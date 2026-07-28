# 08 — Risks & Decisions

---

## Risks

Ordered by how much damage they can do, not how likely they are.

### R1 — Email breaks during the DNS move ⚠ highest impact

**What:** The domain's `MX`, SPF and DKIM records live in the DNS zone being moved. Miss one and
the client silently stops receiving email — while the website looks perfect.

**Why it is the top risk:** it is invisible. Nobody notices missing email for hours or days, and
by then senders have already got bounces.

**Mitigation:** screenshot the full zone file before touching anything; verify Cloudflare's
imported records against it line by line; send a real test email _to_ the domain immediately
after cutover (task 9.10, called out explicitly in the runbook).

---

### R2 — Content lost or wrong in extraction

**What:** 77 content items are being read out of rendered HTML. Automated parsing gets ~95% right
and quietly mangles the rest — a truncated programme note, a dropped performer, a wrong date.

**Mitigation:** task **1.7** is a mandatory human read-through against the full-page screenshots,
item by item, and it blocks the cutover. Already partly de-risked: the Load More problem
(§5 of [01](./01-discovery-findings.md)) was found and solved in discovery rather than after
launch, which is exactly the class of error this risk is about.

---

### R3 — SEO dip after cutover

**What:** URL or content changes can cost search rankings.

**Assessment:** low, and the likely direction is _up_. URLs are preserved, all old paths 301, and
**17 albums and 8 photos that Google currently cannot see become visible**. Plus `Event` and
`MusicAlbum` structured data the current site has none of.

**Mitigation:** `_redirects` covers every old URL (9.5); sitemap submitted immediately (9.11);
Search Console watched for 2 weeks; Hostinger kept for 30 days.

---

### R4 — Client cannot work the tooling

**What:** The whole "manage it with Claude" premise fails if the client stalls at the terminal.

**Mitigation:** [07-client-handbook.md](./07-client-handbook.md) is written for a non-technical
reader with copy-paste sentences, and task **8.8** requires the client to publish a real change
themselves before the project is called done. If that session goes badly, the fallback is
pre-planned: add **Decap CMS** or **Pages CMS** — both free, both git-backed, both give a
click-through admin UI over the exact same files, and neither invalidates any other decision
here.

---

### R5 — Low-resolution source images

**What:** Some album covers are only ~300–600 px because that is the largest WordPress holds.
They cannot be upscaled.

**Mitigation:** task 1.6 asks the client for originals. Where none exist, the current site has
the same limitation, so nothing is worse than today.

---

### R6 — Concert data goes stale

**What:** 34 concerts today, oldest May 2024. If the client stops adding them, the site ages.

**Mitigation:** past concerts move to an archive automatically, so the top of the page never
shows something months old. This is strictly better than the current manual ordering, where a
2024 concert can sit at the top forever.

---

### R7 — Contact form spam

**Mitigation:** Turnstile + honeypot + minimum submit time + Resend's own filtering. If it still
leaks, Cloudflare WAF rate-limiting is free and one rule away.

---

### R8 — Free-tier limits change

**What:** Cloudflare or Resend could alter their free tiers.

**Assessment:** low. Cloudflare Pages' unlimited-bandwidth free tier is a deliberate competitive
position, and Pages has been free since 2020.

**Mitigation:** the output is **plain static files**. If Cloudflare ever became unattractive, the
same `dist/` folder deploys to Netlify, Vercel, GitHub Pages or any bucket in minutes. There is
no lock-in to be trapped by — which is a large part of why static was chosen.

---

## Decisions

| #   | Decision                                       | Alternatives                                | Why                                                                                                                                                                                            |
| --- | ---------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Astro 7, static                                | Next.js, Eleventy, hand-written HTML        | Zero JS by default, typed content collections, build-time images. The schema validation is what makes non-technical + AI editing safe.                                                         |
| D2  | Cloudflare Pages                               | Netlify, GitHub Pages, Vercel               | Unlimited bandwidth, free functions, and DNS in the same dashboard as a cutover that has to happen anyway.                                                                                     |
| D3  | Markdown/JSON in git                           | Headless CMS, SQLite, WordPress headless    | No accounts, no limits, no vendor. Claude edits files more reliably than it drives a CMS API, and git gives free version history.                                                              |
| D4  | One file per item                              | One big JSON per collection                 | Edits stay surgical; a mistake can affect one concert, not 34.                                                                                                                                 |
| D5  | Zod schemas, strict                            | Loose frontmatter                           | The guardrail. Bad edits fail the build instead of reaching visitors.                                                                                                                          |
| D6  | Tailwind v4                                    | Vanilla CSS, CSS modules, styled-components | Tokens map cleanly to the extracted palette; no runtime; tiny output.                                                                                                                          |
| D7  | Self-hosted fonts                              | Google Fonts CDN                            | Removes a third-party request, a GDPR question, and a render-blocking round trip.                                                                                                              |
| D8  | No cookie banner                               | Keep a consent tool                         | No cookies and no third-party resources means no consent is legally required. The banner exists today only because WordPress needs it.                                                         |
| D9  | Pages Function + Resend                        | Formspree, Netlify Forms, Web3Forms         | Free, API key stays server-side, professional deliverability. Web3Forms documented as a fallback (6.9).                                                                                        |
| D10 | Keep `www` as canonical                        | Move to apex                                | Preserves accumulated SEO signal. No benefit to changing it now.                                                                                                                               |
| D11 | Native `<details>` for accordions              | JS accordion library                        | Keyboard-accessible and zero JS. Replaces a meaningful slice of what Elementor loads today.                                                                                                    |
| D12 | Drop the 4 demo blog posts                     | Migrate them                                | They are leftover theme demo content ("Blog 1"–"Blog 4", 2018), unlinked and empty of real content. 301 to `/`.                                                                                |
| D13 | Redirect `/events/` and `/mario-hossen-disco/` | Rebuild them                                | Both are unlinked 2024 archives superseded by the homepage sections.                                                                                                                           |
| D14 | Reimplement the layout from measured tokens    | Port Zugan theme files                      | The client's content and photos are theirs and carry over; the commercial theme's source does not need to come with them. Also produces ~40 KB of purpose-built CSS instead of 47 stylesheets. |
| D15 | Fix heading hierarchy and alt text             | Reproduce the current markup exactly        | "Same design" means the same _visual result_. Copying an `<h1>` on a concert date and 82 empty `alt` attributes would be copying defects. Visual output is unchanged.                          |

---

## Open questions for the client

Tracked as task 1.6.

1. **Contact form destination** — which email address should enquiries go to?
2. **Higher-resolution album covers** — several are only ~300 px wide.
3. **Photographer credits** — the 12 gallery portraits are uncredited; if commissioned, crediting is often contractual.
4. **Alt text** — help describing the 12 portraits (Claude can draft; the client should confirm).
5. **Google Search Console** — is there existing access to hand over? Needed to monitor the cutover.
6. **Analytics** — is visitor data wanted at all? Cloudflare Web Analytics is free and cookieless; the alternative is nothing, which is also fine.
7. **Repertoire accuracy** — the repertoire lists are long and were last edited some time ago. Worth a review while everything is being touched anyway.
8. **Domain email** — does email run through this domain? Determines how careful R1 has to be (assume yes until confirmed).
