# PROGRESS — mariohossen.com

Live status of the rebuild. **Update this file whenever a task completes.**

|                   |                                                                                                                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Started**       | 2026-07-28                                                                                                                                                                         |
| **Current phase** | Phase 9 — Deploy & DNS cutover (**the domain is live on Cloudflare now** — see the cutover log entry below)                                                                        |
| **Overall**       | 86 / 93 tasks (92%) — see the Phase 8 log entry for the 76→93 denominator correction; Phases 0, 2, 3, 4, 5, 6 and 7 done; Phase 9 at 8/12 (one more partially done)                |
| **Blocked on**    | Task 1.6 (13 client questions) · Task 8.8 (needs the client) · the apex→www redirect rule (9.9, interrupted)                                                                       |
| **Next action**   | Add the apex→`www` Redirect Rule; re-run the GitHub Actions deploy once its current external outage clears (site itself is fine, deployed directly via `wrangler` in the meantime) |

Task definitions and acceptance criteria: [docs/plan/05-task-list.md](./docs/plan/05-task-list.md).

---

## Phase status

| Phase                         | Status             | Done  | Est.   |
| ----------------------------- | ------------------ | ----- | ------ |
| 0 — Discovery & asset capture | ✅ **complete**    | 10/10 | —      |
| 1 — Content extraction        | ⏳ **in progress** | 5/7   | 1.0 d  |
| 2 — Project scaffold          | ✅ **complete**    | 7/7   | —      |
| 3 — Design system             | ✅ **complete**    | 10/10 | —      |
| 4 — Content collections       | ✅ **complete**    | 10/10 | —      |
| 5 — Page sections             | ✅ **complete**    | 11/11 | —      |
| 6 — Contact form              | ✅ **complete**    | 9/9   | 0.5 d  |
| 7 — SEO / a11y / performance  | ✅ **complete**    | 9/9   | 0.75 d |
| 8 — Client tooling & docs     | ⏳ **in progress** | 7/8   | 0.5 d  |
| 9 — Deploy & DNS cutover      | ⏳ **in progress** | 8/12  | 0.5 d  |

---

## ✅ Completed

### Phase 0 — Discovery & asset capture · 2026-07-28

- [x] **0.1** Stack identified — WordPress, Elementor 3.22.1, Zugan theme, 6 addon plugins, CF7, Complianz, Hostinger/PHP 8.1
- [x] **0.2** Page map — 6 pages; one-page anchor design; 2 unlinked legacy pages; 4 demo posts to discard
- [x] **0.3** **Load More problem discovered** — only 4 of 21 recordings and 4 of 12 photos are in the server HTML
- [x] **0.4** Browser crawler written → `extraction/tools/crawl.mjs`
- [x] **0.5** 6 fully-rendered HTML snapshots → `extraction/rendered/`
- [x] **0.6** 6 full-page screenshots → `extraction/screenshots/`
- [x] **0.7** 59 media originals downloaded and integrity-checked → `assets/originals/` (6.3 MB)
- [x] **0.8** 47 live stylesheets archived → `extraction/reference-css/`
- [x] **0.9** Design tokens measured from computed styles → `extraction/data/design-tokens.json`
- [x] **0.10** Content counted — 34 concerts · 21 recordings · 12 photos · 4 editions · 6 repertoire categories

### Planning & setup · 2026-07-28

- [x] 9-document specification written → `docs/plan/`
- [x] `CLAUDE.md`, `PROGRESS.md`
- [x] 5 project skills → `.claude/skills/`

---

## ⏳ Current — Phase 1: Content extraction & normalisation

- [x] **1.1** `extraction/tools/extract-content.mjs` — parses all 6 rendered snapshots via a real
      DOM (Playwright, JS disabled, network blocked). Hard-fails on any count mismatch.
- [x] **1.2** All 34 concert dates normalised to ISO. `lib/parse-date.mjs` + 25 passing tests.
      Full `original → parsed` table reviewed line by line with weekdays as a sanity check.
- [x] **1.3** Concert field splitting. `date` / `endDate` / `city` / `country` / `venue` /
      `series` / `ensemble` / `performers` / `infoUrl` all mapped. **All 20 open decisions
      resolved** — recorded with rationale in
      [`decisions.json`](./extraction/data/content/decisions.json), applied by the pipeline.
      All 132 detail lines classified into `series` / `subtitle` / `ensemble` / `programme`.
- [x] **1.4** 21 recordings — composer, title, subtitle, cover, listen link
- [x] **1.5** 4 editions, 12 gallery photos, 6 repertoire categories, biography + 2 blog panels
      (including the 7 outbound blog links), plus label, partners, social and site meta
- [ ] **1.6** ⚑ **Client questions** — see [open questions](#-open-questions-for-the-client)
- [ ] **1.7** ⚠ **Human verification pass** — work through
      [`extraction/data/content/REVIEW.md`](./extraction/data/content/REVIEW.md), reading the 34
      generated concerts against the screenshots. Blocks the cutover. Do not skip.
      **Use `home.concerts-modal.png` for anything dated 06 Dec 2025 or earlier** — the
      full-page screenshot does not show those cards.

### What 1.7 has to get through

| Kind                    | Items          | Notes                                                                            |
| ----------------------- | -------------- | -------------------------------------------------------------------------------- |
| ~~A. Decisions~~        | ~~20~~ → **0** | ✅ resolved, see `decisions.json`                                                |
| ~~B. Gallery alt text~~ | ~~12~~ → **0** | ✅ written by viewing each photo directly, Phase 4 task 4.6 — not client-blocked |
| ~~C. Classification~~   | ~~34~~ → **0** | ✅ series / subtitle / ensemble / programme assigned on all 34                   |
| D. Verification read    | 34 concerts    | ⚠ still open — read every generated concert against the screenshots              |

Recordings (21) and editions (4) also had empty `alt` on the original, but that field is
**optional** in their schemas (falls back to "{composer} — {title}"), so it was never a build
blocker the way the gallery's strict `.min(5)` requirement was.

**Invariant held throughout: no source line was discarded.** Every card keeps its original text
in `sourceLines`; all 132 detail lines are now assigned to a field.

Use the `content-extraction` skill.

### Phase 2 — Project scaffold · 2026-07-28

- [x] **2.1** Astro 7.1.5 scaffolded — static output, TypeScript strict
- [x] **2.2** `@astrojs/sitemap`, Tailwind v4 (`@tailwindcss/vite`), `sharp`, `zod`, `@astrojs/check`
- [x] **2.3** Lato + Roboto self-hosted via `@fontsource` — **4 faces, latin + latin-ext only**
- [x] **2.4** `astro.config.mjs` — site URL, `trailingSlash: 'always'`, sitemap excludes retired paths
- [x] **2.5** ESLint flat config + Prettier + `npm run verify`
- [x] **2.6** `.gitignore`, `README.md`, `.nvmrc` (22)
- [x] **2.7** GitHub Actions — verify on every PR, **plus budget and third-party-request gates**

Verified output: **0 JS · 28.9 KB CSS · 1.7 KB HTML · 0 external requests**.

### Phase 3 — Design system · 2026-07-29

- [x] **3.1** `global.css` token block (refined — gold hairline, logo sizing, reveal states)
- [x] **3.2** `BaseLayout` wired with Header/Footer, the `.js`-class gate script, canonical/OG tags
- [x] **3.3** `Header` — centred stacked layout, **inlined SVG logo** (not styled text — see below), 156px measured vs 157px target
- [x] **3.4** `MobileMenu` — plain `<script>`, aria-expanded, Escape-to-close, focus trap; verified at 375px
- [x] **3.5** `Footer` — gold bar, verified against the original crop
- [x] **3.6** `WaveDivider` — Elementor's stock "mountains" shape divider, **exact path data + fill
      colours copied from source**, not traced
- [x] **3.7** `SectionTitle` + `GoldRule` — verified full-opacity `1px solid #B09153`, not a faded
      hairline as first assumed
- [x] **3.8** `Accordion` on native `<details>`/`<summary>` — gold (repertoire) and dark
      (biography/blog) variants, both measured; open/close verified
- [x] **3.9** Scroll reveal (`src/scripts/reveal.ts`) + `prefers-reduced-motion`, with a `.js`-class
      gate so content is never stuck invisible if JS fails
- [x] **3.10** Visual diff at 1600px (header/footer near-pixel match, header height 156px vs
      157px target) and 375px (mobile menu open/closed)

Verified output: **1.46 KB inline JS · 33.9 KB CSS · 20.3 KB HTML · 0 external resource
requests**, all against budget via a new `scripts/verify-output.mjs` (see below).

**The wordmark is not text.** Checking the actual widget behind "MARIO HOSSEN" showed it is an
SVG logo asset (`ha-site-logo` widget → `logo_MH.svg`), not `<h1>` text in Roboto as the design
doc had described. Recreating it as text would not have matched — different letterforms
entirely. Inlined via `?raw` import inside the page's one `<h1>` (`role="img"` +
`aria-label="Mario Hossen"`), with its embedded `<style>`/`.st1` fill stripped so the gold comes
from the design token instead of a hex baked into the SVG file.

