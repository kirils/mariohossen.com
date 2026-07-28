# mariohossen.com — Static Rebuild Plan

Replace the current WordPress/Elementor site at `https://www.mariohossen.com` with a modern
static site that looks and behaves the same, costs **€0/month to run**, and can be maintained
by a non-technical client through Claude.

**Status:** planning complete, discovery done, all assets downloaded.
**Date:** 2026-07-28

---

## The decisions, up front

| Question        | Decision                                                           | Why                                                                                                                                  |
| --------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Framework       | **Astro 7** (static output, Node 22+)                              | Ships zero JS by default, has typed content collections + build-time image optimisation. Best-in-class for a content site like this. |
| Styling         | **Tailwind CSS v4** + CSS custom properties                        | Design tokens extracted from the live site drive everything; no runtime cost.                                                        |
| Content storage | **Markdown + JSON in `src/content/`**, validated by Zod schemas    | Plain text files Claude can edit reliably; the schema stops bad edits from ever reaching production.                                 |
| Hosting         | **Cloudflare Pages**                                               | Free, unlimited bandwidth, free SSL, global CDN, git-push deploys, and DNS lives in the same dashboard as the cutover.               |
| Contact form    | **Cloudflare Pages Function → Resend**, protected by **Turnstile** | Free tiers cover this site many times over; the API key never reaches the browser.                                                   |
| Client editing  | **Claude Code**, driven by a plain-language handbook               | What the client asked for. The Zod schema + CI checks are the safety net.                                                            |
| Analytics       | **Cloudflare Web Analytics** (optional, cookieless)                | Free, and it means the site needs **no cookie banner at all**.                                                                       |

Full reasoning in [02-architecture.md](./02-architecture.md).

---

## Plan documents

| #   | Document                                           | What it covers                                                                                     |
| --- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 01  | [Discovery findings](./01-discovery-findings.md)   | What the current site actually is — stack, page map, content counts, and the problems worth fixing |
| 02  | [Architecture](./02-architecture.md)               | Stack choice, alternatives rejected, and the line-by-line proof that running cost is €0            |
| 03  | [Design system](./03-design-system.md)             | Colours, typography, spacing and components measured from the live site                            |
| 04  | [Content model](./04-content-model.md)             | The schemas — what a concert, recording, edition and photo look like as a file                     |
| 05  | [**Task list**](./05-task-list.md)                 | **The implementation plan: 9 phases, every task, with acceptance criteria**                        |
| 06  | [Deployment & DNS cutover](./06-deployment-dns.md) | Going live, and the zero-downtime DNS switch runbook                                               |
| 07  | [Client handbook](./07-client-handbook.md)         | How the client runs the site with Claude, in non-technical language                                |
| 08  | [Risks & decisions](./08-risks-and-decisions.md)   | What could go wrong, what we decided and why                                                       |

---

## What is already done

Discovery and asset capture are complete — this was not just planned, it was executed:

```
assets/originals/          59 media files, 6.3 MB — every image, the PDF and the logo
extraction/rendered/        6 fully-rendered HTML snapshots (JS executed, "Load More" exhausted)
extraction/screenshots/     6 full-page screenshots for pixel reference
extraction/data/            design-tokens.json, home.widgets.json, asset manifests
extraction/reference-css/  47 stylesheets from the live site, for design reference
extraction/tools/crawl.mjs  the reusable crawler (re-run it any time to re-sync)
```

The single most important discovery: **the Recordings and Gallery sections only ship 4 items
each in the server HTML.** The other 17 albums and 8 photos are injected by JavaScript when
"Load More" is clicked. A plain `wget` mirror silently misses them — and so does Google.
The crawler in `extraction/tools/` clicks through until exhausted, which is how all 21
recordings and 12 photos were recovered.

---

## Content inventory to migrate

| Section          | Items                   | Notes                                                        |
| ---------------- | ----------------------- | ------------------------------------------------------------ |
| Biography        | 1 long text + read-more | Plus 2 collapsible blog panels                               |
| Repertoire       | 6 categories            | Accordion; hundreds of works by composer                     |
| Concerts         | 34                      | Mixed past and upcoming; dates in inconsistent formats       |
| Recordings       | 21 albums               | Only 4 were in the server HTML                               |
| Editions         | 4                       | Doblinger sheet-music publications                           |
| Gallery          | 12 photos               | Only 4 were in the server HTML                               |
| Label / Partners | 3 blocks                | Dynamic, ÖNB, Thomastik-Infeld                               |
| Standalone pages | 4                       | Contact, Imprint, Cookie Policy, plus 2 legacy archive pages |

---

## Timeline

Roughly **5–7 working days** of focused work, in the phase order of
[05-task-list.md](./05-task-list.md). Phases 1–3 (content extraction, scaffold, design system)
are the bulk; phases 4–6 (sections, forms, SEO) go quickly once the system is in place.

The DNS cutover in Phase 9 is deliberately last and fully reversible.

---

## A note on the current theme

The existing site runs the commercial _Zugan_ ThemeForest theme. This plan **reimplements the
layout from measured design tokens** rather than copying theme source files. The client's own
content and photographs carry over unchanged — those are theirs. This is both the legally clean
route and the technically better one, since the result is ~40 KB of purpose-built CSS instead
of 47 stylesheets of theme and page-builder overhead.
