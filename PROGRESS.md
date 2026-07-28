# PROGRESS — mariohossen.com

Live status of the rebuild. **Update this file whenever a task completes.**

|                   |                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------- |
| **Started**       | 2026-07-28                                                                                   |
| **Current phase** | Phase 5 — Page sections                                                                      |
| **Overall**       | 42 / 76 tasks (55%) — Phases 0, 2, 3 and 4 done; Phase 1 done bar the client-dependent parts |
| **Blocked on**    | Task 1.6 — 13 open questions for the client (8 original + 5 from the decisions pass)         |
| **Next action**   | Phase 5 (task 5.1) — build the actual page sections on the content collections               |

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
| 5 — Page sections             | ⏳ **next**        | 0/11  | 1.5 d  |
| 6 — Contact form              | ⬜ not started     | 0/9   | 0.5 d  |
| 7 — SEO / a11y / performance  | ⬜ not started     | 0/9   | 0.75 d |
| 8 — Client tooling & docs     | ⬜ not started     | 0/8   | 0.5 d  |
| 9 — Deploy & DNS cutover      | ⬜ not started     | 0/12  | 0.5 d  |

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

---

## ⬜ Upcoming

Condensed. Full detail in [docs/plan/05-task-list.md](./docs/plan/05-task-list.md).

<details>
<summary><b>Phase 5 — Page sections</b> (11 tasks)</summary>

- [ ] 5.1 Biography · 5.2 Repertoire · 5.3 Concerts (auto past/upcoming) · 5.4 Recordings (**all 21 in initial HTML**)
- [ ] 5.5 Editions · 5.6 Gallery + lightbox (**all 12 in initial HTML**) · 5.7 Label/Partners
- [ ] 5.8 Contact section · 5.9 Standalone pages · 5.10 404 · 5.11 Responsive pass

</details>

<details>
<summary><b>Phase 6 — Contact form</b> (9 tasks)</summary>

- [ ] 6.1 Pages Function · 6.2 Zod validation · 6.3 Turnstile · 6.4 Honeypot
- [ ] 6.5 ⚑ Resend + encrypted env var · 6.6 Works without JS · 6.7 `aria-live` states
- [ ] 6.8 End-to-end test on a preview deploy · 6.9 Document Web3Forms fallback

</details>

<details>
<summary><b>Phase 7 — SEO, accessibility, performance</b> (9 tasks)</summary>

- [ ] 7.1 Meta · 7.2 OpenGraph · 7.3 JSON-LD (Person, Event, MusicAlbum)
- [ ] 7.4 ⚠ Accessibility pass — axe 0 violations, keyboard-only, gold-on-gold contrast
- [ ] 7.5 Sitemap + robots · 7.6 Image optimisation verified · 7.7 Lighthouse ≥ 95
- [ ] 7.8 Budgets: HTML < 60 KB, CSS < 40 KB, JS < 15 KB · 7.9 Cross-browser

</details>

<details>
<summary><b>Phase 8 — Client tooling & documentation</b> (8 tasks)</summary>

- [ ] 8.1 Repo `CLAUDE.md` for the content model · 8.2 `docs/CLIENT-GUIDE.md` (plain language)
- [ ] 8.3 Content templates · 8.4 `npm run verify` · 8.5 `npm run preview`
- [ ] 8.6 Deploy-on-push docs · 8.7 Rollback guide
- [ ] 8.8 ⚑ **Live walkthrough — client publishes a real change themselves**

</details>

<details>
<summary><b>Phase 9 — Deploy & DNS cutover</b> (12 tasks)</summary>

- [ ] 9.1 GitHub repo · 9.2 Cloudflare Pages · 9.3 Verify on `.pages.dev` · 9.4 ⚑ Client review
- [ ] 9.5 ⚠ `_redirects` — nothing from the old sitemap may 404
- [ ] 9.6 ⚠ Lower DNS TTL to 300 s, 24 h ahead
- [ ] 9.7 ⚠ **Full WordPress backup, verified openable**
- [ ] 9.8 Move DNS · 9.9 SSL + canonical host · 9.10 Post-cutover checks (**including a real email test**)
- [ ] 9.11 Search Console · 9.12 Cancel Hostinger after 30 days

</details>

---

## ⚑ Open questions for the client

Blocking parts of Phase 1 and Phase 6. Chase these early — they have lead time.

| #   | Question                                                                                                                                                                             | Blocks |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| 1   | Which email address should contact-form enquiries go to? (`settings.json` currently uses the public Imprint address, `mariohossen@gmail.com`, as a placeholder pending confirmation) | 6.5    |
| 2   | Higher-resolution album covers? Several are only ~300 px wide.                                                                                                                       | 1.6    |
| 3   | Photographer credits for the 12 gallery portraits? (~~alt text~~ done — all 12 written directly from viewing the photos, task 4.6)                                                   | 4.6    |
| 4   | Existing Google Search Console access to hand over?                                                                                                                                  | 9.11   |
| 5   | Analytics wanted at all? (Cloudflare Web Analytics is free + cookieless)                                                                                                             | 7.x    |
| 6   | Repertoire lists — still accurate? Worth reviewing while we are in there.                                                                                                            | 1.5    |
| 7   | **Does email run through this domain?** Determines DNS-move care. Assume yes until confirmed.                                                                                        | 9.8    |

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