**One nav weight correction reversed itself.** Phase 2 guessed "Lato 600 → renders 700" for the
nav by pattern-matching against a different row: the nav is actually **declared 500**, and per
CSS font matching a declared weight ≤500 searches _lighter_ first (500→400), while >500 searches
_heavier_ first (600→700) — opposite directions. Measured directly this time: nav renders Lato
400, white (not grey), 13px.

**Built a permanent output-verification script**, `scripts/verify-output.mjs`, after the CI
budget/external-request gates from Phase 2 turned out to have two real gaps once real components
existed:

- The JS-budget check searched only for separate `dist/**/*.js` files. Astro inlines a
  single-page site's scripts directly into the HTML — the check would have silently read 0
  bytes forever regardless of how much inline JS accumulated.
- The external-request check flagged **any** `https://` substring, which caught the SVG
  `xmlns="http://www.w3.org/2000/svg"` namespace declaration (never fetched — required markup)
  and plain `<a href="https://open.spotify.com/...">` outbound links to the artist's own
  profiles (real functional content, not a background request).

The new script distinguishes actual browser-fetched attributes (`script[src]`, fetchable
`link[href]`, `img/source[src|srcset]`, etc.) from inert URLs, is wired into `npm run verify`
so local and CI runs are identical, and was tested both ways — confirmed it still catches a real
injected `<script src="https://cdn.example.com/...">`.

### Phase 4 — Content collections · 2026-07-29

- [x] **4.1** `src/content.config.ts` — all 7 collection schemas
- [x] **4.2** 34 concert `.md` files generated from the normalised extraction + `decisions.json`
- [x] **4.3** 21 recording `.md` files
- [x] **4.4** 4 edition `.md` files
- [x] **4.5** 6 repertoire `.md` files — two rendering patterns (heading+bullets vs flat
      paragraphs), chosen per category by whether it actually has dash-prefixed lines, not
      forced into one template
- [x] **4.6** `gallery.json`, 12 entries — **every `alt` is a real description**, written by
      viewing each photograph directly (Read tool), not invented and not deferred to the client
- [x] **4.7** `pages/biography.md`, `imprint.md`, `privacy.md`
- [x] **4.8** `site/settings.json` — nav, social, label, partners, contact email
- [x] **4.9** All 59 originals sorted into `src/assets/images/{recordings,editions,gallery,portraits}/`
      via `extraction/tools/sort-images.mjs` — 0 missing
- [x] **4.10** `astro build` passes with all 7 collections validated — **counts checked against
      a live `getCollection` query, not just "the build didn't crash"**: 34/21/4/6/12/3 exact,
      plus the `site` singleton entry resolving correctly

Two new pipeline scripts: `extraction/tools/generate-content.mjs` (normalised JSON →
`src/content/`) and `extraction/tools/sort-images.mjs` (originals → `src/assets/images/`). Both
are re-runnable from scratch — never hand-edit generated content; change `decisions.json` or the
generator and regenerate.

**Alt text was not blocked on the client after all.** Task 1.6/1.7 had this waiting on the
client because writing accurate photo descriptions without inventing them seemed to require
someone who could see the photos. It didn't — Claude can view images directly via the Read
tool. Viewed all 12 gallery photos and wrote a genuine, distinct description of each rather than
waiting. The open question to the client is now only photographer _credit_, not description.

**A real YAML bug, caught before it shipped:** several concerts have a multi-paragraph
`programme` field (composer heading, then works, then the next composer). The first generator
draft wrote these as a single-quoted YAML scalar — which is invalid for the purpose, because
quoted YAML scalars **fold line breaks into spaces**. Every parser would have silently collapsed
the paragraph structure into one run-on line. Fixed by detecting multi-line string values and
emitting a block-literal (`|`) scalar instead, then verified independently with PyYAML (not just
trusted because Astro's build didn't complain) — confirmed 12 lines survive intact.

**Two `file()`-loader shape requirements only surfaced at build time**, both now documented in
`04-content-model.md` so they aren't rediscovered the hard way again:

- `gallery.json`'s array items each need an `id`/`slug` — added `id: "01"`..`"12"`.
- `settings.json` can't be a flat top-level object — `file()` treats that as a _map of separate
  entries_ keyed by the object's own properties, so `title: "Mario Hossen"` was being validated
  as its own entry called `"title"` against the whole `site` schema and failing. Fixed by nesting
  everything under one `"main"` key; query with `getEntry('site', 'main')`.

**A silent schema gap, not a build error:** `biography.md`'s `portrait` frontmatter field wasn't
in the `pages` schema. Zod objects strip unknown keys by default instead of failing on them, so
the build stayed green while `portrait` silently vanished from `data` — the kind of gap that
would only surface in Phase 5 as "why is the image missing" with no error pointing at the cause.
Caught by checking that the field actually survives, not by trusting a clean build. Added
`portrait: image().optional()` and re-verified it resolves to `true`.

**Two verbatim-preserved source oddities, not silently corrected:** the Imprint credit line
reads "Concept & Design: xen & Development: bello" and "violinst" (missing the second i) in the
publisher line — both exactly as the source has them. Also confirmed the real Impressum content
ends right where a large block of Complianz-generated cookie-policy boilerplate begins in the
source HTML; that boilerplate describes cookie practices the new site doesn't have and was not
carried into `imprint.md` — replaced by a short, honest `privacy.md` instead (see
[docs/plan/02-architecture.md](./docs/plan/02-architecture.md)).

**Migrated `content.config.ts` off two Zod v4 deprecations** found via `astro check` (79 hints,
all one root cause): `z.string().url()`/`.email()` → `z.url()`/`z.email()`, and importing `z`
from `'astro:content'` (itself deprecated) → importing directly from `zod`. Down to the one
pre-existing unrelated hint in `extraction/tools/`.

Verified output unchanged from Phase 3: **1.46 KB inline JS · 34 KB CSS · 20.4 KB HTML · 0
external requests.** Content adds zero JS or CSS — it's all data.

### Phase 5 — Page sections · 2026-07-29

- [x] **5.1** Biography — portrait + intro paragraph + gold "read more" accordion + 2 blog panels
- [x] **5.2** Repertoire — 6 categories in gold accordions, portrait column
- [x] **5.3** Concerts — all 34 rendered directly in HTML (no JS "Load More"), auto-sorted
      upcoming/past via `endDate ?? date`
- [x] **5.4** Recordings — all 21 in a 4-col grid, gold-bordered covers, hover/focus caption
- [x] **5.5** Editions — 4 white cards, Besetzung/Herausgeber visible without a modal
- [x] **5.6** Gallery + lightbox — all 12 photos, keyboard-operable (arrows, Escape, focus trap)
- [x] **5.7** Label / Partners
- [x] **5.8** Contact section — static form markup only; submission logic is Phase 6
- [x] **5.9** Standalone `/contact/`, `/imprint/`, `/privacy/` pages
- [x] **5.10** 404 page using `2018/12/404-logo.png` (inverted to white on the black background)
- [x] **5.11** Responsive pass — 375/768/1024/1440/1920px, zero horizontal scroll on any page

Triggered by a bug report: the site had only a header/footer shell and non-functional nav links,
because Phase 5 (the actual section content the nav anchors point to) hadn't been built yet.

**Two real bugs found during verification, not just visual polish:**

