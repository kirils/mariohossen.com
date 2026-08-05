/// <reference types="@cloudflare/workers-types" />
import { z } from 'zod'

/**
 * Cloudflare Pages Function — receives the contact form's POST from ContactForm.astro. Runs on
 * Cloudflare's edge runtime, not Node: no `fs`, no `process.env`. Secrets come only from the
 * `env` binding, set as encrypted Cloudflare Pages environment variables (see
 * docs/plan/06-deployment-dns.md) — never in git, never in the client bundle.
 *
 * Handles two request shapes from the same markup:
 *  - A plain browser form POST (`Accept: text/html`) — task 6.6, must work with JS disabled.
 *  - The progressive-enhancement fetch() in ContactForm.astro (`Accept: application/json`),
 *    which shows the aria-live success/error states from task 6.7 without a page navigation.
 *
 * Fallback if Resend's domain verification stalls: swap the `sendViaResend` call below for
 * Web3Forms (free, no domain verification) — see the "Contact form" section of
 * docs/plan/02-architecture.md for the trade-off. Documented per task 6.9.
 */

interface Env {
  RESEND_API_KEY?: string
  CONTACT_TO_EMAIL?: string
  CONTACT_FROM_EMAIL?: string
  TURNSTILE_SECRET_KEY?: string
}

const ContactSchema = z.object({
  name: z.string().trim().min(1, 'Please enter your name.').max(200),
  email: z.email('Please enter a valid email address.'),
  subject: z.string().trim().min(1, 'Please enter a subject.').max(200),
  message: z.string().trim().min(1, 'Please enter a message.').max(5000),
  // Honeypot (ContactForm.astro's hidden "website" field) — real visitors never fill it in.
  website: z.string().optional(),
  // JS-only: ms epoch stamped when the form rendered, used for the minimum-submit-time check.
  // Absent when JS is disabled — that case skips the check rather than blocking a real visitor.
  formLoadedAt: z.string().optional(),
  'cf-turnstile-response': z.string().optional(),
})

// A submission faster than this is a bot filling every field in one pass, not a person reading
// and typing. Only enforced when formLoadedAt is present (see the schema comment above).
const MIN_SUBMIT_MS = 3000

function wantsJson(request: Request): boolean {
  return (request.headers.get('accept') ?? '').includes('application/json')
}

function jsonResponse(body: { ok: boolean; error?: string }, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

// Self-contained response page for the no-JS path — there is no server-rendered Astro page to
// redirect back into (the site is static output), so the Function renders its own minimal
// confirmation, styled to match rather than dropping the visitor onto a bare browser error page.
function htmlResponse(message: string, ok: boolean, status: number): Response {
  const heading = ok ? 'Message sent' : 'Something went wrong'
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${heading} — Mario Hossen</title>
<style>
  body { background:#000; color:#bbb; font-family:system-ui,sans-serif; display:flex;
    min-height:100vh; align-items:center; justify-content:center; text-align:center; padding:2rem; }
  main { max-width:32rem; }
  h1 { color:#fff; font-weight:700; font-size:1.5rem; margin-bottom:1rem; }
  a { color:#B09153; }
</style>
</head>
<body>
<main>
  <h1>${heading}</h1>
  <p>${message}</p>
  <p><a href="/#contact">Back to the contact form</a></p>
</main>
</body>
</html>`
  return new Response(html, { status, headers: { 'content-type': 'text/html; charset=utf-8' } })
}

function respond(request: Request, ok: boolean, message: string, status: number): Response {
  if (wantsJson(request)) return jsonResponse({ ok, error: ok ? undefined : message }, status)
  return htmlResponse(message, ok, status)
}

// Verified only when a token is present. Turnstile's widget needs JavaScript to run its
// challenge and produce a token at all — requiring one unconditionally would reject every
// no-JS submission outright, which breaks task 6.6. When the client hasn't set
// PUBLIC_TURNSTILE_SITE_KEY yet, or the visitor's browser never loaded the widget, this is
// skipped and the submission falls back to the honeypot + minimum-submit-time checks instead.
async function verifyTurnstile(token: string, secret: string, ip: string | null): Promise<boolean> {
  const body = new URLSearchParams({ secret, response: token })
  if (ip) body.set('remoteip', ip)

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  })
  const result = (await res.json()) as { success: boolean }
  return result.success
}

async function sendViaResend(env: Env, fields: z.infer<typeof ContactSchema>): Promise<void> {
  const from = env.CONTACT_FROM_EMAIL ?? 'Mario Hossen Website <onboarding@resend.dev>'
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [env.CONTACT_TO_EMAIL],
      reply_to: fields.email,
      subject: `[Website] ${fields.subject}`,
      text: `From: ${fields.name} <${fields.email}>\n\n${fields.message}`,
    }),
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Resend rejected the message (${res.status}): ${detail}`)
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const raw = Object.fromEntries((await request.formData()).entries())
  const parsed = ContactSchema.safeParse(raw)

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Please check the form and try again.'
    return respond(request, false, message, 400)
  }
  const fields = parsed.data

  // Silently accept-and-drop suspected spam rather than telling the sender what tripped the
  // filter — a generic "thanks" response gives a bot nothing to adapt against.
  const looksLikeSpam =
    Boolean(fields.website) ||
    (fields.formLoadedAt !== undefined && Date.now() - Number(fields.formLoadedAt) < MIN_SUBMIT_MS)
  if (looksLikeSpam) {
    return respond(request, true, 'Thanks for reaching out — I will get back to you soon.', 200)
  }

  const turnstileToken = fields['cf-turnstile-response']
  if (turnstileToken && env.TURNSTILE_SECRET_KEY) {
    const verified = await verifyTurnstile(
      turnstileToken,
      env.TURNSTILE_SECRET_KEY,
      request.headers.get('cf-connecting-ip')
    )
    if (!verified) {
      return respond(request, false, 'Verification failed — please try again.', 422)
    }
  }

  if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL) {
    console.error('contact function: RESEND_API_KEY or CONTACT_TO_EMAIL not configured')
    return respond(
      request,
      false,
      'The contact form is not set up yet — please email directly instead.',
      500
    )
  }

  try {
    await sendViaResend(env, fields)
  } catch (err) {
    console.error('contact function: Resend send failed', err)
    return respond(request, false, 'Could not send your message — please try again shortly.', 502)
  }

  return respond(request, true, 'Thanks for reaching out — I will get back to you soon.', 200)
}
