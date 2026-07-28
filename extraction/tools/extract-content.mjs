/**
 * Task 1.1 — parse the rendered WordPress snapshots into structured JSON.
 *
 * Uses Playwright with JavaScript DISABLED and all network blocked, so we get a real DOM API
 * against the exact bytes captured by crawl.mjs. Nothing can re-run, re-order or lazy-load;
 * what the crawler saw is what we parse.
 *
 * Output: extraction/data/content/*.json  (raw, faithful — no interpretation yet)
 *
 * Usage: node extract-content.mjs
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../..')
const RENDERED = path.join(ROOT, 'extraction/rendered')
const OUT = path.join(ROOT, 'extraction/data/content')

const EXPECTED = {
  concerts: 34,
  recordings: 21,
  gallery: 12,
  editions: 4,
  repertoire: 6,
}

fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const ctx = await browser.newContext({ javaScriptEnabled: false })
// The snapshot references absolute https:// URLs. Block everything so nothing is fetched.
await ctx.route('**/*', (route) =>
  route.request().url().startsWith('file://') ? route.continue() : route.abort()
)

const page = await ctx.newPage()
await page.goto('file://' + path.join(RENDERED, 'home.rendered.html'), {
  waitUntil: 'domcontentloaded',
})

/**
 * Helpers injected into the page. Kept inside evaluate() calls because they need the DOM.
 * `blockText` preserves line structure: <br>, <p>, <div> all become newlines, because on this
 * site a line break is meaningful (it separates city from venue, performer from performer).
 */
const HELPERS = `
  function blockText(el) {
    if (!el) return ''
    const clone = el.cloneNode(true)
    // Elementor injects <style> blocks inside text-editor widgets; textContent would
    // otherwise return raw CSS as if it were body copy.
    clone.querySelectorAll('style, script, noscript').forEach(n => n.remove())
    clone.querySelectorAll('br').forEach(br => br.replaceWith('\\n'))
    clone.querySelectorAll('p, div').forEach(b => b.append('\\n'))
    return clone.textContent
      .replace(/\\u00a0/g, ' ')          // nbsp -> space
      .replace(/[\\u200b-\\u200d\\ufeff]/g, '')  // zero-width chars
      .split('\\n')
      .map(s => s.trim())
      .filter(Boolean)
      .join('\\n')
  }
  function lines(el) { return blockText(el).split('\\n').filter(Boolean) }
`

// ---------------------------------------------------------------------------- concerts
const concertsAll = await page.evaluate(`(() => {
  ${HELPERS}
  const titles = [...document.querySelectorAll('[data-widget_type="premium-addon-title.default"]')]
  return titles.map((t, i) => {
    const col = t.closest('.elementor-column')
    const dateRaw = blockText(t.querySelector('.premium-title-text') || t)
    // Text blocks in document order — their meaning varies card to card, so keep them raw.
    const blocks = [...col.querySelectorAll('[data-widget_type="text-editor.default"]')]
      .map(b => lines(b.querySelector('.elementor-widget-container') || b))
      .filter(b => b.length)
    const link = col.querySelector('[data-widget_type="button.default"] a[href]')
    return {
      index: i,
      dateRaw,
      blocks,
      infoUrl: link ? link.getAttribute('href') : null,
      infoLabel: link ? link.textContent.trim() : null,
    }
  })
})()`)

// An unfinished card exists in the Elementor layout: no date, no content, just a stray "Info"
// button. It renders as a visibly empty box on the live site. Drop it from the content, but
// surface it in the report rather than silently discarding it.
const concerts = concertsAll.filter((c) => c.dateRaw && c.blocks.length)
const concertsSkipped = concertsAll.filter((c) => !(c.dateRaw && c.blocks.length))

// -------------------------------------------------------------- recordings + gallery
const galleries = await page.evaluate(`(() => {
  ${HELPERS}
  return [...document.querySelectorAll('[data-widget_type="eael-filterable-gallery.default"]')].map(w => ({
    widgetId: w.getAttribute('data-id'),
    items: [...w.querySelectorAll('.eael-filterable-gallery-item-wrap')].map(el => {
      const img = el.querySelector('img')
      return {
        title: blockText(el.querySelector('.fg-item-title')),
        content: blockText(el.querySelector('.fg-item-content')),
        img: img ? img.getAttribute('src') : null,
        alt: img ? (img.getAttribute('alt') || '') : '',
        links: [...el.querySelectorAll('a[href]')]
          .map(a => a.getAttribute('href'))
          .filter(h => h && h !== '#'),
      }
    }),
  }))
})()`)

