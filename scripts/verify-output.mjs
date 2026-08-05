#!/usr/bin/env node
/**
 * Post-build verification of dist/ — enforces the two architectural promises in
 * docs/plan/02-architecture.md: output size budgets, and zero third-party resource requests
 * (the latter is what lets the site run with no cookie-consent banner).
 *
 * This deliberately does NOT flag every "https://" substring in the HTML — an earlier version
 * of this check did, and it produced false positives on two harmless things: the SVG
 * xmlns="http://www.w3.org/2000/svg" namespace declaration (never fetched, required markup),
 * and plain <a href="https://open.spotify.com/..."> outbound links to the artist's own
 * YouTube/Spotify/Facebook/Instagram profiles (real functional content, not a background
 * request). Only attributes that actually cause the BROWSER to fetch something automatically
 * are in scope: script[src], link[href] for a fetchable rel, img/source[src|srcset],
 * iframe/embed/object[src|data], and video/audio poster.
 *
 * Usage: node scripts/verify-output.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const DIST = path.resolve(import.meta.dirname, '..', 'dist')

// Budgets from docs/plan/02-architecture.md — "Performance targets".
const BUDGETS = {
  htmlBytes: 147_456, // 144 KB — homepage-scoped, see the note under "Performance targets"
  cssBytes: 40_960, // 40 KB
  jsBytes: 15_360, // 15 KB
}

// Only these rel values on <link> cause an automatic fetch. rel="canonical"/"alternate"/
// "sitemap" are metadata the browser never loads.
const FETCHABLE_LINK_REL =
  /\b(stylesheet|preload|prefetch|dns-prefetch|preconnect|manifest|icon)\b/i

// The one deliberate exception to "no third-party requests" (CLAUDE.md non-negotiable #3):
// Cloudflare Turnstile, which functions/api/contact.ts verifies server-side (task 6.3). It is
// Cloudflare's own product on the same host that serves the site, sets no tracking cookies, and
// — critically — only ever appears in the built output once the client sets
// PUBLIC_TURNSTILE_SITE_KEY in Cloudflare Pages (ContactForm.astro renders the widget/script
// conditionally on that var). Until then this list changes nothing: the check still fails on
// every other external host.
const ALLOWED_EXTERNAL_HOSTS = ['challenges.cloudflare.com']

function isAllowedExternal(url) {
  try {
    return ALLOWED_EXTERNAL_HOSTS.includes(new URL(url).hostname)
  } catch {
    return false
  }
}

function bytesOf(str) {
  return Buffer.byteLength(str, 'utf8')
}

function findHtmlFiles(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...findHtmlFiles(full))
    else if (entry.name.endsWith('.html')) out.push(full)
  }
  return out
}

function inlineScriptBytes(html) {
  let total = 0
  // Non-greedy, tag-aware: stop at the first </script>, not the last.
  for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
    total += bytesOf(m[1])
  }
  return total
}

function externalResourceUrls(html) {
  const found = new Set()
  const add = (url) => {
    if (url && !url.includes('mariohossen.com') && /^https?:\/\//i.test(url)) found.add(url)
  }

  for (const m of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/gi)) add(m[1])
  for (const m of html.matchAll(/<link\b([^>]*)>/gi)) {
    const tag = m[1]
    const relMatch = /\brel="([^"]*)"/i.exec(tag)
    const hrefMatch = /\bhref="([^"]+)"/i.exec(tag)
    if (hrefMatch && relMatch && FETCHABLE_LINK_REL.test(relMatch[1])) add(hrefMatch[1])
  }
  for (const m of html.matchAll(/<(?:img|source)\b[^>]*\bsrc="([^"]+)"/gi)) add(m[1])
  for (const m of html.matchAll(/<(?:img|source)\b[^>]*\bsrcset="([^"]+)"/gi)) {
    for (const part of m[1].split(',')) add(part.trim().split(/\s+/)[0])
  }
  for (const m of html.matchAll(/<(?:iframe|embed)\b[^>]*\bsrc="([^"]+)"/gi)) add(m[1])
  for (const m of html.matchAll(/<object\b[^>]*\bdata="([^"]+)"/gi)) add(m[1])
  for (const m of html.matchAll(/<video\b[^>]*\bposter="([^"]+)"/gi)) add(m[1])
  // url(...) inside inline <style> blocks — external CSS files aren't expected on this site,
  // but check anyway rather than assuming.
  for (const styleBlock of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    for (const m of styleBlock[1].matchAll(/url\((['"]?)(https?:\/\/[^'")]+)\1\)/gi)) add(m[2])
  }

  return [...found]
}

function outboundLinks(html) {
  const found = new Set()
  for (const m of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)) {
    if (/^https?:\/\//i.test(m[1]) && !m[1].includes('mariohossen.com')) found.add(m[1])
  }
  return [...found]
}

if (!fs.existsSync(DIST)) {
  console.error(`dist/ not found at ${DIST} — run \`npm run build\` first.`)
  process.exit(1)
}

const htmlFiles = findHtmlFiles(DIST)
const cssFiles = fs
  .readdirSync(path.join(DIST, '_astro'), { withFileTypes: true })
  .filter((e) => e.isFile() && e.name.endsWith('.css'))
  .map((e) => path.join(DIST, '_astro', e.name))
const jsFiles = fs.existsSync(path.join(DIST, '_astro'))
  ? fs
      .readdirSync(path.join(DIST, '_astro'), { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.js'))
      .map((e) => path.join(DIST, '_astro', e.name))
  : []

const cssBytes = cssFiles.reduce((n, f) => n + fs.statSync(f).size, 0)
const separateJsBytes = jsFiles.reduce((n, f) => n + fs.statSync(f).size, 0)

let failed = false
let totalInlineJs = 0
const perPageHtml = []
const allExternal = []
const allOutbound = []

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8')
  perPageHtml.push([file, bytesOf(html)])
  totalInlineJs += inlineScriptBytes(html)
  allExternal.push(...externalResourceUrls(html).map((u) => [file, u]))
  allOutbound.push(...outboundLinks(html))
}

const jsBytes = separateJsBytes + totalInlineJs

// The HTML budget in docs/plan/02-architecture.md is scoped per page (measured against the
// homepage specifically) — summing every page's bytes together and comparing that sum to a
// single-page budget would fail more as unrelated pages (imprint, privacy, 404) are simply
// added, regardless of whether any individual page is actually bloated.
console.log(`Checked ${htmlFiles.length} HTML file(s).`)
for (const [file, bytes] of perPageHtml) {
  console.log(`  ${path.relative(DIST, file)}: ${bytes}B (budget ${BUDGETS.htmlBytes}B)`)
}
console.log(
  `  CSS: ${cssBytes}B (budget ${BUDGETS.cssBytes}B)  ` +
    `JS: ${jsBytes}B — ${separateJsBytes}B separate + ${totalInlineJs}B inline (budget ${BUDGETS.jsBytes}B)`
)

for (const [file, bytes] of perPageHtml) {
  if (bytes > BUDGETS.htmlBytes) {
    console.error(
      `::error::HTML over budget for ${path.relative(DIST, file)} (${bytes}B > ${BUDGETS.htmlBytes}B)`
    )
    failed = true
  }
}

if (cssBytes > BUDGETS.cssBytes) {
  console.error(`::error::CSS over budget (${cssBytes}B > ${BUDGETS.cssBytes}B)`)
  failed = true
}
if (jsBytes > BUDGETS.jsBytes) {
  console.error(`::error::JS over budget (${jsBytes}B > ${BUDGETS.jsBytes}B)`)
  failed = true
}

const allowedExternal = allExternal.filter(([, url]) => isAllowedExternal(url))
const disallowedExternal = allExternal.filter(([, url]) => !isAllowedExternal(url))

if (allowedExternal.length) {
  console.log('Allowed third-party request(s) (see the ALLOWED_EXTERNAL_HOSTS note above):')
  for (const [file, url] of allowedExternal) {
    console.log(`  ${path.relative(DIST, file)}: ${url}`)
  }
}

if (disallowedExternal.length) {
  console.error('::error::Third-party resource request(s) found in built output:')
  for (const [file, url] of disallowedExternal) {
    console.error(`  ${path.relative(DIST, file)}: ${url}`)
  }
  failed = true
} else if (!allowedExternal.length) {
  console.log('No third-party resource requests ✓')
}

if (allOutbound.length) {
  console.log(
    `\nOutbound links found (expected, not a violation — visitor-initiated, not auto-loaded):`
  )
  for (const url of [...new Set(allOutbound)].sort()) console.log(`  ${url}`)
}

process.exit(failed ? 1 : 0)
