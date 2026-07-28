# 04 — Content Model

The content model is the client-facing product. Everything else is implementation detail — this
is what they and Claude will actually touch.

**Design rules:**

1. **One file per item.** Adding a concert creates one file and touches nothing else.
2. **Field names read like English.** `venue`, not `loc_str_2`.
3. **The schema is the guardrail.** A bad edit fails the build, not the live site.
4. **Never require an ID, slug or sort order.** Those are derived. Humans should not maintain them.

---

## Directory layout

```
src/
├── content.config.ts          ← all schemas live here
└── content/
    ├── concerts/              2026-05-22-china-tour.md          (34 files)
    ├── recordings/            paganini-le-streghe.md            (21 files)
    ├── editions/              paganini-24-capricci.md            (4 files)
    ├── repertoire/            01-concerts-with-orchestra.md      (6 files)
    ├── gallery/               gallery.json                      (12 entries)
    ├── pages/                 biography.md · imprint.md · privacy.md
    └── site/                  settings.json
```

---

## Concerts

The most-edited collection — this is where almost all future changes happen.

`src/content/concerts/2026-05-22-china-tour.md`

```markdown
---
date: 2026-05-22
endDate: 2026-05-29 # optional — only for multi-day runs
city: 'Beijing · Shanghai · Shenzhen · Tianjin · Jinan'
country: 'CN'
venue: null # optional — 6 of 34 concerts state no venue
series: 'China Tour' # the festival, tour or concert series
ensemble: 'Paganini Ensemble Vienna' # the performing group
performers:
  - 'Mario Hossen, Violin'
  - 'Julia Turnowsky, Viola'
  - 'Liliana Kehayova, Violoncello'
  - 'Alexander Swete, Guitar'
programme: 'Chamber music works by Niccolò Paganini' # optional
infoUrl: 'https://example.com/tickets' # optional
---
```

Schema:

```ts
const concerts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/concerts' }),
  schema: z.object({
    date: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    city: z.string().min(1),
    country: z.string().length(2).optional(), // ISO 3166-1 alpha-2
    venue: z.string().min(1).optional(),
    series: z.string().optional(),
    ensemble: z.string().optional(),
    performers: z.array(z.string()).default([]),
    programme: z.string().optional(),
    infoUrl: z.string().url().optional(),
    draft: z.boolean().default(false),
  }),
})
```

### Two fields changed after extraction (2026-07-28)

Both came out of working through the real 34 cards, not from design:

- **`venue` is optional, not required.** Six concerts state no venue on the original — Padova,
  Raiding, Varna, the Sofia jury appearance and both China tours. Requiring `venue` would mean
  inventing a location for each, which is worse than omitting it.
- **`ensemble` is a new field.** _Paganini Ensemble_, _I Solisti Veneti_, _Les Orpheistes
  Orchestra_, _Camerata Orphica NBU_ and _Bulgarian National Radio Symphony Orchestra_ are none
  of `series` (the festival), `venue`, or `performers` (named individuals). Ten concerts have
  one. Folding it into `performers` would corrupt the performer list and the JSON-LD.

`country` accepts only ISO alpha-2. The source uses `(A)` for Austria and `(LTU)` for Lithuania;
those are normalised at extraction, not stored raw.

**What this buys us, that the current site does not have:**

- `date` is a real date, so upcoming/past **split and sort themselves**. No manual reordering,
  ever. Past concerts move to an archive automatically the day after they happen.
- The filename date prefix keeps the folder readable but is **not** what drives sorting — the
  frontmatter `date` is. They cannot disagree in a way that matters.
- Every concert emits `Event` JSON-LD, so Google can show it as an event rich result.
- `z.coerce.date()` rejects `"22. - 29. MAY 2026"` outright. The 9 different date formats in the
  current content get normalised once, at migration, and can never drift again.

---

## Recordings

`src/content/recordings/paganini-spirit.md`

```markdown
---
composer: 'N. Paganini'
title: 'The spirit of Paganini'
subtitle: 'Rare and unpublished works' # optional
cover: '../../assets/images/recordings/Spirit_Paganini.jpg'
label: 'Dynamic' # optional
year: 2019 # optional
listenUrl: 'https://www.dynamic.it/product_info.php?products_id=3719'
order: 2 # optional manual override
---
```

```ts
const recordings = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/recordings' }),
  schema: ({ image }) =>
    z.object({
      composer: z.string().min(1),
      title: z.string().min(1),
      subtitle: z.string().optional(),
      cover: image(), // validated + optimised at build time
      alt: z.string().optional(), // falls back to "{composer} — {title}"
      label: z.string().optional(),
      year: z.number().int().min(1900).max(2100).optional(),
      listenUrl: z.string().url().optional(),
      order: z.number().default(999),
      draft: z.boolean().default(false),
    }),
})
```

