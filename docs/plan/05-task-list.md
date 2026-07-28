# 05 — Implementation Task List

9 phases. Each task has an acceptance criterion — a task is not done until that is true.

**Legend:** `[x]` done · `[ ]` to do · **⚑** needs the client · **⚠** blocks the cutover

---

## Phase 0 — Discovery & asset capture ✅ COMPLETE

- [x] **0.1** Identify the current stack — WordPress, Elementor 3.22.1, Zugan theme, 6 addon plugins, CF7, Complianz, Hostinger
- [x] **0.2** Map every page — 6 pages; one-page design with anchor nav; 2 unlinked legacy pages
- [x] **0.3** Discover the "Load More" problem — only 4 of 21 recordings and 4 of 12 photos are in the server HTML
- [x] **0.4** Build a browser-based crawler that exhausts every Load More → `extraction/tools/crawl.mjs`
- [x] **0.5** Capture fully-rendered HTML for all 6 pages → `extraction/rendered/`
- [x] **0.6** Capture full-page screenshots for pixel reference → `extraction/screenshots/`
- [x] **0.7** Download all 59 media originals, integrity-checked → `assets/originals/` (6.3 MB)
- [x] **0.8** Archive the 47 live stylesheets for design reference → `extraction/reference-css/`
- [x] **0.9** Measure design tokens from computed styles → `extraction/data/design-tokens.json`
- [x] **0.10** Count content: 34 concerts · 21 recordings · 12 photos · 4 editions · 6 repertoire categories

> Re-run `node extraction/tools/crawl.mjs <out>` any time to re-sync before the cutover.

---

## Phase 1 — Content extraction & normalisation

Turning rendered HTML into clean content files. **The most error-prone phase — budget the most
care here, not the most cleverness.**

- [ ] **1.1** Write `extraction/tools/extract-content.mjs` — parse `extraction/rendered/home.rendered.html` into structured JSON per section
  - _Done when:_ it emits `concerts.json`, `recordings.json`, `editions.json`, `gallery.json`, `repertoire.json`, `biography.json` with no manual editing
- [ ] **1.2** Normalise all 34 concert dates to ISO. Source formats include `22. - 29. MAY 2026`, `8-11. MAY 2025`, `20 October 2024`, `04 Juli 2024` (German), and `08. NOV 2025​` (trailing zero-width character)
  - _Done when:_ all 34 parse as valid dates; multi-day runs have `date` + `endDate`; a printed table of `original → parsed` has been read line by line
- [ ] **1.3** Split each concert card into `city`, `country`, `venue`, `series`, `performers[]`, `programme`, `infoUrl`
  - _Done when:_ all 34 have `city` and `venue`; no field contains leftover HTML
- [ ] **1.4** Extract 21 recordings — composer, title, subtitle, cover, outbound link
  - _Done when:_ 21 files exist, each with a cover that resolves and a valid `listenUrl`
- [ ] **1.5** Extract 4 editions, 12 gallery photos, 6 repertoire categories, biography + 2 blog panels
  - _Done when:_ every count matches Phase 0.10 exactly
- [ ] **1.6 ⚑** Ask the client for: higher-resolution album covers, photographer credits, alt-text help for the 12 portraits, and the correct destination email for the contact form
  - _Done when:_ answered, or explicitly deferred with a sensible default recorded
- [ ] **1.7 ⚠** **Human verification pass** — read every extracted item against `extraction/screenshots/home.fullpage.png` side by side
  - _Done when:_ a signed-off checklist exists confirming all 77 items are correct. **Do not skip. Automated extraction from rendered HTML is good, not perfect, and this is the only place a silent content error can be caught.**

---

## Phase 2 — Project scaffold

- [ ] **2.1** `npm create astro@latest` — minimal, TypeScript strict, static output
- [ ] **2.2** Add `@astrojs/sitemap`, `@astrojs/tailwind` (v4), `sharp`, `zod`
- [ ] **2.3** Self-host fonts: `@fontsource/lato` and `@fontsource/roboto`, weights 300/400/500/600/700 only
  - _Done when:_ a production build makes **zero** requests to `fonts.googleapis.com` or `fonts.gstatic.com`
- [ ] **2.4** Configure `astro.config.mjs` — `site: 'https://www.mariohossen.com'`, sitemap, image service
- [ ] **2.5** ESLint + Prettier + `astro check` in `npm run verify`
- [ ] **2.6** `.gitignore`, `README.md`, `.nvmrc` (Node 22)
- [ ] **2.7** GitHub Actions: on every PR run `astro check` + `astro build`
  - _Done when:_ a deliberately broken frontmatter field makes CI fail

---

## Phase 3 — Design system

