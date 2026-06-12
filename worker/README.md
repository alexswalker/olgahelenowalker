# olga-contact-worker

Cloudflare Worker that handles contact form submissions for olgahelenowalker.com.

## Prerequisites

Complete all items in the Human prerequisites section of `docs/superpowers/plans/2026-06-09-contact-form.md` before deploying.

## First-time setup

1. Install dependencies:
   ```bash
   cd worker && npm install
   ```

2. Fill in the four TODO values in `wrangler.toml`:
   - `account_id` — your Cloudflare account ID (dashboard right sidebar)
   - `RATE_LIMIT_KV.id` — KV namespace ID (dashboard → Workers & Pages → KV)
   - `RECIPIENT_EMAIL` — where Olga receives enquiries
   - `FROM_EMAIL` — verified Resend sending address (e.g. enquiries@olgahelenowalker.com)

3. Set the two secrets (run from the `worker/` directory):
   ```bash
   npx wrangler secret put TURNSTILE_SECRET
   npx wrangler secret put RESEND_API_KEY
   ```
   Paste the value when prompted. Neither value is stored in any file.

## Running tests

```bash
cd worker && npm test
```

## Local development

```bash
cd worker && npx wrangler dev --local
```

The Worker listens on `http://localhost:8787`. Temporarily set `WORKER_URL` in `index.html` to `http://localhost:8787/` and serve the site with `python3 -m http.server 8000`.

Use the always-pass Turnstile test keys for local development (see Human prerequisites).

## Deploying

```bash
cd worker && npm run deploy
```

Wrangler creates a DNS CNAME at `contact-api.olgahelenowalker.com` automatically. It does not touch the apex A records used by GitHub Pages.

## Testing the deployed Worker

Replace WORKER_URL with `https://contact-api.olgahelenowalker.com/` for these examples.

**Valid submission:**
```bash
curl -s -X POST https://contact-api.olgahelenowalker.com/ \
  -H "Content-Type: application/json" \
  -H "Origin: https://olgahelenowalker.com" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "message": "Test enquiry from curl.",
    "company": "",
    "cf-turnstile-response": "REAL_TOKEN_FROM_BROWSER"
  }'
```
Expected: `{"ok":true}`

**Honeypot filled (silent reject):**
```bash
curl -s -X POST https://contact-api.olgahelenowalker.com/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Bot","email":"bot@spam.com","message":"Buy now","company":"SpamCo","cf-turnstile-response":""}'
```
Expected: `{"ok":false,"error":"Invalid submission"}` with status 400

**Wrong origin (CORS blocked):**
```bash
curl -s -v -X OPTIONS https://contact-api.olgahelenowalker.com/ \
  -H "Origin: https://evil.com" \
  -H "Access-Control-Request-Method: POST"
```
Expected: `Access-Control-Allow-Origin: https://olgahelenowalker.com` — not `evil.com`

**Rate limit:**
Send 6 POST requests in quick succession from the same IP. The 6th should return status 429.

## Confirming Turnstile and Resend both fired

- Turnstile: Cloudflare dashboard → Turnstile → your widget → Analytics shows a verified challenge.
- Resend: Resend dashboard → Logs shows the email send attempt and delivery status.
- End-to-end: a real email arrives at `RECIPIENT_EMAIL` with the correct reply-to address.

## Before going live checklist

- [ ] Replace `TURNSTILE_SITE_KEY_PLACEHOLDER` in `index.html` with the production site key
- [ ] Replace all `ENQUIRY_EMAIL_PLACEHOLDER` in `index.html` with the confirmed email address
- [ ] Review and confirm privacy notice wording with Olga (marked `REVIEW_BEFORE_LAUNCH`)
- [ ] Confirm ICO registration is complete
- [ ] Confirm Resend domain verification is green
- [ ] Send a real test submission and confirm email arrives with correct reply-to
- [ ] Verify form works on mobile (iOS Safari, Chrome Android)
