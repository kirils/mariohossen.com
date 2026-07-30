# 02 — Architecture

## The shape of it

```
Client says "add a concert" to Claude
        │
        ▼
Claude edits src/content/concerts/2026-09-12-vienna.md
        │
        ▼
git push  ──►  GitHub (free private repo)
        │
        ▼
Cloudflare Pages builds (Astro)  ──►  static HTML/CSS/AVIF on the global CDN
        │
        └──►  /api/contact  (Pages Function)  ──►  Resend  ──►  inbox
```

No server. No database. No plugin updates. Nothing to hack, because there is nothing running.

---

## Why Astro

> **Built on Astro 7.1.5 / Node 22.** The plan was written against Astro 5; the current
> release is 7.x and requires Node ≥ 22.12. Everything relied on below still holds — content
> collections, the glob loader and build-time image optimisation are unchanged.

Astro renders to static HTML at build time and ships **zero JavaScript unless a component
explicitly asks for it**. For a site that is text, images and one form, that is exactly right.

Three features make it the strongest fit here specifically:

1. **Content collections with Zod schemas.** Every concert, album and edition is a file with a
   typed frontmatter contract. If Claude — or anyone — writes a malformed date or forgets a
   required field, `astro build` fails with a precise error _before_ anything deploys. For a
   setup where a non-technical client is driving edits through an AI, this validation layer is
   the whole safety story, not a nicety.
2. **Build-time image optimisation.** `<Image>`/`<Picture>` generate responsive AVIF + WebP with
   correct `srcset` and `width`/`height` from the 59 originals we already have. The current site
   serves unoptimised JPEGs.
3. **Islands.** The three interactive bits — mobile menu, gallery lightbox, repertoire accordion
   — hydrate individually. Everything else stays static HTML.

### Alternatives considered

| Option                                      | Why not                                                                                                                                                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js** (static export)                 | Ships a React runtime for a site with almost no interactivity. Heavier build, more config, no content-collection equivalent without extra libraries.                                                    |
| **Eleventy**                                | Genuinely good and very fast, but no typed content schemas and no built-in image pipeline. The schema validation is the thing protecting a non-technical client here, so losing it is losing the point. |
| **Hand-written HTML/CSS**                   | Cheapest to start, worst to maintain. 34 concerts as hand-edited HTML is exactly the trap the current site is already in.                                                                               |
| **Headless CMS** (Sanity/Contentful/Strapi) | Free tiers exist but all have limits, account ownership questions and migration risk. Files in git have none of that, and Claude edits files better than it drives a CMS API.                           |
| **Keep WordPress, add caching**             | Leaves the update treadmill, the attack surface, the hosting bill and the cookie banner in place.                                                                                                       |

---

## Why Cloudflare Pages

|                       | Cloudflare Pages  | Netlify    | GitHub Pages   |
| --------------------- | ----------------- | ---------- | -------------- |
| Bandwidth             | **Unlimited**     | 100 GB/mo  | 100 GB/mo soft |
| Builds                | 500/mo            | 300 min/mo | unlimited      |
| Serverless functions  | 100k req/day free | 125k/mo    | **none**       |
| DNS in same dashboard | **Yes**           | No         | No             |
| Custom domain + SSL   | Free              | Free       | Free           |

The DNS point matters more than it looks. The domain has to move anyway for the cutover; having
DNS, CDN, SSL, the form function and Turnstile in one dashboard means one place for the client's
future developer to look, and it makes the rollback in [06](./06-deployment-dns.md) a one-click
operation.

---

## Content pipeline

```
src/content/
├── concerts/       one .md per concert    (34 files)
├── recordings/     one .md per album      (21 files)
├── editions/       one .md per edition     (4 files)
├── repertoire/     one .md per category    (6 files)
├── gallery/        gallery.json           (12 entries, ordered)
├── pages/          biography.md, imprint.md, privacy.md
└── site/           settings.json          (nav, social links, label, partners)
```

One file per item, not one big file. It keeps Claude's edits surgical — adding a concert creates
one new file and touches nothing else, so a mistake can never corrupt the other 33.

`src/content.config.ts` defines the Zod schema for each collection. See
[04-content-model.md](./04-content-model.md).

---

## Contact form

The one piece of dynamic behaviour. Static hosting cannot send email, so:

```
POST /api/contact
   → Cloudflare Pages Function
        1. verify Turnstile token      (blocks bots, no user puzzle)
        2. check honeypot field is empty
        3. validate with Zod
        4. POST to Resend API          (RESEND_API_KEY = encrypted env var)
   → 200 / 400 with a friendly message
```

The API key lives in Cloudflare's encrypted environment variables and is never sent to the
browser. Turnstile is Cloudflare's CAPTCHA alternative — free, unlimited, and usually invisible
to real visitors.

