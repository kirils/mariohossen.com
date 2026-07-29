/**
 * Task 4.9 — copies the media referenced by generated content into
 * src/assets/images/{recordings,editions,gallery,portraits,brand}/, matched by filename against
 * assets/originals/ (searched recursively, since originals are nested by WordPress upload date).
 *
 * assets/originals/ is a read-only archive — this only ever reads from it, never writes.
 * Re-runnable: each destination folder is cleared and rebuilt from scratch on every run.
 *
 * Usage: node sort-images.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const ORIGINALS = path.join(ROOT, 'assets/originals')
const DATA = path.join(ROOT, 'extraction/data/content')
const DEST = path.join(ROOT, 'src/assets/images')

const readJSON = (name) => JSON.parse(fs.readFileSync(path.join(DATA, name + '.json'), 'utf8'))

function findAllFiles(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...findAllFiles(full))
    else out.push(full)
  }
  return out
}

const allOriginals = findAllFiles(ORIGINALS)
const byBasename = new Map()
for (const f of allOriginals) {
  const name = path.basename(f)
  if (byBasename.has(name)) {
    throw new Error(
      `Duplicate basename across assets/originals/: ${name} (${byBasename.get(name)} and ${f})`
    )
  }
  byBasename.set(name, f)
}

function copyInto(subfolder, filenames) {
  const dest = path.join(DEST, subfolder)
  fs.rmSync(dest, { recursive: true, force: true })
  fs.mkdirSync(dest, { recursive: true })
  const missing = []
  for (const name of new Set(filenames)) {
    const src = byBasename.get(name)
    if (!src) {
      missing.push(name)
      continue
    }
    fs.copyFileSync(src, path.join(dest, name))
  }
  return { copied: filenames.length ? new Set(filenames).size - missing.length : 0, missing }
}

const recordings = readJSON('recordings.normalised')
const editions = readJSON('editions.normalised')
const gallery = readJSON('gallery.normalised')
const biography = readJSON('biography.normalised')

// MHossen.jpg is the Repertoire section's portrait (tuxedo, white bow tie) — a second portrait
// alongside the biography one. It sits *after* the REPERTOIRE heading in the source DOM, so
// biography.normalised.json's `portraits` list (deliberately scoped to images *before* that
// heading) never picks it up. Found by comparing the rendered screenshot against what Phase 4
// had actually sorted — not present in any extraction JSON, so it is listed by hand here.
const REPERTOIRE_PORTRAIT = 'MHossen.jpg'

const jobs = [
  ['recordings', recordings.map((r) => r.coverFile)],
  ['editions', editions.map((e) => e.coverFile)],
  ['gallery', gallery.map((g) => g.file)],
  ['portraits', [...biography.portraits, REPERTOIRE_PORTRAIT]],
  // The header logo is already a hand-placed src/assets/brand/ asset from Phase 3 — not sorted
  // here.
]

let anyMissing = false
for (const [folder, filenames] of jobs) {
  const { copied, missing } = copyInto(folder, filenames)
  console.log(
    `${folder.padEnd(11)} ${copied} file(s) copied${missing.length ? `, MISSING: ${missing.join(', ')}` : ''}`
  )
  if (missing.length) anyMissing = true
}

if (anyMissing) {
  console.error(
    '\nSome referenced files were not found in assets/originals/ — fix before building.'
  )
  process.exit(1)
}

console.log('\nDone.')
