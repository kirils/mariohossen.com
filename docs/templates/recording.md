<!--
  Template for a new recording (album). Copy this whole file to
  src/content/recordings/album-slug.md, fill in the frontmatter, then delete this comment
  block and any optional line that doesn't apply.

  Before filling this in: copy the cover image into src/assets/images/recordings/, lowercase
  kebab-case filename (e.g. spirit-of-paganini.jpg). A wrong or missing path here fails the
  build, on purpose — better than a broken image reaching a visitor.

  Full field reference: docs/plan/04-content-model.md § Recordings.
  Easier: tell Claude the album details and hand it the cover image — see docs/CLIENT-GUIDE.md.

  Required: composer, title, cover.
-->
---
composer: 'N. Paganini' # required — abbreviated form, matching the other recordings
title: 'The spirit of Paganini' # required
subtitle: 'Rare and unpublished works' # optional
cover: '../../assets/images/recordings/spirit-of-paganini.jpg' # required
# alt: '...'                        # optional — falls back to "{composer} — {title}" if omitted
label: 'Dynamic' # optional — the record label
year: 2019 # optional
listenUrl: 'https://example.com/listen' # optional
order: 5 # optional — only if you want to force this above/below its neighbours; normally omit
---
