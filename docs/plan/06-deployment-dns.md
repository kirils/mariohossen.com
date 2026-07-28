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

Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**

| Setting           | Value           |
| ----------------- | --------------- |
| Production branch | `main`          |
| Build command     | `npm run build` |
| Output directory  | `dist`          |
| Node version      | `20` (`.nvmrc`) |

### 3. Environment variables

Cloudflare → Pages project → **Settings → Environment variables** (Production **and** Preview):

| Name                        | Value                        | Encrypted             |
| --------------------------- | ---------------------------- | --------------------- |
| `RESEND_API_KEY`            | from resend.com              | **yes**               |
| `CONTACT_TO_EMAIL`          | client's destination address | no                    |
| `TURNSTILE_SECRET_KEY`      | from Cloudflare Turnstile    | **yes**               |
| `PUBLIC_TURNSTILE_SITE_KEY` | from Cloudflare Turnstile    | no (public by design) |

> Encrypted values are write-only — you cannot read them back. Store them in a password manager
> and hand them to the client, or they will be unrecoverable when someone else takes over.

### 4. Verify on the preview URL

The site is now live at `https://mariohossen-com.pages.dev` with no DNS change.

Every push to `main` deploys production; every PR gets its own preview URL.

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
