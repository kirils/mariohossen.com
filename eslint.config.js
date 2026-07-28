import js from '@eslint/js'
import ts from 'typescript-eslint'
import astro from 'eslint-plugin-astro'
import prettier from 'eslint-config-prettier'

export default [
  {
    ignores: [
      'dist/**',
      '.astro/**',
      'node_modules/**',
      'extraction/reference-css/**',
      'extraction/rendered/**',
      'assets/**',
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...astro.configs.recommended,
  prettier,
  {
    // The extraction tools are Node scripts, not part of the site bundle.
    files: ['extraction/tools/**/*.mjs'],
    languageOptions: {
      globals: { console: 'readonly', process: 'readonly' },
    },
    rules: {
      'no-undef': 'off', // browser globals inside page.evaluate() strings
    },
  },
]