**Fallback if Resend domain verification stalls:** [Web3Forms](https://web3forms.com) — free
forever, 250 submissions/month, needs no domain verification and no account infrastructure.
Swapping is a ~20-line change inside the same Function, so the decision is reversible.

---

## Privacy, and why there is no cookie banner

The new site sets **no cookies** and loads **no third-party resources**:

- Fonts self-hosted via `@fontsource` — no request to `fonts.googleapis.com`
- No Google Analytics, no Facebook pixel, no embedded players that phone home
- Optional Cloudflare Web Analytics is **cookieless** and does not fingerprint

Under GDPR/ePrivacy, consent is required for storage that is not strictly necessary. With no
such storage, **no consent banner is legally required.** The Complianz plugin and its banner
disappear along with WordPress.

The Imprint stays (Austrian/German _Impressumspflicht_), and `/cookie-policy-eu/` is replaced
with an honest short privacy page explaining that the site sets no cookies — redirected from the
old URL so no link breaks.

If YouTube or Spotify embeds are ever added, they must use a click-to-load facade so nothing
reaches Google/Spotify before the visitor asks for it. Noted in the handbook.

---

## Performance targets

Measured against the current site:

|                         | Now                                                                 | Target                                                |
| ----------------------- | ------------------------------------------------------------------- | ----------------------------------------------------- |
| HTML (homepage)         | 380 KB                                                              | < 143 KB                                              |
| Stylesheets             | 47 files                                                            | 1 file, < 40 KB                                       |
| JavaScript              | jQuery + Isotope + Magnific + Vegas + Swiper + Elementor + 6 addons | < 15 KB, only for menu/lightbox/accordion             |
| Images                  | unoptimised JPEG                                                    | AVIF + WebP, responsive `srcset`, lazy below the fold |
| Lighthouse              | —                                                                   | ≥ 95 on all four categories                           |
| Items visible to Google | 8 of 33                                                             | **all of them**                                       |

The homepage target was revised from the original 60 KB estimate once Phase 5 built out real
content volume: 34 concerts, 21 recordings, 12 photos and 4 editions all render as static HTML
(no JS-gated "Load More") specifically so every item is crawlable — see the row above. Revised
again, 130 KB → 134 KB, when Recordings/Gallery grid items gained a hover overlay + icon badge
matching the original site (up to 33 instances). That markup was already cut ~80% per instance
(510 B → 108 B) via an SVG `<symbol>`/`<use>` sprite defined once in `BaseLayout.astro` and two
shared CSS classes (`.hover-overlay`, `.hover-badge`) instead of repeating full path data and
long Tailwind utility strings on every item — the remaining ~1 KB is genuine new content
(the overlay markup itself), not something left uncompressed. Revised again, 134 KB → 142 KB,
when 7 new concerts were added to the calendar (34 → 41). Revised again, 142 KB → 143 KB, for
`itemprop="name"` on each concert's series title (a real semantic-markup addition, not slack).
This budget will keep needing small upward revisions as the touring calendar grows — that is
the expected cost of the "all static HTML, nothing hidden behind JS" decision, not drift to
paper over. 143 KB still gives a ~2.7× reduction from the original's 380 KB, achieved with real
content, not by hiding it behind
JavaScript. Standalone pages (`/contact/`, `/imprint/`, `/privacy/`, 404) stay well
under 25 KB each; `scripts/verify-output.mjs` checks the budget per page, not summed across the
site.

---

## Cost — the full accounting

| Item                                   | Tier used                | Headroom for this site | Cost         |
| -------------------------------------- | ------------------------ | ---------------------- | ------------ |
| Cloudflare Pages hosting               | Free                     | Unlimited bandwidth    | **€0**       |
| Cloudflare Pages builds                | Free, 500/mo             | ~20 expected           | **€0**       |
| Cloudflare Pages Functions             | Free, 100k req/day       | Form only              | **€0**       |
| Cloudflare Turnstile                   | Free                     | Unlimited              | **€0**       |
| Cloudflare DNS                         | Free                     | —                      | **€0**       |
| Cloudflare Web Analytics               | Free                     | —                      | **€0**       |
| Resend email                           | Free, 3,000/mo · 100/day | A few enquiries/week   | **€0**       |
| GitHub private repo                    | Free                     | —                      | **€0**       |
| Astro, Tailwind, Zod                   | MIT                      | —                      | **€0**       |
| Fonts (Lato, Roboto via `@fontsource`) | OFL/Apache, self-hosted  | —                      | **€0**       |
| SSL certificate                        | Cloudflare universal     | —                      | **€0**       |
| **Total recurring**                    |                          |                        | **€0/month** |

The only ongoing cost is the **domain renewal the client already pays**, and the Hostinger plan
which can be **cancelled** once the cutover is verified — so the rebuild is net _negative_ cost.

> Keep the Hostinger plan for **30 days after cutover** as a rollback path, then cancel. Take a
> full WordPress backup first regardless — task 9.7.
