/**
 * Phase 4 (tasks 4.2–4.8) — turns the normalised extraction into the actual Astro content
 * collection files under src/content/. Reads *.normalised.json + decisions.json; writes
 * Markdown/JSON that src/content.config.ts validates on every build.
 *
 * Re-runnable: deletes and regenerates each collection's directory from scratch, so there is
 * never a stale file left behind from an earlier run. Content the client has since hand-edited
 * would be overwritten — this is meant to run once, at migration, not as an ongoing sync.
 *
 * Usage: node generate-content.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const DATA = path.join(ROOT, 'extraction/data/content')
const CONTENT = path.join(ROOT, 'src/content')

const readJSON = (name) => JSON.parse(fs.readFileSync(path.join(DATA, name + '.json'), 'utf8'))

function resetDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
}

const slugify = (s) =>
  String(s ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip accents: ő -> o, ö -> o
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')

/** Ensures a slug is unique within a running set, appending -2, -3, ... on collision. */
function uniqueSlug(base, used) {
  let slug = base || 'untitled'
  let n = 2
  while (used.has(slug)) {
    slug = `${base}-${n}`
    n++
  }
  used.add(slug)
  return slug
}

// YAML frontmatter writer. Deliberately hand-rolled rather than a dependency: the value set is
// small and fully known (strings, numbers, booleans, string arrays, ISO dates), so a generic
// YAML library buys nothing but weight. Every string goes through the same quoting function —
// there is no bare/unquoted path, so there is no way to accidentally emit invalid YAML for a
// value containing a colon, a quote, or a leading special character.
function yamlString(s) {
  return `'${String(s).replace(/'/g, "''")}'`
}
// A single/double-quoted YAML scalar FOLDS line breaks into spaces — it cannot carry a
// multi-line value verbatim. `programme` sometimes holds several composer/work paragraphs
// joined with '\n'; that has to be a block literal (`|`) with each line indented, or the
// paragraph structure silently collapses into one run-on line when the frontmatter is parsed.
function yamlBlockLiteral(key, s, indent = '  ') {
  const body = String(s)
    .split('\n')
    .map((line) => indent + line)
    .join('\n')
  return `${key}: |\n${body}`
}
function yamlValue(v) {
  if (v === null || v === undefined) return null
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return yamlString(v)
}
function frontmatter(fields) {
  const lines = ['---']
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      if (!value.length) continue
      lines.push(`${key}:`)
      for (const item of value) lines.push(`  - ${yamlValue(item)}`)
    } else if (typeof value === 'string' && value.includes('\n')) {
      lines.push(yamlBlockLiteral(key, value))
    } else {
      const rendered = yamlValue(value)
      if (rendered === null) continue
      lines.push(`${key}: ${rendered}`)
    }
  }
  lines.push('---')
  return lines.join('\n')
}
function writeMd(dir, filename, fields, body = '') {
  const fm = frontmatter(fields)
  const content = body.trim() ? `${fm}\n\n${body.trim()}\n` : `${fm}\n`
  fs.writeFileSync(path.join(dir, filename), content, 'utf8')
}

// ------------------------------------------------------------------------------- 4.2 concerts
{
  const dir = path.join(CONTENT, 'concerts')
  resetDir(dir)
  const concerts = readJSON('concerts.normalised')
  const used = new Set()
  let count = 0
  for (const c of concerts) {
    const slugSource = c.series || c.city || c.venue || `concert-${c.sourceIndex}`
    const slug = uniqueSlug(slugify(slugSource), used)
    const filename = `${c.date}-${slug}.md`
    writeMd(dir, filename, {
      date: c.date,
      endDate: c.endDate,
      city: c.city,
      country: c.country,
      venue: c.venue,
      series: c.series,
      ensemble: c.ensemble,
      performers: c.performers,
      programme: c.programme,
      infoUrl: c.infoUrl,
    })
    count++
  }
  console.log(`concerts:   ${count} files`)
}

