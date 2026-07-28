---
name: design-fidelity
description: Design tokens and visual-fidelity method for mariohossen.com — the measured colour palette, typography, layout grid, section rhythm and component inventory, plus how to verify a rebuilt section against the original screenshots. Use for any visual or styling work, when a section looks wrong, or when checking that the rebuild matches the WordPress original.
---

# Design fidelity

The brief is "same design as the existing site". That means the **same visual result**, not the
same markup — the original has defects worth leaving behind (see [Fix, do not
copy](#fix-do-not-copy)).

Every value here was read from `getComputedStyle` on the live site. Raw data:
`extraction/data/design-tokens.json`. Full write-up:
[docs/plan/03-design-system.md](../../../docs/plan/03-design-system.md).

## Palette

```
--color-bg      #000000    page background, most section bands
--color-gold    #B09153    section titles, rules, borders, concert band, footer
--color-text    #BBBBBB    body copy
--color-white   #FFFFFF    card headings, concert dates, form fields
--color-surface rgb(35 35 35 / 0.9)
```

Black, gold, grey, white. **Do not add colours.** If something needs to stand out, use weight,
size or space.

### Contrast

| Pair                        | Ratio  |                                                   |
| --------------------------- | ------ | ------------------------------------------------- |
| `#BBBBBB` on `#000000`      | 12.6:1 | ✅                                                |
| `#B09153` on `#000000`      | 6.4:1  | ✅ AA                                             |
| `#000000` on `#B09153`      | 6.4:1  | ✅ AA                                             |
| `#B09153` on `#B09153` band | ~1:1   | ❌ **appears on the original — do not reproduce** |

Text sitting on the gold concert band must be `#000000` or `#FFFFFF`.

## Typography

Self-hosted via `@fontsource` — never the Google Fonts CDN (that is what keeps the site free of a
cookie banner).

**Only four faces are real: Lato 400/700 and Roboto 300/400.** The original's CSS _declares_
Lato at 300/500/600 in places, but `document.fonts` on the live site shows those never load —
Lato has no 500 or 600 face at all (real weights: 100/300/400/700/900), so the browser silently
resolves the declared weight to the nearest available one:

| Declared | Actually renders |
| -------- | ---------------- |
| Lato 300 | Lato 400         |
| Lato 500 | Lato 400         |
| Lato 600 | **Lato 700**     |

Declare the **resolved** weight directly — do not import Lato 300/500/600, they don't exist and
importing them either errors or silently substitutes.

| Role                                    | Family                   | Size    | Weight                                    | Colour                                                        |
| --------------------------------------- | ------------------------ | ------- | ----------------------------------------- | ------------------------------------------------------------- |
| Body                                    | Lato                     | 16 / 26 | 400                                       | `#BBBBBB`                                                     |
| Section title                           | Roboto                   | 32      | 300                                       | `#B09153`                                                     |
| Wordmark `MARIO HOSSEN`                 | **not text — see below** | —       | —                                         | `#B09153` (baked into the SVG)                                |
| Concert date                            | Lato                     | 30      | 700                                       | `#FFFFFF`                                                     |
| Card title                              | Lato                     | 20      | 700                                       | `#FFFFFF`                                                     |
| Card meta (series/performers/programme) | Lato                     | 14–15   | declared 600 → renders **700**            | `#FFFFFF` on black cards, `#000000` on the gold Concerts band |
| Nav                                     | Lato                     | 13      | declared 500 → renders **400**, uppercase | `#FFFFFF` → gold on hover                                     |
| Small print                             | Lato                     | 12–13   | 400                                       | `#BBBBBB`                                                     |

**The two weight corrections above matter because Lato only has 400/700 loaded.** Per CSS font
matching, a declared weight ≤500 searches lighter first (500→400); a declared weight >500
searches heavier first (600→700). Getting the direction backwards silently ships the wrong visual
weight — verify with a real measurement on the specific element, not by pattern-matching against
a similar-looking row elsewhere in this table.

**The wordmark is an SVG logo asset** (`assets/originals/2020/07/logo_MH.svg`, viewBox
`0 0 320 58.1`, fill `#B09153`), not Roboto text — it is a hand-drawn wordmark and would not
match if recreated in a font. Inline it inside an `<h1>` with `role="img"` +
`aria-label="Mario Hossen"`.

Size scale in use: `12 · 13 · 14 · 15 · 16 · 20 · 22 · 26 · 30 · 32`.

Font subsets are pinned to **latin + latin-ext** — the only character above Latin-1 anywhere in
the content is the `ő` in Győr. The default `@fontsource` imports also ship cyrillic, greek,
vietnamese, math and symbol subsets that this content never needs; importing the unqualified
`@fontsource/lato/400.css` instead of `@fontsource/lato/latin-400.css` pulls all of them in.
Current `src/styles/global.css` already does this correctly — match its pattern for any new
weight.

## Layout

```
container   1240px, centred
gutter      20px mobile · 40px desktop
header      157px tall (wordmark + nav + social)
section     ~80px vertical padding desktop · ~48px mobile
breakpoints mobile ≤767 · tablet ≤1023 · desktop ≥1024
```

Grid columns — recordings, gallery, editions: **4 → 2 → 1**. Concerts: **3 → 2 → 1**.

## Section rhythm

The alternation of black and gold bands _is_ the design:

```
HEADER          black — wordmark, nav, social
BIOGRAPHY       black — portrait left / text right
REPERTOIRE      black — gold accordion + portrait right
CONCERTS        black title → ⟨purple→gold curved divider⟩ → GOLD band
RECORDINGS      black — 4-col album grid, gold hairline under title
EDITIONS        black — 4-col white cards
GALLERY         black — 4-col photos, gold borders
LABEL/PARTNERS  black — 2-col
CONTACT         black — form right
FOOTER          GOLD bar — copyright, links, social
```

### The wave divider — exact source, don't trace it

This is Elementor's stock **"mountains" shape divider**, not a bespoke design. Three layered
semi-transparent paths (`viewBox="0 0 1000 100"`, opacity 0.33/0.66/1) sit on the gold section's
own background, one set at the top edge and a different set at the bottom edge:

|                                        | Fill      | Height |
| -------------------------------------- | --------- | ------ |
| Top (black Concerts title → gold band) | `#230B66` | 35px   |
| Bottom (gold band → black Recordings)  | `#1D0956` | 50px   |

The path `d` data is real markup, already captured in
`extraction/rendered/home.rendered.html` (search `elementor-shape-fill`) — copy it verbatim into
`WaveDivider.astro` rather than tracing pixels from the screenshot.

**Matching detail:** the concert card border is `1px solid rgba(35, 11, 102, 0.24)` — the same
`#230B66` as the top divider, at 24% opacity. Reuse that literal value.

### Component measurements that needed exact-ID targeting

A generic query like `.eael-accordion-header` or `.gallery-item-thumbnail-wrap` matches the
_first_ instance in the DOM, which on this site is often the wrong one — the biography "read
more" toggle uses the same widget as the repertoire categories, and Recordings/Gallery share one
widget type. Target by known `id`/position, not by class alone, or you will silently measure the
wrong element (as an earlier probe here did — its first pass read the read-more toggle's black
background and reported it as the repertoire accordion colour).

| Element                                 | Value                                                                                        |
| --------------------------------------- | -------------------------------------------------------------------------------------------- |
| Repertoire accordion bar                | bg `#B09153` gold, title `#000000` weight 600, edge-to-edge (no gap, 1px hairline only)      |
| Biography read-more / blog-panel toggle | bg `#000000` black, text `#BBBBBB` grey — same widget, deliberately different palette        |
| Biography portrait                      | `object-fit: fill` (stretched, not cropped), no border                                       |
| "Info" button                           | bg `#000000`, text `#B09153`, 13px, `padding: 10px 20px`, `border-radius: 2px`, no uppercase |
| Gallery grid item border                | `3px solid #B09153` — Recordings covers have **no** border despite the shared widget         |

## Motion

Original uses `animate.css` entrance animations. Reproduce with a small `IntersectionObserver`:
fade + 12 px rise, 400 ms. **Always** wrap in:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

The original does not respect this preference. We do.

## Verification method

Compare against `extraction/screenshots/*.fullpage.png` (1600 px wide, full page) — **not** the
live site, so comparisons stay stable if the client edits WordPress mid-project.

```bash
# Screenshot the rebuild at the same width
npx playwright screenshot --full-page --viewport-size=1600,1200 \
  http://localhost:4321/ /tmp/rebuild.png
```

Then slice both to the same region and compare side by side:

```python
from PIL import Image
a = Image.open('extraction/screenshots/home.fullpage.png')
b = Image.open('/tmp/rebuild.png')
box = (0, 0, 1600, 1650)          # header region
a.crop(box).save('/tmp/a.png')
b.crop(box).save('/tmp/b.png')
```

Check, in this order — these are the things that read as "wrong" fastest:

1. **Vertical rhythm** — section padding and the gaps between cards
2. **Type scale** — heading sizes and weights, especially the 300-weight section titles
3. **Gold usage** — rules, borders, hover states
4. **Grid gutters** and card aspect ratios
5. **The wave divider** curve

Pixel-perfection is not the bar; nothing should look _shifted_ at a glance.

Repeat at **1024 px** and **375 px**. Full-width and mobile are where rebuilt layouts usually
diverge.

## Fix, do not copy

"Same design" means the same visual result. These defects in the original are corrected while the
appearance stays identical:

| Original                                                 | Rebuild                                       |
| -------------------------------------------------------- | --------------------------------------------- |
| `<h1>` on a concert date; no page `<h1>`                 | Wordmark is `<h1>`, visually unchanged        |
| 82 images with empty `alt`                               | Real descriptions everywhere; schema-enforced |
| Gold-on-gold text in places                              | `#000000` or `#FFFFFF` on the gold band       |
| No `prefers-reduced-motion` handling                     | Motion disabled when requested                |
| 47 stylesheets, ~380 KB HTML                             | One stylesheet < 40 KB, HTML < 60 KB          |
| jQuery + Isotope + Magnific + Vegas + Swiper + Elementor | < 15 KB of JS                                 |

If a change would alter what a visitor _sees_, it is out of scope for this list — raise it rather
than deciding unilaterally.

## Reference material

| Path                                    | What                                          |
| --------------------------------------- | --------------------------------------------- |
| `extraction/screenshots/*.fullpage.png` | Full-page visual reference, all 6 pages       |
| `extraction/data/design-tokens.json`    | Raw computed-style measurements               |
| `extraction/rendered/*.rendered.html`   | Post-JavaScript DOM — the real structure      |
| `extraction/reference-css/`             | The 47 original stylesheets, for lookups only |
