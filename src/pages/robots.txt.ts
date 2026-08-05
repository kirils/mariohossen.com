import type { APIRoute } from 'astro'
import { withBase } from '../lib/url'

// A static public/robots.txt couldn't tell the two build targets apart (astro.config.mjs's
// DEPLOY_TARGET only exists at build time, not per-request) — this endpoint can, by checking the
// resolved `site`. The GitHub Pages preview (docs/plan/02-architecture.md calls it out as
// temporary, not the canonical domain) is excluded from indexing entirely, so it can never
// compete with the real domain as duplicate content in search results.
export const GET: APIRoute = ({ site }) => {
  const isPreview = site?.hostname.endsWith('github.io') ?? false

  const body = isPreview
    ? '# Temporary GitHub Pages preview — not the canonical domain.\nUser-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\n\nSitemap: ${new URL(withBase('/sitemap-index.xml'), site).href}\n`

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
