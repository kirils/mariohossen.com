<!--
  Template for a new edition (sheet music). Copy this whole file to
  src/content/editions/edition-slug.md, fill in the frontmatter, then delete this comment
  block and any optional line that doesn't apply.

  Before filling this in: copy the cover image into src/assets/images/editions/, lowercase
  kebab-case filename. A wrong or missing path here fails the build, on purpose.

  Full field reference: docs/plan/04-content-model.md § Editions.
  Easier: tell Claude the details and hand it the cover image — see docs/CLIENT-GUIDE.md.

  scoring/editor render as the German labels "Besetzung"/"Herausgeber" — that's how the
  publisher lists them — but keep writing the field *names* in English; only the *values* are
  German.

  Required: composer, title, cover.
-->

---

composer: 'Niccolò Paganini' # required
title: 'Werke für Violine und Orchester' # required
volume: 'Vol. IV' # optional — delete if this edition has no volume number
scoring: 'Violine und Klavier / Orgel / Cembalo / Basso continuo' # optional — "Besetzung"
editor: 'Mario Hossen / Mariateresa Dellaborra / Musikverlag Doblinger' # optional — "Herausgeber"
cover: '../../assets/images/editions/doblinger-vol4.jpg' # required
moreUrl: 'https://example.com/edition' # optional — publisher's page for this edition
order: 5 # optional — only if you want to force this above/below its neighbours; normally omit
---
