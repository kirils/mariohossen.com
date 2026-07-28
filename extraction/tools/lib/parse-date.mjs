/**
 * Normalise the concert date strings used on the WordPress site into ISO dates.
 *
 * The source uses at least nine formats, mixes English and German month names, and includes
 * ranges that cross a month boundary. The parser is deliberately strict: anything it cannot
 * read with confidence throws, because a wrong-but-plausible date is far more damaging here
 * than a loud failure.
 */

const MONTHS = {
  // English
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
  // German — the site mixes these in ("04 Juli 2024", "07 Juni 2024")
  januar: 1,
  februar: 2,
  maerz: 3,
  märz: 3,
  mai: 5,
  juni: 6,
  juli: 7,
  oktober: 10,
  dezember: 12,
}

/** Strip zero-width characters, normalise nbsp, collapse whitespace. */
export function cleanDateString(input) {
  return String(input ?? '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u00A0/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`

/**
 * @param {string} raw e.g. "29. 30. NOV. & 1. DEC.  2025"
 * @returns {{date: string, endDate?: string}} ISO dates
 */
export function parseConcertDate(raw) {
  const s = cleanDateString(raw)
  if (!s) throw new Error('empty date string')

  // The year is the only 4-digit number. Pull it out first so it is never read as a day.
  const years = s.match(/\b\d{4}\b/g) ?? []
  if (years.length === 0) throw new Error(`no year found in "${raw}"`)
  if (years.length > 1) throw new Error(`ambiguous: multiple years in "${raw}"`)
  const year = Number(years[0])

  const rest = s.replace(/\b\d{4}\b/, ' ')

  // Tokenise into day numbers and month names, in document order.
  const tokens = rest.split(/[^A-Za-zÄÖÜäöü0-9]+/).filter(Boolean)

  /** @type {{day: number, month: number}[]} */
  const parts = []
  let pendingDays = []

  for (const token of tokens) {
    if (/^\d{1,2}$/.test(token)) {
      pendingDays.push(Number(token))
      continue
    }
    const month = MONTHS[token.toLowerCase()]
    if (month === undefined) {
      throw new Error(`unrecognised token "${token}" in "${raw}"`)
    }
    if (pendingDays.length === 0) {
      throw new Error(`month "${token}" with no day in "${raw}"`)
    }
    // Every day collected so far belongs to this month ("29. 30. NOV." -> 29 Nov, 30 Nov).
    for (const day of pendingDays) parts.push({ day, month })
    pendingDays = []
  }

  if (pendingDays.length) throw new Error(`day(s) with no month in "${raw}"`)
  if (parts.length === 0) throw new Error(`no date found in "${raw}"`)

  for (const { day, month } of parts) {
    if (day < 1 || day > 31) throw new Error(`day ${day} out of range in "${raw}"`)
    const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
    if (day > maxDay) {
      throw new Error(`day ${day} does not exist in month ${month} of ${year} ("${raw}")`)
    }
  }

  const first = parts[0]
  const last = parts[parts.length - 1]
  const date = iso(year, first.month, first.day)

  if (parts.length === 1) return { date, endDate: undefined }

  // A range that runs backwards has crossed into the next year (e.g. 30 Dec -> 2 Jan).
  const endYear =
    Date.UTC(year, last.month - 1, last.day) < Date.UTC(year, first.month - 1, first.day)
      ? year + 1
      : year

  return { date, endDate: iso(endYear, last.month, last.day) }
}