`image()` means a typo in a cover path **fails the build** rather than shipping a broken image —
and Astro generates the responsive AVIF/WebP set automatically.

---

## Editions

```markdown
---
composer: 'Niccolò Paganini'
title: '24 Capricci für Violine solo'
volume: '' # optional, e.g. "Vol. I"
scoring: 'Violine solo' # "Besetzung"
editor: 'Mario Hossen / Musikverlag Doblinger' # "Herausgeber"
cover: '../../assets/images/editions/MH_NP_24Capricci.jpg'
moreUrl: 'https://www.doblinger-musikverlag.at/...'
order: 1
---
```

German field labels (_Besetzung_, _Herausgeber_) are preserved in the **rendered output** because
that is how the publisher lists them — but the **field names stay English** so Claude and any
future developer read them without guessing.

---

## Repertoire

Six categories, each a long composer→works list. Markdown body, because that is what it is.

`src/content/repertoire/01-concerts-with-orchestra.md`

```markdown
---
title: 'CONCERTS & WORKS WITH ORCHESTRA'
order: 1
---

### NICCOLO PAGANINI

- Violin Concerto No.1 in E flat Major, Op.6, M.S. 21
- Violin Concerto No.2 in B Minor, Op.7, M.S. 48
- Maestosa Suonata Sentimentale, M.S. 51

### J. S. BACH

- Complete Violin Concertos
```

Rendered into a native `<details>` accordion — same look as now, no JavaScript.

---

## Gallery

A single ordered JSON file, because order matters and 12 separate files for 12 photos would be
silly.

```json
[
  {
    "src": "gallery/Mario-Hossen-1.jpg",
    "alt": "Mario Hossen playing violin, dark studio portrait",
    "credit": "© Photographer Name"
  }
]
```

```ts
const gallery = defineCollection({
  loader: file('./src/content/gallery/gallery.json'),
  schema: z.object({
    src: z.string(),
    alt: z.string().min(5, 'Every photo needs a real description'),
    credit: z.string().optional(),
  }),
})
```

That `.min(5)` on `alt` is deliberate and slightly opinionated: **the build refuses a photo with
no description.** The current site has 82 images with empty `alt`. Making it impossible to
regress is worth one strict rule.

Photographer credits are currently absent from the site — ask the client (task 1.6). If the
photos were commissioned, crediting is usually contractual.

---

## Pages & site settings

`pages/biography.md` — frontmatter `portrait`, `intro` (the always-visible paragraph); body is
everything behind "read more", plus the two blog panels as sub-sections.

`site/settings.json` — the things that appear in more than one place:

```json
{
  "title": "Mario Hossen",
  "tagline": "violin soloist and conductor",
  "nav": [
    { "label": "biography", "href": "/#biography" },
    { "label": "repertoire", "href": "/#repertoire" }
  ],
  "social": {
    "youtube": "https://...",
    "spotify": "https://...",
    "facebook": "https://...",
    "instagram": "https://..."
  },
  "label": {
    "name": "Dynamic Opera and Classical Music",
    "address": "Dynamic S.r.l – Via Mura Chiappe, 39 16136 Genoa, Italy",
    "phone": "+39 010 2722884",
    "fax": "+39 010 213937",
    "email": "dynamic@dynamic.it",
    "website": "https://www.dynamic.it"
  },
  "partners": [
    { "name": "Österreichische Nationalbank", "url": "https://www.oenb.at" },
    { "name": "Thomastik – Infeld", "url": "https://www.thomastik-infeld.com" }
  ],
  "contactEmail": "…"
}
```

---

## Images

```
src/assets/images/
├── recordings/   21 album covers
├── editions/      4 publication covers
├── gallery/      12 photographs
├── portraits/     biography + repertoire portraits
└── brand/        logo_MH.svg, favicon
```

In `src/assets/` (not `public/`) so Astro processes them: responsive `srcset`, AVIF + WebP with
JPEG fallback, correct intrinsic dimensions to prevent layout shift, lazy loading below the fold.

Originals stay untouched in `assets/originals/` as the archival copy.

---

## Why this model is safe for a non-technical owner

| Failure                   | What happens                                                    |
| ------------------------- | --------------------------------------------------------------- |
| Malformed date            | Build fails with the file and field named. Live site untouched. |
| Missing required field    | Build fails, names the field.                                   |
| Typo in an image path     | Build fails — no broken images ever ship.                       |
| Photo added with no `alt` | Build fails. Accessibility cannot regress.                      |
| Bad URL in `infoUrl`      | Build fails — `z.string().url()`.                               |
| Concert date passes       | Moves to past automatically. No action needed.                  |
| Someone deletes a file    | Git history has it. One command restores it.                    |

Every one of these is caught **before** deployment. The live site can only ever be in a state
that passed the schema.