// ---------------------------------------------------------------------------- editions
// Modal-popup widgets are also used by one concert card, so a popup alone does not mean
// "edition". Real editions have a cover image and a "Besetzung:" line.
const editionsAll = await page.evaluate(`(() => {
  ${HELPERS}
  return [...document.querySelectorAll('[data-widget_type="wts-modal-popup.default"]')].map(w => {
    const col = w.closest('.elementor-column')
    const imgEl = col.querySelector('[data-widget_type="image.default"] img')
    const linkEl = col.querySelector('[data-widget_type="image.default"] a[href]')
    return {
      composer: blockText(w.querySelector('.eae-modal-title')),
      body: lines(w.querySelector('.eae-modal-content')),
      cover: imgEl ? imgEl.getAttribute('src') : null,
      alt: imgEl ? (imgEl.getAttribute('alt') || '') : '',
      moreUrl: linkEl ? linkEl.getAttribute('href') : null,
      buttonLabel: blockText(w.querySelector('.eae-popup-btn-text')),
    }
  })
})()`)

const isEdition = (e) => e.cover && e.body.some((l) => /Besetzung\s*:/i.test(l))
const editions = editionsAll.filter(isEdition)
const editionsSkipped = editionsAll.filter((e) => !isEdition(e))

// ------------------------------------------------------------- repertoire + bio accordions
// The biography's "read more" toggle and its two blog panels use the SAME accordion markup as
// the repertoire categories. Split them by document position: anything before the REPERTOIRE
// heading belongs to the biography, anything after it is a repertoire category.
const accordions = await page.evaluate(`(() => {
  ${HELPERS}
  const marker = [...document.querySelectorAll('h1, h2, h3, .elementor-heading-title')]
    .find(h => h.textContent.trim().toUpperCase().startsWith('REPERTOIRE'))
  return [...document.querySelectorAll('.eael-accordion-list')].map((el, i) => {
    const head = el.querySelector('.eael-accordion-tab-title')
    const body = el.querySelector('.eael-accordion-content')
    const beforeRepertoire = !!marker &&
      !!(el.compareDocumentPosition(marker) & Node.DOCUMENT_POSITION_FOLLOWING)
    return {
      domOrder: i + 1,
      section: beforeRepertoire ? 'biography' : 'repertoire',
      anchor: el.querySelector('.eael-accordion-header')?.id || '',
      title: blockText(head),
      html: body ? body.innerHTML.trim() : '',
      lines: lines(body),
      // The biography blog panels are lists of outbound links; text alone would lose them.
      links: body
        ? [...body.querySelectorAll('a[href]')].map(a => ({
            text: blockText(a),
            href: a.getAttribute('href'),
          }))
        : [],
    }
  })
})()`)

const repertoire = accordions
  .filter((a) => a.section === 'repertoire')
  .map((a, i) => ({ ...a, order: i + 1 }))
const bioAccordions = accordions.filter((a) => a.section === 'biography')

// --------------------------------------------------------------------------- biography
// The biography sits in the first section; grab its text-editor blocks plus the portrait.
const biography = await page.evaluate(`(() => {
  ${HELPERS}
  const all = [...document.querySelectorAll('[data-widget_type="text-editor.default"]')]
  // Biography blocks precede the REPERTOIRE heading in document order.
  const marker = [...document.querySelectorAll('h2, .elementor-heading-title')]
    .find(h => h.textContent.trim().toUpperCase().startsWith('REPERTOIRE'))
  const before = all.filter(b => marker && (b.compareDocumentPosition(marker) & Node.DOCUMENT_POSITION_FOLLOWING))
  // Portraits are the images that appear before the REPERTOIRE heading — position-filtered,
  // not just "the first few in the document".
  const imgs = [...document.querySelectorAll('[data-widget_type="image.default"] img')]
    .filter(i => marker && (i.compareDocumentPosition(marker) & Node.DOCUMENT_POSITION_FOLLOWING))
    .map(i => i.getAttribute('src'))
    .filter(Boolean)
  return {
    blocks: before.map(b => lines(b.querySelector('.elementor-widget-container') || b)).filter(b => b.length),
    imagesBeforeRepertoire: imgs,
  }
})()`)

