import type { CollectionEntry } from 'astro:content'

type Concert = CollectionEntry<'concerts'>

/**
 * Newest date first, throughout — upcoming concerts (furthest-out first), then past concerts
 * (most recent first) below them. Because every upcoming date is by definition later than every
 * past date, sorting each bucket newest-first makes `all` one continuous descending sequence
 * with no reversal at the upcoming/past seam. The whole point of a date-typed field: concerts
 * reorder themselves as time passes, with no manual editing. A multi-day run counts as
 * "upcoming" through its own final day (endDate ?? date).
 */
export function sortConcerts(concerts: Concert[], now: Date = new Date()) {
  const withEnd = concerts.map((c) => ({ c, end: c.data.endDate ?? c.data.date }))
  const upcoming = withEnd
    .filter(({ end }) => end >= now)
    .sort((a, b) => +b.c.data.date - +a.c.data.date)
    .map(({ c }) => c)
  const past = withEnd
    .filter(({ end }) => end < now)
    .sort((a, b) => +b.c.data.date - +a.c.data.date)
    .map(({ c }) => c)
  return { upcoming, past, all: [...upcoming, ...past] }
}

const MONTHS = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
]

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Renders a single consistent format regardless of how the source phrased it (the original
 * mixed at least nine formats across its 34 cards — see docs/plan/01-discovery-findings.md).
 *   15. MAY 2026
 *   22. – 29. MAY 2026              (same month)
 *   24. MAY – 02. JUNE 2024         (crosses a month)
 */
export function formatConcertDate(date: Date, endDate?: Date): string {
  const d = pad(date.getUTCDate())
  const m = MONTHS[date.getUTCMonth()]
  const y = date.getUTCFullYear()
  if (!endDate) return `${d}. ${m} ${y}`

  const ed = pad(endDate.getUTCDate())
  const em = MONTHS[endDate.getUTCMonth()]
  const ey = endDate.getUTCFullYear()

  if (m === em && y === ey) return `${d}. – ${ed}. ${m} ${y}`
  if (y === ey) return `${d}. ${m} – ${ed}. ${em} ${y}`
  return `${d}. ${m} ${y} – ${ed}. ${em} ${ey}`
}