- [ ] **3.1** `src/styles/global.css` with the `@theme` token block from [03-design-system.md](./03-design-system.md)
- [ ] **3.2** `BaseLayout.astro` — `<head>`, fonts, skip-link, container
- [ ] **3.3** `Header.astro` — wordmark (`<h1>`), anchor nav, social row, sticky-on-scroll
- [ ] **3.4** `MobileMenu.astro` — hamburger, focus trap, Escape to close, `< 2 KB` JS
- [ ] **3.5** `Footer.astro` — gold bar, copyright, links, social
- [ ] **3.6** `WaveDivider.astro` — inline SVG reproducing the purple→gold curve, traced from screenshots
  - _Done when:_ overlaying it on the screenshot at 1600 px shows no visible difference
- [ ] **3.7** `SectionTitle.astro` + `GoldRule.astro`
- [ ] **3.8** `Accordion.astro` on native `<details>`/`<summary>`, styled to match, **zero JS**
- [ ] **3.9** Scroll-reveal via `IntersectionObserver`, wrapped in `prefers-reduced-motion: reduce`
- [ ] **3.10** Visual diff of header + footer against screenshots at 1600 / 1024 / 375 px

---

## Phase 4 — Content collections

- [ ] **4.1** `src/content.config.ts` — all schemas from [04-content-model.md](./04-content-model.md)
- [ ] **4.2** Generate 34 concert `.md` files from Phase 1 output
- [ ] **4.3** Generate 21 recording `.md` files
- [ ] **4.4** Generate 4 edition `.md` files
- [ ] **4.5** Generate 6 repertoire `.md` files
- [ ] **4.6** Write `gallery.json` (12 entries) — **every entry needs real alt text**, schema enforces it
- [ ] **4.7** Write `pages/biography.md`, `imprint.md`, `privacy.md`
- [ ] **4.8** Write `site/settings.json` — nav, social, label, partners
- [ ] **4.9** Sort the 59 originals into `src/assets/images/{recordings,editions,gallery,portraits,brand}/`
  - _Done when:_ every image referenced by a content file resolves and the build emits no warnings
- [ ] **4.10** `astro build` passes with all schemas green

---

## Phase 5 — Page sections

Each in the order it appears on the page.

- [ ] **5.1** Biography — portrait left, text right, "read more" `<details>`, 2 blog panels
- [ ] **5.2** Repertoire — 6-category gold accordion + portrait right
- [ ] **5.3** Concerts — gold band, wave divider, 3-col cards, `date >= today` first, past below
  - _Done when:_ an artificially back-dated concert moves itself to past with no code change
- [ ] **5.4** Recordings — 4-col album grid, hover overlay with composer/title, outbound link
  - _Done when:_ **all 21 are in the initial HTML.** `curl -s <url> | grep -c 'album-card'` returns 21
- [ ] **5.5** Editions — 4-col white cards, Besetzung/Herausgeber, "see more"
- [ ] **5.6** Gallery — 4-col grid, gold borders, lightbox (arrows, Escape, swipe, focus trap)
  - _Done when:_ all 12 are in the initial HTML and the lightbox is fully keyboard-operable
- [ ] **5.7** Label / Partners — 2-col
- [ ] **5.8** Contact section — form + consent checkbox
- [ ] **5.9** `/contact/`, `/imprint/`, `/privacy/` standalone pages
- [ ] **5.10** 404 page using `2018/12/404-logo.png`
- [ ] **5.11** Responsive pass — 375 / 768 / 1024 / 1440 / 1920 px, no horizontal scroll anywhere

---

## Phase 6 — Contact form

- [ ] **6.1** `functions/api/contact.ts` — Cloudflare Pages Function
- [ ] **6.2** Zod validation server-side (name, email, subject, message, consent)
- [ ] **6.3** Cloudflare Turnstile — free, invisible to real visitors
- [ ] **6.4** Honeypot field + minimum time-to-submit
- [ ] **6.5 ⚑** Resend integration; `RESEND_API_KEY` as an encrypted Cloudflare env var
  - _Done when:_ the key exists **only** in Cloudflare, never in git, never in the client bundle
- [ ] **6.6** Progressive enhancement — the form posts and works with JS disabled
- [ ] **6.7** Friendly success and error states, `aria-live` announced
- [ ] **6.8** End-to-end test on a Cloudflare preview deployment: real submission → real inbox
- [ ] **6.9** Document the Web3Forms fallback in case Resend domain verification stalls

---

## Phase 7 — SEO, accessibility, performance

- [ ] **7.1** Meta titles/descriptions; keep `Mario Hossen – violin soloist and conductor`
- [ ] **7.2** OpenGraph + Twitter cards with a proper share image
- [ ] **7.3** JSON-LD: `Person` (site-wide), `Event` (per concert), `MusicAlbum` (per recording)
  - _Done when:_ Google Rich Results Test passes for Person and at least one Event
