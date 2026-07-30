/**
 * Prefixes a root-relative path with the configured base path. `import.meta.env.BASE_URL` is
 * '/' in production (Cloudflare Pages, served at the custom domain root) and
 * '/mariohossen.com/' when built with DEPLOY_TARGET=github-pages (see astro.config.mjs) — a
 * GitHub Pages project repo is served under /<repo-name>/, not the domain root, so every
 * hand-written root-relative href needs this rather than a literal leading slash.
 */
export function withBase(path: string): string {
  return import.meta.env.BASE_URL + path.replace(/^\//, '')
}
