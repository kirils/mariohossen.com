# 03 — Design System

Every value here was read from `getComputedStyle` on the live site, not eyeballed. Raw data:
`extraction/data/design-tokens.json`. Visual reference: `extraction/screenshots/*.fullpage.png`.

---

## Colour

| Token             | Value                | Where it appears                                                | Frequency       |
| ----------------- | -------------------- | --------------------------------------------------------------- | --------------- |
| `--color-bg`      | `#000000`            | Page background, most section bands                             | 29 elements     |
| `--color-gold`    | `#B09153`            | Section titles, rules, borders, concert band, footer bar, links | 44 text + 20 bg |
| `--color-text`    | `#BBBBBB`            | Body copy                                                       | 326 elements    |
| `--color-white`   | `#FFFFFF`            | Card headings, concert dates, form fields                       | 145 elements    |
| `--color-ink`     | `#000000`            | Text on gold backgrounds, button fills                          | 73 elements     |
| `--color-surface` | `rgba(35,35,35,0.9)` | Overlay panels                                                  | 1               |
| `--color-slate`   | `#23282D`            | Minor UI chrome                                                 | 1               |

The palette is genuinely just **black, gold, grey, white**. Do not add colours.

### Contrast — needs attention

`#BBBBBB` on `#000000` is **12.6:1** — excellent.
`#B09153` on `#000000` is **6.4:1** — passes AA for both normal and large text.
`#000000` on `#B09153` is the same 6.4:1 — fine.

But **`#B09153` gold text on the gold `#B09153` concert band** appears in places on the current
site at very low contrast. During the rebuild, text on the gold band must be `#000000` or
`#FFFFFF`. Checked in task 7.4.

---

## Typography

