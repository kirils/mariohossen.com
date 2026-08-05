import type { CollectionEntry } from 'astro:content'

const SITE_URL = 'https://www.mariohossen.com'

// Same four links rendered by SocialLinks.astro — kept here rather than reading
// site/settings.json's (currently unused) `social` field, so this can never drift from what a
// visitor actually sees on the page.
const SAME_AS = [
  'https://www.youtube.com/channel/UCyCB_mun4F91Efmwwm72wYw',
  'https://open.spotify.com/artist/0JVA6wodUe5NnmnZkoiQG9',
  'https://www.facebook.com/mario.hossen',
  'https://www.instagram.com/mariohossenofficial/',
]

export function personSchema() {
  return {
    '@type': 'Person',
    name: 'Mario Hossen',
    jobTitle: 'Violin soloist and conductor',
    url: `${SITE_URL}/`,
    sameAs: SAME_AS,
  }
}

/**
 * Only upcoming concerts — a past Event has nothing to offer a rich-result search, and marking
 * up all 41 (vs. the handful that are actually upcoming at any moment) would cost real HTML
 * budget for zero benefit. Call with `sortConcerts(...).upcoming`.
 */
export function eventSchema(concert: CollectionEntry<'concerts'>) {
  const { date, endDate, city, country, venue, series, ensemble, performers, programme, infoUrl } =
    concert.data

  const performerEntries = [
    ...(ensemble ? [{ '@type': 'PerformingGroup', name: ensemble }] : []),
    ...performers.map((name) => ({ '@type': 'Person', name })),
  ]

  return {
    '@type': 'Event',
    name: series ?? ensemble ?? `Concert in ${city}`,
    startDate: date.toISOString().slice(0, 10),
    ...(endDate && { endDate: endDate.toISOString().slice(0, 10) }),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: venue ?? city,
      address: {
        '@type': 'PostalAddress',
        addressLocality: city,
        ...(country && { addressCountry: country }),
      },
    },
    performer:
      performerEntries.length > 0 ? performerEntries : { '@type': 'Person', name: 'Mario Hossen' },
    ...(programme && { description: programme }),
    ...(infoUrl && { url: infoUrl }),
  }
}

export function musicAlbumSchema(recording: CollectionEntry<'recordings'>) {
  const { composer, title, subtitle, year, listenUrl } = recording.data

  return {
    '@type': 'MusicAlbum',
    name: subtitle ? `${title} — ${subtitle}` : title,
    byArtist: { '@type': 'Person', name: 'Mario Hossen' },
    description: `Works by ${composer}`,
    ...(year && { datePublished: String(year) }),
    ...(listenUrl && { url: listenUrl }),
  }
}
