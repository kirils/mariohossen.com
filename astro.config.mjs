// @ts-check
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves a project repo under /<repo-name>/, not the domain root — Cloudflare
// Pages (the documented production target, docs/plan/02-architecture.md) serves it at the
// custom domain root. DEPLOY_TARGET lets both coexist without permanently rewriting this file
// for one host; the GitHub Actions workflow sets it, nothing else does.
const isGhPages = process.env.DEPLOY_TARGET === 'github-pages'

// https://astro.build/config
export default defineConfig({
  site: isGhPages ? 'https://kirils.github.io' : 'https://www.mariohossen.com',
  base: isGhPages ? '/mariohossen.com' : undefined,
  output: 'static',
  // The WordPress site used trailing slashes; keeping them means old URLs stay identical
  // and the redirect map in Phase 9 only has to cover genuinely retired paths.
  trailingSlash: 'always',

  integrations: [
    sitemap({
      // Retired paths are served by _redirects (301), so they must not appear in the sitemap.
      filter: (page) => !/\/(events|mario-hossen-disco|cookie-policy-eu)\//.test(page),
    }),
  ],

  build: {
    inlineStylesheets: 'auto',
  },

  vite: {
    plugins: [tailwindcss()],
  },
})