Two families, self-hosted via `@fontsource` (no Google Fonts CDN — see
[02-architecture.md](./02-architecture.md#privacy-and-why-there-is-no-cookie-banner)).

| Role                                        | Family     | Size          | Weight                   | Colour                         |
| ------------------------------------------- | ---------- | ------------- | ------------------------ | ------------------------------ |
| Body                                        | **Lato**   | 16 px / 26 px | 400                      | `#BBBBBB`                      |
| Section title (`REPERTOIRE`, `CONCERTS`, …) | **Roboto** | 32 px         | 300                      | `#B09153`                      |
| Wordmark `MARIO HOSSEN`                     | **Roboto** | ~42 px        | 300, wide letter-spacing | `#B09153`                      |
| Concert date                                | **Lato**   | 30 px         | 700                      | `#FFFFFF`                      |
| Card title                                  | **Lato**   | 20 px         | 700                      | `#FFFFFF`                      |
| Card meta / personnel                       | **Lato**   | 13–14 px      | 400 / **700**            | `#BBBBBB`                      |
| Nav                                         | **Lato**   | 14 px         | **700**, uppercase       | `#BBBBBB` → `#B09153` on hover |
| Small print / footer                        | **Lato**   | 12–13 px      | 400                      | `#BBBBBB`                      |

### Only four faces are real — corrected 2026-07-28

The original site's CSS _declares_ Lato at 300, 500 and 600 in places, and this document
originally repeated those numbers. They are not real. Checking `document.fonts` on the live site
shows only **four faces ever reach `loaded`**:

| Family | Weights actually loaded |
| ------ | ----------------------- |
| Lato   | **400, 700**            |
| Roboto | **300, 400**            |

The stylesheet only ever requests `Lato:400,700`. Lato has no 500 or 600 face at all — its real
weights are 100/300/400/700/900 — so the browser resolves the declared values to the nearest
available face:

| Declared | Actually rendered |
| -------- | ----------------- |
| Lato 300 | Lato 400          |
| Lato 500 | Lato 400          |
| Lato 600 | **Lato 700**      |

So the nav, which this document previously described as "Lato 600", has always rendered as
**Lato 700**. The rebuild declares the resolved weight directly rather than relying on the
browser to snap — same pixels, no dependence on font-matching behaviour.

Subsets are pinned to **latin + latin-ext**. The default `@fontsource` imports also ship
cyrillic, greek, vietnamese, math and symbol subsets; the only character above Latin-1 in the
entire content is the `ő` in Győr. Pinning cut the emitted font files from 20 to 8 and the CSS
bundle from 51.9 KB to 28.9 KB.

Size scale in use: `12, 13, 14, 15, 16, 20, 22, 26, 30, 32` px.

### Heading hierarchy — a fix, not a copy

The current markup is wrong (`<h1>` on a concert date, no page `<h1>`). The rebuild keeps the
_visual_ result identical while fixing the _semantics_:

| Visual element          | Current tag               | New tag                         |
| ----------------------- | ------------------------- | ------------------------------- |
| `MARIO HOSSEN` wordmark | `<p>`                     | **`<h1>`** (visually unchanged) |
| Section titles          | `<h2>`                    | `<h2>` ✓                        |
| Concert dates           | `<h3>` / one stray `<h1>` | **`<h3>`** consistently         |
| Album / edition titles  | `<h3>`                    | `<h3>` ✓                        |

---

## Layout

| Token             | Value                                    |
| ----------------- | ---------------------------------------- |
| `--container`     | **1240 px** max-width, centred           |
| Gutter            | 20 px mobile, 40 px desktop              |
| Header height     | 157 px (wordmark + nav + social row)     |
| Section padding   | ~80 px top/bottom desktop, ~48 px mobile |
| Grid — recordings | 4 columns desktop → 2 tablet → 1 mobile  |
| Grid — gallery    | 4 columns desktop → 2 tablet → 1 mobile  |
| Grid — concerts   | 3 columns desktop → 2 tablet → 1 mobile  |
| Grid — editions   | 4 columns desktop → 2 tablet → 1 mobile  |

Breakpoints (inherited from the current site, keep them):
`mobile ≤ 767 px · tablet ≤ 1023 px · desktop ≥ 1024 px`

---

## Section rhythm

The page alternates bands, and this alternation _is_ the design:

```
┌─ HEADER ──────────────── black, wordmark + nav + social
├─ BIOGRAPHY ───────────── black, portrait left / text right
├─ REPERTOIRE ──────────── black, gold accordion + portrait right
├─ CONCERTS ────────────── black title, then ⟨purple→gold curved divider⟩, then GOLD band
├─ RECORDINGS ──────────── black, 4-col album grid, gold hairline under title
├─ EDITIONS ────────────── black, 4-col white cards
├─ GALLERY ─────────────── black, 4-col photo grid, gold borders
├─ LABEL / PARTNERS ────── black, 2-col
├─ CONTACT ─────────────── black, form right
└─ FOOTER ──────────────── GOLD bar, copyright + links + social
```

### The curved divider

A signature detail: an SVG wave transitioning **purple → gold** where the black Concerts heading
meets the gold Concerts band. Reproduce as an inline SVG (a few hundred bytes) rather than the
current background image. Extract the exact curve from the screenshots — task 3.6.

---

## Components to build

| Component                  | Used by                                      | Interactive?                 |
| -------------------------- | -------------------------------------------- | ---------------------------- |
| `SectionTitle`             | every section                                | no                           |
| `GoldRule`                 | under each section title                     | no                           |
| `WaveDivider`              | concerts                                     | no                           |
| `Accordion`                | repertoire, biography read-more, blog panels | **yes** — `<details>`, no JS |
| `ConcertCard`              | concerts                                     | no                           |
| `AlbumCard`                | recordings                                   | no                           |
| `EditionCard`              | editions                                     | no                           |
| `GalleryGrid` + `Lightbox` | gallery                                      | **yes** — ~5 KB vanilla JS   |
| `MobileMenu`               | header                                       | **yes** — ~2 KB              |
| `ContactForm`              | contact, /contact                            | **yes** — fetch + Turnstile  |
| `SocialRow`                | header, footer                               | no                           |

Only four components ship JavaScript. Everything else is static HTML.

The repertoire accordion, the biography read-more and the blog panels can all be native
`<details>`/`<summary>` — styled to match, keyboard-accessible for free, and **zero JavaScript**.
That alone replaces a large part of what Elementor is currently loading.

---

## Motion

The current site uses `animate.css` entrance animations on scroll. Reproduce with a small
`IntersectionObserver` (fade + 12 px rise, 400 ms) — but wrap it in
`@media (prefers-reduced-motion: reduce)` so it is disabled for visitors who ask for that. The
current site does not respect that preference.

---

## Tailwind v4 token block

Drop straight into `src/styles/global.css`:

```css
@import 'tailwindcss';

@theme {
  --color-bg: #000000;
  --color-gold: #b09153;
  --color-text: #bbbbbb;
  --color-white: #ffffff;
  --color-surface: rgb(35 35 35 / 0.9);

  --font-sans: 'Lato', system-ui, sans-serif;
  --font-display: 'Roboto', system-ui, sans-serif;

  --container-site: 1240px;

  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
}
```