// ------------------------------------------------------------------- header / footer / meta
const meta = await page.evaluate(`(() => {
  ${HELPERS}
  const nav = [...document.querySelectorAll('li.menu-item > a[href]')].map(a => ({
    label: a.textContent.trim(),
    href: a.getAttribute('href'),
  }))
  const social = [...document.querySelectorAll('a[href]')]
    .map(a => a.getAttribute('href'))
    .filter(h => h && /youtube|spotify|facebook|instagram/i.test(h))
  // The LABEL and PARTNERS blocks are h6 headings followed by a text-editor widget.
  const namedBlock = (label) => {
    const head = [...document.querySelectorAll('.elementor-widget-heading .elementor-heading-title')]
      .find(h => h.textContent.trim().toUpperCase() === label)
    if (!head) return null
    const widget = head.closest('[data-widget_type]')
    let sib = widget && widget.nextElementSibling
    while (sib && sib.getAttribute('data-widget_type') !== 'text-editor.default') {
      sib = sib.nextElementSibling
    }
    if (!sib) return null
    return {
      lines: lines(sib.querySelector('.elementor-widget-container') || sib),
      links: [...sib.querySelectorAll('a[href]')].map(a => ({
        text: a.textContent.trim(),
        href: a.getAttribute('href'),
      })),
    }
  }

  return {
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content || '',
    nav,
    social: [...new Set(social)],
    label: namedBlock('LABEL'),
    partners: namedBlock('PARTNERS'),
    // Scoped to heading widgets: the theme's inline <style> also contains the word
    // "Copyright" and would otherwise match first.
    copyright: blockText([...document.querySelectorAll('.elementor-heading-title')]
      .filter(e => e.textContent.length < 120 && /copyright/i.test(e.textContent))[0]),
  }
})()`)

await browser.close()

// ------------------------------------------------------------------------------- write
const write = (name, data) => {
  fs.writeFileSync(path.join(OUT, name + '.json'), JSON.stringify(data, null, 2), 'utf8')
}

// The two filterable galleries are recordings then gallery in document order. Identify by
// content rather than position: recordings have titles, gallery photos do not.
const recordingsWidget = galleries.find((g) => g.items.some((i) => i.title)) || galleries[0]
const galleryWidget = galleries.find((g) => g !== recordingsWidget) || galleries[1]

write('concerts.raw', concerts)
write('recordings.raw', recordingsWidget?.items ?? [])
write('gallery.raw', galleryWidget?.items ?? [])
write('editions.raw', editions)
write('repertoire.raw', repertoire)
write('biography.raw', { ...biography, accordions: bioAccordions })
write('meta.raw', meta)
write('skipped.raw', { concerts: concertsSkipped, editions: editionsSkipped })

// ------------------------------------------------------------------------------ verify
const actual = {
  concerts: concerts.length,
  recordings: recordingsWidget?.items.length ?? 0,
  gallery: galleryWidget?.items.length ?? 0,
  editions: editions.length,
  repertoire: repertoire.length,
}

console.log('\nExtracted counts:')
let failed = false
for (const [k, want] of Object.entries(EXPECTED)) {
  const got = actual[k]
  const ok = got === want
  if (!ok) failed = true
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${k.padEnd(12)} ${got} (expected ${want})`)
}
console.log(`\nWritten to ${path.relative(ROOT, OUT)}/`)

const skipped = concertsSkipped.length + editionsSkipped.length
if (skipped) {
  console.log(`\nSkipped ${skipped} non-content widget(s) — recorded in skipped.raw.json:`)
  for (const c of concertsSkipped) {
    console.log(`  concert card with no date/content, stray link: ${c.infoUrl ?? '(none)'}`)
  }
  for (const e of editionsSkipped) {
    console.log(`  popup with no cover/Besetzung (belongs to a concert): ${e.body[0] ?? ''}`)
  }
}

if (failed) {
  console.error(
    '\nCOUNT MISMATCH — stop and investigate before proceeding (see the content-extraction skill).'
  )
  process.exit(1)
}