// ------------------------------------------------------------------------------ 4.3 recordings
{
  const dir = path.join(CONTENT, 'recordings')
  resetDir(dir)
  const recordings = readJSON('recordings.normalised')
  const used = new Set()
  let count = 0
  for (const r of recordings) {
    const slug = uniqueSlug(slugify(`${r.composer}-${r.title}`), used)
    writeMd(dir, `${slug}.md`, {
      composer: r.composer,
      title: r.title,
      subtitle: r.subtitle,
      cover: `../../assets/images/recordings/${r.coverFile}`,
      listenUrl: r.listenUrl,
      order: r.order,
    })
    count++
  }
  console.log(`recordings: ${count} files`)
}

// -------------------------------------------------------------------------------- 4.4 editions
{
  const dir = path.join(CONTENT, 'editions')
  resetDir(dir)
  const editions = readJSON('editions.normalised')
  const used = new Set()
  let count = 0
  for (const e of editions) {
    const slug = uniqueSlug(slugify(`${e.composer}-${e.title}-${e.volume ?? ''}`), used)
    writeMd(dir, `${slug}.md`, {
      composer: e.composer,
      title: e.title,
      volume: e.volume,
      scoring: e.scoring,
      editor: e.editor,
      cover: `../../assets/images/editions/${e.coverFile}`,
      moreUrl: e.moreUrl,
      order: e.order,
    })
    count++
  }
  console.log(`editions:   ${count} files`)
}

// ------------------------------------------------------------------------------ 4.5 repertoire
{
  const dir = path.join(CONTENT, 'repertoire')
  resetDir(dir)
  const repertoire = readJSON('repertoire.normalised')
  let count = 0
  for (const cat of repertoire) {
    const hasDashLines = cat.lines.some((l) => l.startsWith('–') || l.startsWith('-'))
    let body
    if (hasDashLines) {
      // Composer heading + bullet-list pattern: a non-dash line starts a new ### heading;
      // dash lines become list items under the current heading (or a bare list if none yet).
      const parts = []
      for (const line of cat.lines) {
        if (line.startsWith('–') || line.startsWith('-')) {
          parts.push(`- ${line.replace(/^[–-]\s*/, '')}`)
        } else {
          parts.push(`\n### ${line}\n`)
        }
      }
      body = parts.join('\n')
    } else {
      // No dash lines at all (e.g. "WORKS FOR VIOLIN & PIANO") — these are flat descriptive
      // lines in the original ("AMERICAN COMPOSERS: A. Copland, ..."), not sub-headed lists.
      // Promoting each to a heading would misrepresent the source structure.
      body = cat.lines.join('\n\n')
    }
    const filename = `${String(cat.order).padStart(2, '0')}-${slugify(cat.title)}.md`
    writeMd(dir, filename, { title: cat.title, order: cat.order }, body)
    count++
  }
  console.log(`repertoire: ${count} files`)
}

