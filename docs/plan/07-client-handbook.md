# 07 — Client Handbook (draft)

> This is the **specification** for the guide the client receives. The finished version ships as
> `docs/CLIENT-GUIDE.md` in task 8.2. It is written here in the voice it should be delivered in —
> no jargon, no assumed knowledge.

---

## Your website, in one paragraph

Your website is now a set of simple text files. When you want to change something, you tell
Claude in plain English — "add a concert in Vienna on 12 September" — and Claude makes the
change and publishes it. About a minute later it is live. There is no login to remember, no
plugins to update, and nothing that can be hacked.

---

## The one thing to know

**You cannot break the website.**

Before any change goes live, it is automatically checked. If something is wrong — a date typed
oddly, a missing photo, a required detail left out — the change is **rejected and your live site
stays exactly as it was**. You will see an error explaining what to fix. The site is never
half-broken.

---

## Getting started

1. Open **Terminal** on your computer.
2. Type `cd mariohossen.com` and press Enter.
3. Type `claude` and press Enter.
4. Type what you want in plain English.

That is the whole workflow.

---

## Things you will actually do

### Add a concert

> Add a concert: 12 September 2026, Vienna Austria, Musikverein Goldener Saal.
> Series is Paganini Ensemble Vienna. Performers: Mario Hossen violin, Julia Turnowsky viola.
> Programme: chamber music by Paganini. Tickets at https://example.com/tickets

You do not need to say where it goes in the list. **Concerts sort themselves by date**, and once
a concert is past it moves out of "upcoming" on its own. You never have to tidy the list.

### Change or cancel a concert

> Change the Vienna concert on 12 September — the venue is now Brahms-Saal.

> Remove the Sofia concert on 27 April.

### Add a new album

> Add a recording: Paganini, Violin Concerto No. 5, on the Dynamic label, 2026.
> The cover image is on my desktop as paganini-5.jpg. Listen link: https://...

Put the cover image file somewhere easy to find and say where it is. Claude handles resizing and
optimising.

### Add photos to the gallery

> Add these three photos to the gallery. They are in my Pictures folder,
> named concert-vienna-1.jpg through 3.jpg.

Claude will ask you to **describe each photo** in a few words. Please answer — that description
is what blind visitors hear, and it is how Google finds your pictures. The system will not accept
a photo without one.

### Edit the biography

> In my biography, change "more than 100 orchestras" to "more than 120 orchestras".

### Add a sheet-music edition

> Add an edition: Niccolò Paganini, Werke für Violine und Orchester Vol. IV,
> Besetzung Violine und Klavier, Herausgeber Mario Hossen / Musikverlag Doblinger.
> Cover is doblinger-vol4.jpg on my desktop. Link: https://...

### Update contact or partner details

> Change the Dynamic phone number to +39 010 1234567.

---

## Seeing a change before it goes live

> Show me the site before publishing.

Claude starts a preview at `http://localhost:4321` in your browser. Nothing is public yet. When
you are happy:

> Looks good, publish it.

---

## Undoing something

> Undo the last change.

Every version of the site is kept forever. You can go back to how it was last Tuesday, or last
year. Nothing is ever really lost.

---

## When something goes wrong

**"Claude said the build failed."**
Good — that is the safety net doing its job. Your live site is untouched. Show Claude the error
and say "fix this".

**"I published but the site looks the same."**
Wait a minute and refresh with `Cmd+Shift+R`. Publishing takes about 60 seconds.

**"I am not sure whether it worked."**

> Is the site up to date with my latest change?

---

## What needs a developer

Ask your developer for:

- Changing the **design** — colours, fonts, layout
- Adding a **new kind of section** (e.g. a press area, a video page)
- Anything involving the **domain name**, email, or the contact form
- Adding **YouTube or Spotify players** — these have privacy rules and must be set up correctly

Everything on the "things you will actually do" list above is yours.

---

## Why there is no cookie banner any more

The old site needed one because WordPress and its plugins stored data on visitors' computers.
The new site stores nothing, tracks nothing, and loads nothing from Google or Facebook. Under EU
law, no consent banner is needed when nothing is stored. Your Imprint page stays, because that is
required separately.

**If you ever want to embed a YouTube or Spotify player, tell your developer first** — done
naively it re-introduces tracking and would put the cookie banner back.

---

## What it costs

**€0 per month.** Hosting, security certificate, worldwide delivery and the contact form are all
on free plans that this site will not come close to outgrowing. The only bill is your domain name
renewal, which you already pay.

---

## Quick reference

| I want to…         | Say to Claude                                           |
| ------------------ | ------------------------------------------------------- |
| Add a concert      | "Add a concert: [date], [city], [venue], [details]"     |
| Cancel a concert   | "Remove the [city] concert on [date]"                   |
| Add an album       | "Add a recording: [composer], [title], cover is [file]" |
| Add photos         | "Add these photos to the gallery: [files]"              |
| Edit the biography | "In my biography, change X to Y"                        |
| Preview            | "Show me the site before publishing"                    |
| Publish            | "Publish the changes"                                   |
| Undo               | "Undo the last change"                                  |
| Check status       | "Is the site up to date?"                               |
