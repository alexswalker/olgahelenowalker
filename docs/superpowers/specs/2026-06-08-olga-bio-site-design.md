# Olga Heleno Walker — Bio Site Design

**Date:** 2026-06-08
**Domain:** https://olgahelenowalker.com (apex canonical)
**Repo:** `alexswalker/olgahelenowalker` (public, GitHub Pages)
**Status:** Approved direction; pending spec review before scaffolding.

## Purpose

A single-page static professional bio for **Olga (Hay) Heleno Walker — MBACP Integrative
Child & Adolescent Psychotherapist**, based in North Yorkshire (serving York & Harrogate).

Phase 1 (now): a **bio-first** site that establishes who Olga is, her training, and her
credentials, with simple contact details. Olga is still in a salaried role, so this is a
presence/credibility page, not yet a marketing funnel.

Phase 2 (H2 2026): **evolve toward enquiries** — add Services, Fees, and optionally an
enquiry form — as she opens her private practice. The Phase 1 structure is designed so
these slot in without a rebuild.

## Technical foundation

Cloned from the proven `alexwalker.net` stack — deliberately identical so it is trivially
crawlable and zero-maintenance:

- Single `index.html` (~all user-facing content), inline CSS, **no JavaScript, no build step**.
- Served as static files from **GitHub Pages**; push to `main` deploys.
- Self-hosted fonts (`DM Sans`, `DM Serif Display`) preloaded from `fonts/` via `@font-face`
  — no Google Fonts.
- Headshot via `<picture>`: `photo.webp` (source) + `photo.jpg` (fallback), generated from
  `olga/olga-headshot.jpeg`.
- Supporting files: `llms.txt`, `sitemap.xml`, `robots.txt` (allow-lists AI crawlers),
  `.well-known/security.txt`, `favicon.svg`, `404.html`, `.nojekyll`, `CNAME`.
- `CLAUDE.md` adapted from Alex's repo (same "bump the three date markers" discipline,
  apex-canonical rule, press/timeline maintenance guidance).

**Apex `olgahelenowalker.com` is canonical.** Every self-referencing URL (canonical tag,
Open Graph, Twitter, JSON-LD `url`/`image`, `sitemap.xml`, `robots.txt`, `llms.txt`) uses the
bare apex — never `www.` — to match the GitHub Pages `www → apex` 301 redirect.

## Visual identity

Same clean layout and typography as Alex's site, but a **warm & calming** palette suited to
a child & adolescent therapist and the parents who are the primary audience:

- Paper: soft warm neutral (cream/sand) in light mode; deep warm charcoal in dark mode.
- Accent: a single muted, reassuring tone — **sage green** (with terracotta as a possible
  alternate) — used sparingly for links/labels.
- Generous whitespace; DM Serif Display for headings, DM Sans for body.
- Respect `prefers-color-scheme` (light + dark) and `prefers-reduced-motion`.

## Page structure (sections, in order)

1. **Hero** — name; "MBACP Integrative Child & Adolescent Psychotherapist"; location line
   (*York & Harrogate, North Yorkshire*); headshot; one-line tagline.
2. **About** — who Olga is and her integrative, child-centred ethos.
3. **Approach** — how she works: integrative, mindfulness-informed; children & adolescents
   (~ages 4–18). A gentle precursor to a future Services section.
4. **Background** (Timeline, newest first):
   - School Counsellor, St Aidan's CofE High School, Harrogate — 2025–present
   - Level 7 PG Diploma in Counselling & Psychotherapy for Children & Young People —
     Place2Be, 2023–2025
   - School Counsellor, AIM Academies Trust — 2023–2025 (primary 4–11, secondary 11–18)
   - Level 3 Certificate & Level 2 Award, Counselling Skills for Working with Children —
     Place2Be, 2022
   - Mindfulness-Based Cognitive Therapy (MBCT) — Oxford Mindfulness Foundation
   - Head of People, Expert Edge / Amazon Experts (now Havas Market) — 2018–2021
5. **Qualifications & Membership** — MBACP (member of BACP), Level 7 Diploma, University of
   East London. Prominent: trust signals are decisive in therapy.
6. **Contact** — email + phone links (`mailto:` / `tel:`, zero JS, no data handling),
   areas served (York, Harrogate; in-person and/or online).
7. **Footer** — "Last updated" `<time>` + BACP registration note.

Phase 2 inserts **Services** and **Fees** between Approach and Background, and optionally an
enquiry form in Contact (via a third-party handler such as Formspree, since GitHub Pages has
no backend) — noted in `docs/` backlog, not built now.

## Structured data (JSON-LD)

`ProfilePage` whose `mainEntity` is a `Person`, tuned for **local discovery**:

- `name`, `jobTitle` ("Integrative Child & Adolescent Psychotherapist"), `image`, `url`.
- `memberOf` → BACP (British Association for Counselling and Psychotherapy).
- `alumniOf` → University of East London; `hasCredential` for the Place2Be Level 7 Diploma.
- `knowsAbout` → child psychotherapy, adolescent counselling, integrative therapy,
  mindfulness-based approaches.
- `areaServed` → York, Harrogate, North Yorkshire.
- `dateModified` on the `ProfilePage` (one of the three date markers to keep in sync).

Upgrade path: when the practice launches, add a `LocalBusiness` / health-practitioner entity
with `address`, `geo`, and `makesOffer`.

## Date-marker discipline (carried over from Alex's repo)

On every content change to `index.html`, bump all three to the same date:
1. `sitemap.xml` `<lastmod>`
2. `index.html` JSON-LD `ProfilePage` `dateModified`
3. `index.html` footer `<time datetime="…">` "Last updated" line

## Setup steps (hosting & domain — partly user-driven)

1. **Create repo** `alexswalker/olgahelenowalker` (public). *(May require a token with repo
   scope; if the Codespaces token can't, create via github.com and push.)*
2. **Push** scaffolded site to `main`.
3. **Enable GitHub Pages**: Settings → Pages → deploy from `main` / root. Add custom domain
   `olgahelenowalker.com` (writes/uses the `CNAME` file) and enable "Enforce HTTPS".
4. **DNS at the registrar** for `olgahelenowalker.com`:
   - Apex `A` records → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
     `185.199.111.153` (GitHub Pages).
   - (Optional) `AAAA` records → GitHub's IPv6 set.
   - `www` `CNAME` → `alexswalker.github.io`.
5. **Verify** after propagation: `curl -sSI https://olgahelenowalker.com/` (200 + HTTPS),
   and `www → apex` 301.

## Out of scope (Phase 1)

- Enquiry form / backend / form handler.
- Fees and Services content.
- Edge security headers (HSTS, nosniff, frame-ancestors) — same GitHub Pages limitation as
  Alex's site; revisit if/when behind Cloudflare.
- Blog / articles / press.
