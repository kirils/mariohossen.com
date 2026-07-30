---
name: astro-patterns
description: Build conventions for the mariohossen.com Astro site — components, layouts, pages, content collections, Zod schemas, image handling, islands and Cloudflare Pages Functions. Use when writing or modifying any code in src/ or functions/, scaffolding the project, or deciding how a feature should be structured.
---

# Astro build conventions

Astro 7 (Node 22+), static output, TypeScript strict, Tailwind CSS v4 (via `@tailwindcss/vite`),
deployed to Cloudflare Pages.
Architecture rationale: [docs/plan/02-architecture.md](../../../docs/plan/02-architecture.md).

## The governing principle

**Ship zero JavaScript unless a component genuinely cannot work without it.**

Only three things on this site may hydrate:

| Component            | Budget |
| -------------------- | ------ |
| `MobileMenu`         | < 2 KB |
| `Lightbox` (gallery) | < 5 KB |
| `ContactForm`        | < 8 KB |

Everything else is static HTML. Total JS budget: **< 15 KB**.

Accordions — repertoire, biography read-more, blog panels — use native `<details>`/`<summary>`.
Keyboard-accessible for free, zero JS. Never reach for a JS accordion here.

## Structure

```
src/
├── components/
│   ├── layout/     Header · Footer · MobileMenu · SocialRow
│   ├── ui/         SectionTitle · GoldRule · WaveDivider · Accordion · Button
│   ├── cards/      ConcertCard · AlbumCard · EditionCard
│   └── sections/   Biography · Repertoire · Concerts · Recordings · Editions · Gallery · Contact
├── layouts/        BaseLayout.astro
├── pages/          index · contact · imprint · privacy · 404
├── content/        Markdown/JSON — the client's territory
├── assets/images/  Processed by Astro
├── styles/         global.css
└── lib/            Pure helpers — dates, JSON-LD, formatting
functions/api/      Cloudflare Pages Functions
```

One component per file. Files under ~200 lines; extract rather than grow.

## Components

`.astro` by default. Reach for a framework component only if there is real client-side state —
on this site, there is almost none.

```astro
---
interface Props {
  title: string
  id?: string
}
const { title, id } = Astro.props
---

<section id={id} class="py-20">
  <h2 class="font-display text-gold text-[32px] font-light">{title}</h2>
  <slot />
</section>
```

- Always type `Props`.
- Destructure once at the top of the frontmatter.
- Use `<slot />` for composition instead of passing HTML strings.
- Never `set:html` with user or content-derived data unless it comes from `render()`.

## Content collections

Defined in `src/content.config.ts` with the glob/file loaders. Full schemas:
[docs/plan/04-content-model.md](../../../docs/plan/04-content-model.md).

```ts
import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const concerts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/concerts' }),
  schema: z.object({
    date: z.coerce.date(),
    city: z.string().min(1),
    venue: z.string().min(1),
    draft: z.boolean().default(false),
  }),
})

export const collections = { concerts }
```

**Schema rules:**

- Required fields are required. Do not make something optional to silence a build error.
- Use `image()` for any image path — it validates existence _and_ enables optimisation.
- Use `z.string().url()` for URLs, `z.coerce.date()` for dates.
- Keep the strict `alt` minimum on gallery entries.

The schema is the safety layer for a non-technical owner. Weakening it to make a build pass
defeats the entire design. If a schema genuinely needs to change, change it deliberately and say
why.

**Querying:**

```ts
import { getCollection } from 'astro:content'

const all = await getCollection('concerts', ({ data }) => !data.draft)
const now = new Date()
const upcoming = all
  .filter((c) => (c.data.endDate ?? c.data.date) >= now)
  .sort((a, b) => +b.data.date - +a.data.date)
const past = all
  .filter((c) => (c.data.endDate ?? c.data.date) < now)
  .sort((a, b) => +b.data.date - +a.data.date)
```

Note the `endDate ?? date` — a multi-day run is still "upcoming" on its final day. Both buckets
sort newest-first (`sortConcerts` in `src/lib/concerts.ts`), not just `past` — every upcoming
date is later than every past date, so this makes `[...upcoming, ...past]` one continuous
descending sequence with no reversal at the seam between them.

