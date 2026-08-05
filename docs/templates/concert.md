<!--
  Template for a new concert. Copy this whole file to
  src/content/concerts/YYYY-MM-DD-city-slug.md
  and fill in the frontmatter below, then delete this comment block and every optional line
  that doesn't apply to this concert.

  Full field reference: docs/plan/04-content-model.md § Concerts.
  Easier: just tell Claude the details in plain language — see docs/CLIENT-GUIDE.md, it will
  write this file for you.

  Required: date, city. Everything else is optional — delete the whole line if it doesn't
  apply. Never write `null` or `''` for an optional field; a line that isn't there at all is
  what "not set" means here.

  You never have to decide where a concert appears in the list — it sorts itself by date,
  automatically, every time.
-->
---
date: 2026-09-12 # required — YYYY-MM-DD
endDate: 2026-09-15 # optional — only for a multi-day run (a festival, a tour)
city: 'Vienna' # required
country: 'AT' # optional — ISO country code, two letters (AT, DE, BG, US...)
venue: 'Musikverein, Goldener Saal' # optional — delete if the source doesn't name one
series: 'Paganini Ensemble Vienna' # optional — the festival, tour or concert series
ensemble: 'Paganini Ensemble Vienna' # optional — the performing group, if distinct from named performers below
performers: # optional — one line per performer, "Name, Instrument"
  - 'Mario Hossen, Violin'
  - 'Julia Turnowsky, Viola'
programme: 'Chamber music works by Niccolò Paganini' # optional
infoUrl: 'https://example.com/tickets' # optional — ticket or programme link
---
