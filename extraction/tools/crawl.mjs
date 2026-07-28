import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const OUT = process.argv[2] || './out'
const ORIGIN = 'https://www.mariohossen.com'

const PAGES = [
  ['home', '/'],
  ['contact', '/contact/'],
  ['imprint', '/imprint/'],
  ['events', '/events/'],
  ['mario-hossen-disco', '/mario-hossen-disco/'],
  ['cookie-policy-eu', '/cookie-policy-eu/'],
]

fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: 1600, height: 1200 },
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36',
})

const allAssets = new Set()
ctx.on('request', (req) => {
  const u = req.url()
  if (u.startsWith(ORIGIN)) allAssets.add(u)
})

const scrollAll = (page) =>
  page.evaluate(async () => {
    const step = window.innerHeight * 0.8
    for (let y = 0; y < document.body.scrollHeight + step; y += step) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 150))
    }
    window.scrollTo(0, 0)
  })

for (const [name, urlPath] of PAGES) {
  const page = await ctx.newPage()
  console.log(`\n=== ${name} (${urlPath}) ===`)
  await page.goto(ORIGIN + urlPath, { waitUntil: 'networkidle', timeout: 90000 })

  for (const sel of ['.cmplz-accept', '#cmplz-accept', 'button:has-text("Accept")']) {
    const b = page.locator(sel).first()
    if (await b.count().catch(() => 0)) {
      await b.click({ timeout: 3000 }).catch(() => {})
      break
    }
  }
  await page.waitForTimeout(800)
  await scrollAll(page)
  await page.waitForTimeout(1000)

  // Items append asynchronously via Isotope, so count thumbnails+titles and wait for the
  // number to settle rather than assuming one click == one synchronous batch.
  const tally = () =>
    page.evaluate(
      () =>
        document.querySelectorAll('.gallery-item-thumbnail').length +
        document.querySelectorAll('.fg-item-title').length
    )

  let stagnant = 0
  for (let round = 0; round < 80; round++) {
    const before = await tally()
    const btns = page.locator('.eael-gallery-load-more')
    const n = await btns.count()
    let clicked = 0
    for (let i = 0; i < n; i++) {
      const b = btns.nth(i)
      if (!(await b.isVisible().catch(() => false))) continue
      await b.scrollIntoViewIfNeeded().catch(() => {})
      await b.click({ timeout: 5000, force: true }).catch(() => {})
      clicked++
    }
    if (!clicked) break
    await page.waitForTimeout(2500)
    const after = await tally()
    console.log(`  round ${round + 1}: clicked ${clicked} btn(s), tally ${before} -> ${after}`)
    if (after <= before) {
      if (++stagnant >= 2) break
    } else stagnant = 0
  }

  await scrollAll(page)
  await page.waitForTimeout(3000)

  const html = await page.content()
  fs.writeFileSync(path.join(OUT, `${name}.rendered.html`), html)

  const domAssets = await page.evaluate((origin) => {
    const found = new Set()
    const add = (u) => {
      if (!u) return
      try {
        const abs = new URL(u, location.href).href
        if (abs.startsWith(origin)) found.add(abs)
      } catch {
        // Not a resolvable URL (data: URI, template placeholder) — nothing to collect.
      }
    }
    document.querySelectorAll('img').forEach((el) => {
      add(el.getAttribute('src'))
      add(el.getAttribute('data-src'))
      const ss = el.getAttribute('srcset') || el.getAttribute('data-srcset')
      if (ss) ss.split(',').forEach((p) => add(p.trim().split(/\s+/)[0]))
    })
    document.querySelectorAll('source').forEach((el) => {
      const ss = el.getAttribute('srcset')
      if (ss) ss.split(',').forEach((p) => add(p.trim().split(/\s+/)[0]))
    })
    document.querySelectorAll('a[href]').forEach((el) => {
      const h = el.getAttribute('href')
      if (h && /\.(jpe?g|png|webp|gif|svg|pdf|mp3|mp4)(\?|$)/i.test(h)) add(h)
    })
    document.querySelectorAll('link[href]').forEach((el) => add(el.getAttribute('href')))
    document.querySelectorAll('*').forEach((el) => {
      const bg = getComputedStyle(el).backgroundImage
      if (bg && bg !== 'none') {
        for (const m of bg.matchAll(/url\(["']?([^"')]+)["']?\)/g)) add(m[1])
      }
    })
    return [...found]
  }, ORIGIN)
  domAssets.forEach((u) => allAssets.add(u))

  // Structured extraction. Widgets are captured separately so Recordings, Concerts and
  // Gallery stay distinguishable instead of collapsing into one flat list.
  const widgets = await page.evaluate(() => {
    return [
      ...document.querySelectorAll('[data-widget_type="eael-filterable-gallery.default"]'),
    ].map((w) => ({
      widgetId: w.getAttribute('data-id'),
      items: [...w.querySelectorAll('.eael-filterable-gallery-item-wrap')].map((el) => ({
        title: el.querySelector('.fg-item-title')?.textContent.trim() || '',
        content: el.querySelector('.fg-item-content')?.innerText.trim() || '',
        img: el.querySelector('img')?.getAttribute('src') || '',
        links: [...el.querySelectorAll('a[href]')]
          .map((a) => a.href)
          .filter((h) => h && !h.endsWith('#')),
      })),
    }))
  })
  fs.writeFileSync(path.join(OUT, `${name}.widgets.json`), JSON.stringify(widgets, null, 2))
  console.log(
    `  widgets: ${widgets.map((w) => w.items.length).join(' + ')} items | dom assets ${domAssets.length}`
  )

  await page
    .screenshot({ path: path.join(OUT, `${name}.fullpage.png`), fullPage: true })
    .catch(() => {})

  // Some content lives inside modal popups that never open during a normal crawl — most
  // importantly the Concerts "Load more", which holds 24 of the 34 concerts. The markup is in
  // the DOM either way, so extraction already sees it, but without opening the modal there is
  // no VISUAL reference for those items and the task 1.7 verification pass has nothing to
  // check them against.
  const triggers = page.locator('.eae-popup-link')
  const triggerCount = await triggers.count()
  for (let i = 0; i < triggerCount; i++) {
    const t = triggers.nth(i)
    const label =
      ((await t.textContent().catch(() => '')) || '').trim().replace(/\W+/g, '-') || `popup-${i}`
    if (!(await t.isVisible().catch(() => false))) continue
    await t.scrollIntoViewIfNeeded().catch(() => {})
    await t.click({ timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(1200)
    const modal = page.locator('.mfp-content').first()
    if (await modal.count().catch(() => 0)) {
      await modal
        .screenshot({ path: path.join(OUT, `${name}.modal-${i}-${label}.png`) })
        .catch(() => {})
      console.log(`  captured modal ${i} ("${label}")`)
    }
    await page.keyboard.press('Escape').catch(() => {})
    await page.waitForTimeout(600)
  }

  await page.close()
}

fs.writeFileSync(path.join(OUT, 'all-assets.txt'), [...allAssets].sort().join('\n'))
console.log(`\nTOTAL same-origin asset URLs seen: ${allAssets.size}`)
await browser.close()
