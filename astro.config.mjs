// @ts-check
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'

// https://astro.build/config
export default defineConfig({
  site: 'https://www.mariohossen.com',
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
