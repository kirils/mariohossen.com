# 06 — Deployment & DNS Cutover

The site is live and serving real visitors. This runbook is written so the cutover is
**reversible at every step** and the worst case is a few minutes of stale content, never an
outage.

---

## Part 1 — Deploy (no DNS change, zero risk)

Nothing here touches the live site. The WordPress site keeps serving `mariohossen.com`
throughout.

### 1. Repository

```bash
git init && git add . && git commit -m "feat: static rebuild of mariohossen.com"
gh repo create mariohossen-com --private --source=. --push
```

Private, because it contains the client's content and configuration.

### 2. Cloudflare Pages

**Actually done this way, not the dashboard's "Connect to Git":** `wrangler pages project create
mariohossen-com --production-branch master` created the project, and
`.github/workflows/deploy-cloudflare-pages.yml` (mirroring the existing GitHub Pages workflow)
builds and runs `wrangler pages deploy dist` on every push to `master`. Cloudflare's dashboard
build config (build command / output directory / Node version) is irrelevant here — GitHub
Actions builds the site, wrangler only uploads the finished `dist/` plus the `functions/`
bundle. Reasoning recorded in `PROGRESS.md`'s Phase 6 log.

Auth is a Cloudflare API token, **not** the account's own login — `CLOUDFLARE_API_TOKEN` (repo
secret) + `CLOUDFLARE_ACCOUNT_ID` (repo variable, not secret — it's not sensitive).

> **Three real gotchas hit while setting this up, worth knowing if this ever needs redoing:**
>
> 1. `cloudflare/wrangler-action@v3` defaults to installing wrangler 3.90.0, which has a peer
>    dependency on `@cloudflare/workers-types@^4` — conflicts with the `^5` this repo uses for
>    `functions/api/contact.ts`'s types (task 6.1) and fails the install with `ERESOLVE`. Fixed by
>    pinning `wranglerVersion: 4.119.0` in the workflow (matching the version used locally).
> 2. A **custom API token** returns a generic `Authentication error [code: 10000]` on
>    `/accounts/{id}/pages/projects` if it's the wrong token — including Cloudflare's own
>    auto-generated onboarding token from account signup, which looks valid (`/user/tokens/verify`
>    reports it active) but can't actually read Pages projects. A token created explicitly via
>    **API Tokens → Create Token → "Edit Cloudflare Workers" template** worked immediately. If
>    this error reappears, verify directly with `curl -H "Authorization: Bearer $TOKEN"` against
>    `https://api.cloudflare.com/client/v4/accounts/{id}/pages/projects` — it isolates the token
>    from any GitHub Actions/wrangler-action noise.
> 3. Account signup also silently installs the **"Cloudflare Workers and Pages" GitHub App** on
>    the repo, wired to Cloudflare's own separate "Workers Builds" CI feature — nothing we set up
>    or use. It auto-triggers a `Workers Builds: mariohossen-com` check on every push, using a
>    build token that's invalid from the start (same root cause as #2 — an onboarding-created
>    credential that doesn't actually work), so it fails every single time and leaves a red X on
>    every commit. The Pages project's own git integration is unaffected — checking it still
>    correctly reports `Git Provider: No` — this is a second, independent integration layered on
>    top by the GitHub App, not the same thing. Fix: **uninstall the
>    GitHub App** (`github.com/settings/installations` → Cloudflare Workers and Pages → Configure
>    → Uninstall) rather than fixing its token — regenerating the token would make Cloudflare's
>    own git-based builds start actually running, which is exactly the second, competing deploy
>    mechanism this project deliberately avoided by choosing GitHub Actions + `wrangler` in the
>    first place.

### 3. Environment variables

Two different places, because the build now happens in GitHub Actions, not Cloudflare's own build
— see the note in step 2:

**Cloudflare dashboard → Pages project → Settings → Environment variables** (read at request time
by `functions/api/contact.ts`, so dashboard-set values apply regardless of how the deploy got
there):

| Name                   | Value                        | Encrypted |
| ---------------------- | ---------------------------- | --------- |
| `RESEND_API_KEY`       | from resend.com              | **yes**   |
| `CONTACT_TO_EMAIL`     | client's destination address | no        |
| `TURNSTILE_SECRET_KEY` | from Cloudflare Turnstile    | **yes**   |

**GitHub repo → Settings → Secrets and variables → Actions** (needed at _build_ time, since
`PUBLIC_TURNSTILE_SITE_KEY` becomes part of the static HTML via `import.meta.env` —
Cloudflare-dashboard-only values never reach a build that happens outside Cloudflare):

| Name                        | Value                     | Type                                   |
| --------------------------- | ------------------------- | -------------------------------------- |
| `PUBLIC_TURNSTILE_SITE_KEY` | from Cloudflare Turnstile | secret (not sensitive, but consistent) |

Once that secret exists, add `env: { PUBLIC_TURNSTILE_SITE_KEY: ${{ secrets.PUBLIC_TURNSTILE_SITE_KEY }} }`
to the `npm run build` step in `deploy-cloudflare-pages.yml` — omitted for now since the value
doesn't exist yet (task 6.5, blocked on a Turnstile account).

> Encrypted values are write-only — you cannot read them back. Store them in a password manager
> and hand them to the client, or they will be unrecoverable when someone else takes over.

### 4. Verify on the preview URL

