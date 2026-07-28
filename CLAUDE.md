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

|                                     |                                  |
| ----------------------------------- | -------------------------------- |
| Phase 0 — discovery & asset capture | ✅ complete                      |
| Phases 1–9 — implementation         | see [PROGRESS.md](./PROGRESS.md) |
| Site scaffold                       | not yet created                  |

There is no `package.json` yet. The repo currently holds the plan, the extracted source
material, and the 59 downloaded media originals.

## Repository layout

```
docs/plan/            The specification. 9 documents. Authoritative.
PROGRESS.md           Live status. Update it as work completes.
assets/originals/     59 media files from the WordPress site (6.3 MB). Archival — never edit.
extraction/           Rendered HTML, screenshots, design tokens, the crawler.
.claude/skills/       Project skills — see below.

src/                  (Phase 2 onward) the Astro site
├── content/          Markdown/JSON content — what the client edits
├── content.config.ts Zod schemas — the guardrail
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

## Commands

```bash
npm run dev        # local dev server, localhost:4321
npm run build      # production build — runs all schema validation
npm run preview    # preview the production build
npm run verify     # astro check + build — run before every commit
```

_(Available from Phase 2 onward.)_

## Content facts

Counts verified during discovery. If a number here stops matching reality, something was lost:

| Collection            | Items |
| --------------------- | ----- |
| Concerts              | 34    |
| Recordings            | 21    |
| Gallery photos        | 12    |
| Editions              | 4     |
| Repertoire categories | 6     |

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
