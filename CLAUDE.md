# CLAUDE.md — mariohossen.com

Static rebuild of the WordPress site at `https://www.mariohossen.com` for **Mario Hossen**,
Austro-Bulgarian violin soloist and conductor.

**Read [PROGRESS.md](./PROGRESS.md) first** — it is the live state of the project.
The full specification is [docs/plan/](./docs/plan/).

---

## What this project is

Replace a WordPress + Elementor site with an Astro static site that:

- looks and behaves **identically** to the original,
- costs **€0/month** to run,
- can be maintained by a **non-technical client through Claude**.

The client is not a developer. Every decision in this repo is weighted toward _making a bad edit
impossible_ rather than toward developer convenience.

## Current state

See [PROGRESS.md](./PROGRESS.md) — it's updated every session and is the only place phase/task
completion is tracked. Do not duplicate that status here; a second copy is a second thing to
forget to update; this file has already shipped a stale "site scaffold not yet created" claim
once, long after Phase 2 built one.

## Repository layout

```
docs/plan/            The specification. 9 documents. Authoritative.
docs/CLIENT-GUIDE.md  Plain-language guide, written for the client, not for Claude.
docs/templates/       Copy-paste content templates (concert / recording / edition).
PROGRESS.md           Live status. Update it as work completes.
assets/originals/     59 media files from the WordPress site (6.3 MB). Archival — never edit.
extraction/           Rendered HTML, screenshots, design tokens, the crawler.
.claude/skills/       Project skills — see below.

src/                  The Astro site
├── content/          Markdown/JSON content — what the client edits
├── content.config.ts Zod schemas — the guardrail
├── lib/schema.ts      JSON-LD builders (Person / Event / MusicAlbum)
├── components/
├── layouts/
├── pages/
├── assets/images/    Processed images
└── styles/global.css Design tokens
functions/api/        Cloudflare Pages Functions (contact form)
```

## Stack

Astro 7 (static, Node 22+) · Tailwind CSS v4 · Zod content schemas · TypeScript strict ·
Cloudflare Pages · Resend + Turnstile for the contact form.

Rationale and rejected alternatives: [docs/plan/02-architecture.md](./docs/plan/02-architecture.md).

## Project skills

Invoke these rather than re-deriving their contents:

| Skill                | Use when                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| `content-editing`    | Adding/changing a concert, recording, edition, photo, or biography text. **The most-used skill.** |
| `astro-patterns`     | Building or modifying components, pages, collections, images                                      |
| `design-fidelity`    | Any visual work — tokens, layout, verifying against the original                                  |
| `content-extraction` | Re-running the crawler or extracting content from the WordPress snapshots                         |
| `deploy-ops`         | Deployment, environment variables, DNS cutover, rollback                                          |

## Non-negotiables

These exist because of specific findings during discovery. Do not quietly relax them.

1. **Never weaken a Zod schema to make a build pass.** The schema is the only thing standing
   between a non-technical owner and a broken production site. If content does not fit the
   schema, fix the content — or change the schema deliberately, and say so.
2. **Every image needs real `alt` text.** The old site had 82 images with empty `alt`. The
   gallery schema enforces `min(5)`. Do not bypass it. If you do not know what a photo shows,
   ask — do not invent a description.
3. **No third-party runtime requests.** No Google Fonts CDN, no analytics scripts, no bare
   YouTube/Spotify embeds. This is what allows the site to run with **no cookie banner**. Adding
   one external request re-introduces a legal requirement. Fonts are self-hosted via
   `@fontsource`.
4. **Secrets live only in Cloudflare env vars.** `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY` never
   enter git, never reach the client bundle.
5. **`assets/originals/` and `extraction/` are read-only archives.** Copy out of them; never
   edit in place. They are the only record of what the original site contained.
6. **Preserve URLs.** `/contact/`, `/imprint/` keep their paths. Retired paths get 301s. Nothing
   from the old sitemap may 404.
7. **Ship zero JS unless a component genuinely needs it.** Only the mobile menu, gallery lightbox
   and contact form may hydrate. Accordions use native `<details>`.
8. **Semantic HTML over visual copying.** The original has an `<h1>` on a concert date and no
   page `<h1>`. Reproduce the _look_, not the defects.
9. **Concerts sort by date, automatically — never hand-order them.** Newest date first,
   throughout: upcoming concerts show furthest-out-first, then past concerts below them show
   most-recent-first — one continuous descending sequence, computed from `date`/`endDate` in
   `src/lib/concerts.ts` (`sortConcerts`). This needs zero maintenance as a concert moves from
   upcoming to past — a newly-added concert always lands in the right place on its own. Never
   add a manual `order` field to concerts or hardcode display order; if a concert appears in the
   wrong place, the fix is its `date`/`endDate`, not the sort.

## Commands

```bash
npm run dev        # local dev server, localhost:4321
npm run build      # production build — runs all schema validation
npm run preview    # preview the production build
npm run verify     # astro check + build — run before every commit
```

## Content facts

Counts verified during discovery, from the original WordPress site. Recordings, gallery photos,
editions and repertoire categories are a fixed migrated set — if one of those four stops matching
reality, something was lost, so treat a mismatch as a bug. **Concerts are the one number expected
to grow** as new ones get added (34 at discovery, more since) — a higher count there is normal,
not a red flag; run `ls src/content/concerts/*.md | wc -l` for the real current total rather than
trusting a number in this file.

| Collection            | Items at discovery   |
| --------------------- | -------------------- |
| Concerts              | 34 (grows over time) |
| Recordings            | 21                   |
| Gallery photos        | 12                   |
| Editions              | 4                    |
| Repertoire categories | 6                    |

Media originals: **59 files**.

> **The Load More trap.** The live WordPress site only ships 4 recordings and 4 photos in its
> server HTML — the rest are injected by JavaScript. Anything scraped with `curl`/`wget` silently
> loses 17 albums and 8 photos. Always use `extraction/tools/crawl.mjs`. Details:
> [docs/plan/01-discovery-findings.md §5](./docs/plan/01-discovery-findings.md).

## Design tokens

```
background  #000000    gold/accent  #B09153    body text  #BBBBBB    white  #FFFFFF
body font   Lato       display font Roboto     container  1240px
```

Measured, not chosen. Full detail: [docs/plan/03-design-system.md](./docs/plan/03-design-system.md).
Raw values: `extraction/data/design-tokens.json`.

## Working conventions

- **Update [PROGRESS.md](./PROGRESS.md) when you complete a task.** Tick the box, add a line to
  the log. This is how the next session knows where things stand.
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`.
- Files under ~400 lines; extract rather than grow.
- Prefer many small focused files over few large ones.
- Content changes and code changes go in separate commits.

## Verifying against the original

The original site is still live at `https://www.mariohossen.com`. Compare against
`extraction/screenshots/*.fullpage.png` (1600 px wide, full page) rather than the live site, so
comparisons stay stable even if the client edits WordPress mid-project.
