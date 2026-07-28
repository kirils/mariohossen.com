# mariohossen.com

Static rebuild of the website of **Mario Hossen**, Austro-Bulgarian violin soloist and conductor —
replacing a WordPress/Elementor site with an Astro site that costs €0/month to run and can be
maintained through Claude.

- **Plan and specification:** [`docs/plan/`](./docs/plan/)
- **Live status:** [`PROGRESS.md`](./PROGRESS.md)
- **Working rules for Claude:** [`CLAUDE.md`](./CLAUDE.md)

## Requirements

Node **22+** (see `.nvmrc`). Astro 7 will not run on Node 20.

```bash
nvm use          # picks up .nvmrc
npm install
```

## Commands

| Command                | What it does                                                                |
| ---------------------- | --------------------------------------------------------------------------- |
| `npm run dev`          | Dev server on http://localhost:4321                                         |
| `npm run build`        | Production build into `dist/`                                               |
| `npm run preview`      | Serve the production build locally                                          |
| `npm run verify`       | **Run before every commit** — format, lint, tests, type/schema check, build |
| `npm run test:content` | Tests for the content-extraction tooling                                    |

## Layout

```
src/
├── content/        Markdown + JSON — the content the client edits
├── content.config.ts   Zod schemas; a bad edit fails the build, not the live site
├── layouts/ components/ pages/ styles/
└── assets/images/  Processed by Astro into responsive AVIF/WebP

docs/plan/          The 9-document specification
extraction/         Snapshots, screenshots and tooling from the original WordPress site
assets/originals/   The 59 media files downloaded from the original — archival, read-only
```

## Things that are deliberate

- **No third-party requests.** Fonts are self-hosted; there is no analytics script and no
  external embed. That is what allows the site to run with **no cookie banner**. CI fails the
  build if any external URL appears in the output.
- **No JavaScript** unless a component genuinely needs it. Budget: < 15 KB total.
- **The content schemas are strict on purpose.** They are the safety net for a non-technical
  owner editing via Claude. Do not loosen one to make a build pass.

## Deployment

Cloudflare Pages, deployed on push to `main`. Full runbook, including the DNS cutover from
Hostinger: [`docs/plan/06-deployment-dns.md`](./docs/plan/06-deployment-dns.md).