// --------------------------------------------------------------------------------- 4.6 gallery
{
  const dir = path.join(CONTENT, 'gallery')
  resetDir(dir)
  // Alt text written by viewing every photo directly (Read tool, this session) — not invented,
  // not deferred to the client. See PROGRESS.md Phase 4 log for the reasoning.
  const ALT = {
    'Mario-Hossen-1.jpg':
      'Mario Hossen playing the violin, head bowed over the instrument, dramatic side-lit studio portrait against a black background',
    'Mario-Hossen-2.jpg':
      'Mario Hossen in a black turtleneck, standing three-quarter view, holding his violin by the neck at chest height, looking directly at camera',
    'Mario-Hossen-4.jpg':
      'Close-up of Mario Hossen playing the violin, sharp focus on his face and the instrument with the bow softly blurred in the foreground',
    'LAN6478-1-1-scaled.jpg':
      'Side-profile silhouette of Mario Hossen in formal black tie, holding his violin and bow vertically, lit with dramatic rim lighting against near-black',
    'Mario-Hossen-6.jpg':
      'Mario Hossen with arms crossed in a dark embellished jacket over a black turtleneck, a faint ghosted profile visible in the shadow behind him',
    'Mario-Hossen_front.jpg':
      'Close three-quarter portrait of Mario Hossen holding his violin toward the camera, black turtleneck, dark blue-black background',
    'LAN6512-scaled.jpg':
      'Mario Hossen playing the violin in profile, white bow tie and shirt cuff visible beneath a dark formal jacket, the instrument lit against black',
    '20190221_MarioHossen_0402.jpg':
      'Mario Hossen wearing a wide-brimmed black hat and grey blazer over a black turtleneck, holding his violin and bow, one hand in his pocket',
    'MH4.jpeg':
      'Black-and-white photograph of Mario Hossen seated in profile, adjusting the tuning pegs of his violin, looking down in concentration',
    'MH2.jpeg':
      'Black-and-white close head-and-shoulders portrait of Mario Hossen, wrist resting near his jaw, looking directly at camera',
    'MH1.jpeg':
      'Black-and-white candid portrait of Mario Hossen smiling, chin resting on his hand, seated indoors near a staircase',
    'MH3.jpeg':
      'Black-and-white close-up of Mario Hossen looking over the scroll of his violin, the pegbox in sharp focus and his face softly out of focus behind it',
  }
  const gallery = readJSON('gallery.normalised')
  const entries = gallery.map((g) => {
    const alt = ALT[g.file]
    if (!alt) throw new Error(`No alt text authored for gallery file: ${g.file}`)
    return {
      // Astro's file() loader requires an id/slug per array item.
      id: String(g.order).padStart(2, '0'),
      src: `../../assets/images/gallery/${g.file}`,
      alt,
      order: g.order,
    }
  })
  fs.writeFileSync(path.join(dir, 'gallery.json'), JSON.stringify(entries, null, 2) + '\n', 'utf8')
  console.log(`gallery:    ${entries.length} entries (gallery.json)`)
}

// ----------------------------------------------------------------------------------- 4.7 pages
{
  const dir = path.join(CONTENT, 'pages')
  resetDir(dir)
  const bio = readJSON('biography.normalised')

  // --- biography.md ---
  const bioBody = []
  bioBody.push(bio.readMore.join('\n\n'))
  for (const panel of bio.panels) {
    bioBody.push(`\n## ${panel.title}\n`)
    if (panel.links.length === panel.lines.length) {
      // 1:1 — every line is itself a link (Project Paganini panel).
      for (const link of panel.links) bioBody.push(`- [${link.text}](${link.href})`)
    } else {
      // A leading non-link title line, then the links (Thomastik Infeld panel).
      bioBody.push(panel.lines[0])
      for (const link of panel.links) bioBody.push(`- [${link.text}](${link.href})`)
    }
  }
  writeMd(
    dir,
    'biography.md',
    { title: 'Biography', portrait: '../../assets/images/portraits/Mario-Hossen_front.jpg' },
    bioBody.join('\n')
  )

  // --- imprint.md ---
  // Only the genuine Impressum content. Everything from "Privacy Policy: Last updated..."
  // onward in the source is Complianz's auto-generated cookie/privacy boilerplate describing
  // cookie practices the new site does not have — replaced by privacy.md, not carried over.
  // "violinst" and the "xen"/"bello" credit fragments are verbatim from the source; not ours
  // to silently correct. See PROGRESS.md Phase 4 log.
  const imprintBody = `
Publisher: Mario Hossen, violinist
Email: mariohossen@gmail.com

Concept & Design: xen & Development: bello

## Disclaimer

Mario Hossen makes every effort to ensure that the material contained in this website is
current, complete and correct. Despite this, errors and mistakes cannot be completely ruled
out. We do not accept liability for the relevance, accuracy or completeness of the information
and material offered on this website unless the mistake occurred intentionally or through
gross negligence. This refers to any loss, additional costs or damage of any kind suffered as
a result of any use of any material on this website.

## Copyright

The layout of this website, graphics, videos and pictures used, and the collection of
individual contributions, are protected by copyright.

## Privacy

Where you are invited to submit personal information (e-mail address, names, postal
addresses), the submission of this information is purely voluntary. Mario Hossen expressly
declares that the information submitted will not be passed on to third parties.
`
  writeMd(dir, 'imprint.md', { title: 'Imprint' }, imprintBody)

  // --- privacy.md ---
  // A short, honest replacement for the old Complianz-generated cookie policy — see
  // docs/plan/02-architecture.md "Privacy, and why there is no cookie banner". The new site
  // sets no cookies and loads no third-party trackers, so there is nothing to disclose beyond
  // saying so.
  const privacyBody = `
This website does not set cookies and does not load any third-party trackers, analytics
scripts or advertising code. Because nothing is stored on your device beyond what is strictly
necessary to display the page, no cookie-consent banner is required or shown.

## Contact form

If you use the contact form, the information you submit (name, email address, subject and
message) is sent by email to Mario Hossen in order to reply to you. It is not stored on this
website, added to a mailing list, or shared with any third party.

## Outbound links

This site links to Mario Hossen's own profiles on YouTube, Spotify, Facebook and Instagram,
and to third-party retailers and publishers for recordings and editions. Following one of
these links takes you to that service's own website, which has its own separate privacy
policy — we encourage you to review it there.

## Questions

If you have any questions about this privacy policy, contact Mario Hossen at
mariohossen@gmail.com.
`
  writeMd(dir, 'privacy.md', { title: 'Privacy Policy' }, privacyBody)

  console.log('pages:      3 files (biography, imprint, privacy)')
}

