/**
 * Map a raw concert card onto the content-model fields.
 *
 * The source cards were hand-built in Elementor over several years and their structure is not
 * consistent, so this deliberately does NOT try to classify everything. It assigns what is
 * provably safe and routes the rest to `unassignedLines` with a `review` note.
 *
 * Invariant: every source line ends up either in a field or in `unassignedLines`. Nothing is
 * silently dropped.
 */
import { parseConcertDate } from './parse-date.mjs'

/** Country spellings used on the site -> ISO 3166-1 alpha-2. */
const COUNTRY = {
  AT: 'AT',
  A: 'AT',
  AUT: 'AT',
  DE: 'DE',
  D: 'DE',
  GER: 'DE',
  BG: 'BG',
  BGR: 'BG',
  BE: 'BE',
  BEL: 'BE',
  IT: 'IT',
  ITA: 'IT',
  ES: 'ES',
  ESP: 'ES',
  PT: 'PT',
  PRT: 'PT',
  HU: 'HU',
  HUN: 'HU',
  LT: 'LT',
  LTU: 'LT',
  FR: 'FR',
  FRA: 'FR',
  CH: 'CH',
  CHE: 'CH',
  CZ: 'CZ',
  CZE: 'CZ',
  PL: 'PL',
  POL: 'PL',
  NL: 'NL',
  NLD: 'NL',
  GB: 'GB',
  UK: 'GB',
  US: 'US',
  USA: 'US',
  CN: 'CN',
  CHN: 'CN',
  JP: 'JP',
  JPN: 'JP',
  RO: 'RO',
  ROU: 'RO',
  GR: 'GR',
  GRC: 'GR',
  TR: 'TR',
  TUR: 'TR',
  RS: 'RS',
  SRB: 'RS',
  SI: 'SI',
  SVN: 'SI',
  SK: 'SK',
  SVK: 'SK',
  HR: 'HR',
  HRV: 'HR',
  LU: 'LU',
  LUX: 'LU',
}

// "Vienna (AT)", "Vilnius, (LTU)", "Madrid (ES) Auditorio Nacional"
const LOCATION = /^(.+?),?\s*\(([A-Za-z]{1,3})\)\s*,?\s*(.*)$/

