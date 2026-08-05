---
name: deploy-ops
description: Deployment and operations for mariohossen.com — Cloudflare Pages setup, environment variables and secrets, redirects, the DNS cutover from Hostinger, rollback procedures, and post-launch checks. Use when deploying, configuring hosting, publishing changes, diagnosing a failed build, or running the go-live.
---

# Deployment & operations

Cloudflare Pages, static output, git-push deploys. Full runbook:
[docs/plan/06-deployment-dns.md](../../../docs/plan/06-deployment-dns.md).

## The one thing to keep in mind

**The original WordPress site is live and serving real visitors.** Nothing in Part 1 below touches
it. Only the DNS cutover does, and that step is reversible in about five minutes if the TTL was
lowered first.

## Part 1 — Deploy (zero risk)

### How it's actually deployed — not the dashboard's "Connect to Git"

The Pages project `mariohossen-com` is deployed by
`.github/workflows/deploy-cloudflare-pages.yml`: GitHub Actions builds the site (`npm ci && npm
run build`) and runs `wrangler pages deploy dist` on every push to **`master`**, authenticated
with a scoped `CLOUDFLARE_API_TOKEN` repo secret + `CLOUDFLARE_ACCOUNT_ID` repo variable — **not**
Cloudflare's own git integration. Cloudflare's dashboard build settings (build command / output
directory / Node version) are irrelevant as a result; GitHub Actions reads `.nvmrc` (22) via
`actions/setup-node`. Full reasoning: `PROGRESS.md`'s Phase 6/9 log entries.