## Images

Images the site renders live in `src/assets/images/` so Astro processes them. `public/` is only
for files that must keep an exact URL (favicon, `robots.txt`).

```astro
---
import { Image } from 'astro:assets'
import cover from '../assets/images/recordings/spirit-of-paganini.jpg'
---

<Image
  src={cover}
  alt="The Spirit of Paganini album cover"
  widths={[300, 600, 900]}
  sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 25vw"
  formats={['avif', 'webp']}
  loading="lazy"
/>
```

- Above-the-fold images: `loading="eager"` + `fetchpriority="high"`. Everything else lazy.
- Never hand-write `<img>` for a processed asset — you lose `srcset` and the dimensions that
  prevent layout shift.
- `alt` is never empty. Purely decorative graphics should be CSS backgrounds or inline SVG
  instead.

## Styling

Tailwind v4 with tokens in `src/styles/global.css`. Tokens live in the `@theme` block — see
[docs/plan/03-design-system.md](../../../docs/plan/03-design-system.md).

- Use token classes (`text-gold`, `bg-bg`, `font-display`), not raw hex values.
- Arbitrary values are fine for measured one-offs (`text-[32px]`) — this design was measured from
  a real site and does not fit a generic scale.
- No `@apply` soup. If a pattern repeats, it is a component.
- Mobile-first: base styles, then `md:` (768) and `lg:` (1024).

## Interactivity — plain `<script>`, not `client:*` directives

**This site has no UI framework installed** (no React/Vue/Svelte) and none of its interactive
components are framework islands. `client:*` directives (`client:load`, `client:idle`,
`client:visible`, `client:media`) only apply to hydrating a framework component — Astro has
nothing to hydrate here, so writing `client:media="..."` on a plain `.astro` component is a
no-op at best and a build error at worst.

The actual mechanism, used by `MobileMenu.astro` and `src/scripts/reveal.ts`: a `.astro`
component's own `<script>` tag (inline, or `<script src="../scripts/foo.ts">`) is automatically
picked up by Astro's build, type-checked/bundled through Vite, and deduplicated across the page
— no directive needed. It always runs; scope _when_ it does anything by checking conditions
inside the script itself (media query via `matchMedia`, `IntersectionObserver` for
below-the-fold, etc.) rather than by reaching for a hydration directive that doesn't apply.

```astro
<!-- MobileMenu.astro -->
<div data-mobile-menu>…</div>
<script>
  const root = document.querySelector('[data-mobile-menu]')
  // ...
</script>
```

For the gallery Lightbox and the contact form, the same pattern applies: write the interactive
behaviour as a plain `<script>` inside the component, and if it only matters below the fold,
gate the logic with an `IntersectionObserver` inside that script — not with `client:visible`.

## Pages Functions

`functions/api/contact.ts` runs on Cloudflare's edge runtime — **not Node**. No `fs`, no
`process.env` (use the `env` binding), no Node built-ins.

```ts
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const data = await request.json()
  const parsed = ContactSchema.safeParse(data)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid submission' }, { status: 400 })
  }
  // env.RESEND_API_KEY — never expose this to the client
}
```

- Validate server-side with Zod. Client-side validation is UX, never a security boundary.
- Return friendly messages; log detail server-side. Never leak internals to the browser.
- Secrets come from `env`, only ever from Cloudflare's encrypted variables.

## SEO helpers

Keep JSON-LD builders in `src/lib/schema.ts` — `Person` site-wide, `Event` per concert,
`MusicAlbum` per recording. Every page sets a canonical URL and OpenGraph tags via `BaseLayout`.

## Accessibility — non-negotiable

- One `<h1>` per page, headings in order, never skipped.
- Every interactive element reachable and operable by keyboard.
- Visible focus styles — never `outline: none` without a replacement.
- Modals (lightbox, mobile menu) trap focus and close on `Escape`.
- Wrap all motion in `@media (prefers-reduced-motion: reduce)`.
- Contrast ≥ 4.5:1. Watch text on the gold `#B09153` band — it must be `#000000` or `#FFFFFF`.

## Before committing

```bash
npm run verify     # astro check + build
```

Never commit with a failing build. Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`,
`chore:`. Keep content commits separate from code commits.
