import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseConcertDate } from './parse-date.mjs'

/**
 * Every case below is a real string taken from the live site. The dangerous failure here is not
 * a crash — it is a date that parses successfully and is wrong, so each expectation is written
 * out in full rather than checked loosely.
 */
const cases = [
  // single day, English
  ['15. MAY 2026', { date: '2026-05-15' }],
  ['27. APRIL 2026', { date: '2026-04-27' }],
  ['17. NOVEMBER 2025', { date: '2025-11-17' }],
  ['19. OCT 2025', { date: '2025-10-19' }],
  ['20 October 2024', { date: '2024-10-20' }],
  ['14 May 2024', { date: '2024-05-14' }],
  ['25 August 2024', { date: '2024-08-25' }],
  ['28 September 2024', { date: '2024-09-28' }],

  // German month names
  ['04 Juli 2024', { date: '2024-07-04' }],
  ['07 Juni 2024', { date: '2024-06-07' }],

  // hyphen range, same month
  ['22. - 29. MAY 2026', { date: '2026-05-22', endDate: '2026-05-29' }],
  ['8-11. MAY 2025', { date: '2025-05-08', endDate: '2025-05-11' }],

  // ampersand range, same month
  ['01. & 02. MAY 2026', { date: '2026-05-01', endDate: '2026-05-02' }],
  ['02. & 03. MAY 2025', { date: '2025-05-02', endDate: '2025-05-03' }],
  ['04. & 05. APRIL 2025', { date: '2025-04-04', endDate: '2025-04-05' }],
  ['26. & 27. SEPT 2025', { date: '2025-09-26', endDate: '2025-09-27' }],

  // bare space-separated days, same month
  ['25. 26. NOVEMBER 2025', { date: '2025-11-25', endDate: '2025-11-26' }],
  ['20. 21. NOVEMBER 2025', { date: '2025-11-20', endDate: '2025-11-21' }],

  // CROSS-MONTH — the case that breaks naive parsers
  ['29. 30. NOV. & 1. DEC.  2025', { date: '2025-11-29', endDate: '2025-12-01' }],
  ['24 May - 02 June 2024', { date: '2024-05-24', endDate: '2024-06-02' }],

  // zero-width space (U+200B) at the end, as it appears in the source
  ['08. NOV 2025​', { date: '2025-11-08' }],
]

for (const [input, expected] of cases) {
  test(`parses ${JSON.stringify(input)}`, () => {
    const got = parseConcertDate(input)
    assert.equal(got.date, expected.date, 'start date')
    assert.equal(got.endDate, expected.endDate, 'end date')
  })
}

test('a single day never produces an endDate', () => {
  assert.equal(parseConcertDate('15. MAY 2026').endDate, undefined)
})

test('cross-year ranges roll the end year forward', () => {
  const got = parseConcertDate('30. DEC. & 2. JAN. 2025')
  assert.equal(got.date, '2025-12-30')
  assert.equal(got.endDate, '2026-01-02')
})

test('unparseable input throws rather than guessing', () => {
  assert.throws(() => parseConcertDate('sometime next spring'))
  assert.throws(() => parseConcertDate(''))
})

test('a missing year throws rather than assuming the current one', () => {
  assert.throws(() => parseConcertDate('15. MAY'))
})
