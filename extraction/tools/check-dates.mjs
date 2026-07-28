import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseConcertDate } from './lib/parse-date.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const concerts = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'extraction/data/content/concerts.raw.json'), 'utf8')
)

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const weekday = (d) => WD[new Date(d + 'T12:00:00Z').getUTCDay()]

let failures = 0
console.log('idx  original                          ->  start        (day)  end          (day)')
console.log('-'.repeat(92))
for (const c of concerts) {
  try {
    const { date, endDate } = parseConcertDate(c.dateRaw)
    const end = endDate ? `${endDate}  ${weekday(endDate)}` : ''
    console.log(
      `${String(c.index).padStart(3)}  ${c.dateRaw.padEnd(32)} ->  ${date}  ${weekday(date)}    ${end}`
    )
  } catch (e) {
    failures++
    console.log(`${String(c.index).padStart(3)}  ${c.dateRaw.padEnd(32)} ->  ERROR: ${e.message}`)
  }
}
console.log('-'.repeat(92))
console.log(`${concerts.length} concerts, ${failures} unparsed`)
process.exit(failures ? 1 : 0)
