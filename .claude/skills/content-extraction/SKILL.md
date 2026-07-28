---
name: content-extraction
description: Extract content and assets from the original WordPress site at mariohossen.com — running the Playwright crawler, parsing the rendered HTML snapshots into content files, normalising the messy date formats, and re-syncing before the DNS cutover. Use for Phase 1 tasks, when content seems missing, or when the client has changed something in WordPress that needs pulling across.
---

# Extracting content from the WordPress original

Phase 1 of [docs/plan/05-task-list.md](../../../docs/plan/05-task-list.md). The most error-prone
phase in the project — a mangled programme note or a wrong date ships silently and nobody notices
for months.

## Read this first: the Load More trap

The live site runs Essential Addons _Filterable Gallery_ widgets. The server sends **only the
first 4 items of each section**; the rest sit in a detached JavaScript array and are appended
when "Load More" is clicked.

|                | `curl` / `wget` sees | Reality |
| -------------- | -------------------- | ------- |
| Recordings     | 4                    | **21**  |
| Gallery photos | 4                    | **12**  |
| `<img>` on `/` | 16                   | 82      |

**Never scrape this site with `curl`, `wget` or a plain fetch.** It returns a plausible-looking
result that is missing 17 albums and 8 photos, and reports no error.

Always work from `extraction/rendered/*.rendered.html`, which were produced by a real browser
after exhausting every Load More.

### There are TWO different "Load more" buttons — they work differently

| Section             | Mechanism                                                                                      | Consequence                                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Recordings, Gallery | Essential Addons filterable gallery — items held in a **detached JS array**, appended on click | Missing from the server HTML entirely. Must click.                                                                                |
| **Concerts**        | A **modal popup** (`wts-modal-popup`) holding concerts #11–#34                                 | Present in the DOM, so extraction sees all 34 — but the modal never opens, so the **full-page screenshot only shows ~10 of them** |

That second one is a trap for _verification_, not extraction. `home.fullpage.png` shows only the
first ten concerts; the other 24 are inside a closed modal. Their visual reference is
**`extraction/screenshots/home.concerts-modal.png`**, produced by:

```bash
node extraction/tools/capture-concerts-modal.mjs
```

Use that screenshot when verifying any concert dated **06 December 2025 or earlier**.

## Re-running the crawler

```bash
cd extraction/tools
npm i playwright && npx playwright install chromium
node crawl.mjs ./out
```

It handles: dismissing the Complianz cookie banner, scrolling to trigger lazy-loading, clicking
every Load More until item counts stop rising, then snapshotting DOM + screenshots + a structured
widget dump.

Expected output — **if any count is lower, something regressed:**

```
=== home (/) ===
  round 1: clicked 2 btn(s), tally 12 -> 24
  ...
  widgets: 21 + 12 items | dom assets 98
```

Re-run it **once more immediately before the DNS cutover** to catch anything the client added to
WordPress in the meantime.

## Source material

| Path                                        | What                                                           |
| ------------------------------------------- | -------------------------------------------------------------- |
| `extraction/rendered/*.rendered.html`       | Post-JS DOM, all Load More exhausted — **the source of truth** |
| `extraction/data/home.widgets.json`         | The 21 recordings + 12 photos, already structured              |
| `extraction/screenshots/*.fullpage.png`     | Visual reference for verification                              |
| `extraction/data/all-assets.txt`            | Every same-origin URL the browser requested                    |
| `extraction/data/content/*.normalised.json` | The mapped content — what Phase 4 turns into files             |
| `extraction/data/content/decisions.json`    | Hand-authored resolutions, each with its reasoning             |
| `extraction/data/content/REVIEW.md`         | Generated checklist for task 1.7                               |
| `assets/originals/`                         | The 59 downloaded media files (read-only archive)              |

## Pipeline

```bash
node extraction/tools/crawl.mjs ./out            # re-capture from the live site
node extraction/tools/extract-content.mjs        # rendered HTML  -> *.raw.json
node extraction/tools/normalise-content.mjs      # *.raw.json     -> *.normalised.json + REVIEW.md
node extraction/tools/check-dates.mjs            # print the date table for review
node --test extraction/tools/lib/                # 25 date-parser tests
```

Both extract and normalise are **idempotent and re-runnable**; never hand-edit a
`*.normalised.json`. To change an outcome, edit `decisions.json` and re-run — a decision that
stops matching a card makes the run fail loudly rather than silently not applying.

## Expected counts

If a number comes out different, **stop and find out why** — do not proceed.

| Collection            | Count |
| --------------------- | ----- |
| Concerts              | 34    |
| Recordings            | 21    |
| Gallery photos        | 12    |
| Editions              | 4     |
| Repertoire categories | 6     |
| Media originals       | 59    |