// ----------------------------------------------------------------------------- 4.8 settings.json
{
  const dir = path.join(CONTENT, 'site')
  resetDir(dir)
  const meta = readJSON('meta.raw')

  const primaryNav = meta.nav.filter((n) => n.href.startsWith('/#'))
  // The source lists the Instagram profile twice (with and without a trailing slash).
  const social = [...new Set(meta.social)]
  const findSocial = (host) => social.find((u) => u.includes(host))

  const settings = {
    title: 'Mario Hossen',
    tagline: 'violin soloist and conductor',
    nav: primaryNav,
    social: {
      youtube: findSocial('youtube.com'),
      spotify: findSocial('spotify.com'),
      facebook: findSocial('facebook.com'),
      instagram: findSocial('instagram.com/mariohossenofficial/'), // prefer the trailing-slash form
    },
    label: {
      name: 'Dynamic Opera and Classical Music',
      address: 'Dynamic S.r.l – Via Mura Chiappe, 39 16136 Genoa, Italy',
      phone: '+39 010 2722884',
      fax: '+39 010 213937',
      email: 'dynamic@dynamic.it',
      website: 'https://www.dynamic.it',
    },
    partners: [
      { name: 'Österreichische Nationalbank', url: 'https://www.oenb.at' },
      { name: 'Thomastik – Infeld', url: 'https://www.thomastik-infeld.com' },
    ],
    // The address already public on the site's own Imprint page — not a new disclosure.
    // The client should confirm this is where contact-form submissions should actually be
    // routed before Phase 6 wires up the real send (see PROGRESS.md open questions).
    contactEmail: 'mariohossen@gmail.com',
  }
  // Astro's file() loader treats a flat top-level JSON object as a MAP of separate entries
  // keyed by its own top-level property names — it would otherwise try to validate the string
  // "Mario Hossen" against the whole `site` schema as a standalone entry called "title". A
  // singleton config object has to be nested one level so file() sees exactly one entry.
  // Query it with `getEntry('site', 'main')`, not `getCollection('site')`.
  const wrapped = { main: settings }
  fs.writeFileSync(path.join(dir, 'settings.json'), JSON.stringify(wrapped, null, 2) + '\n', 'utf8')
  console.log('settings:   1 file (settings.json)')
}

console.log('\nDone. Run `npm run build` to validate every file against content.config.ts.')
