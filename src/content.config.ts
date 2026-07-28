import { defineCollection } from 'astro:content'
import { glob, file } from 'astro/loaders'
// Astro's re-export of `z` from 'astro:content' is deprecated — import straight from `zod`
// (already a direct dependency) instead.
import { z } from 'zod'

/**
 * All schemas for the site's editable content. This file is the safety net for a non-technical
 * owner editing via Claude — a malformed entry fails the build, never the live site. Do not
 * loosen a rule here to make a build pass; fix the content instead (see the content-editing
 * skill). If a rule genuinely needs to change, say so explicitly and why.
 *
 * Full model and rationale: docs/plan/04-content-model.md.
 */

const concerts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/concerts' }),
  schema: z.object({
    date: z.coerce.date(),
    // Only for multi-day runs. Still "upcoming" through its final day — see astro-patterns skill.
    endDate: z.coerce.date().optional(),
    city: z.string().min(1),
    // ISO 3166-1 alpha-2. The source used "(A)" and "(LTU)"; normalised at extraction time.
    country: z.string().length(2).optional(),
    // Optional, not required — 6 of 34 real concerts state no venue on the original. Requiring
    // it would mean inventing a location. See docs/plan/04-content-model.md.
    venue: z.string().min(1).optional(),
    // The festival, tour or concert series (e.g. "China Tour", "Concert Spirituel").
    series: z.string().optional(),
    // The performing group (e.g. "Paganini Ensemble Vienna") — distinct from `series` (the
    // festival) and `performers` (named individuals). Added after working through the real data.
    ensemble: z.string().optional(),
    performers: z.array(z.string()).default([]),
    programme: z.string().optional(),
    infoUrl: z.url().optional(),
    draft: z.boolean().default(false),
  }),
})

const recordings = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/recordings' }),
  schema: ({ image }) =>
    z.object({
      composer: z.string().min(1),
      title: z.string().min(1),
      subtitle: z.string().optional(),
      cover: image(), // a typo in the path fails the build, not the live site
      // Optional: falls back to "{composer} — {title}" at render time, a reasonable default
      // for album cover art (unlike the gallery, which requires a real description — see below).
      alt: z.string().optional(),
      label: z.string().optional(),
      year: z.number().int().min(1900).max(2100).optional(),
      listenUrl: z.url().optional(),
      order: z.number().default(999),
      draft: z.boolean().default(false),
    }),
})

const editions = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/editions' }),
  schema: ({ image }) =>
    z.object({
      composer: z.string().min(1),
      title: z.string().min(1),
      volume: z.string().optional(),
      scoring: z.string().optional(), // "Besetzung" — kept in German in the rendered output
      editor: z.string().optional(), // "Herausgeber"
      cover: image(),
      alt: z.string().optional(),
      moreUrl: z.url().optional(),
      order: z.number().default(999),
      draft: z.boolean().default(false),
    }),
})

const repertoire = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/repertoire' }),
  schema: z.object({
    title: z.string().min(1),
    order: z.number().default(999),
  }),
})

const gallery = defineCollection({
  loader: file('./src/content/gallery/gallery.json'),
  schema: ({ image }) =>
    z.object({
      src: image(),
      // Deliberately strict: the original site shipped 82 images with an empty alt attribute.
      // Making that impossible to regress is worth one opinionated rule. Never fill this with a
      // placeholder — write a real description or ask; see the content-editing skill.
      alt: z.string().min(5, 'Every photo needs a real description'),
      credit: z.string().optional(),
      order: z.number().default(999),
    }),
})

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1),
      // Only biography.md uses this; imprint/privacy have none. Optional, not a separate
      // required field, since a Zod object without .strict() silently strips unknown
      // frontmatter keys rather than failing the build — this was caught only by checking
      // that `portrait` actually survives into `data`, not by a build error. See
      // docs/plan/04-content-model.md.
      portrait: image().optional(),
    }),
})

const site = defineCollection({
  loader: file('./src/content/site/settings.json'),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    nav: z.array(z.object({ label: z.string(), href: z.string() })),
    social: z.object({
      youtube: z.url().optional(),
      spotify: z.url().optional(),
      facebook: z.url().optional(),
      instagram: z.url().optional(),
    }),
    label: z.object({
      name: z.string(),
      address: z.string(),
      phone: z.string().optional(),
      fax: z.string().optional(),
      email: z.email().optional(),
      website: z.url().optional(),
    }),
    partners: z.array(z.object({ name: z.string(), url: z.url() })),
    contactEmail: z.email().optional(),
  }),
})

export const collections = { concerts, recordings, editions, repertoire, gallery, pages, site }