- [ ] **7.4 ⚠** Accessibility pass — heading order, alt on all images, focus visible, contrast ≥ 4.5:1 (**including gold-on-gold, see [03](./03-design-system.md#contrast--needs-attention)**), keyboard-only walkthrough
  - _Done when:_ axe-core reports 0 violations and the whole site is usable with keyboard only
- [ ] **7.5** `sitemap.xml` + `robots.txt`
- [ ] **7.6** Image optimisation verified — AVIF/WebP served, `width`/`height` set, below-fold lazy
- [ ] **7.7** Lighthouse ≥ 95 on Performance, Accessibility, Best Practices, SEO (mobile + desktop)
- [ ] **7.8** Confirm HTML < 60 KB, CSS < 40 KB, JS < 15 KB
- [ ] **7.9** Cross-browser: Chrome, Firefox, Safari, iOS Safari, Android Chrome

---

## Phase 8 — Client tooling & documentation

The part that determines whether this site is still healthy in two years.

- [ ] **8.1** `CLAUDE.md` at the repo root — tells Claude the content model, conventions and rules for this repo
- [ ] **8.2** `docs/CLIENT-GUIDE.md` — plain language, no jargon: add a concert, add an album, swap a photo, edit the biography. Copy-paste-ready sentences to say to Claude
- [ ] **8.3** Content templates in `docs/templates/` for concert / recording / edition
- [ ] **8.4** `npm run verify` — one command: type-check, schema-check, build
- [ ] **8.5** `npm run preview` — local preview before publishing
- [ ] **8.6** Deploy-on-push documented, with how to see if a build failed and what to do
- [ ] **8.7** Rollback guide — "undo the last change" in one command
- [ ] **8.8 ⚑** Walk the client through it live; have them add a real concert themselves start to finish
  - _Done when:_ the client has published a change without help

---

## Phase 9 — Deployment & DNS cutover

Full runbook in [06-deployment-dns.md](./06-deployment-dns.md).

- [ ] **9.1** Private GitHub repo, push
- [ ] **9.2** Connect Cloudflare Pages, auto-deploy from `main`
- [ ] **9.3** Verify on `*.pages.dev`
- [ ] **9.4 ⚑** Full client review on the preview URL — every section, on their phone
- [ ] **9.5 ⚠** `_redirects` — old URLs must not 404:
  ```
  /events/              /#concerts      301
  /mario-hossen-disco/  /#recordings    301
  /cookie-policy-eu/    /privacy/       301
  /blog1/  /blog2/  /blog3/  /blog4/    →  /  301
  /category/*                           →  /  301
  /feed/                                →  /  301
  ```
  - _Done when:_ every URL in the old `wp-sitemap` resolves 200 or 301, never 404
- [ ] **9.6 ⚠** Reduce DNS TTL to 300 s at the current provider, **at least 24 h before cutover**
- [ ] **9.7 ⚠** **Take a full WordPress backup before touching DNS** — files + database, stored off-Hostinger
  - _Done when:_ the backup is downloaded and verified openable. This is the real safety net; do it even though the plan is reversible
- [ ] **9.8** Move DNS to Cloudflare; add `mariohossen.com` + `www` to Pages
- [ ] **9.9** Verify SSL, `www` → apex (or apex → `www`) redirect, HSTS
- [ ] **9.10** Post-cutover checks — every page 200, form delivers a real email, redirects fire, `sitemap.xml` live
- [ ] **9.11** Submit the new sitemap in Google Search Console; watch coverage for 2 weeks
- [ ] **9.12** Keep Hostinger live for **30 days**, then cancel

---

## Effort estimate

| Phase                   | Days            |
| ----------------------- | --------------- |
| 0 — Discovery           | ✅ done         |
| 1 — Content extraction  | 1.0             |
| 2 — Scaffold            | 0.5             |
| 3 — Design system       | 1.0             |
| 4 — Content collections | 0.5             |
| 5 — Page sections       | 1.5             |
| 6 — Contact form        | 0.5             |
| 7 — SEO / a11y / perf   | 0.75            |
| 8 — Client tooling      | 0.5             |
| 9 — Deploy & cutover    | 0.5             |
| **Total**               | **≈ 6.75 days** |

## Critical path

```
1.1 → 1.2 → 1.7 ⚠ → 4.2 → 5.3 → 7.4 ⚠ → 9.5 ⚠ → 9.7 ⚠ → 9.8 (go live)
```

Phases 2 and 3 can run in parallel with Phase 1 — the scaffold and design system do not depend
on the content being final.
