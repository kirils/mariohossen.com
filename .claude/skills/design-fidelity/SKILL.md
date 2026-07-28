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
cookie banner). Weights **300, 400, 500, 600, 700** only.

| Role                    | Family | Size    | Weight             | Colour                    |
| ----------------------- | ------ | ------- | ------------------ | ------------------------- |
| Body                    | Lato   | 16 / 26 | 400                | `#BBBBBB`                 |
| Section title           | Roboto | 32      | 300                | `#B09153`                 |
| Wordmark `MARIO HOSSEN` | Roboto | ~42     | 300, wide tracking | `#B09153`                 |
| Concert date            | Lato   | 30      | 700                | `#FFFFFF`                 |
| Card title              | Lato   | 20      | 700                | `#FFFFFF`                 |
| Card meta               | Lato   | 13–14   | 400–600            | `#BBBBBB`                 |
| Nav                     | Lato   | 14      | 600, uppercase     | `#BBBBBB` → gold on hover |
| Small print             | Lato   | 12–13   | 400                | `#BBBBBB`                 |

Size scale in use: `12 · 13 · 14 · 15 · 16 · 20 · 22 · 26 · 30 · 32`.

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

### The wave divider

A signature detail: an SVG curve transitioning **purple → gold** where the black Concerts heading
meets the gold band. Reproduce as inline SVG (a few hundred bytes), traced from
`extraction/screenshots/home.fullpage.png`. Do not approximate it with a diagonal or a straight
edge — it is one of the few distinctive marks the design has.

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
