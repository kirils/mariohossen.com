# 01 — Discovery Findings

Everything below was measured from the live site on 2026-07-28, not assumed.

---

## 1. Current stack

| Layer            | What is running                                                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Host             | Hostinger (hPanel), PHP 8.1.34, `hcdn` edge cache                                                                                |
| CMS              | WordPress (REST API open, `wp-json` reachable)                                                                                   |
| Theme            | `zugan` + `zugan-child` (commercial ThemeForest theme)                                                                           |
| Page builder     | Elementor 3.22.1                                                                                                                 |
| Elementor addons | Essential Addons Lite 5.9.24, Happy Addons 3.11.1, Premium Addons 4.10.34, Royal Addons, Addon Elements, Header Footer Elementor |
| Forms            | Contact Form 7 5.7.5.1                                                                                                           |
| Cookies          | Complianz GDPR                                                                                                                   |
| Other            | Redux Framework 4.4.17, SVG Support, Real Media Library, Media Cleaner                                                           |

That is **six** Elementor addon plugins stacked on top of Elementor itself. It is the single
biggest reason the homepage weighs what it does.

## 2. Page map

Only six pages exist. The site is effectively a **one-page design** with anchor navigation.

| URL                    | Role                                                                                    | Keep?                      |
| ---------------------- | --------------------------------------------------------------------------------------- | -------------------------- |
| `/`                    | The whole site: biography, repertoire, concerts, recordings, editions, gallery, contact | Yes — this is the site     |
| `/contact/`            | Standalone version of the contact section                                               | Yes                        |
| `/imprint/`            | Legal imprint                                                                           | Yes                        |
| `/cookie-policy-eu/`   | Complianz-generated cookie policy                                                       | Replace (see §6)           |
| `/events/`             | Legacy 2024 events archive, **not in the navigation**                                   | Redirect to `/#concerts`   |
| `/mario-hossen-disco/` | Legacy 2024 discography page, **not in the navigation**                                 | Redirect to `/#recordings` |

Navigation is: `biography · repertoire · concerts · recordings · editions · gallery · contact`
— all anchors on `/`. The footer adds Contact, Imprint, Cookie Policy.

There are also 4 WordPress posts titled "Blog 1" … "Blog 4" (dated 2018) and four categories
(`texte`, `moderation`, `kunst`, `videos`). These are **leftover theme demo content** — they are
not linked from anywhere and carry no real content. Do not migrate them; redirect to `/`.

## 3. Content inventory

| Section      | Items                  | Detail                                                                                                                                                                             |
| ------------ | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Biography    | ~11 paragraphs         | Short intro visible, rest behind a "read more" toggle                                                                                                                              |
| Blog panels  | 2                      | "Project PAGANINI in VIENNA" and "Thomastik Infeld Blog", each expanding to a sub-list of 6 articles                                                                               |
| Repertoire   | 6 accordion categories | Concerts & Works with Orchestra · Integral Recitals · Works for Violin & Piano · Works for Solo Violin · Jazz/Tango/Special · Chamber Music. Each holds a long composer→works list |
| Concerts     | **34**                 | Newest `22.–29. MAY 2026`, oldest `14 May 2024`. Each card: date, city (country), venue, series, ensemble/personnel, programme, "Info" link                                        |
| Recordings   | **21**                 | Album cover, composer, title, outbound link (Dynamic, Qobuz, JioSaavn, …)                                                                                                          |
| Editions     | 4                      | Doblinger sheet music — cover, composer, title, volume, scoring, editor, "see more" link                                                                                           |
| Gallery      | **12**                 | Portrait photography, lightbox, no captions                                                                                                                                        |
| Label        | 1                      | Dynamic S.r.l., Genoa — full postal address, phone, fax, email, website                                                                                                            |
| Partners     | 2                      | Österreichische Nationalbank, Thomastik-Infeld                                                                                                                                     |
| Contact form | 1                      | Name, Email, Subject, Message, consent checkbox                                                                                                                                    |
| Social       | 4                      | YouTube, Spotify, Facebook, Instagram                                                                                                                                              |

## 4. Media assets — all downloaded

**59 files, 6.3 MB**, now in `assets/originals/` mirroring the WordPress upload paths.

| Type | Count                                              |
| ---- | -------------------------------------------------- |
| JPG  | 45                                                 |
| JPEG | 6                                                  |
| PNG  | 5 (favicon, 404 logo, placeholders)                |
| WebP | 2                                                  |
| SVG  | 1 (`logo_MH.svg` — the wordmark)                   |
| PDF  | 1 (Paganini Ensemble Wien / Brahms-Saal programme) |

