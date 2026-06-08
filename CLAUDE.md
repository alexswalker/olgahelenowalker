# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A single-page static professional bio at https://olgahelenowalker.com/ (Olga Heleno Walker, MBACP Integrative Child & Adolescent Psychotherapist, serving York & Harrogate, North Yorkshire). Served as plain files from GitHub Pages — no framework, no build step, no JavaScript, no tests. `CNAME` points the apex domain at GitHub Pages and `.nojekyll` disables Jekyll processing. DNS for the domain is managed by **Cloudflare**.

**The apex `olgahelenowalker.com` is canonical.** GitHub Pages 301-redirects `www` → apex, so every self-referencing URL in the repo (canonical tag, Open Graph, Twitter, JSON-LD `url`/`image`, `sitemap.xml`, `robots.txt` `Sitemap:`, `llms.txt`, `.well-known/security.txt`) must use the bare apex — never `www.`. When adding any new self-link, use `https://olgahelenowalker.com/…`.

The site is a structured, LLM-friendly source of truth about Olga. It is currently **bio-first**: it establishes who she is, her training and her credentials. The intended evolution (H2 2026) is toward **enquiries** for a private practice — adding Services, Fees and (optionally) an enquiry form. See `docs/superpowers/specs/` for the design.

## Architecture

Everything user-facing lives in `index.html`. It contains:

1. `<head>` metadata: canonical URL, Open Graph, Twitter card, `theme-color` (light + dark).
2. **Schema.org JSON-LD**: a `ProfilePage` whose `mainEntity` is the `Person` (Olga), tuned for local discovery — `jobTitle`, `memberOf` (BACP), `alumniOf`, `hasCredential`, `knowsAbout`, and `areaServed` (York, Harrogate, North Yorkshire).
3. Inline CSS with `:root` custom properties and a `prefers-color-scheme: dark` override. Palette is warm & calming (cream paper, muted sage accent `--accent: #4f6a55`). Self-hosted fonts (`DM Sans`, `DM Serif Display`) are preloaded from `fonts/` and declared via `@font-face` — do not pull from Google Fonts.
4. Body sections (in order): hero, About, Approach, Background (timeline), Qualifications & Membership, Contact, footer.

Supporting files that move in lockstep with `index.html`:

- **`llms.txt`** — plain-text mirror of the bio for LLM crawlers. Keep in sync with any HTML change that adds/removes a section or materially changes the copy.
- **`sitemap.xml`** — single-URL sitemap. Bump `<lastmod>` to today on any content change.
- **`robots.txt`** — allow-lists AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.). The posture is to be maximally indexable, including by LLMs.
- **`photo.jpg` + `photo.webp`** — served via `<picture>` with WebP source and JPEG fallback (generated from a square source headshot). If the headshot changes, regenerate both.
- **`.well-known/security.txt`**, `favicon.svg`, `404.html` — static assets, edit in place.

## Common tasks

**Bump all three "last modified" markers on every content change to `index.html`.** Non-negotiable — they exist for SEO, LLM crawlers, and visible recency:

1. `sitemap.xml` → `<lastmod>` (search engines)
2. `index.html` JSON-LD → `ProfilePage` `"dateModified"` (LLM/structured-data crawlers)
3. `index.html` footer → `<time datetime="…">…</time>` "Last updated" line (human-visible)

All three to today's date, in the same commit as the content change. If you're not changing user-visible content (e.g. editing CLAUDE.md or comments), leave them alone.

**Add/confirm contact details.** Contact is currently a placeholder pending Olga's decision on which email/phone to use. The Contact section in `index.html` has a commented-out `contact-links` block (mailto/tel) ready to fill — un-comment, drop in the confirmed details, replace the `contact-note`, then bump the three date markers.

**Evolve toward a practice site (Phase 2).** Insert `Services` and `Fees` sections between Approach and Background; optionally add an enquiry form (GitHub Pages has no backend — use a third-party handler such as Formspree, and mind GDPR for sensitive data). Consider upgrading the JSON-LD with a `LocalBusiness`/health-practitioner entity (`address`, `geo`, `makesOffer`).

**Run an SEO/GEO audit.** A read-only MCP server, **`specification`** (https://specification.website), exposes `mcp__specification__*` tools — use it when auditing/optimising. Most relevant categories: **seo** (canonical/redirect consistency, headings), **agent-readiness** (stable URLs), **accessibility** (descriptive link text, reduced motion). Header-based items below can be satisfied via Cloudflare.

**HTTP security headers (Cloudflare).** Because DNS is on Cloudflare, the header-based spec items GitHub Pages can't set *can* be met here once records are Proxied (orange cloud): `Strict-Transport-Security` (HSTS) and `X-Content-Type-Options: nosniff` from SSL/TLS → Edge Certificates; `Content-Security-Policy: frame-ancestors 'none'` + `X-Frame-Options: DENY` via a Transform Rule. Target config:

```
strict-transport-security: max-age=15552000; includeSubDomains
x-content-type-options: nosniff
content-security-policy: frame-ancestors 'none'
x-frame-options: DENY
```

Verify after setup: `curl -sSI https://olgahelenowalker.com/ | grep -iE 'strict-transport|x-content-type|x-frame|content-security'`.

**Local preview.** No build step. Open `index.html` directly, or:
```bash
python3 -m http.server 8000
```

## Conventions

- **Commits** use Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`). Keep messages short and content-focused.
- **Deploy** is implicit: pushing to `main` publishes via GitHub Pages.
- **No dependencies, no package manager, no build pipeline.** Don't introduce a framework or JS bundler without an explicit request — the site's value includes being trivially crawlable and zero-JS.
- **Tone for Olga's copy:** warm, plain, reassuring, non-clinical; written for parents seeking help for a child. Currently third person; first person ("I…") is a reasonable switch for the practice phase. Olga reviews and edits all bio copy.

## Where to look

- `docs/superpowers/specs/` — the design spec for this site (purpose, structure, phases, hosting/DNS steps).
