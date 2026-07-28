/**
 * Capture a readable visual reference for the 24 concerts that live inside the Concerts
 * "Load more" modal on the live site.
 *
 * They are in the page DOM (so extraction sees them), but the modal never opens during a normal
 * crawl — which left 24 of 34 concerts with no screenshot to verify against in task 1.7.
 *
 * Usage: node capture-concerts-modal.mjs [outDir]
 */
import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = process.argv[2] || path.join(ROOT, 'extraction/screenshots')
fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1500, height: 2000 } })
await page.goto('https://www.mariohossen.com/', { waitUntil: 'networkidle', timeout: 90000 })
await page
  .locator('.cmplz-accept')
  .first()
  .click({ timeout: 3000 })
  .catch(() => {})
await page.waitForTimeout(800)

const trigger = page.locator('.eae-popup-link', { hasText: 'Load more' }).first()
await trigger.scrollIntoViewIfNeeded()
await trigger.click()
await page.waitForTimeout(2000)

// Magnific renders the modal in a scrollable overlay. Neutralise the overlay's own scrolling
// and hide the page behind it so a full-page screenshot captures the modal in one piece.
await page.evaluate(() => {
  const wrap = document.querySelector('.mfp-wrap')
  const content = document.querySelector('.mfp-content')
  if (!wrap || !content) return
  document.querySelectorAll('body > *:not(.mfp-wrap):not(.mfp-bg)').forEach((el) => {
    el.style.display = 'none'
  })
  for (const el of [wrap, document.querySelector('.mfp-container'), content]) {
    if (!el) continue
    el.style.position = 'static'
    el.style.overflow = 'visible'
    el.style.height = 'auto'
    el.style.maxHeight = 'none'
    el.style.transform = 'none'
  }
  document.body.style.background = '#000'
  document.body.style.overflow = 'visible'
})
await page.waitForTimeout(1200)

const file = path.join(OUT, 'home.concerts-modal.png')
await page.screenshot({ path: file, fullPage: true })

const size = await page.evaluate(() => ({
  h: document.body.scrollHeight,
  cards: document.querySelectorAll('.premium-title-text').length,
}))
console.log(
  `Wrote ${path.relative(ROOT, file)}  (page ${size.h}px, ${size.cards} date headings visible)`
)

await browser.close()