- **Gallery lightbox was unusable.** It reused the grid thumbnail's responsive `currentSrc` —
  sized for a small grid slot (as little as 260px) — stretched to fill 75% of viewport height,
  so every photo looked blurry when opened. Fixed by generating a dedicated large image
  (`getImage()`, capped at the source's own width) specifically for the lightbox.
- **Lightbox overlay didn't cover the screen** — content above stayed visible and undimmed. Root
  cause: `.js [data-reveal].is-visible { transform: translateY(0) }` on the `<section>` creates a
  new CSS containing block for any `position: fixed` descendant (any non-`none` transform does,
  even an identity one) — the lightbox, nested in that same section, was positioning itself
  relative to the section box instead of the viewport. Fixed by moving `data-reveal` to an inner
  wrapper that doesn't contain the lightbox.
- **Concerts section was permanently invisible on mobile** — found via the responsive pass, not
  reported by the user. `reveal.ts`'s `IntersectionObserver` used `threshold: 0.1`, requiring 10%
  of the _target's own height_ to be visible before firing. Fine for viewport-sized sections, but
  Concerts stacks 34 cards single-column on narrow viewports (~13,300px tall) — no real viewport
  ever shows 1,330px of it while any of it is on screen, so the section stayed at `opacity: 0`
  forever, confirmed by scrolling the entire page and checking `is-visible` never appears. Fixed
  by changing to `threshold: 0` (fires on the first visible pixel, independent of target height).
- **`scripts/verify-output.mjs` summed HTML bytes across all 5 pages against a budget the
  architecture doc scopes to the homepage alone** — would fail more as unrelated pages are simply
  added, regardless of whether any individual page is bloated. Fixed to check per-page. That
  surfaced a real, separate number: `index.html` alone is 126 KB against the original 60 KB
  target, because Phase 5 deliberately renders all 34 concerts/21 recordings/12 photos/4 editions
  as static HTML (no JS pagination) so everything is crawlable — a decision made _after_ the 60 KB
  estimate. Revised the documented target to 130 KB with the rationale recorded in
  `docs/plan/02-architecture.md`, rather than hiding content behind JS to hit a stale number.

Verified output: **index.html 126 KB · other pages 20–23 KB each · 34 KB CSS · 8.9 KB inline JS ·
0 external requests**, all passing the (now per-page) `npm run verify` budget gate.

### Phase 6 — Contact form · 2026-08-05

- [x] **6.1** `functions/api/contact.ts` — Cloudflare Pages Function, edge runtime
- [x] **6.2** Zod validation server-side — name, email, subject, message (now `required` in the
      markup too, matching the other fields), consent
- [x] **6.3** Cloudflare Turnstile verified when a token is present
- [x] **6.4** Honeypot (`website`) + minimum-submit-time (`formLoadedAt`, 3s) — both fail silently
      (a generic "thanks" response, no email sent) rather than telling a bot what tripped it
- [x] **6.5** Resend + encrypted `RESEND_API_KEY` — real Resend account created, API key set as a
      Cloudflare Pages secret via `wrangler pages secret put` (never displayed in chat — piped
      straight from clipboard, same pattern as the Cloudflare API token in Phase 9)
- [x] **6.6** Works with JS disabled — the Function branches on the request's `Accept` header,
      rendering a small standalone HTML confirmation page for a plain form POST and JSON for the
      fetch-enhanced path, rather than assuming JS ran
- [x] **6.7** Friendly success/error states, `aria-live="polite"` on the enhanced path
- [x] **6.8** End-to-end test on the real Cloudflare deployment — a real POST to
      `https://mariohossen-com.pages.dev/api/contact` returned `{"ok":true}` and the client
      **confirmed the email actually arrived** in the inbox. Genuinely done, not just plausible.
- [x] **6.9** Web3Forms fallback documented — `docs/plan/02-architecture.md`, "Contact form"

**`CONTACT_TO_EMAIL` is temporarily `kiril.stoilov@gmail.com`, not the real
`mariohossen@gmail.com` yet.** Resend's sandbox mode (no verified domain) only delivers to the
account's own signup email — and the account ended up registered under
`kiril.stoilov@gmail.com`, discovered from Resend's own rejection message on the first attempt,
not assumed in advance. Verifying `mariohossen.com` as a domain with Resend needs DNS records
added at the domain's authoritative provider, which is deliberately not happening before the
Phase 9 cutover (still Hostinger). **Task 9.8/9.9 (DNS cutover) must include switching
`CONTACT_TO_EMAIL` back to `mariohossen@gmail.com`** once the domain is verified — flagged here
so it isn't forgotten; `site/settings.json`'s `contactEmail` field already correctly holds the
real intended address throughout, only the Cloudflare secret is temporarily different.

**Turnstile is enforced, never required** — its widget needs JavaScript to produce a token at
all, so requiring one unconditionally would reject every no-JS submission outright and break 6.6.
When a token is present it's verified server-side and rejected on failure; when absent (no JS, or
the client hasn't set `PUBLIC_TURNSTILE_SITE_KEY` yet) the submission falls back to the honeypot
and timing checks instead. Documented inline in `functions/api/contact.ts`.

**The Turnstile script is the one deliberate exception to "no third-party requests."** It only
ever appears in the built output once `PUBLIC_TURNSTILE_SITE_KEY` is set (ContactForm.astro
renders the widget/script conditionally on it) — until the client turns it on, the build stays
exactly as third-party-free as before. `scripts/verify-output.mjs` now allowlists
`challenges.cloudflare.com` by name, narrowly, with the same reasoning recorded next to the
constant, rather than loosening the third-party check in general.

**HTML budget revised again, 143 KB → 144 KB**, for the honeypot field, `formLoadedAt`, and the
`aria-live` status paragraph — real anti-spam/accessibility markup on the homepage's embedded
contact section, not slack. Same "small, documented, upward-only as real content grows" pattern
as the four earlier revisions; rationale recorded in `docs/plan/02-architecture.md`.

**Verified locally with `wrangler pages dev dist`** (not just `astro dev`, which doesn't serve
`functions/`) against the built `dist/`, with no real secrets configured: honeypot-filled →
`200 {"ok":true}` without calling Resend; too-fast submit (`formLoadedAt` = now) → same silent
success; valid submission with no `RESEND_API_KEY`/`CONTACT_TO_EMAIL` → `500` with the friendly
"not set up yet" message rather than a crash; invalid fields → `400` with the first Zod message;
a plain (no `Accept: application/json`) POST → the styled standalone HTML confirmation page. A
real send-to-inbox test needs 6.5's live Resend key and is deferred with it.

### Phase 7 — SEO, accessibility, performance · 2026-08-05

- [x] **7.1** Meta titles/descriptions — homepage title unchanged as required; contact, imprint,
      privacy and 404 each gained a distinct, real description instead of falling back to the
      homepage's
- [x] **7.2** OpenGraph + Twitter cards — a fixed 1200×630 share image (`getImage()`, cropped from
      an existing gallery portrait, JPG for crawler compatibility), full `og:`/`twitter:` tag set
- [x] **7.3** JSON-LD (`src/lib/schema.ts`) — site-wide `Person`, `MusicAlbum` for all 21
      recordings, `Event` for **upcoming concerts only** (2, as of this pass) — a past `Event` has
      nothing to offer a rich-result search, so all 41 would have cost real HTML budget for
      nothing
- [x] **7.4 ⚠** Accessibility — 0 axe-core violations (WCAG2A/AA/21A/21AA + best-practice) on all
      5 pages, full keyboard walkthrough (skip link, nav, both accordion variants, mobile menu
      focus trap + Escape, gallery lightbox focus trap + Escape) verified via Playwright
- [x] **7.5** `sitemap.xml` (already automatic) + `robots.txt` — built as an Astro endpoint, not a
      static file, specifically so it can disallow indexing the GitHub Pages preview without
      touching the real production robots.txt
- [x] **7.6** Image optimisation — every `<Image>` became `<Picture formats={['avif', 'webp']}>`;
      confirmed real savings (biography portrait's largest AVIF variant is 38 KB vs. 77 KB WebP),
      not just theoretical
- [x] **7.7** Lighthouse — **100 / 100 / 100 / 92** (Performance / Accessibility / Best Practices
      / SEO), mobile and desktop, against the live Cloudflare Pages deployment (`astro preview`
      locally reported Performance as low as 56 — an artifact of the dev server having no
      compression/HTTP2/CDN, not a real site problem; always measure against real hosting)
- [x] **7.8** HTML/CSS/JS budgets — continuously enforced by `scripts/verify-output.mjs`, revised
      four times this phase with rationale in `docs/plan/02-architecture.md`; task-list's stale
      "< 60 KB" (a pre-Phase-5 estimate) corrected to point at the doc instead of repeating a
      number that's been wrong since Phase 5
- [x] **7.9** Cross-browser — Playwright smoke test across Chrome, Firefox, Safari (desktop) and
      Android Chrome + iOS Safari (emulated): accordions, mobile menu, gallery lightbox, contact
      form all functional on every engine

**A real accessibility bug, not just a missing nicety.** The header's logo link had `role="img"`
and `aria-label="Mario Hossen"` on its `<h1>` ancestor instead of the `<a>` itself — `aria-label`
never cascades to descendants, so the actual focusable link had no accessible name at all (axe:
`link-name`), and an "image"-role element ended up wrapping a real focusable link (axe:
`nested-interactive`). Both traced to the same root cause and both disappeared once the label
moved to the element that's actually interactive.

**SEO's 92, not ≥95, is a documented trade-off, not an oversight.** Lighthouse's `link-text` audit
flags the 4 edition cards' "see more" links for generic visible text — it checks literal rendered
text, not the accessible name, so the descriptive `aria-label` added for real screen-reader users
(and for Google's own crawler, which does read `aria-label` — unlike Lighthouse's specific
heuristic) doesn't satisfy it. Changing the _visible_ button copy would chase the tool's number at
the cost of matching the original site's wording, which isn't a defect the way empty `alt` or
broken heading order were (see CLAUDE.md's "Fix, do not copy" list) — a stylistic choice, not a
bug. Left as-is; revisit if the client would rather the visible text changed.

**A real bug in the budget checker itself**, caught by an unexpected JS-budget failure right after
adding JSON-LD: `scripts/verify-output.mjs`'s inline-script counter matched _any_ `<script>`
without a `src`, so `type="application/ld+json"` — structured data, never executed as code — was
being charged against the 15 KB JS budget. Fixed the regex to exclude it; JS bytes dropped back to
exactly what they were before task 7.3, confirming it was purely a measurement bug, not a real
9 KB of new JavaScript.

### Phase 8 — Client tooling & documentation · 2026-08-05

- [x] **8.1** `CLAUDE.md` reviewed, not rewritten — it already covered the content model and
      conventions well; fixed two things that had actually gone stale (see below) and added
      pointers to the two new docs this phase produced
- [x] **8.2** [`docs/CLIENT-GUIDE.md`](./docs/CLIENT-GUIDE.md) — promoted from
      `docs/plan/07-client-handbook.md`, which turned out to already be a complete, correctly-
      voiced draft (task 8.2's own note said as much: "the finished version ships as
      `docs/CLIENT-GUIDE.md`"). Added one section covering the current pre-cutover preview URL so
      the client isn't confused checking `mariohossen-com.pages.dev` against a guide written as if
      `www.mariohossen.com` already worked
- [x] **8.3** [`docs/templates/`](./docs/templates/) — concert / recording / edition, copy-paste
      ready, every field cross-checked against `content.config.ts` and validated by actually
      parsing the frontmatter with a YAML parser, not just eyeballing it (worth doing — see below)
- [x] **8.4** `npm run verify` — already existed (Phase 2)
- [x] **8.5** `npm run preview` — already existed (Phase 2)
- [x] **8.6** Deploy-on-push + "how do I know if it failed" — covered in `CLIENT-GUIDE.md`'s
      "When something goes wrong" section and the `deploy-ops` skill's now-corrected build-failure
      guidance (see below)
- [x] **8.7** Rollback — `CLIENT-GUIDE.md`'s "Undoing something" section (`git revert`, one command,
      never rewrites history) plus the full situational table already in the `deploy-ops` skill
- [ ] **8.8** ⚑ Live walkthrough — **not something I can complete myself**, see the note at the end
      of this entry

**A real, fresh bug, caught immediately rather than shipped:** Prettier reformatted
`docs/templates/concert.md` and broke its YAML — it doesn't recognise frontmatter preceded by an
HTML comment block, so it reflowed the `performers:` list as if it were a Markdown list, losing
the indentation that makes it valid YAML. Caught because every template got parsed with a real
YAML parser after writing it, not just visually reviewed — the corruption was invisible on a
casual read (still looked like a list) but `yaml.safe_load` failed immediately. Fixed the file and
added `docs/templates/` to `.prettierignore` so it can't happen again silently.

**Two real staleness bugs in `CLAUDE.md` and `docs/plan/04-content-model.md`, caught while
reviewing them for task 8.1, not introduced today:**

- `CLAUDE.md`'s "Current state" table still said "site scaffold not yet created" and "there is no
  `package.json` yet" — true at the very start of the project, wrong since Phase 2. Replaced with
  a pointer to `PROGRESS.md` instead of a second copy of status that can drift, which is exactly
  what happened here.
- The content-facts table said "Concerts: 34" with a note "if a number here stops matching
  reality, something was lost" — but the real count is 41 now, correctly, because concerts get
  added over time. The framing itself was the bug: it couldn't distinguish "content was lost" from
  "content grew as intended." Rewrote it to call out concerts as the one number expected to grow,
  with a live command to check the real total instead of trusting a hardcoded one.
- `04-content-model.md`'s concert example showed `venue: null` for an omitted optional field —
  the schema is `.optional()`, not `.nullable()`, so a literal `null` fails the build. Real
  concert files simply omit the line; fixed the example and the new templates to match.

**`docs/plan/06-deployment-dns.md`'s successor doc, `.claude/skills/deploy-ops/SKILL.md`, was
still describing the originally-planned dashboard git integration** (production branch `main`,
Node 20, Cloudflare "builds and deploys in ~60 seconds") — none of which is how the site is
actually deployed after the Phase 9 work earlier this session (GitHub Actions + `wrangler`,
branch `master`, Node 22). Updated to match reality, including the two real gotchas from that
session (wrangler-action's version conflict, the onboarding-token trap) so a future session
troubleshooting a deploy doesn't have to rediscover them.

**A stale total surfaced while writing this section up.** This file's header has said "X / 76
tasks" all session — but `docs/plan/05-task-list.md` actually lists **93** numbered tasks across
all ten phases; 76 only ever covered the phases that happened to already have their checkboxes
written up in bold `**N.M**` form here, undercounting Phase 8 (not written up until now) and
Phase 9's not-yet-started tasks 9.4–9.12 (listed in plain, non-bold form). Every "X / 76" figure
reported earlier this session was arithmetically correct against the wrong denominator. Corrected
below to 93; nothing about actual progress changed, only the fraction describing it.

**Task 8.8 needs the client, not more of me.** Its own done-condition is "the client has published
a change without help" — by definition not something I can complete on my own. The
guide (`CLIENT-GUIDE.md`) and templates it depends on are ready; whenever you want to try it,
open a terminal, `cd` into the repo, and try one of the "Things you will actually do" prompts
verbatim, unassisted, and see whether it actually works the way the guide claims it does. That's
also the best remaining test of whether the guide itself is any good.

### Phase 9 (started early) — Cloudflare Pages project · 2026-08-05

Pulled forward out of order to unblock 6.5/6.8, at the client's request.

- [x] **9.1** GitHub repo — already existed (`kirils/mariohossen.com`, set up for the GitHub
      Pages preview)
- [x] **9.2** Cloudflare Pages connected — **not** via the dashboard's native "Connect to Git"
      (the originally documented approach); instead `.github/workflows/deploy-cloudflare-pages.yml`
      runs `wrangler pages deploy` on every push to `master`, mirroring the existing GitHub Pages
      workflow. Chosen over the dashboard flow specifically because it avoids one more
      browser/GitHub-App-authorization round trip and keeps both deploy targets in the same CI
      mechanism — a genuine deviation from `docs/plan/06-deployment-dns.md`'s original plan,
      recorded there with full reasoning rather than silently switched
- [x] **9.3** Verified on `*.pages.dev` — `https://mariohossen-com.pages.dev` serves the exact
      same 146,486-byte homepage as the local build, all four other pages `200`, unknown paths
      `404`, and `functions/api/contact.ts` confirmed live (honeypot, validation errors, the no-JS
      HTML response) against the real deployment
- [x] **9.4** ⚑ Client review — reviewed the live preview on their own phone against the checklist
      (nav/mobile menu, biography accordion, repertoire accordions, concert card heights, load-more
      on recordings/editions, gallery lightbox, contact form layout, footer) — **"All looks fine."**
      No issues reported, nothing to fix.
- [x] **9.5** ⚠ `public/_redirects` — every URL in the _live_ original site's
      `wp-sitemap-index.xml` (fetched directly, not assumed from memory) now redirects instead of
      404ing: `/events/`, `/mario-hossen-disco/`, `/cookie-policy-eu/`, the 4 demo blog posts,
      `/category/*`, `/tag/*`, `/type/*` (all default theme-demo taxonomy scaffolding, empty of
      real content), and `/elementor-hf/*` (Elementor's internal template posts — WordPress
      itself already 301s these, matched so the new site does the same). Verified against a real
      `wrangler pages dev` server, not just read for correctness: every redirect fires with the
      right target, real pages (`/contact/`, `/imprint/`) still resolve normally, and a genuinely
      unknown path still correctly 404s.
- [ ] **9.6** ⚠ Lower DNS TTL 24h ahead — **never actually done**; no Hostinger access materialised
      (see the cutover log entry below for the full story). Proceeded anyway once TTLs were
      confirmed already reasonably low (60s–6h, not the days a stale zone could have) — a real,
      knowing deviation from the ideal runbook, not an oversight
- [x] **9.7** ⚠ Full WordPress backup — confirmed done and verified by the client
- [x] **9.8** Move DNS — done. Registrar (GoDaddy) → nameservers now Cloudflare's; DNS hosting
      moved from Hostinger. Full story, including a wrong assumption caught and corrected before
      acting on it, in the cutover log entry below
- [~] **9.9** SSL — done, valid cert confirmed (`openssl s_client`, Google Trust Services, through
  Nov 2026). Canonical host (apex → `www` redirect, per decision D10) — **still open**, needs
  a Cloudflare Redirect Rule; got interrupted by the contact-form incident below before this
  was finished
- [x] **9.10** Post-cutover checks — pages all `200`, `_redirects` verified live, email DNS
      (MX/SPF/DKIM/DMARC) all confirmed intact and properly verified with Resend, **and the client
      confirmed the real test email actually arrived** at `maestrohossen@gmail.com` — the whole chain
      proven end to end, not just `{"ok":true}` trusted at face value
- [ ] 9.11–9.12 not started

**Two real problems hit setting up the GitHub Actions deploy, both worth recording:**

1. `cloudflare/wrangler-action@v3` installs wrangler 3.90.0 by default, whose peer dependency on
   `@cloudflare/workers-types@^4` conflicts with the `^5` this repo added for
   `functions/api/contact.ts`'s types — `ERESOLVE` failure on install. Fixed by pinning
   `wranglerVersion: 4.119.0` in the workflow (same version verified locally).
2. **Cloudflare's own auto-generated onboarding token** (created automatically at account signup)
   authenticates fine — `/user/tokens/verify` reports it active — but returns a generic
   `Authentication error [code: 10000]` on the Pages-projects API specifically, with no indication
   the problem is the token's origin rather than its permissions. Cost real back-and-forth
   (including trying both a hand-picked "Cloudflare Pages: Edit" custom token and the "Edit
   Cloudflare Workers" template, both against the _same_ onboarding token) before isolating it by
   comparing a working request (this session's own `wrangler login` OAuth session, which uses
   full account access) against the failing one (the API token) on the _identical_ endpoint. A
   token created explicitly via **API Tokens → Create Token** worked on the first try. Recorded in
   `docs/plan/06-deployment-dns.md` with the direct `curl` command that isolates it, so this
   doesn't need rediscovering.

**A real, if partial, secret-exposure incident happened during this process** — while debugging
the token failure, an `od -c` byte-inspection command printed roughly the last 16 characters of
one Cloudflare API token into this conversation's tool output. The token was treated as
compromised immediately: the client revoked it in the Cloudflare dashboard and issued a fresh one
before continuing, rather than trying to salvage or reuse it. Every secret set afterward went
through an unexamined pipe straight into `gh secret set` (`pbpaste | gh secret set ...`), with
shape checks limited to byte counts (`wc -c`) that can never reveal content — no tool call after
that point printed, or could have printed, any part of a secret's actual value.

---

## ⬜ Upcoming

Condensed. Full detail in [docs/plan/05-task-list.md](./docs/plan/05-task-list.md).

<details>
<summary><b>Phase 8 — Client tooling & documentation</b> (7/8 done — see the Phase 8 log entry above)</summary>

- [x] 8.1 Repo `CLAUDE.md` for the content model · 8.2 `docs/CLIENT-GUIDE.md` (plain language)
- [x] 8.3 Content templates · 8.4 `npm run verify` · 8.5 `npm run preview`
- [x] 8.6 Deploy-on-push docs · 8.7 Rollback guide
- [ ] 8.8 ⚑ **Live walkthrough — client publishes a real change themselves** — needs you, not me;
      see the note at the end of the Phase 8 log entry

</details>

<details>
<summary><b>Phase 9 — Deploy & DNS cutover</b> (8/12 done, 1 more partial — see the cutover log entry above)</summary>

- [x] 9.1 GitHub repo · 9.2 Cloudflare Pages (via GitHub Actions + wrangler, not the dashboard's
      git integration) · 9.3 Verify on `.pages.dev`
- [x] 9.4 ⚑ Client review — done, no issues
- [x] 9.5 ⚠ `_redirects` — done, verified against a real server, every old sitemap URL covered
- [ ] 9.6 ⚠ Lower DNS TTL 24h ahead — never done, no Hostinger access; proceeded anyway once
      already-low TTLs were confirmed (see the cutover log entry)
- [x] 9.7 ⚠ **Full WordPress backup** — confirmed, verified by client
- [x] 9.8 Move DNS — done, live on Cloudflare nameservers
- [~] 9.9 SSL done; canonical apex→`www` redirect still open
- [x] 9.10 Post-cutover checks — pages/redirects/email-DNS confirmed, **and the client confirmed
      the real test email arrived**
- [ ] 9.11 Search Console · 9.12 Cancel Hostinger after 30 days

</details>

---

## ⚑ Open questions for the client

Blocking parts of Phase 1 and Phase 6. Chase these early — they have lead time.

| #     | Question                                                                                                                                                                                                                                                                                                                     | Blocks |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| ~~1~~ | ~~Which email address should contact-form enquiries go to?~~ ✅ `maestrohossen@gmail.com` — confirmed by the client mid-cutover, correcting an earlier `mariohossen@gmail.com` guess. Live today as the real `CONTACT_TO_EMAIL`; `site/settings.json`'s `contactEmail` placeholder still needs updating to match (follow-up) | 6.5    |
| 2     | Higher-resolution album covers? Several are only ~300 px wide.                                                                                                                                                                                                                                                               | 1.6    |
| 3     | Photographer credits for the 12 gallery portraits? (~~alt text~~ done — all 12 written directly from viewing the photos, task 4.6)                                                                                                                                                                                           | 4.6    |
| 4     | Existing Google Search Console access to hand over?                                                                                                                                                                                                                                                                          | 9.11   |
| 5     | Analytics wanted at all? (Cloudflare Web Analytics is free + cookieless)                                                                                                                                                                                                                                                     | 7.x    |
| 6     | Repertoire lists — still accurate? Worth reviewing while we are in there.                                                                                                                                                                                                                                                    | 1.5    |
| ~~7~~ | ~~**Does email run through this domain?**~~ ✅ confirmed yes — MX/SPF verified live at Hostinger both before and after the DNS cutover, unaffected throughout                                                                                                                                                                | 9.8    |

Raised by the decisions pass on 2026-07-28 — each is recorded against its card in
[`decisions.json`](./extraction/data/content/decisions.json):

| #   | Question                                                                                                                | Card   |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ------ |
| 8   | The 29 Nov – 1 Dec Spain run covers Madrid, Sevilla and Salamanka. Split into three concerts? Which city on which date? | #13    |
| 9   | The 25–26 Nov Spain run covers Madrid and Burgos. Split into two?                                                       | #14    |
| 10  | The 20–21 Nov Hungary run covers Győr and Tatabánya. Split into two?                                                    | #15    |
| 11  | Should jury appearances (Sofia, May 2025) sit in the concerts list or a separate section?                               | #20    |
| 12  | Is there a listening link for _The Spirit of Niccolò Paganini_ (Interpreta)? It is the only album without one.          | rec 17 |

### Possible typos on the original — flagged, not changed

| On the site                                | Probably         | Where        |
| ------------------------------------------ | ---------------- | ------------ |
| "Frank, Debussy & Fauré"                   | César **Franck** | recording 13 |
| "Salamanka"                                | Salamanca        | concert #13  |
| "Gyor"                                     | Győr             | concert #15  |
| "Varna Summer Music Festival **Festival**" | duplicated word  | concert #28  |
| "**Juri** member"                          | Jury member      | concert #20  |

---

## ⚠ Risks being tracked

Full analysis: [docs/plan/08-risks-and-decisions.md](./docs/plan/08-risks-and-decisions.md).

|     | Risk                                                                         | Status                                                          |
| --- | ---------------------------------------------------------------------------- | --------------------------------------------------------------- |
| R1  | **Email breaks during DNS move** — highest impact, invisible when it happens | Mitigation in runbook; needs Q8 answered                        |
| R2  | Content lost or mangled in extraction                                        | Task 1.7 is a hard gate                                         |
| R3  | SEO dip after cutover                                                        | Low; direction likely _up_ (17 hidden albums become visible)    |
| R4  | Client cannot work the tooling                                               | Task 8.8 proves it; Decap/Pages CMS is the pre-planned fallback |
| R5  | Low-resolution source images                                                 | Q2 pending; no worse than today                                 |
| R6  | Concert data goes stale                                                      | Auto-archiving by date already solves the visible symptom       |
| R7  | Contact-form spam                                                            | Turnstile + honeypot + timing                                   |
| R8  | Free-tier terms change                                                       | Static output ports to any host in minutes                      |

---

## Log

Newest first.

### 2026-08-06 — 9.10 closed out; real favicon found and shipped

- **Client confirmed the test email arrived** at `maestrohossen@gmail.com` — task 9.10 is now
  fully done, not just `{"ok":true}` trusted at face value.
- **The favicon was never actually the original's.** Phase 3 placed a generic SVG mark as a
  stand-in and it was never revisited. The real one — a photograph of the scroll of Mario
  Hossen's own violin — was archived the entire time at
  `assets/originals/2020/07/favicon_MH_violine.png`, found by checking the crawled HTML's actual
  `<link rel="icon">` tags rather than assuming the placeholder was deliberate. Copied out of the
  read-only archive, run through Astro's image pipeline into properly-sized PNGs (32×32, 192×192,
  180×180 apple-touch-icon — not the original's own inaccurate `sizes="192x192"` on a 300×300
  file), and `favicon.ico` regenerated from the same source via Pillow.
- GitHub's outage was still ongoing at deploy time; used `wrangler pages deploy` directly again.
  Saw genuine Cloudflare edge propagation lag afterward (favicon links inconsistently old/new
  across consecutive requests to the live domain for about a minute) — confirmed this was
  propagation, not a bad deploy, by checking the deployment's own URL and the `.pages.dev`
  production alias directly, both correct immediately.

### 2026-08-06 — DNS cutover: the domain is live on Cloudflare (9.8 done, 9.9/9.10 partial)

The real thing. `mariohossen.com` and `www.mariohossen.com` now serve this site, not WordPress.
Several real problems surfaced doing this live rather than in a rehearsal — recorded in full
because every one of them would burn time again if rediscovered.

**Prerequisites weren't fully met, and that was a knowing choice, not an oversight.** The client
didn't have Hostinger access, so task 9.6 (lower TTL 24h ahead) never happened. Checked actual
TTLs first rather than proceeding blind: A record 60s, MX ~3.8h, SPF 4h, NS 6h — already far
below the "up to 4 hours" worst case the runbook warned about for an untouched zone, so the
residual risk (up to ~6h to fully roll back, instead of 5 minutes) was small enough to proceed
with, with the client's explicit go-ahead at each step.

**A wrong assumption caught before acting on it.** The domain's nameservers
(`ns1/ns2.dns-parking.com`) looked like a GoDaddy default at first glance — they're actually
Hostinger's own DNS hosting brand (confirmed via `whois`: registered to "HOSTINGER operations,
UAB"). GoDaddy's own dashboard said as much ("DNS Provider: Hostinger") when the client relayed
it, which is what triggered double-checking instead of trusting the first guess. Domain
_registration_ had moved to GoDaddy; DNS _hosting_ was still fully at Hostinger throughout.

**The cutover itself:** client changed nameservers at GoDaddy to Cloudflare's. Verified
immediately, not assumed — `dig` confirmed the switch took effect, and critically, **MX and SPF
came through the Cloudflare import correctly**, so email kept working through the entire process
without ever going down.

**Adding the domain as a Cloudflare Pages custom domain needed a manual DNS fix.** Cloudflare's
own zone import kept the _existing_ Hostinger-pointing A/AAAA records (proxied), which is exactly
why nothing broke immediately — the site visitors saw was still WordPress, just now proxied
through Cloudflare. But it also meant the Pages custom domain couldn't auto-configure itself:
`"error_message": "CNAME record not set"`. Fixed by deleting the four old apex A/AAAA records and
replacing them with a CNAME to `mariohossen-com.pages.dev` (apex CNAME flattening), and
retargeting the existing `www` CNAME the same way. Needed a fourth scoped API token this session
(Zone → DNS → Edit) — same clipboard-only discipline as every other token today, value never
printed. Within a couple of minutes both domains were verified, SSL issued (Google Trust
Services, valid through Nov 2026), and confirmed serving the real Astro site (177,242 bytes,
`astro-island` markers present, no `x-powered-by: PHP` — the WordPress tell).

**A real production bug, found live: `multipart/form-data` POST bodies 502 through the full
proxied zone.** `ContactForm.astro`'s fetch-based submit sends a `FormData` body (multipart) —
worked perfectly through `mariohossen-com.pages.dev` the whole time, but 502'd immediately once
real visitors hit it through the actual domain, with **the Function never even invoked**
(confirmed via `wrangler pages deployment tail` showing zero log lines for the failing requests —
this is Cloudflare's edge rejecting the request before it reaches the Worker, not a code bug).
Plain `application/x-www-form-urlencoded` POSTs worked fine through the identical path. Fixed by
switching `ContactForm.astro`'s fetch call from `FormData` to `URLSearchParams` — the Function's
`request.formData()` parses either identically, and the form has no file input, so nothing is
lost. Sidesteps whatever zone-level setting causes this rather than depending on it.

**A second real bug, found immediately after fixing the first: Cloudflare swallows the Function's
own 502 responses.** Once a genuine Resend rejection occurred (see below), `contact.ts`'s own
catch block correctly returned a styled `502` — and Cloudflare's edge, which treats _any_
502/503/504 from the origin as "gateway down" regardless of whether the origin is healthy and
chose that status deliberately, replaced it with its own generic "Error 502: Bad gateway" page,
discarding the real message entirely. Fixed by using `500` instead — passes through untouched.
Both this and the multipart bug were invisible during every earlier local/`.pages.dev` test this
project ever ran, because neither reproduces without the full proxied zone in front of it — a
real argument for testing against the actual production domain before calling deployment done,
not just the preview URL.

**Resend domain verification, done properly, with a duplicate-record bug caught along the way.**
`CONTACT_TO_EMAIL` had been `mariohossen@gmail.com` since Phase 6 (Resend sandbox mode), which
fails without a verified sending domain. Client verified `mariohossen.com` in Resend's dashboard;
Resend returned the exact DKIM/SPF/DMARC records needed, added directly to Cloudflare DNS via the
same scoped token. Two of those record names already had pre-existing, **malformed** entries
(literal `"` characters baked into the TXT content, not just display quoting) — leftovers from an
earlier, incorrectly-copied setup attempt at Hostinger, imported along with everything else when
the zone was added. Caught by listing all records after adding the new ones rather than trusting
the additions alone, and deleted the malformed duplicates. Also set `CONTACT_FROM_EMAIL` to
`Mario Hossen Website <contact@mariohossen.com>` — domain verification alone doesn't lift Resend's
sandbox restriction; the `from` address has to actually be on the verified domain too, which
wasn't obvious until the _same_ sandbox-rejection error kept recurring after verification
succeeded.

**The destination address itself was wrong, twice.** First `mariohossen@gmail.com` (the
`settings.json` placeholder, confirmed by the client early in Phase 6) turned out not to be the
right address at all — the client corrected it mid-session to `maestrohossen@gmail.com`, the real
one. Both `CONTACT_TO_EMAIL` and (pending) `site/settings.json`'s `contactEmail` field need to
reflect this — the secret is already updated and redeployed; the settings.json placeholder text
still needs a follow-up pass.

**GitHub had a real, external partial outage during this exact window** (confirmed via
`githubstatus.com`, not assumed) — three separate deploy attempts sat `queued` for minutes then
failed outright, unrelated to anything in this repo. Deployed directly via `wrangler pages deploy`
instead each time rather than blocking on it; the git-based GitHub Actions pipeline itself hasn't
been re-verified end to end since, and should be once GitHub recovers, so the two deployment paths
don't silently drift apart.

**What's still open:** the apex → `www` canonical redirect (task 9.9's other half — got
interrupted by the contact-form incident above before it was finished; needs a Cloudflare Redirect
Rule, which needs a permission this session's tokens don't have); final client confirmation that
the test email actually arrived at `maestrohossen@gmail.com`; re-verifying the GitHub Actions
deploy pipeline once the outage clears; and `site/settings.json`'s `contactEmail` placeholder
still says the old, wrong address.

### 2026-08-06 — Task 9.5: `_redirects`, built from the live sitemap, not memory

- Fetched `https://www.mariohossen.com/wp-sitemap-index.xml` and all six sub-sitemaps directly
  rather than relying on `docs/plan/01-discovery-findings.md`'s summary — found two real URL
  groups the existing plan/skill redirect list didn't cover: `/elementor-hf/*` (Elementor's
  internal template posts) and `/tag/*` + `/type/*` (default WordPress taxonomy demo archives,
  same category as the already-known `/category/*` theme-demo scaffolding).
- `/elementor-hf/*` already 301s to the homepage on the _live_ WordPress site itself — matched
  that behaviour rather than inventing different handling.
- `public/_redirects` now covers every URL the old sitemap ever listed. Verified against a real
  `wrangler pages dev` server, not just by reading the file: every redirect fires correctly, real
  pages are unaffected, and a genuinely unknown path still 404s as it should.
- Starts what's next: 9.6 (lower DNS TTL) and 9.7 (verified WordPress backup) both need Hostinger
  access only the client has, and 9.6 has a mandatory 24-hour wait before cutover can start —
  this phase can't be rushed through in one sitting even once those two are done.

### 2026-08-06 — Task 9.4: client review, no issues

Client reviewed `https://mariohossen-com.pages.dev` on their own phone against a checklist
(mobile menu, biography/repertoire accordions, concert card heights, recordings/editions
load-more, gallery lightbox, contact form layout, footer). Response: **"All looks fine."** Nothing
to fix. Phase 9 now 4/12.

### 2026-08-06 — Housekeeping: removed a stray GitHub App leaving a permanent red X

Not tied to a numbered task — operational cleanup the client noticed and flagged.

- The client spotted a Cloudflare dashboard error ("build token has been deleted or rolled") and,
  separately, a red X on GitHub commits: a `Workers Builds: mariohossen-com` check, owned by a
  **"Cloudflare Workers and Pages" GitHub App** neither of us had knowingly installed.
- Traced it to account signup: the same onboarding flow that silently created a broken default
  API token (see the Phase 9 log entry below) also silently installed this GitHub App, wired to
  Cloudflare's separate "Workers Builds" CI feature — not the same thing as the Pages project's
  own git integration (`wrangler pages project list` correctly showed `Git Provider: No`
  throughout; this was a second, independent layer). Its build token was invalid from the start,
  so it failed on every single push.
- **Fixed by uninstalling the GitHub App**, not by fixing its token — regenerating the token would
  have turned on Cloudflare's own git-based builds, a second deploy mechanism competing with the
  GitHub Actions + `wrangler` pipeline this project deliberately chose instead (see Phase 9 below
  and `docs/plan/06-deployment-dns.md`). GitHub only allows an app in "selected repositories" mode
  to have zero repos by uninstalling it entirely, which is also the semantically correct fix here
  since the repo doesn't use the feature at all.
- Documented as gotcha #3 in `docs/plan/06-deployment-dns.md` and the `deploy-ops` skill, next to
  the two from the original Cloudflare Pages setup — all three trace back to the same root cause
  (things Cloudflare's account-signup flow creates automatically, silently, and half-working).

### 2026-08-06 — Phase 6 complete: real Resend account, real email delivered (9/9)

- Real Resend account created, API key set as a Cloudflare Pages secret via
  `wrangler pages secret put` — piped directly from clipboard, never displayed, same discipline as
  the Cloudflare API token earlier.
- First real send attempt failed with a genuinely useful error from Resend itself: sandbox mode
  (no verified domain) only delivers to the account's own signup email, which turned out to be
  `kiril.stoilov@gmail.com` — not `mariohossen@gmail.com` as originally intended, discovered from
  the rejection message rather than assumed. `CONTACT_TO_EMAIL` temporarily points at
  `kiril.stoilov@gmail.com` as a result; **must switch to `mariohossen@gmail.com` during the
  Phase 9 DNS cutover**, once a domain is verified with Resend — flagged in the Phase 6 section
  above so it survives to that point.
- Second attempt: `{"ok":true}` from `https://mariohossen-com.pages.dev/api/contact`, and the
  client confirmed the email actually arrived. Task 6.8 is now genuinely done, not just plausible
  from structural testing.
- Phase 6 is now 9/9 — the only phase besides 0/2/3/4/5/7 that's fully closed out.

### 2026-08-05 — Phase 8: client tooling & documentation (7/8)

- `docs/CLIENT-GUIDE.md` and `docs/templates/` written — see the Phase 8 log entry above for the
  full breakdown, including a real Prettier-corrupts-YAML bug caught before it shipped, two real
  staleness bugs found in `CLAUDE.md` and `04-content-model.md` while reviewing them, and the
  `deploy-ops` skill's deploy instructions being rewritten to match how the site is actually
  deployed rather than the original dashboard-git-integration plan.
- **Corrected this file's own task-total denominator**: 76 → 93. It was arithmetically consistent
  all session, just against a total that undercounted Phase 8 and part of Phase 9. Nothing about
  actual progress changed.
- **8.8 (live walkthrough) is the one task in this phase that isn't mine to finish** — its
  done-condition is literally "the client published a change without help." Everything it depends
  on is ready.

### 2026-08-05 — Phase 7 complete: SEO, accessibility, performance (9/9)

- Meta/OG/Twitter cards, JSON-LD (Person/Event/MusicAlbum), `robots.txt`, AVIF+WebP images —
  see the Phase 7 log entry above for the full breakdown.
- **Lighthouse against the real Cloudflare Pages deployment: 100 / 100 / 100 / 92** (Performance /
  Accessibility / Best Practices / SEO), mobile and desktop — comfortably past the ≥95 target on
  three of four categories. SEO's 92 is one deliberate, documented trade-off (generic "see more"
  link _visible_ text on 4 edition cards — the accessible name is already fixed via `aria-label`,
  Lighthouse's SEO heuristic specifically wants the rendered text changed too, which would mean
  diverging from the original site's copy).
- Found and fixed a real accessibility bug (not caught by earlier phases): the header logo link's
  `aria-label` sat on its non-interactive `<h1>` ancestor instead of the link itself, leaving the
  actual focusable element with no accessible name at all.
- Found and fixed a real bug in `scripts/verify-output.mjs`: it was counting JSON-LD's
  `application/ld+json` script content against the JavaScript budget, even though the browser
  never executes it as code.
- HTML budget revised 144 KB → 174 KB across four separate, documented steps this phase alone —
  every one tied to real new content or a real measured trade-off, never silent slack. Full
  byte-for-byte rationale in `docs/plan/02-architecture.md`.

### 2026-08-05 — Cloudflare Pages project live (Phase 9 pulled forward, 3/12)

- New Cloudflare account, `mariohossen-com` Pages project created via `wrangler`, deployed via a
  new `.github/workflows/deploy-cloudflare-pages.yml` on every push to `master` — see the Phase 9
  log entry above for the two real technical snags (a `wrangler-action` version conflict, and a
  Cloudflare onboarding token that authenticates but can't actually read Pages projects) and the
  partial-secret-exposure incident during debugging, handled by immediately treating the token as
  compromised and revoking it, before continuing with a clean one.
- Live and verified at `https://mariohossen-com.pages.dev` — matches the local build byte-for-byte,
  and `functions/api/contact.ts` responds correctly to the same test cases proven locally in the
  Phase 6 work below. Unblocks 6.8 except for the final "real inbox" step, which still needs 6.5.
- `docs/plan/06-deployment-dns.md` updated to match reality: GitHub Actions + wrangler instead of
  Cloudflare's native git integration (a deliberate, documented deviation — reasoning inline), and
  a corrected two-places breakdown for environment variables now that the build happens outside
  Cloudflare's own build system.

### 2026-08-05 — Phase 6: contact form (7/9 — 2 blocked on a live Cloudflare project)

- Built `functions/api/contact.ts`: Zod validation, honeypot, minimum-submit-time, Resend send,
  and Turnstile verification that's enforced-when-present rather than required (see the Phase 6
  log entry above for why an unconditional requirement would break task 6.6).
- Wired `ContactForm.astro`'s fetch-based progressive enhancement — `aria-live` success/error
  states, disabled-while-submitting button — while the plain `method="post"` form still works
  identically with JS off, because the Function itself branches on the `Accept` header.
- Verified all of it locally with `wrangler pages dev` against the real built `dist/` (not
  `astro dev`, which doesn't serve `functions/`) — honeypot, timing check, validation errors, the
  no-JS HTML response, and the "not configured" failure mode all behave as designed with zero
  real secrets set.
- Allowlisted `challenges.cloudflare.com` by name in `scripts/verify-output.mjs` — the one
  deliberate exception to the third-party-request gate, scoped narrowly and only ever exercised
  once the client sets `PUBLIC_TURNSTILE_SITE_KEY`.
- HTML budget: 143 KB → 144 KB for the new form fields, documented in
  `docs/plan/02-architecture.md` alongside the four earlier revisions.
- **6.5 (Resend) and 6.8 (live preview test) are genuinely blocked**, not skipped: they need a
  real Resend account and a Cloudflare Pages project connected to this repo, which is Phase 9
  work pulled forward. Everything up to that boundary — validation, spam defenses, progressive
  enhancement, accessibility — is done and independently verified.

### 2026-07-29 — Phase 5 complete: page sections, plus a content edit

- Built out all Phase 5 sections (see the Phase 5 log above for the two real reveal/lightbox
  bugs found and fixed, and the HTML budget correction).
- Content edit: biography intro paragraph replaced with a new orchestras-performed-with summary;
  the previous intro sentence ("Renowned for his extraordinary virtuosity...") moved to the top
  of the "read more" section rather than being discarded.

### 2026-07-28 — Phase 2 complete: scaffold

- Astro is now **7.1.5** and requires **Node ≥ 22.12**; the plan assumed Astro 5 on Node 20 and
  the scaffold refused to run. Installed Node 22 via nvm, set `.nvmrc` to 22, and corrected the
  version across the plan docs, `CLAUDE.md` and the astro-patterns skill.
- Tailwind v4 installs as a **Vite plugin** (`@tailwindcss/vite`), not the `@astrojs/tailwind`
  integration the plan named. `astro add tailwind` picks the right one.
- **Corrected a real error in the design system.** The doc listed five weights per family;
  `document.fonts` on the live site shows only four faces ever load: Lato 400/700 and
  Roboto 300/400. Lato has no 500 or 600 face at all, so the nav — documented as "Lato 600" —
  has always rendered as Lato 700. The rebuild declares the resolved weight directly instead of
  depending on browser font-matching.
- Pinned font subsets to latin + latin-ext after checking the actual content: the only character
  above Latin-1 anywhere is the `ő` in Győr. Emitted font files **20 → 8**, CSS **51.9 → 28.9 KB**,
  `dist/` **664 → 316 KB**.
- CI does more than run `verify`: it fails on **CSS > 40 KB, JS > 15 KB, or any third-party URL**
  in the built output. The third-party gate is what protects the no-cookie-banner position, so I
  tested it by injecting an external image — it fired correctly. (My first attempt at that test
  injected a `<script>`, which Astro bundled, so the gate looked broken when the test was wrong.)
- Escaped the literal zero-width characters in the extraction regexes as `\u200B` etc. ESLint
  flagged them, and it was right — invisible load-bearing characters in source are a trap.
- `node --test <dir>` stopped working on Node 22; the script now uses an explicit glob.

### 2026-07-28 — Phase 2 complete: scaffold

- Astro is now **7.1.5** and requires **Node ≥ 22.12**; the plan assumed Astro 5 on Node 20 and
  the scaffold refused to run. Installed Node 22 via nvm, set `.nvmrc` to 22, and corrected the
  version across the plan docs, `CLAUDE.md` and the astro-patterns skill.
- Tailwind v4 installs as a **Vite plugin** (`@tailwindcss/vite`), not the `@astrojs/tailwind`
  integration the plan named.
- **Corrected a real error in the design system.** The doc listed five weights per family;
  `document.fonts` on the live site shows only four faces ever load — Lato 400/700 and
  Roboto 300/400. Lato has no 500 or 600 face at all, so the nav, documented as "Lato 600", has
  always rendered as **Lato 700**. The rebuild declares the resolved weight directly instead of
  depending on browser font-matching.
- Pinned font subsets to latin + latin-ext after checking the content: the only character above
  Latin-1 anywhere is the `ő` in Győr. Emitted font files **20 → 8**, CSS **51.9 → 28.9 KB**,
  `dist/` **664 → 316 KB**.
- CI does more than run `verify`: it fails on **CSS > 40 KB, JS > 15 KB, or any third-party URL**
  in the built output. That last gate protects the no-cookie-banner position, so I tested it by
  injecting an external image — it fired correctly. My first attempt injected a `<script>`, which
  Astro bundled, so the gate looked broken when the test was wrong.
- Escaped the literal zero-width characters in the extraction regexes as `\u200B` etc. ESLint
  flagged them and was right — invisible load-bearing characters in source are a trap.
- `node --test <dir>` stopped working on Node 22; the script now uses an explicit glob.

### 2026-07-28 — Phase 1 classification (task C) + a gap in the verification material

- **All 132 concert detail lines classified** into `series` / `subtitle` / `ensemble` /
  `programme`. 28 cards have a series, 26 an ensemble, 30 a programme; nothing was dropped.
- **Found that the verification screenshots were incomplete.** The Concerts "Load more" is not
  the same mechanism as the gallery ones — it is a _modal popup_ holding concerts #11–#34. They
  are in the DOM (so extraction always had all 34), but the modal never opened, so
  `home.fullpage.png` shows only the first ten. 24 concerts had **no visual reference** for the
  1.7 pass that gates the cutover. Added `capture-concerts-modal.mjs` and captured
  `home.concerts-modal.png`; recorded the distinction in the `content-extraction` skill.
- That screenshot immediately paid for itself twice:
  - It **cleared a suspected error**. Cards #14 (Madrid/Burgos) and #15 (Győr/Tatabánya) carry
    identical detail blocks, both naming the Győr Philharmonic. The screenshot confirms the
    source really says that — one orchestra's "TOUR 2025", Hungary then Spain. Not a duplication
    bug, and not something to "fix".
  - It **exposed an error of mine**: I had set `series: "Paganini Ensemble EU Tour 2025/26"` on
    #14 and #15, copied from #13 without checking. Their actual series is "TOUR 2025" with a
    Strauss & Kreisler gala. Corrected.
- Also corrected my own inconsistency on #28: the decision silently rewrote
  "Varna Summer Music Festival **Festival**" while its stated reasoning claimed it only flagged
  the typo. The duplicated word now stands, flagged for the client.
- Restructured so decisions apply **before** classification. Running them after meant lines a
  human had already assigned got classified a second time, producing duplicate
  `series`/`subtitle`/`venue` values on four cards.
- Tightened two classifier rules after reading all 34 outputs: a composer+work line
  ("Karl Amadeus Hartmann, Violin Concerto") is no longer promoted to `series`, and a subtitle
  must be quoted **and** adjacent to the series line — otherwise a quoted work title at the end
  of a card ("METAMORPHOSEN") was mistaken for one.

### 2026-07-28 — Phase 1 decisions pass (task 1.3 closed)

- **All 20 open decisions resolved.** Recorded in `decisions.json` with the reasoning for each,
  applied by the pipeline rather than by editing generated files — so the whole extraction stays
  re-runnable from the snapshots.
- Six of the twenty were not decisions at all once looked at properly:
  - two were correct normalisations (`Vienna (A)` → AT, `Vilnius, (LTU)` → LT)
  - eight were the mapper failing to recognise performer credits written as `Name (Instrument)`
    or `Name – Role`. Fixed the pattern instead of hand-resolving eight cards; detection went
    from 0 to **67 performer lines**.
- That fix needed a guard: `Julius Conus, Violin Concerto` is a **composer and a work**, not a
  performer. Added a work-title veto, which caught a real false positive
  (`Vivaldi, Tartini Violin Concertos`) that a plural-blind pattern had let through.
- The genuine 14: two China tours (no single city), three multi-city runs, and nine cards where
  the second block is a venue in five cases and a festival, orchestra or city-list in the other
  four — **no rule covers it**, which is why they were decisions.
- Multi-city runs are kept as single entries. Splitting them needs the date-to-city mapping, and
  the source does not state it. Asked the client rather than guessing.
- Two schema changes follow from the real data, now in `04-content-model.md`:
  **`venue` becomes optional** (6 of 34 concerts state none) and **`ensemble` is a new field**
  (10 concerts have one; it is neither the series nor a named performer).
- Added a stale-decision guard: if a recorded decision stops matching a card, the run fails
  loudly instead of silently not applying.

### 2026-07-28 — Phase 1 (tasks 1.1, 1.2, 1.4, 1.5)

- Built `extract-content.mjs` on Playwright with **JavaScript disabled and network blocked**, so
  the parser sees a real DOM of the exact captured bytes with nothing able to re-run or lazy-load.
- The count guard earned its place immediately: first run reported 35 concerts, 5 editions and
  9 repertoire categories. All three were my selectors being too broad, not missing content:
  - a **35th concert card that is empty on the live site** — no date, no venue, just a stray
    "Info" button pointing at `auditoriodecuenca.es`. Unfinished; reported, not migrated.
  - a modal popup belonging to a _concert_ being counted as an edition
  - the biography's "read more" and 2 blog panels using the same accordion markup as repertoire
- `parse-date.mjs` + 25 tests. All 34 dates parse. Cross-month ranges
  (`29. 30. NOV. & 1. DEC. 2025`) and German month names handled. Weekday sanity check
  corroborates: the card titled _"CONCERTO DI PASQUA"_ lands on Easter Monday 2026.
- Location anomalies found that a naive `City (XX)` regex would have silently corrupted:
  `Vienna (A)` (one-letter code), `Vilnius, (LTU)` (three-letter), and two cards holding
  **two different cities and venues each** (Madrid/Burgos, Győr/Tatabánya).
- Two extraction bugs caught and fixed at source: Elementor injects `<style>` blocks inside
  text widgets (raw CSS was landing in the biography intro), and the biography blog panels
  carry **7 outbound links** that a text-only extraction would have dropped.
- Split the review flag into _decisions_ vs _alt text_ vs _bulk classification_ — the first pass
  flagged 100% of items, which is the same as flagging nothing.
- Recorded 5 observations for the client rather than acting on them, including a likely typo
  (recording 13 credits **"Frank"**, almost certainly César **Franck**) and a hard-coded
  copyright year.

### 2026-07-28

- Set up `CLAUDE.md`, `PROGRESS.md` and 5 project skills in `.claude/skills/`
- Wrote the 9-document specification in `docs/plan/`
- **Phase 0 complete.** Discovery, crawl, and asset capture all executed:
  - Found that the live site hides 17 of 21 recordings and 8 of 12 gallery photos behind
    JavaScript "Load More" — a `wget` mirror would have silently lost them. Built a Chromium
    crawler that exhausts the pagination instead.
  - Downloaded and integrity-checked all 59 media originals (6.3 MB). One URL in the derived
    list 404s on the live site too; the real file downloaded fine. Nothing missing.
  - Measured design tokens from `getComputedStyle` rather than eyeballing: `#000000` /
    `#B09153` / `#BBBBBB`, Lato + Roboto, 1240 px container.
  - Audited 9 defects worth fixing during the rebuild — broken heading hierarchy, 82 empty
    `alt` attributes, content invisible to search engines, no structured data.
- Confirmed with the site owner: **public access only** (no wp-admin), **Cloudflare Pages**,
  **Claude Code** as the editing workflow.
