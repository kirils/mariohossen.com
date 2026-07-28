---
name: content-editing
description: Add, change or remove site content for mariohossen.com — concerts, recordings (albums), editions (sheet music), gallery photos, biography text, and label/partner details. Use whenever the request is about what the site SAYS or SHOWS rather than how it is built. Triggers include "add a concert", "new album", "update the biography", "add photos", "cancel the concert in", "change the phone number", "remove the recording".
---

# Editing content on mariohossen.com

The site owner is a **professional violinist, not a developer**, and will often phrase requests
casually. Your job is to translate that into correct content files — and to _ask_ rather than
guess when a required detail is missing.

## Before you start

Content lives in `src/content/`. Schemas are in `src/content.config.ts`. Read the schema for the
collection you are touching before writing a file — it is the contract, and the build enforces it.

Reference: [docs/plan/04-content-model.md](../../../docs/plan/04-content-model.md).

## The rules that matter

1. **Never edit a schema to make content fit.** Fix the content. If the schema genuinely needs a
   new field, say so explicitly and explain the trade-off first.
2. **Never invent facts.** Dates, venues, performer names, catalogue numbers and URLs must come
   from the user. A plausible-looking wrong venue is worse than a question.
3. **Never write placeholder alt text.** No `alt: "image"`, no `alt: "photo of violinist"`. If
   you cannot see what a photo shows, ask the user to describe it.
4. **One item, one file.** Adding a concert creates exactly one new file.
5. **Run `npm run verify` before saying it is done.** If it fails, fix it — do not report success.

## Adding a concert

The most common request by far.

**Required:** date, city, venue.
**Optional but usually present:** country, series, performers, programme, ticket/info URL.

```
src/content/concerts/YYYY-MM-DD-city-slug.md
```

```markdown
---
date: 2026-09-12
endDate: 2026-09-15 # only for multi-day runs — omit otherwise
city: 'Vienna'
country: 'AT' # ISO 3166-1 alpha-2
venue: 'Musikverein, Goldener Saal'
series: 'Paganini Ensemble Vienna'
performers:
  - 'Mario Hossen, Violin'
  - 'Julia Turnowsky, Viola'
programme: 'Chamber music works by Niccolò Paganini'
infoUrl: 'https://example.com/tickets'
---
```

Notes:

- **Do not ask where it goes in the list.** Concerts sort by `date` automatically, and past ones
  move to the archive on their own. Placement is never a decision.
- The filename date is for humans reading the folder. The frontmatter `date` is what the site
  uses. Keep them consistent anyway.
- If the user gives a date range ("22–29 May"), that is `date` + `endDate`.
- If the user gives no year, ask. Do not assume the current year — concert announcements often
  run 12–18 months ahead.
- Performer strings follow the site's existing form: `"Name, Instrument"`, instrument capitalised
  as in the other files.

**Changing a concert:** locate by city + date, edit in place.
**Cancelling:** delete the file. Git keeps history, so it is recoverable.

## Adding a recording (album)

**Required:** composer, title, cover image.

```markdown
---
composer: 'N. Paganini'
title: 'The spirit of Paganini'
subtitle: 'Rare and unpublished works'
cover: '../../assets/images/recordings/spirit-of-paganini.jpg'
label: 'Dynamic'
year: 2019
listenUrl: 'https://...'
order: 5
---
```

- Copy the cover into `src/assets/images/recordings/` first, with a lowercase kebab-case filename.
- `composer` uses the abbreviated form the site already uses (`N. Paganini`, `J.S. Bach`,
  `L. v. Beethoven`) — match the neighbouring files rather than expanding names.
- A bad `cover` path **fails the build**. That is intended.

## Adding an edition (sheet music)

```markdown
---
composer: 'Niccolò Paganini'
title: 'Werke für Violine und Orchester'
volume: 'Vol. IV'
scoring: 'Violine und Klavier / Orgel / Cembalo / Basso continuo'
editor: 'Mario Hossen / Mariateresa Dellaborra / Musikverlag Doblinger'
cover: '../../assets/images/editions/doblinger-vol4.jpg'
moreUrl: 'https://...'
order: 5
---
```

Editions are German-language publications. `scoring` renders as _Besetzung_, `editor` as
_Herausgeber_. Keep the German text exactly as the publisher lists it — do not translate or
"tidy" it.

## Adding gallery photos

1. Copy the images into `src/assets/images/gallery/`, lowercase kebab-case.
2. Append entries to `src/content/gallery/gallery.json` (order in the file is display order).

```json
{
  "src": "gallery/mario-hossen-musikverein-2026.jpg",
  "alt": "Mario Hossen performing on stage at the Musikverein, violin raised mid-phrase",
  "credit": "© Photographer Name"
}
```

**The `alt` field is mandatory and the schema rejects anything under 5 characters.** This is
deliberate — the previous WordPress site had 82 images with empty `alt`.

If you can view the image, write a genuine description. If you cannot, **ask the user**:

> Can you describe each photo in a sentence? It is what blind visitors hear and how Google finds
> your pictures.

Ask about photographer credit too if it is absent — for commissioned portraits, crediting is
often contractual.

## Editing the biography

`src/content/pages/biography.md`. The `intro` frontmatter field is the always-visible paragraph;
the body is everything behind "read more", including the two blog panels.

Make the **minimal** edit requested. Do not rewrite surrounding prose, "improve" phrasing, or
restructure paragraphs unless asked. This is the client's own professional biography.

## Label, partners, social links, navigation

All in `src/content/site/settings.json`. Small, careful edits only.

## Finishing up

```bash
npm run verify     # must pass
npm run preview    # if the user wants to look before publishing
```

Then commit with a content-shaped message:

```
content: add Vienna concert 12 September 2026
content: add Paganini Violin Concerto No. 5 recording
```

Content commits stay separate from code commits.

## If the build fails

Good — the guardrail worked and the live site is untouched. The error names the file and field.
Common causes:

| Error                                         | Cause                                                   |
| --------------------------------------------- | ------------------------------------------------------- |
| `Invalid date`                                | Date not `YYYY-MM-DD`                                   |
| `Expected string, received undefined`         | Required field missing                                  |
| `Could not find image`                        | Wrong `cover`/`src` path, or the file was not copied in |
| `String must contain at least 5 character(s)` | `alt` text missing or a placeholder                     |
| `Invalid url`                                 | URL missing its `https://`                              |

Fix the content. Do not loosen the schema.
