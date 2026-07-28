# Extraction Artifacts

Everything captured from the live WordPress site at `https://www.mariohossen.com` on
**2026-07-28**. This is the raw source material for the rebuild — see
[../docs/plan/](../docs/plan/).

## Contents

| Path                         | What it is                                                                                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rendered/*.rendered.html`   | All 6 pages **after JavaScript ran and every "Load More" was exhausted**. These, not the raw server HTML, are the source of truth for content extraction. |
| `screenshots/*.fullpage.png` | Full-page screenshots at 1600 px wide. The visual reference for design fidelity and for the mandatory content verification pass (task 1.7).               |
| `data/design-tokens.json`    | Colours, fonts, sizes, weights and container widths read from `getComputedStyle` on the live site.                                                        |
| `data/home.widgets.json`     | The 21 recordings and 12 gallery photos recovered from behind "Load More".                                                                                |
| `data/all-assets.txt`        | Every same-origin URL the browser requested across all 6 pages (793).                                                                                     |
| `data/dl-originals.txt`      | The 60 original media URLs that were downloaded.                                                                                                          |
| `data/media-1.json`          | Raw WordPress media-library REST response.                                                                                                                |
| `reference-css/`             | The 47 stylesheets the live site loads. Design reference only — none of this ships.                                                                       |
| `tools/crawl.mjs`            | The crawler. Re-runnable.                                                                                                                                 |

Media files themselves are in [`../assets/originals/`](../assets/originals/) (59 files, 6.3 MB),
mirroring the WordPress `wp-content/uploads/` path structure.

## Why a browser crawler and not `wget`

The Recordings and Gallery sections are Essential Addons _Filterable Gallery_ widgets. The server
sends **only the first 4 items of each**; the rest are held in a detached JavaScript array and
appended when "Load More" is clicked.

|                | `curl` / `wget` sees | After Load More |
| -------------- | -------------------- | --------------- |
| Recordings     | 4                    | **21**          |
| Gallery photos | 4                    | **12**          |
| `<img>` on `/` | 16                   | 82              |

A mirror tool captures 8 items and loses 21 without reporting anything wrong. `crawl.mjs` drives
real Chromium, dismisses the cookie banner, scrolls to trigger lazy-loading, then clicks every
Load More until the item count stops rising.

## Re-running

```bash
cd extraction/tools
npm i playwright && npx playwright install chromium
node crawl.mjs ./out
```

Worth doing once more immediately before the DNS cutover, to catch any content the client added
to WordPress in the meantime.