Practical difference from the plan below: no automatic PR preview URLs (a native-git-integration
feature this setup doesn't have), and "check the Pages dashboard for a failed build" means
checking the **GitHub Actions** run instead — Cloudflare only ever sees a finished `dist/`, it
never runs the build itself.

Three real gotchas if this workflow ever needs rebuilding from scratch — all cost real time once
already, all documented with the exact fix in
[docs/plan/06-deployment-dns.md § Cloudflare Pages](../../../docs/plan/06-deployment-dns.md):
`cloudflare/wrangler-action`'s default wrangler version conflicts with this repo's
`@cloudflare/workers-types`; Cloudflare's auto-generated onboarding token silently can't read
Pages projects (looks valid, isn't) — a token from **API Tokens → Create Token** works; and
account signup also silently installs a **"Cloudflare Workers and Pages" GitHub App** wired to a
separate, unused "Workers Builds" CI feature, which fails on every push with an invalid token and
leaves a red X on every commit — uninstall the app (don't fix its token, that would turn on a
second, competing deploy mechanism this project deliberately doesn't use).

### Environment variables — two different places now

Because GitHub Actions builds the site (not Cloudflare), a variable needed at _build_ time and one
needed at _request_ time no longer live in the same place.

**Cloudflare dashboard → Pages project → Settings → Environment variables** — read at request
time by `functions/api/contact.ts`, so it doesn't matter that Cloudflare didn't build the site:

| Name                   | Encrypted |
| ---------------------- | --------- |
| `RESEND_API_KEY`       | **yes**   |
| `TURNSTILE_SECRET_KEY` | **yes**   |
| `CONTACT_TO_EMAIL`     | no        |

**GitHub repo → Settings → Secrets and variables → Actions** — needed at _build_ time, since
`PUBLIC_TURNSTILE_SITE_KEY` becomes part of the static HTML via `import.meta.env`:

| Name                        | Type                                    |
| --------------------------- | --------------------------------------- |
| `PUBLIC_TURNSTILE_SITE_KEY` | secret (not sensitive, kept consistent) |
| `CLOUDFLARE_API_TOKEN`      | secret — scoped, see the gotcha above   |
| `CLOUDFLARE_ACCOUNT_ID`     | variable — not sensitive                |

Once `PUBLIC_TURNSTILE_SITE_KEY` exists, it also needs adding to the `npm run build` step's `env:`
in `deploy-cloudflare-pages.yml` — omitted today since the value doesn't exist yet (task 6.5).

Rules:

- Secrets **never** enter git, `.env` files that get committed, or the client bundle.
- Only `PUBLIC_`-prefixed variables may reach the browser.
- Encrypted values are **write-only** — you cannot read them back. Store them in a password
  manager and hand them to the client, or they are unrecoverable when someone else takes over.

## Part 2 — DNS cutover

Only after the client has signed off on the `.pages.dev` preview.

### Hard prerequisites ⚠

Do not start without all three:

1. **TTL lowered to 300 s at least 24 hours in advance.** This is what makes rollback take five
   minutes instead of four hours. The old TTL must expire from resolver caches before the new
   value means anything, so the 24 hours cannot be compressed.
2. **A full WordPress backup — files and database — downloaded off Hostinger and actually opened
   to confirm it is not a zero-byte file.** Hostinger's own backups are fine but do not count as
   verified until one is on your own disk.
3. **The email DNS records recorded.** `MX`, SPF `TXT`, DKIM, `autodiscover`. Screenshot the full
   zone file.

### On email — the highest-impact risk

If mail for `mariohossen.com` runs through the DNS zone being moved, missing one record means the
client **silently stops receiving email** while the website looks perfect. Nobody notices for
hours, and by then senders have already got bounces.

- Verify Cloudflare's imported zone against your screenshot, record by record. Its auto-scan is
  good, not guaranteed complete.
- After cutover, **send a real email to an address on the domain and confirm it arrives.** This
  check is not optional and it is the one people forget.

### Sequence

1. Add the site to Cloudflare (Free plan); it scans and imports the existing zone.
2. **Verify the imported records against the screenshot** — especially `MX`, SPF, DKIM.
3. Update nameservers at the registrar.
4. Add `mariohossen.com` and `www.mariohossen.com` as custom domains on the Pages project.
5. Keep **`www` as canonical** — the current site uses it, and changing now discards accumulated
   SEO signal for no benefit.

### Post-cutover checks

```bash
for u in / /contact/ /imprint/ /privacy/ /events/ /mario-hossen-disco/ /cookie-policy-eu/; do
  echo "$u -> $(curl -s -o /dev/null -w '%{http_code}' https://www.mariohossen.com$u)"
done
curl -sI https://mariohossen.com | grep -i location        # apex → www
curl -s https://www.mariohossen.com/ | grep -c album-card  # expect 21
curl -sI https://www.mariohossen.com/sitemap-index.xml | head -1
```

- [ ] All pages 200
- [ ] Old URLs 301, **nothing 404s**
- [ ] Apex redirects to `www`, SSL valid
- [ ] All 21 albums and 12 photos in the initial HTML
- [ ] **Contact form delivers a real email**
- [ ] **A test email to the domain arrives** ← the mail check
- [ ] Sitemap reachable

## Redirects

`public/_redirects` — nothing from the old sitemap may 404:

```
/events/               /#concerts     301
/mario-hossen-disco/   /#recordings   301
/cookie-policy-eu/     /privacy/      301
/blog1/                /              301
/blog2/                /              301
/blog3/                /              301
/blog4/                /              301
/category/*            /              301
/feed/                 /              301
```

## Rollback

| Situation                        | Action                                        | Recovery                    |
| -------------------------------- | --------------------------------------------- | --------------------------- |
| Problem after DNS moved          | Point `A`/`CNAME` back to the Hostinger IP    | **~5 min** (with 300 s TTL) |
| Cloudflare itself is the problem | Restore original nameservers at the registrar | 1–24 h                      |
| Bad content deploy, DNS fine     | `git revert HEAD && git push`                 | ~2 min                      |
| Need the exact previous build    | Pages → Deployments → **Rollback**            | ~30 s                       |

WordPress stays untouched on Hostinger throughout. Rollback is a DNS change, not a restore.

**Keep Hostinger live for 30 days after cutover**, then cancel.

## Routine publishing

```bash
npm run verify          # must pass first
git add -A && git commit -m "content: add Vienna concert 12 September 2026"
git push
```

GitHub Actions builds and `wrangler` deploys — a couple of minutes end to end. No automatic PR
preview URLs (see the note under Environment variables above); `gh run watch` or the Actions tab
shows progress.

## When a build fails

**The live site is untouched** — `npm run build` failing in GitHub Actions means the workflow
never reaches the `wrangler pages deploy` step at all. There is no partial or broken state to
clean up.

Read the error in the GitHub Actions run (`gh run view <id> --log-failed`, or the Actions tab); it
names the file and field. Most failures are content-schema violations — fix the content, never
the schema. See the
`content-editing` skill.

## Monitoring

- **Google Search Console** — submit the sitemap at cutover, watch coverage for two weeks
- **Cloudflare Web Analytics** — free, cookieless, optional; enabling it does _not_ re-introduce
  a cookie-banner requirement
- **Cloudflare Pages dashboard** — build history and one-click rollback

## Do not

- Add third-party scripts (analytics, chat, embeds) — that re-introduces the cookie banner the
  rebuild removes
- Commit secrets, or move a secret out of Cloudflare into the repo
- Change the canonical host from `www` without a deliberate SEO decision
- Cancel Hostinger before the 30-day window is up
- Touch DNS without the TTL lowered and the backup verified
