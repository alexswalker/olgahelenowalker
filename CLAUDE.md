# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A single-page static professional bio at https://olgahelenowalker.com/ (Olga Heleno Walker, MBACP Integrative Child & Adolescent Psychotherapist, serving York & Harrogate, North Yorkshire). Served as plain files from GitHub Pages — no framework, no build step. The page is essentially zero-JS, save for a single inline form handler powering the contact form; the only backend and the only tests live in a separate Cloudflare Worker (in `worker/`). `CNAME` points the apex domain at GitHub Pages and `.nojekyll` disables Jekyll processing. DNS for the domain is managed by **Cloudflare**.

**The apex `olgahelenowalker.com` is canonical.** GitHub Pages 301-redirects `www` → apex, so every self-referencing URL in the repo (canonical tag, Open Graph, Twitter, JSON-LD `url`/`image`, `sitemap.xml`, `robots.txt` `Sitemap:`, `llms.txt`, `.well-known/security.txt`) must use the bare apex — never `www.`. When adding any new self-link, use `https://olgahelenowalker.com/…`.

The site is a structured, LLM-friendly source of truth about Olga. It remains **bio-first** — it establishes who she is, her training and her credentials — but the first step toward **enquiries** for a private practice has been built: a UK GDPR-compliant contact form, backed by a Cloudflare Worker (Turnstile + Resend + KV rate-limiting). The form is in the page but not yet live end-to-end; going live is gated by the human prerequisites and steps in `worker/DEPLOY-CHECKLIST.md`. Still ahead (H2 2026): Services and Fees sections. See `docs/superpowers/specs/` for the design and `docs/superpowers/plans/` for the contact-form plan.

## Architecture

Everything user-facing lives in `index.html`. It contains:

1. `<head>` metadata: canonical URL, Open Graph, Twitter card, `theme-color` (light + dark).
2. **Schema.org JSON-LD**: a `ProfilePage` whose `mainEntity` is the `Person` (Olga), tuned for local discovery — `jobTitle`, `memberOf` (BACP), `alumniOf`, `hasCredential`, `knowsAbout`, and `areaServed` (York, Harrogate, North Yorkshire).
3. Inline CSS with `:root` custom properties and a `prefers-color-scheme: dark` override. Palette is warm & calming (cream paper, muted sage accent `--accent: #4f6a55`). Self-hosted fonts (`DM Sans`, `DM Serif Display`) are preloaded from `fonts/` and declared via `@font-face` — do not pull from Google Fonts.
4. Body sections (in order): hero, About, Approach, Background (timeline), Qualifications & Membership, Contact (now an enquiry form), footer.
5. A single inline `<script>` IIFE before `</body>` that POSTs the contact form to the Worker. This is the only JavaScript on the page — keep it inline, dependency-free, and ES5-compatible (`.then()/.catch()`, no async/await).

**Contact form backend (`worker/`).** A Cloudflare Worker (ES modules, no framework) handles form submissions at `contact-api.olgahelenowalker.com`, kept fully separate from the static site so GitHub Pages stays a zero-backend file host. It validates input, verifies a Cloudflare Turnstile token, enforces a per-IP rate limit via Cloudflare KV, and forwards the enquiry via Resend. Secrets (`TURNSTILE_SECRET`, `RESEND_API_KEY`) are set with `wrangler secret put` and never committed; non-secret config lives in `wrangler.toml` `[vars]`. The Worker has its own test suite (Vitest, `worker/test/`) — run `cd worker && npm test`. It deploys independently of the page (`npm run deploy`); see `worker/README.md` and `worker/DEPLOY-CHECKLIST.md`.

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

**Take the contact form live.** The form and its Worker are built; what remains is human/credential work (Turnstile secret, Resend, KV, confirmed emails, ICO, privacy-wording sign-off) plus filling the `ENQUIRY_EMAIL_PLACEHOLDER` (×3) in `index.html`. The Turnstile **site key** is already in the page. Follow `worker/DEPLOY-CHECKLIST.md` top to bottom; the public form only goes live when the change is merged to `main`. The form change still requires bumping the three date markers when the email placeholders are filled.

**Evolve toward a practice site (Phase 2).** Insert `Services` and `Fees` sections between Approach and Background. (The enquiry form is already done — see "Take the contact form live" above.) Consider upgrading the JSON-LD with a `LocalBusiness`/health-practitioner entity (`address`, `geo`, `makesOffer`).

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
- **No dependencies, no package manager, no build pipeline for the page itself.** Don't introduce a framework or JS bundler without an explicit request — the page's value includes being trivially crawlable and near-zero-JS (only the inline contact-form handler). The `worker/` subproject is the one exception: it has its own `package.json` (Wrangler + Vitest dev deps only) and is deployed separately; keep that boundary — Worker tooling never touches the page.
- **Tone for Olga's copy:** warm, plain, reassuring, non-clinical; written for parents seeking help for a child. Currently third person; first person ("I…") is a reasonable switch for the practice phase. Olga reviews and edits all bio copy.

## Where to look

- `docs/superpowers/specs/` — the design spec for this site (purpose, structure, phases, hosting/DNS steps).
- `docs/superpowers/plans/` — the contact-form implementation plan (tasks, human prerequisites).
- `worker/README.md` — Worker setup, local dev, and deployed-Worker test examples.
- `worker/DEPLOY-CHECKLIST.md` — ordered runbook to take the contact form live.
