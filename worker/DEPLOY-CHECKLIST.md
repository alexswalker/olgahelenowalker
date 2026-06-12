# Contact form — deploy runbook

Work top to bottom. Nothing here goes live until the final merge, because the form
only reaches the public site when `feat/contact-form` is merged to `main`
(GitHub Pages publishes `main`).

Two values are already in the repo and need no action:
- Turnstile **site key** `0x4AAAAAADjQsJp5ATRuhbWL` — already in `index.html`.
- All Worker code + 40 passing tests.

Everything below is the human/credential work.

---

## Phase 0 — Start the slow things first

Resend domain verification and ICO registration take time (minutes-to-hours, and
days, respectively). Kick these off before the quick Cloudflare config so they
verify in the background.

- [ ] **ICO registration** — register Olga as a data controller at
  https://ico.org.uk/registration/ (£40/yr). Keep the reference number.
- [ ] **Resend domain** — resend.com → Domains → Add `olgahelenowalker.com`.
  Copy the DKIM / SPF / return-path records it shows into Cloudflare →
  DNS → Records. **Leave the GitHub Pages apex `A` records untouched** — you are
  only *adding* Resend's subdomain records. They can be DNS-only (grey cloud).
  Wait for Resend to show the domain as **Verified** (green).
- [ ] **Resend API key** — once verified, Resend → API Keys → create one with
  send permission. Hold onto it for Phase 3 (do not paste it into any file).

---

## Phase 1 — Gather the four `wrangler.toml` values

You created the Turnstile widget already, so its keys exist. Collect the rest:

- [ ] **Cloudflare account ID** — dashboard right sidebar.
- [ ] **KV namespace** — dashboard → Workers & Pages → KV → Create namespace,
  name it `olga-rate-limit`. Copy the generated **namespace ID**.
- [ ] **Recipient email** — where Olga receives enquiries (any inbox).
- [ ] **From email** — must be on the Resend-verified domain,
  e.g. `enquiries@olgahelenowalker.com`.

Then edit `worker/wrangler.toml` and replace the four `TODO_*` placeholders:

```toml
account_id      = "…"          # Cloudflare account ID
id              = "…"          # under [[kv_namespaces]] — the KV namespace ID
RECIPIENT_EMAIL = "…"          # where Olga receives enquiries
FROM_EMAIL      = "…"          # verified Resend sending address
```

Do **not** change the `RATE_LIMIT_KV` binding name or the `ALLOWED_ORIGIN` /
`contact-api.olgahelenowalker.com` route — those are wired to the code.

---

## Phase 2 — Authenticate Wrangler to Cloudflare

First time only. Either:

```bash
cd worker && npx wrangler login          # opens a browser OAuth flow
```

…or use a scoped token (handy in a Codespace):

```bash
export CLOUDFLARE_API_TOKEN=…            # needs "Workers Scripts: Edit"
```

Confirm it worked:

```bash
cd worker && npx wrangler whoami
```

---

## Phase 3 — First deploy, then set secrets, then redeploy

Secrets attach to a Worker that already exists, so deploy once *before* setting
them.

- [ ] **First deploy** (creates the Worker + the `contact-api.olgahelenowalker.com`
  CNAME automatically; does not touch the apex):
  ```bash
  cd worker && npm run deploy
  ```
- [ ] **Set the two secrets** (each prompts you to paste the value — it is never
  written to a file):
  ```bash
  cd worker && npx wrangler secret put TURNSTILE_SECRET   # the widget's secret key
  cd worker && npx wrangler secret put RESEND_API_KEY     # the key from Phase 0
  ```
- [ ] **Redeploy** so the running Worker picks up the secrets:
  ```bash
  cd worker && npm run deploy
  ```

---

## Phase 4 — Fill the email placeholder in the page

- [ ] Replace all **3** `ENQUIRY_EMAIL_PLACEHOLDER` occurrences in `index.html`
  with the confirmed email address (the privacy-notice contact + the noscript
  fallback). Confirm none remain:
  ```bash
  grep -c ENQUIRY_EMAIL_PLACEHOLDER index.html   # expect 0
  ```
- [ ] Have Olga review and approve the privacy-notice wording
  (marked `REVIEW_BEFORE_LAUNCH` in `index.html`). Adjust if needed.
- [ ] Bump the three date markers to the day you do this, in the same commit
  (`sitemap.xml` `<lastmod>`, JSON-LD `dateModified`, footer `<time>`).

---

## Phase 5 — Verify against the live Worker (still off the public site)

The Worker is live on its subdomain, but the form isn't on the public site until
merge — so you can safely test the endpoint now.

- [ ] **CORS / wrong origin** rejected:
  ```bash
  curl -s -i -X OPTIONS https://contact-api.olgahelenowalker.com/ \
    -H "Origin: https://evil.com" -H "Access-Control-Request-Method: POST" \
    | grep -i access-control-allow-origin
  # expect: https://olgahelenowalker.com   (never evil.com)
  ```
- [ ] **Honeypot** silently rejected (status 400):
  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" -X POST https://contact-api.olgahelenowalker.com/ \
    -H "Content-Type: application/json" \
    -d '{"name":"Bot","email":"b@b.com","message":"x","company":"SpamCo","cf-turnstile-response":""}'
  # expect: 400
  ```
- [ ] **Real end-to-end** — open the form locally (`python3 -m http.server 8000`,
  temporarily point `WORKER_URL` in `index.html` at the live subdomain if needed),
  complete the Turnstile challenge, submit, and confirm:
  - a "Thank you" success message,
  - an email arrives at the recipient with the submitter's address as **reply-to**,
  - the send shows in Resend → Logs and a verified challenge shows in
    Cloudflare → Turnstile → Analytics.
  - Revert any temporary `WORKER_URL` change before merging.
- [ ] **Mobile** — check the form on iOS Safari and Chrome Android.

---

## Phase 6 — Go live

- [ ] Tick the remaining items in PR #1's checklist.
- [ ] Merge `feat/contact-form` → `main`. GitHub Pages publishes within a minute or
  two; the form is now live.
- [ ] Submit one real enquiry through the **public** site as a final smoke test.

---

### Rollback

If anything misbehaves after merge, revert the merge commit on `main` (the form
disappears from the page) — the Worker can keep running harmlessly on its
subdomain, or `cd worker && npx wrangler delete` to remove it.