Every file was integrity-checked: no truncated downloads, no HTML error pages saved as images.

One URL (`2024/06/Handel-Violin-Sonatas-Hossen.jpg`) appears in the list but returns **404 on
the live site too** — the file actually in use is `Handel-Violin-Sonatas-Hossen-1.jpg`, which
downloaded fine. Nothing is missing.

> **Resolution caveat.** Several album covers are only ~300–600 px wide because that is the
> largest version WordPress holds. They cannot be upscaled. Ask the client for higher-resolution
> covers where available — tracked as task 1.6.

## 5. The "Load More" problem

This is the finding that shapes the whole extraction approach.

The Recordings and Gallery sections are Essential Addons _Filterable Gallery_ widgets. The
server renders **only the first 4 items of each**; Isotope holds the rest in a detached
JavaScript array and appends them when "Load More" is clicked.

Verified counts:

|                     | In server HTML | After clicking Load More |
| ------------------- | -------------- | ------------------------ |
| Recordings          | 4              | **21**                   |
| Gallery photos      | 4              | **12**                   |
| `<img>` tags on `/` | 16             | 82                       |

Two consequences:

1. **A plain `wget`/`curl` mirror captures 8 items and silently loses 21.** This is why
   `extraction/tools/crawl.mjs` drives a real browser, clicks every Load More until the counts
   stop rising, and only then snapshots the DOM.
2. **Google sees the same 4 items a `curl` does.** 17 of 21 albums and 8 of 12 photos are
   currently invisible to search engines. Fixing this is one of the clearest wins of the rebuild
   — static HTML puts all of it in the initial response.

## 6. Problems worth fixing during the rebuild

Found while auditing; each becomes a task in [05-task-list.md](./05-task-list.md).

1. **Broken heading hierarchy.** The page has no descriptive `<h1>` — the only `<h1>` on the
   homepage is a concert date, `"02. & 03. MAY 2025"`. Section titles are `<h2>`, concert dates
   are `<h3>`. Bad for SEO and for screen readers.
2. **Empty `alt` on every gallery and album image.** 82 images, essentially none described.
   Fails WCAG 1.1.1 and throws away image-search traffic for a performer whose name _is_ the
   brand.
3. **380 KB of HTML** for one page, plus **47 stylesheets** and a JS stack of jQuery, Isotope,
   Magnific Popup, Vegas, Swiper, Elementor and six addon bundles.
4. **Content hidden from crawlers** — see §5.
5. **A cookie banner that only exists because WordPress needs one.** No cookie banner is
   required if the site sets no cookies and loads no third-party trackers.
6. **Google Fonts loaded from `fonts.googleapis.com`.** For a site with a German/Austrian
   audience this is a live GDPR irritation (the 2022 Munich ruling). Self-hosting removes it.
7. **No structured data.** A classical soloist with 34 concerts and 21 albums should be emitting
   `Person`, `Event` and `MusicAlbum` JSON-LD. Concerts especially — Google shows event rich
   results, and right now the site gets none of it.
8. **Concerts never expire.** Past and upcoming concerts are hand-placed Elementor cards in
   manual order. A date-typed content collection sorts and splits them automatically.
9. **Inconsistent date formats** in the source content: `22. - 29. MAY 2026`, `8-11. MAY 2025`,
   `20 October 2024`, `04 Juli 2024` (German), and one with a trailing invisible character
   (`08. NOV 2025​`). All get normalised to ISO dates at migration.

## 7. Design tokens measured from the live site

Full detail in [03-design-system.md](./03-design-system.md). Headlines:

- Background **`#000000`**, accent gold **`#B09153`**, body text **`#BBBBBB`**, white `#FFFFFF`
- Fonts: **Lato** (body/UI, 578 elements) and **Roboto** (section titles, 11 elements)
- Body 16 px / 26 px line-height; section titles Roboto 300 at 32 px in gold
- Container width **1240 px**; header height 157 px
- A distinctive **purple-to-gold curved SVG divider** between the black and gold bands

## 8. Access constraints

We are working from the **public site only** — no wp-admin, no FTP. That is fine, and everything
above was obtained without credentials. It means two things for the plan:

- Content extraction relies on the rendered-DOM crawl, so **Phase 1 ends with a human
  verification pass** against the screenshots (task 1.7). This is not optional.
- Only media _referenced by a page_ could be found. If the client has photos sitting unused in
  the WordPress media library, we cannot see them. The media library REST endpoint reports 56
  items and we recovered 59 files, so coverage is complete for everything actually in use.
