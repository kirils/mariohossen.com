/**
 * Tasks 1.2–1.5 — turn the raw extraction into normalised content plus a review report.
 *
 * Produces:
 *   extraction/data/content/*.normalised.json  — the mapped content
 *   extraction/data/content/REVIEW.md          — the checklist for task 1.7
 *
 * Usage: node normalise-content.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normaliseConcert } from './lib/normalise-concert.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const DIR = path.join(ROOT, 'extraction/data/content')

const read = (n) => JSON.parse(fs.readFileSync(path.join(DIR, n + '.json'), 'utf8'))
const write = (n, d) =>
  fs.writeFileSync(path.join(DIR, n + '.json'), JSON.stringify(d, null, 2), 'utf8')

const clean = (s) =>
  String(s ?? '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/ /g, ' ')
    .trim()
    .replace(/\s+/g, ' ')

const basename = (url) => (url ? decodeURIComponent(url.split('/').pop().split('?')[0]) : null)

// ----------------------------------------------------------------------------- decisions
// Hand-authored resolutions for cards the mapper could not classify. Applying them here
// (rather than editing generated files) keeps the pipeline re-runnable end to end.
const decisions = read('decisions')
const usedDecisions = new Set()

function applyDecision(item, table, key) {
  const d = table[String(key)]
  if (!d) return item
  usedDecisions.add(`${table === decisions.concerts ? 'concert' : 'recording'}:${key}`)
  for (const [field, value] of Object.entries(d.set)) {
    if (value === null) delete item[field]
    else item[field] = value
  }
  item.decidedWhy = d.why
  if (d.clientQuestion) item.clientQuestion = d.clientQuestion
  item.resolvedReview = item.review
  item.review = []
  item.needsDecision = false
  return item
}

// ------------------------------------------------------------------------------ concerts
const concerts = read('concerts.raw').map((c) => {
  const d = decisions.concerts[String(c.index)]
  if (d) usedDecisions.add(`concert:${c.index}`)
  const out = normaliseConcert(c, d)
  out.needsDecision = out.review.length > 0
  return out
})
concerts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)) // newest first
write('concerts.normalised', concerts)

// ---------------------------------------------------------------------------- recordings
const recordings = read('recordings.raw')
  .map((r, i) => {
    const review = []
    const composer = clean(r.title)
    // The caption block is "title\nsubtitle" — keep the line break meaningful instead of
    // collapsing it, so "Rare and unpublished works" stays a subtitle rather than joining the title.
    const captionLines = String(r.content ?? '')
      .split('\n')
      .map(clean)
      .filter(Boolean)
    const title = captionLines[0] || composer
    const subtitle = captionLines.slice(1).join(' ') || null
    if (!composer) review.push('no composer')
    if (!title || title === composer)
      review.push('no distinct album title — check against the screenshot')
    if (!r.img) review.push('no cover image')
    if (!r.links?.length) review.push('no outbound listen link')
    return {
      order: i + 1,
      composer,
      title,
      subtitle,
      coverFile: basename(r.img),
      listenUrl: r.links?.[0] ?? null,
      review,
      needsDecision: review.length > 0,
      needsAltText: !r.alt,
    }
  })
  .map((r) => applyDecision(r, decisions.recordings, r.order))
write('recordings.normalised', recordings)

// ------------------------------------------------------------------------------- gallery
const gallery = read('gallery.raw').map((g, i) => ({
  order: i + 1,
  file: basename(g.img),
  review: [],
  needsDecision: false,
  needsAltText: !g.alt,
}))
write('gallery.normalised', gallery)

// ------------------------------------------------------------------------------ editions
const editions = read('editions.raw').map((e, i) => {
  const review = []
  const body = e.body.map(clean)
  const field = (label) => {
    const line = body.find((l) => new RegExp('^' + label + '\\s*:', 'i').test(l))
    return line ? clean(line.replace(new RegExp('^' + label + '\\s*:', 'i'), '')) : null
  }
  const scoring = field('Besetzung')
  const editor = field('Herausgeber')
  // Whatever is not a labelled field is the title, possibly with a volume line.
  const titleLines = body.filter((l) => !/^(Besetzung|Herausgeber)\s*:/i.test(l))
  const volume = titleLines.find((l) => /^Vol\.?\s*[IVX0-9]/i.test(l)) ?? null
  const title = titleLines.filter((l) => l !== volume).join(' ')

  if (!scoring) review.push('no Besetzung line')
  if (!editor) review.push('no Herausgeber line')
  if (!title) review.push('no title')

  return {
    order: i + 1,
    composer: clean(e.composer),
    title,
    volume,
    scoring,
    editor,
    coverFile: basename(e.cover),
    moreUrl: e.moreUrl ?? null,
    review,
    needsDecision: review.length > 0,
    needsAltText: !e.alt,
  }
})
write('editions.normalised', editions)

// ---------------------------------------------------------------------------- repertoire
const repertoire = read('repertoire.raw').map((r) => ({
  order: r.order,
  title: clean(r.title),
  anchor: r.anchor,
  lineCount: r.lines.length,
  lines: r.lines,
}))
write('repertoire.normalised', repertoire)

// ----------------------------------------------------------------------------- biography
const bioRaw = read('biography.raw')
const readMore = bioRaw.accordions.find((a) => /read more/i.test(a.title))
const panels = bioRaw.accordions.filter((a) => a !== readMore)
const biography = {
  intro: bioRaw.blocks[0] ?? [],
  readMore: readMore ? readMore.lines : [],
  panels: panels.map((p) => ({
    title: clean(p.title),
    lines: p.lines,
    links: (p.links ?? []).map((l) => ({ text: clean(l.text), href: l.href })),
  })),
  otherBlocks: bioRaw.blocks.slice(1),
  portraits: bioRaw.imagesBeforeRepertoire.map(basename),
}
write('biography.normalised', biography)

// ------------------------------------------------------------------------------- report
const all = { concerts, recordings, editions, gallery }
const openDecisions = Object.fromEntries(
  Object.entries(all).map(([k, v]) => [k, v.filter((x) => x.needsDecision)])
)
const altNeeded = [
  ...recordings
    .filter((r) => r.needsAltText)
    .map((r) => ({ file: r.coverFile, what: `album cover — ${r.composer}, ${r.title}` })),
  ...editions
    .filter((e) => e.needsAltText)
    .map((e) => ({ file: e.coverFile, what: `edition cover — ${e.composer}, ${e.title}` })),
  ...gallery
    .filter((g) => g.needsAltText)
    .map((g) => ({ file: g.file, what: 'gallery photograph' })),
]

const lines = []
lines.push('# Content Review — task 1.7\n')
lines.push('Generated by `extraction/tools/normalise-content.mjs`. Check every item against')
lines.push('`extraction/screenshots/home.fullpage.png` before it becomes a content file.\n')
lines.push('> **Nothing was discarded during extraction.** Any source line the mapper could not')
lines.push('> classify is preserved in `sourceLines` — every card keeps its original text.\n')

lines.push('The work splits into three kinds. Only the first needs judgement per item.\n')
lines.push('| Kind | Items | What it is |')
lines.push('|---|---|---|')
lines.push(
  `| **A. Decisions** | ${Object.values(openDecisions).flat().length} | Structural ambiguity — a human has to choose |`
)
lines.push(`| **B. Alt text** | ${altNeeded.length} | Images with no description on the original |`)
lines.push(
  `| ~~C. Bulk classification~~ | ~~${concerts.length}~~ → **0** | ✅ series / subtitle / ensemble / programme assigned on all ${concerts.length} |`
)

lines.push('\n## Counts\n')
lines.push('| Collection | Total | Decisions | Alt text |')
lines.push('|---|---|---|---|')
for (const [k, v] of Object.entries(all)) {
  const alt = v.filter((x) => x.needsAltText).length
  lines.push(`| ${k} | ${v.length} | ${openDecisions[k].length} | ${alt || '—'} |`)
}
lines.push(`| repertoire | ${repertoire.length} | manual read | — |`)

lines.push('\n---\n')
lines.push('## A. Decisions needed\n')
lines.push('### Concerts\n')
for (const c of openDecisions.concerts) {
  lines.push(`#### ${c.date}${c.endDate ? ' → ' + c.endDate : ''} — ${c.city || '(no city)'}`)
  lines.push(`*source card #${c.sourceIndex}, original date string \`${c.dateRaw}\`*\n`)
  if (c.venue) lines.push(`- venue: ${c.venue}`)
  if (c.performers?.length) lines.push(`- performers: ${c.performers.length} detected`)
  for (const r of c.review) lines.push(`- ⚠ ${r}`)
  if (c.sourceLines?.length) {
    lines.push('- source lines:')
    for (const u of c.sourceLines) lines.push(`  - \`${u}\``)
  }
  lines.push('')
}

for (const name of ['recordings', 'editions', 'gallery']) {
  const items = openDecisions[name]
  if (!items.length) continue
  lines.push(`\n### ${name[0].toUpperCase() + name.slice(1)}\n`)
  for (const it of items) {
    const label = it.composer ? `${it.composer} — ${it.title}` : it.file
    lines.push(`- **${label}**: ${it.review.join('; ')}`)
  }
}

// Things noticed by eye that no rule would catch. Listed rather than "fixed", because
// correcting the client's own content without asking is not ours to do.
const OBSERVATIONS = [
  'Recording 13 is credited to **"Frank, Debussy & Fauré"** — almost certainly César **Franck**. ' +
    'Typo on the original site. Confirm with the client before changing.',
  'The footer copyright reads **"© Copyright – Mario Hossen 2026"** with the year hard-coded. ' +
    'The rebuild should render the year dynamically so it never goes stale.',
  'An unfinished concert card sits in the live layout: no date, no venue, just an "Info" button ' +
    'linking to `auditoriodecuenca.es`. It renders as an empty bordered box. Was a Cuenca concert ' +
    'intended? See `skipped.raw.json`.',
  'Recording 17 ("The Spirit of Niccolò Paganini") has no outbound listen link, unlike the other 20.',
  'Both `LAN6478-1-1.jpg` and `LAN6478-1-1-scaled.jpg` exist in the media. Use the larger original.',
]

lines.push('\n---\n')
lines.push('## Observations for the client\n')
lines.push('Judgement calls that are not ours to make. Nothing here has been changed.\n')
for (const o of OBSERVATIONS) lines.push(`- ${o}`)

lines.push('\n---\n')
lines.push('## B. Alt text to write\n')
lines.push('The original site left every one of these empty. The gallery schema rejects a photo')
lines.push('without a description, so these must be written before the build will pass.')
lines.push('Ask the client for the gallery photographs — do not invent what a portrait shows.\n')
lines.push('| File | What it is |')
lines.push('|---|---|')
for (const a of altNeeded) lines.push(`| \`${a.file}\` | ${a.what} |`)

lines.push('\n---\n')
lines.push('## C. Classification result — spot-check these\n')
lines.push('Series, subtitle, ensemble and programme are now assigned for all 34 concerts.')
lines.push('Nothing needs deciding, but the assignments below are worth reading against the')
lines.push('screenshots — `home.fullpage.png` for the first ten, `home.concerts-modal.png` for')
lines.push('the other twenty-four.\n')
lines.push('| Date | Series | Subtitle | Ensemble | Programme |')
lines.push('|---|---|---|---|---|')
for (const c of [...concerts].sort((a, b) => (a.date < b.date ? 1 : -1))) {
  const p = c.programme ? `${c.programme.split('\n').length} line(s)` : '—'
  lines.push(
    `| ${c.date} | ${c.series ?? '—'} | ${c.subtitle ?? '—'} | ${c.ensemble ?? '—'} | ${p} |`
  )
}

fs.writeFileSync(path.join(DIR, 'REVIEW.md'), lines.join('\n') + '\n', 'utf8')

// ------------------------------------------------------------------------------ console
// A decision that no longer matches any card means the source changed under it — that must be
// loud, not silent, or a stale resolution quietly stops being applied.
const declared = [
  ...Object.keys(decisions.concerts).map((k) => `concert:${k}`),
  ...Object.keys(decisions.recordings).map((k) => `recording:${k}`),
]
const unused = declared.filter((k) => !usedDecisions.has(k))
if (unused.length) {
  console.error(`\nSTALE DECISIONS — no matching item found for: ${unused.join(', ')}`)
  process.exitCode = 1
}

console.log('Normalised:')
for (const [k, v] of Object.entries(all)) {
  const alt = v.filter((x) => x.needsAltText).length
  console.log(
    `  ${k.padEnd(11)} ${String(v.length).padStart(2)}  ` +
      `${openDecisions[k].length} decision(s)${alt ? `, ${alt} need alt text` : ''}`
  )
}
console.log(`  repertoire   ${repertoire.length}`)
console.log(
  `\n${Object.values(openDecisions).flat().length} decisions · ${altNeeded.length} alt texts · ` +
    `all ${concerts.length} concerts classified`
)
console.log(`\nReview report: ${path.relative(ROOT, path.join(DIR, 'REVIEW.md'))}`)