// Performer credits appear in four notations on the site:
//   "Mario Hossen, Violin"   "Mario HOSSEN · Violine"
//   "Mario HOSSEN (Violin)"  "Mario HOSSEN – Soloist und Conductor"
const PERFORMER_PATTERNS = [
  /^([^,·(]{2,60})\s*\(\s*([^()]{2,60})\s*\)$/, // parenthesised — try first, it is unambiguous
  /^([^,·]{2,60})\s*[,·]\s*([^,·]{2,60})$/,
  /^(.{2,60}?)\s+[–—-]\s+(.{2,60})$/,
]

// Role words that confirm a "Name + Role" line really is a performer credit rather than prose.
const ROLE =
  /\b(violin|violine|viola|violoncello|cello|kontrabass|contrabass|piano|klavier|harpsichord|cembalo|guitar|gitarre|flute|flöte|clarinet|klarinette|trumpet|trompete|conductor|dirigent|leitung|direction|soloist|solist|soprano|sopran|harp|harfe|organ|orgel|bass|tenor|mezzo|percussion|accordion|bandoneon)\b/i

// ...but the same words appear in WORK titles ("Julius Conus, Violin Concerto" is a composer and
// a piece, not a performer). These markers veto a match.
const WORK =
  /\b(concertos?|concerti|konzerte?|sonatas?|sonaten?|quartets?|quartett|quartetto|quintets?|quintett|variations?|variationen|symphon|sinfonias?|sinfonie|suites?|partitas?|serenades?|capriccios?|caprices?|rondos?|chorals?|fantasie|fantasia|op\.|m\.s\.|bwv|rv\s*\d|kv\s*\d)\b/i

/** @returns {boolean} true when the line reads as "person, their role" */
function isPerformer(line) {
  for (const re of PERFORMER_PATTERNS) {
    const m = re.exec(line)
    if (!m) continue
    const role = m[2]
    if (ROLE.test(role) && !WORK.test(role)) return true
  }
  return false
}

const clean = (s) =>
  String(s ?? '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/ /g, ' ')
    .trim()
    .replace(/\s+/g, ' ')

/**
 * @param {{index:number, dateRaw:string, blocks:string[][], infoUrl:string|null}} card
 * @param {{set:object, why:string, clientQuestion?:string}} [decision] hand-authored resolution,
 *   applied BEFORE classification so lines a human already assigned are not classified twice.
 */
export function normaliseConcert(card, decision) {
  // `review` = a human must choose. `notes` = accurate observations that need no decision.
  // Mixing the two makes every card look like a problem and hides the real ones.
  const review = []
  const notes = []
  const out = { sourceIndex: card.index, dateRaw: card.dateRaw }

  // ---- date -------------------------------------------------------------------------
  try {
    const { date, endDate } = parseConcertDate(card.dateRaw)
    out.date = date
    if (endDate) out.endDate = endDate
  } catch (e) {
    review.push(`DATE: ${e.message}`)
  }

  const blocks = (card.blocks ?? []).map((b) => b.map(clean).filter(Boolean))
  const locationBlock = blocks[0] ?? []
  const restBlocks = blocks.slice(1)

  // ---- location ---------------------------------------------------------------------
  const located = locationBlock.map((line) => ({ line, m: LOCATION.exec(line) })).filter((x) => x.m)

  if (located.length === 0) {
    // No country code anywhere — usually a tour ("CHINA TOUR") rather than a single venue.
    out.city = locationBlock[0] ?? ''
    if (locationBlock[1]) out.venue = locationBlock[1]
    review.push(
      `LOCATION: no "(country)" found — treated line 1 as city and line 2 as venue. ` +
        `Source: ${JSON.stringify(locationBlock)}`
    )
  } else if (located.length === 1) {
    const [, city, rawCode, trailing] = located[0].m
    out.city = clean(city)
    const code = COUNTRY[rawCode.toUpperCase()]
    if (code) out.country = code
    else review.push(`COUNTRY: unrecognised code "${rawCode}" — left unset`)
    if (code && rawCode.toUpperCase() !== code) {
      notes.push(`COUNTRY: normalised "${rawCode}" -> "${code}"`)
    }
    // Venue may sit on the location line itself, or on the following line.
    const others = locationBlock.filter((l) => l !== located[0].line)
    const venue = clean(trailing) || others[0] || ''
    if (venue) out.venue = venue
    if (clean(trailing) && others.length) {
      review.push(
        `VENUE: two candidates — same-line "${clean(trailing)}" and next-line "${others[0]}". Used the same-line value.`
      )
    }
    if (!venue) review.push('VENUE: none found in the source card')
  } else {
    // Several cities in one card (a short tour). The schema holds one city/venue pair, so this
    // needs a human decision: split into separate concerts, or keep as one combined entry.
    out.city = located.map((x) => clean(x.m[1])).join(' · ')
    const codes = [...new Set(located.map((x) => COUNTRY[x.m[2].toUpperCase()]).filter(Boolean))]
    if (codes.length === 1) out.country = codes[0]
    out.venue = located
      .map((x) => clean(x.m[3]))
      .filter(Boolean)
      .join(' · ')
    review.push(
      `MULTI-CITY: ${located.length} cities in one card — decide whether to split into separate ` +
        `concerts. Source: ${JSON.stringify(locationBlock)}`
    )
  }

  // ---- performers, series, programme -------------------------------------------------
  // Only lines that clearly read as "Name, Instrument" become performers. Everything else is
  // left unassigned for a human rather than guessed at.
  const performers = []
  const unassigned = []

  for (const block of restBlocks) {
    for (const line of block) {
      if (isPerformer(line)) performers.push(line)
      else unassigned.push(line)
    }
  }

  if (performers.length) out.performers = performers
  out.unassignedLines = unassigned

  // ---- apply the human decision first -------------------------------------------------
  // Doing this before classification matters: a line a human already assigned to venue,
  // series or ensemble must not then be classified a second time into something else.
  if (decision) {
    for (const [field, value] of Object.entries(decision.set)) {
      if (value === null) delete out[field]
      else out[field] = value
    }
    out.decidedWhy = decision.why
    if (decision.clientQuestion) out.clientQuestion = decision.clientQuestion
    out.resolvedReview = review.splice(0, review.length)
  }

  // ---- classify what is left: ensemble / series / subtitle / programme ----------------
  // Card shape across the site: [series] ["subtitle"] [ensemble] then the programme
  // (composer headings + works). Anything not confidently one of the first three stays in
  // programme, in source order — that is how it renders, so an over-cautious call costs nothing.
  const ENSEMBLE =
    /\b(orchestra|orchester|orkestar|ensemble|camerata|virtuosi|solisti|philharmonic|philharmonie|kammerorchester|akademie|players)\b/i
  const CATALOGUE =
    /\b(op\.|m\.?s\.?\s*\d|bwv|rv\s*\d|kv\s*\d|twv|hob\.|d\s*\d{3}|no\.\s*\d|nr\.\s*\d)/i
  // Programme prose that must never be mistaken for a series name.
  const PROGRAMME_PROSE = /^(music|chamber music|works|programme|program)\b/i
  // A bare composer list: "G. Tartini, A. Vivaldi, N. Paganini"
  const COMPOSER_LIST = /^([A-ZÀ-Þ]\.\s*[A-Za-zÀ-ÿ'’-]+)(\s*,\s*[A-ZÀ-Þ]\.\s*[A-Za-zÀ-ÿ'’-]+)+\.?$/
  // "Karl Amadeus Hartmann, Violin Concerto" — a composer and a work, never a series name.
  // Requires the comma, so titles like "GRANDE MUSICA – GOLDBERG-VARIATIONEN" are unaffected.
  const COMPOSER_WORK =
    /,\s*[^,]*\b(concertos?|konzerte?|sonatas?|sonaten?|quartetts?|quartets?|variationen|variations?|sinfonias?|symphon\w*|suites?|partitas?|serenades?|capriccios?|caprices?)\b/i
  const QUOTED = /^[“"'„](.+)[”"'“]$/

  const consumed = new Set(
    ['venue', 'series', 'ensemble', 'city']
      .map((f) => String(out[f] ?? '').toLowerCase())
      .filter(Boolean)
  )
  const norm = (s) => s.toLowerCase().replace(/[’']/g, "'").trim()

  const programme = []
  let ensemble = out.ensemble ?? null
  let series = out.series ?? null
  let subtitle = null
  let seriesIdx = -1

  unassigned.forEach((line, i) => {
    // Skip anything a decision already used — otherwise it reappears as a duplicate.
    if ([...consumed].some((c) => norm(c) === norm(line))) return

    const isTour = /\btour\b/i.test(line)
    if (!ensemble && !isTour && ENSEMBLE.test(line) && !CATALOGUE.test(line)) {
      ensemble = line
      return
    }
    if (
      !series &&
      !programme.length &&
      !CATALOGUE.test(line) &&
      !PROGRAMME_PROSE.test(line) &&
      !COMPOSER_LIST.test(line) &&
      !COMPOSER_WORK.test(line)
    ) {
      series = line
      seriesIdx = i
      return
    }
    // A subtitle must be explicitly quoted AND sit immediately after the series line.
    // Without the adjacency test a quoted work title at the end of the card (#34's
    // "METAMORPHOSEN") gets mistaken for one.
    const q = QUOTED.exec(line)
    if (q && !subtitle && i === seriesIdx + 1 && q[1].length < 60) {
      subtitle = q[1]
      return
    }
    programme.push(line)
  })

  if (ensemble) out.ensemble = ensemble
  if (series) out.series = series
  if (subtitle) out.subtitle = subtitle
  if (programme.length) out.programme = programme.join('\n')

  if (!restBlocks.length) {
    review.push('CONTENT: card has no detail blocks beyond the location')
  } else if (!performers.length) {
    // Accurate, not a problem: these cards credit an ensemble and a programme but no
    // individual players.
    notes.push('PERFORMERS: the original credits no individual performers on this card')
  }

  // ---- link --------------------------------------------------------------------------
  if (card.infoUrl) out.infoUrl = card.infoUrl

  // Every source line now lives in a field; keep the raw list only for audit.
  delete out.unassignedLines
  out.sourceLines = unassigned

  out.review = review
  out.notes = notes
  // A decision is only "needed" when the card is structurally ambiguous. Unclassified
  // series/programme lines are universal on this site and are handled as one bulk pass,
  // so they must not drown out the genuine anomalies.
  out.needsDecision = review.length > 0
  return out
}