The site is live at `https://mariohossen-com.pages.dev` with no DNS change — verified: all pages
`200`, unknown paths `404`, `functions/api/contact.ts` live (honeypot, validation, and the no-JS
HTML response path all confirmed against the real deployment, not just `wrangler pages dev`
locally).

Every push to `master` deploys production via the GitHub Actions workflow above; there are no
automatic PR preview URLs the way Cloudflare's native git integration would give — a real
trade-off of the GitHub-Actions-driven approach, acceptable since PR-based review isn't part of
this project's workflow.

**Client review happens here** (task 9.4) — on their phone, on their laptop, every section.

---

## Part 2 — DNS cutover

Only start once Part 1 is signed off.

### T-minus 7 days

- [ ] Client has reviewed and approved the `.pages.dev` site
- [ ] Contact form tested end to end — a real submission arrived in a real inbox
- [ ] `_redirects` covers every old URL (task 9.5)
- [ ] Record current DNS: `dig mariohossen.com A +short`, `dig www.mariohossen.com +short`, and screenshot the full zone file at Hostinger

### T-minus 24 hours ⚠

- [ ] **Lower the TTL** on the existing `A`/`CNAME` records to **300 seconds** at the current DNS provider.

  This is the step that makes rollback fast. If TTL is left at 14400, a mistake takes **4 hours**
  to undo instead of 5 minutes. Do not skip it, and do not compress the 24 hours — the old TTL
  has to expire from resolver caches before the new one means anything.

- [ ] **Take a full WordPress backup** — files _and_ database, downloaded off Hostinger, and
      actually opened to confirm it is not a zero-byte file. Hostinger's own backups are fine but do
      not count as verified until you have one on your own disk.
- [ ] Note the **email DNS records** (`MX`, SPF `TXT`, DKIM, `autodiscover`). If mail for the
      domain runs through the current DNS zone, these must be carried over **exactly** or the client
      stops receiving email. This is the single most common way a website migration causes real
      damage — the website is fine and the mail silently dies.

### Cutover

1. **Add the domain to Cloudflare** — Add Site → `mariohossen.com` → Free plan. Cloudflare scans
   the existing zone and imports the records.
2. **Verify the imported zone against your screenshot.** Especially `MX`, SPF, DKIM. Cloudflare's
   scan is good but not guaranteed complete.
3. **Update the nameservers** at the registrar to the two Cloudflare nameservers.
4. **Add custom domains** in the Pages project: `mariohossen.com` and `www.mariohossen.com`.
   Cloudflare creates the `CNAME`/`A` records and issues SSL automatically.
5. **Choose canonical host.** The current site uses `www`. Keep `www` as canonical and redirect
   the apex — changing it now would throw away accumulated SEO signal for no benefit.
6. **Wait for propagation** — usually minutes, up to 24 h for nameserver changes.

### Immediately after

```bash
for u in / /contact/ /imprint/ /privacy/ /events/ /mario-hossen-disco/ /cookie-policy-eu/; do
  echo "$u -> $(curl -s -o /dev/null -w '%{http_code}' https://www.mariohossen.com$u)"
done
curl -sI https://mariohossen.com | grep -i location      # apex → www
curl -s https://www.mariohossen.com/ | grep -c album-card # expect 21
curl -sI https://www.mariohossen.com/sitemap-index.xml | head -1
```

- [ ] All pages 200
- [ ] Old URLs 301, none 404
- [ ] Apex redirects to `www`
- [ ] SSL valid, padlock clean
- [ ] **Send a real contact-form message and confirm it arrives**
- [ ] **Send a test email _to_ the client's domain address and confirm it arrives** — this is the mail check, and it is the one people forget
- [ ] Sitemap reachable

### Within 48 hours

- [ ] Submit `sitemap.xml` in Google Search Console
- [ ] Request re-indexing of the homepage
- [ ] Raise TTL back to 3600 s once stable
- [ ] Enable Cloudflare Web Analytics (optional, cookieless)

### After 30 days

- [ ] Search Console shows no crawl errors and coverage is stable or improved
- [ ] **Then** cancel the Hostinger plan

---

## Rollback

At any point before the Hostinger plan is cancelled:

| Situation                                              | Action                                                                     | Time to recover                      |
| ------------------------------------------------------ | -------------------------------------------------------------------------- | ------------------------------------ |
| Something wrong, DNS already moved                     | Point the `A`/`CNAME` back to the Hostinger IP in the Cloudflare dashboard | **~5 min** (thanks to the 300 s TTL) |
| Nameservers moved and Cloudflare itself is the problem | Restore the original nameservers at the registrar                          | 1–24 h                               |
| Bad content deploy, DNS fine                           | `git revert HEAD && git push`                                              | ~2 min (Pages rebuild)               |
| Need the exact previous build                          | Cloudflare Pages → Deployments → **Rollback** on the last good one         | ~30 s                                |

The WordPress site stays untouched and running on Hostinger the whole time. Rollback is a DNS
change, not a restore.

---

## Ongoing operations

**Deploying a change** — the client asks Claude for an edit; Claude commits and pushes; Cloudflare
builds and deploys in ~60 seconds. No FTP, no dashboard, no plugin updates.

**If a build fails** the live site is _untouched_ — Cloudflare only swaps in a successful build.
The failure shows in the Pages dashboard and in the GitHub Actions check on the commit, naming
the file and field.

**Maintenance load:** effectively zero. There is no CMS to patch, no plugins to update, no PHP
version to chase. An `npm update` once or twice a year is enough, and even skipping it does not
create a security exposure — nothing executes at request time except the contact function.