## Date normalisation (task 1.2)

The 34 concerts use at least nine different formats. Real examples from the source:

```
22. - 29. MAY 2026        → date: 2026-05-22, endDate: 2026-05-29
15. MAY 2026              → date: 2026-05-15
01. & 02. MAY 2026        → date: 2026-05-01, endDate: 2026-05-02
29. 30. NOV. & 1. DEC. 2025 → date: 2025-11-29, endDate: 2025-12-01
8-11. MAY 2025            → date: 2025-05-08, endDate: 2025-05-11
20 October 2024           → date: 2024-10-20
04 Juli 2024              → date: 2024-07-04     ← German month name
08. NOV 2025​              → date: 2025-11-08     ← trailing U+200B zero-width space
```

Rules:

- Strip zero-width characters first: `s.replace(/[​-‍﻿]/g, '')`.
- Handle German month names: `Januar, Februar, März, Mai, Juni, Juli, Oktober, Dezember`.
- Any range (`-`, `&`, `.` separated) becomes `date` + `endDate`.
- Cross-month and cross-year ranges must resolve correctly — the Nov/Dec example above is the one
  that breaks naive parsers.
- **Print a `original → parsed` table for all 34 and read every line.** A date that parses is not
  the same as a date that parses _correctly_: `01. & 02. MAY` silently becoming `2026-01-02`
  looks perfectly valid.

## Concert field splitting (task 1.3)

Each card holds, roughly in this order:

```
date · city (COUNTRY) · venue / series · sub-series · ensemble · performers[] · programme · Info link
```

The structure is inconsistent — some cards have a series line, some do not; some list four
performers, some none. Extract what is there, leave optional fields absent, and **never
fabricate a missing field**.

Ambiguous cases go on the verification list rather than getting a guess.

## Task 1.7 — the human verification pass ⚠

**This gate blocks the DNS cutover. Do not skip it, and do not mark it done because the counts
match.**

Automated extraction from rendered HTML gets ~95% right. The remaining 5% is silent: a truncated
programme, a dropped performer, a date off by a month, an outbound link pointing at the wrong
album.

Method: open `extraction/screenshots/home.fullpage.png` beside the generated content files and
read **all 77 items** against it, one at a time.

Check per item:

- [ ] Date correct, including multi-day ranges
- [ ] City and venue not swapped
- [ ] Every performer captured, spelled as on the original
- [ ] Programme text complete, not truncated mid-sentence
- [ ] Outbound link goes to the right album/edition
- [ ] Composer and title correct, with accents (`Niccolò`, `Fauré`, `Österreichische`)
- [ ] German text preserved exactly, not translated

Record the result as a checklist in the PR, and tick **1.7** in
[PROGRESS.md](../../../PROGRESS.md) only when it is genuinely complete.

## Character encoding

The content is full of non-ASCII: `Niccolò`, `Fauré`, `Österreichische`, `Musikverein`,
`Besetzung`, `Herausgeber`. It also contains HTML entities (`&#8211;` en-dash, `&amp;`,
`&#8217;` curly apostrophe).

- Unescape entities once — never twice.
- Preserve en-dashes (`–`) as they appear; do not normalise them to hyphens.
- Read/write UTF-8 explicitly at every step.
- Spot-check accented strings after every transformation.

## What not to migrate

| Item                                                   | Why                                                                             |
| ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Posts "Blog 1"–"Blog 4" (2018)                         | Leftover Zugan theme demo content, unlinked, no real content                    |
| Categories `texte` / `moderation` / `kunst` / `videos` | Same — theme demo                                                               |
| `/events/`                                             | Unlinked 2024 archive, superseded by the Concerts section → 301 to `/#concerts` |
| `/mario-hossen-disco/`                                 | Unlinked 2024 archive, superseded by Recordings → 301 to `/#recordings`         |
| Complianz cookie banner text                           | The new site sets no cookies and needs no banner                                |
| Elementor/theme CSS and JS                             | Reference only — none of it ships                                               |

## Assets

All 59 originals are already downloaded and integrity-checked in `assets/originals/`, mirroring
the WordPress upload paths. Task 4.9 sorts them into `src/assets/images/{recordings,editions,
gallery,portraits,brand}/`.

**Copy out of `assets/originals/` — never edit in place.** It is the only record of what the
original site contained.

Known gap: `2024/06/Handel-Violin-Sonatas-Hossen.jpg` appears in derived URL lists but **404s on
the live site too**. The file actually in use is `Handel-Violin-Sonatas-Hossen-1.jpg`, which
downloaded fine. Nothing is missing — do not go looking for it.
