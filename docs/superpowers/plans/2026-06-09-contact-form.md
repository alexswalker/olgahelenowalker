# Contact Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a UK GDPR-compliant enquiry form to `olgahelenowalker.com`, backed by a Cloudflare Worker that verifies Turnstile tokens and delivers submissions via Resend.

**Architecture:** The static GitHub Pages site POSTs form data to a Cloudflare Worker at `contact-api.olgahelenowalker.com`. The Worker validates inputs, verifies Turnstile, enforces a per-IP rate limit via Cloudflare KV, and forwards the enquiry to Olga's inbox via Resend. No secrets leave the Worker; the GitHub Pages site remains a zero-backend static file host. This is the first introduction of JavaScript to the site — kept to a single inline IIFE.

**Tech Stack:** Plain HTML/CSS/JS (frontend); Cloudflare Workers ES modules, no framework (backend); Wrangler 3.x (deploy); Resend (email delivery); Cloudflare Turnstile (bot protection); Vitest 1.x (Worker unit + integration tests)

---

## Human prerequisites

These must be completed before the Worker can be deployed or tested end-to-end. All implementation can be written and unit-tested with stubs in the meantime.

1. **ICO registration** — Olga must register as a data controller with the [Information Commissioner's Office](https://ico.org.uk/registration/) (£40/year for small organisations). Sole traders who process personal data are required to register. Keep the registration number to hand — it may be added to the site later.

2. **Cloudflare Turnstile widget** — Cloudflare dashboard → Turnstile → Add widget → hostname `olgahelenowalker.com` → challenge type: Managed. Note the **site key** (public, goes in HTML) and the **secret key** (secret, goes in Worker).
   - For local development, use the always-pass test keys: site key `1x00000000000000000000AA`, secret key `1x0000000000000000000000000000000AA`.

3. **Resend account** — Create account at resend.com → Domains → Add `olgahelenowalker.com` → copy the DKIM, SPF, and return-path DNS records Resend provides into Cloudflare DNS → wait for verification → generate an API key (send permission).

4. **Confirm email addresses** — Decide the recipient address (where Olga receives enquiries, e.g. a private inbox) and the from address (e.g. `enquiries@olgahelenowalker.com`). The from address must be on the Resend-verified domain. Both are configured as plain `[vars]` in `wrangler.toml`, not secrets.

5. **Cloudflare account ID** — Available in the Cloudflare dashboard right sidebar. Required in `wrangler.toml`.

6. **Create KV namespace** — Cloudflare dashboard → Workers & Pages → KV → Create namespace, name `olga-rate-limit`. Note the namespace ID. Required in `wrangler.toml`.

7. **Confirm privacy notice wording** — The exact text of the inline privacy notice (included in Task 7) must be reviewed and approved by Olga before the form goes live. Placeholder marked `REVIEW_BEFORE_LAUNCH` in the HTML.

---

## File structure

**New files — Worker (in `worker/` subdirectory of this repo):**
| File | Responsibility |
|------|---------------|
| `worker/src/validation.js` | Pure input validation — no I/O, no side effects |
| `worker/src/turnstile.js` | Cloudflare Turnstile siteverify HTTP call |
| `worker/src/email.js` | Resend API email send |
| `worker/src/rateLimit.js` | Per-IP count check against Cloudflare KV |
| `worker/src/index.js` | Main request handler — wires the modules together |
| `worker/test/validation.test.js` | Unit tests for validation |
| `worker/test/turnstile.test.js` | Unit tests for Turnstile verification |
| `worker/test/email.test.js` | Unit tests for email send |
| `worker/test/rateLimit.test.js` | Unit tests for rate limiting |
| `worker/test/worker.test.js` | Integration tests for the full request handler |
| `worker/wrangler.toml` | Cloudflare Workers config, custom domain, KV binding |
| `worker/package.json` | Dev deps (wrangler, vitest) |
| `worker/vitest.config.js` | Vitest config (node environment) |
| `worker/.gitignore` | Ignore node_modules, .wrangler, dist |

**Modified files:**
| File | Change |
|------|--------|
| `index.html` | Replace contact section; add form CSS; add Turnstile `<script>` in `<head>`; add form IIFE before `</body>` |
| `llms.txt` | Add Contact section noting the enquiry form |
| `sitemap.xml` | Bump `<lastmod>` to 2026-06-09 |

---

## Task 1: Worker project scaffold

**Files:**
- Create: `worker/package.json`
- Create: `worker/vitest.config.js`
- Create: `worker/wrangler.toml`
- Create: `worker/.gitignore`
- Create: `worker/src/index.js` (stub — expanded in Task 6)

No tests in this task — it is infrastructure only.

- [ ] **Step 1: Create `worker/package.json`**

```json
{
  "name": "olga-contact-worker",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "deploy": "wrangler deploy"
  },
  "devDependencies": {
    "vitest": "^1.6.0",
    "wrangler": "^3.60.0"
  }
}
```

- [ ] **Step 2: Create `worker/vitest.config.js`**

```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 3: Create `worker/wrangler.toml`**

Replace the four `TODO_*` values before deploying (see Human prerequisites above).

```toml
name = "olga-contact-worker"
main = "src/index.js"
compatibility_date = "2024-09-23"
account_id = "TODO_CLOUDFLARE_ACCOUNT_ID"

[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "TODO_KV_NAMESPACE_ID"

[vars]
ALLOWED_ORIGIN = "https://olgahelenowalker.com"
RECIPIENT_EMAIL = "TODO_RECIPIENT_EMAIL"
FROM_EMAIL = "TODO_FROM_EMAIL"

# Deploying sets up a DNS CNAME at contact-api.olgahelenowalker.com automatically.
# The apex A records for GitHub Pages are not affected.
[[routes]]
pattern = "contact-api.olgahelenowalker.com"
custom_domain = true

# Secrets — set via CLI, never in this file:
#   cd worker && npx wrangler secret put TURNSTILE_SECRET
#   cd worker && npx wrangler secret put RESEND_API_KEY
```

- [ ] **Step 4: Create `worker/.gitignore`**

```
node_modules/
.wrangler/
dist/
.env
```

- [ ] **Step 5: Create stub `worker/src/index.js`**

```javascript
export default {
  async fetch(_request, _env) {
    return new Response('Not implemented', { status: 501 });
  },
};
```

- [ ] **Step 6: Install dependencies**

```bash
cd worker && npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 7: Confirm tests run (zero tests pass)**

```bash
cd worker && npm test
```

Expected output: `Test Files  0 passed` — no errors, just nothing to run yet.

- [ ] **Step 8: Commit**

```bash
git add worker/
git commit -m "feat: scaffold Cloudflare Worker project for contact form"
```

---

## Task 2: Validation module

**Files:**
- Create: `worker/src/validation.js`
- Create: `worker/test/validation.test.js`

- [ ] **Step 1: Write the failing tests**

Create `worker/test/validation.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { validateBody } from '../src/validation.js';

const VALID = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  message: 'I would like to make an enquiry.',
  company: '',
};

describe('validateBody', () => {
  it('accepts a complete valid body', () => {
    expect(validateBody(VALID)).toEqual({ valid: true });
  });

  it('rejects when honeypot field is filled', () => {
    expect(validateBody({ ...VALID, company: 'Spam Corp' }))
      .toEqual({ valid: false, error: 'Invalid submission' });
  });

  it('rejects missing name', () => {
    expect(validateBody({ ...VALID, name: '' }))
      .toEqual({ valid: false, error: 'Name is required' });
  });

  it('rejects whitespace-only name', () => {
    expect(validateBody({ ...VALID, name: '   ' }))
      .toEqual({ valid: false, error: 'Name is required' });
  });

  it('rejects missing email', () => {
    expect(validateBody({ ...VALID, email: '' }))
      .toEqual({ valid: false, error: 'A valid email address is required' });
  });

  it('rejects malformed email — no @', () => {
    expect(validateBody({ ...VALID, email: 'notanemail' }))
      .toEqual({ valid: false, error: 'A valid email address is required' });
  });

  it('rejects malformed email — no domain', () => {
    expect(validateBody({ ...VALID, email: 'jane@' }))
      .toEqual({ valid: false, error: 'A valid email address is required' });
  });

  it('rejects missing message', () => {
    expect(validateBody({ ...VALID, message: '' }))
      .toEqual({ valid: false, error: 'Message is required' });
  });

  it('rejects message over 5000 characters', () => {
    expect(validateBody({ ...VALID, message: 'a'.repeat(5001) }))
      .toEqual({ valid: false, error: 'Message must be 5,000 characters or fewer' });
  });

  it('accepts message of exactly 5000 characters', () => {
    expect(validateBody({ ...VALID, message: 'a'.repeat(5000) }))
      .toEqual({ valid: true });
  });

  it('accepts body without a phone field (phone is optional)', () => {
    const { ...body } = VALID;
    expect(validateBody(body)).toEqual({ valid: true });
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd worker && npm test
```

Expected: `Cannot find module '../src/validation.js'`

- [ ] **Step 3: Implement `worker/src/validation.js`**

```javascript
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateBody(body) {
  const { name, email, message, company } = body;

  if (company) {
    return { valid: false, error: 'Invalid submission' };
  }
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return { valid: false, error: 'Name is required' };
  }
  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return { valid: false, error: 'A valid email address is required' };
  }
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return { valid: false, error: 'Message is required' };
  }
  if (message.length > 5000) {
    return { valid: false, error: 'Message must be 5,000 characters or fewer' };
  }
  return { valid: true };
}
```

- [ ] **Step 4: Run tests — expect all to pass**

```bash
cd worker && npm test
```

Expected: `11 passed`

- [ ] **Step 5: Commit**

```bash
git add worker/src/validation.js worker/test/validation.test.js
git commit -m "feat: add Worker input validation module with tests"
```

---

## Task 3: Turnstile verification module

**Files:**
- Create: `worker/src/turnstile.js`
- Create: `worker/test/turnstile.test.js`

- [ ] **Step 1: Write the failing tests**

Create `worker/test/turnstile.test.js`:

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyTurnstile } from '../src/turnstile.js';

describe('verifyTurnstile', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('returns true when Cloudflare reports success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    }));
    expect(await verifyTurnstile('valid-token', '1.2.3.4', 'my-secret')).toBe(true);
  });

  it('returns false when Cloudflare reports failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: false, 'error-codes': ['invalid-input-response'] }),
    }));
    expect(await verifyTurnstile('bad-token', '1.2.3.4', 'my-secret')).toBe(false);
  });

  it('posts to the correct siteverify URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    });
    vi.stubGlobal('fetch', mockFetch);
    await verifyTurnstile('tok', '9.9.9.9', 'secret');
    expect(mockFetch.mock.calls[0][0])
      .toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
  });

  it('sends secret, token, and IP in the request body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    });
    vi.stubGlobal('fetch', mockFetch);
    await verifyTurnstile('my-tok', '5.5.5.5', 'my-secret');
    const params = new URLSearchParams(mockFetch.mock.calls[0][1].body);
    expect(params.get('secret')).toBe('my-secret');
    expect(params.get('response')).toBe('my-tok');
    expect(params.get('remoteip')).toBe('5.5.5.5');
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd worker && npm test
```

Expected: `Cannot find module '../src/turnstile.js'`

- [ ] **Step 3: Implement `worker/src/turnstile.js`**

```javascript
export async function verifyTurnstile(token, ip, secret) {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  });
  const data = await res.json();
  return data.success === true;
}
```

- [ ] **Step 4: Run tests — expect all to pass**

```bash
cd worker && npm test
```

Expected: `15 passed` (11 from Task 2 + 4 new)

- [ ] **Step 5: Commit**

```bash
git add worker/src/turnstile.js worker/test/turnstile.test.js
git commit -m "feat: add Turnstile verification module with tests"
```

---

## Task 4: Email sending module

**Files:**
- Create: `worker/src/email.js`
- Create: `worker/test/email.test.js`

- [ ] **Step 1: Write the failing tests**

Create `worker/test/email.test.js`:

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendEmail } from '../src/email.js';

const BASE = {
  apiKey: 're_test_key',
  from: 'enquiries@olgahelenowalker.com',
  to: 'olga@example.com',
  replyTo: 'jane@test.com',
  name: 'Jane Smith',
  email: 'jane@test.com',
  phone: null,
  message: 'Hello, I would like to enquire about therapy for my child.',
};

describe('sendEmail', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('returns true when Resend responds with ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    expect(await sendEmail(BASE)).toBe(true);
  });

  it('returns false when Resend responds with an error status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    expect(await sendEmail(BASE)).toBe(false);
  });

  it('posts to the Resend API endpoint', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);
    await sendEmail(BASE);
    expect(mockFetch.mock.calls[0][0]).toBe('https://api.resend.com/emails');
  });

  it('sets Authorization header with the API key', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);
    await sendEmail(BASE);
    expect(mockFetch.mock.calls[0][1].headers['Authorization'])
      .toBe('Bearer re_test_key');
  });

  it('sets reply-to to the submitter email address', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);
    await sendEmail(BASE);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.reply_to).toBe('jane@test.com');
  });

  it('uses "New therapy enquiry from {name}" as subject', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);
    await sendEmail(BASE);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.subject).toBe('New therapy enquiry from Jane Smith');
  });

  it('includes phone in the email body when provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);
    await sendEmail({ ...BASE, phone: '07700 900123' });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.text).toContain('Phone: 07700 900123');
  });

  it('omits the phone line when phone is null', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);
    await sendEmail({ ...BASE, phone: null });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.text).not.toContain('Phone:');
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd worker && npm test
```

Expected: `Cannot find module '../src/email.js'`

- [ ] **Step 3: Implement `worker/src/email.js`**

```javascript
export async function sendEmail({ apiKey, from, to, replyTo, name, email, phone, message }) {
  const lines = [
    `Name: ${name}`,
    `Email: ${email}`,
    ...(phone ? [`Phone: ${phone}`] : []),
    '',
    'Message:',
    message,
  ];

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: replyTo,
      subject: `New therapy enquiry from ${name}`,
      text: lines.join('\n'),
    }),
  });
  return res.ok;
}
```

- [ ] **Step 4: Run tests — expect all to pass**

```bash
cd worker && npm test
```

Expected: `23 passed`

- [ ] **Step 5: Commit**

```bash
git add worker/src/email.js worker/test/email.test.js
git commit -m "feat: add Resend email module with tests"
```

---

## Task 5: Rate limiting module

**Files:**
- Create: `worker/src/rateLimit.js`
- Create: `worker/test/rateLimit.test.js`

- [ ] **Step 1: Write the failing tests**

Create `worker/test/rateLimit.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { checkRateLimit } from '../src/rateLimit.js';

function makeKV(initial = {}) {
  const store = { ...initial };
  return {
    async get(key) { return store[key] ?? null; },
    async put(key, value, _opts) { store[key] = value; },
  };
}

describe('checkRateLimit', () => {
  it('allows the first request from an IP', async () => {
    expect(await checkRateLimit('1.1.1.1', makeKV())).toBe(true);
  });

  it('allows the 5th request (count was 4)', async () => {
    expect(await checkRateLimit('1.1.1.1', makeKV({ 'rate:1.1.1.1': '4' }))).toBe(true);
  });

  it('blocks the 6th request (count was 5)', async () => {
    expect(await checkRateLimit('1.1.1.1', makeKV({ 'rate:1.1.1.1': '5' }))).toBe(false);
  });

  it('treats different IPs independently', async () => {
    const kv = makeKV({ 'rate:1.1.1.1': '5' });
    expect(await checkRateLimit('2.2.2.2', kv)).toBe(true);
  });

  it('increments the count on each allowed request', async () => {
    const kv = makeKV();
    await checkRateLimit('3.3.3.3', kv);
    expect(await kv.get('rate:3.3.3.3')).toBe('1');
    await checkRateLimit('3.3.3.3', kv);
    expect(await kv.get('rate:3.3.3.3')).toBe('2');
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd worker && npm test
```

Expected: `Cannot find module '../src/rateLimit.js'`

- [ ] **Step 3: Implement `worker/src/rateLimit.js`**

```javascript
const MAX_REQUESTS = 5;
const WINDOW_SECONDS = 3600;

export async function checkRateLimit(ip, kv) {
  const key = `rate:${ip}`;
  const current = await kv.get(key);
  const count = current ? parseInt(current, 10) : 0;

  if (count >= MAX_REQUESTS) return false;

  await kv.put(key, String(count + 1), { expirationTtl: WINDOW_SECONDS });
  return true;
}
```

- [ ] **Step 4: Run tests — expect all to pass**

```bash
cd worker && npm test
```

Expected: `28 passed`

- [ ] **Step 5: Commit**

```bash
git add worker/src/rateLimit.js worker/test/rateLimit.test.js
git commit -m "feat: add KV-based per-IP rate limiting with tests"
```

---

## Task 6: Main Worker handler

**Files:**
- Modify: `worker/src/index.js` (replace stub)
- Create: `worker/test/worker.test.js`

- [ ] **Step 1: Write the failing integration tests**

Create `worker/test/worker.test.js`:

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import worker from '../src/index.js';

function makeKV(store = {}) {
  return {
    async get(key) { return store[key] ?? null; },
    async put(key, value, _opts) { store[key] = value; },
  };
}

function makeEnv(overrides = {}) {
  return {
    ALLOWED_ORIGIN: 'https://olgahelenowalker.com',
    TURNSTILE_SECRET: 'test-secret',
    RESEND_API_KEY: 'test-key',
    FROM_EMAIL: 'enquiries@olgahelenowalker.com',
    RECIPIENT_EMAIL: 'olga@example.com',
    RATE_LIMIT_KV: makeKV(),
    ...overrides,
  };
}

function makeRequest(method, body, headers = {}) {
  const init = {
    method,
    headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '1.2.3.4', ...headers },
  };
  if (body !== null && body !== undefined) {
    init.body = JSON.stringify(body);
  }
  return new Request('https://contact-api.olgahelenowalker.com/', init);
}

const VALID_BODY = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  message: 'I would like to enquire about therapy for my child.',
  company: '',
  'cf-turnstile-response': 'valid-token',
};

function mockFetchSuccess() {
  vi.stubGlobal('fetch', vi.fn()
    .mockResolvedValueOnce({ json: () => Promise.resolve({ success: true }) })  // Turnstile
    .mockResolvedValueOnce({ ok: true })                                          // Resend
  );
}

describe('Worker integration', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('returns 204 for OPTIONS preflight', async () => {
    const res = await worker.fetch(makeRequest('OPTIONS'), makeEnv());
    expect(res.status).toBe(204);
  });

  it('sets CORS headers on OPTIONS response', async () => {
    const res = await worker.fetch(makeRequest('OPTIONS'), makeEnv());
    expect(res.headers.get('Access-Control-Allow-Origin'))
      .toBe('https://olgahelenowalker.com');
    expect(res.headers.get('Access-Control-Allow-Methods'))
      .toContain('POST');
  });

  it('returns 405 for GET', async () => {
    const res = await worker.fetch(makeRequest('GET'), makeEnv());
    expect(res.status).toBe(405);
  });

  it('returns 200 and { ok: true } for a valid submission', async () => {
    mockFetchSuccess();
    const res = await worker.fetch(makeRequest('POST', VALID_BODY), makeEnv());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it('sets CORS header on successful POST response', async () => {
    mockFetchSuccess();
    const res = await worker.fetch(makeRequest('POST', VALID_BODY), makeEnv());
    expect(res.headers.get('Access-Control-Allow-Origin'))
      .toBe('https://olgahelenowalker.com');
  });

  it('returns 400 for missing name', async () => {
    const res = await worker.fetch(
      makeRequest('POST', { ...VALID_BODY, name: '' }), makeEnv()
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe('Name is required');
  });

  it('returns 400 when honeypot is filled', async () => {
    const res = await worker.fetch(
      makeRequest('POST', { ...VALID_BODY, company: 'Spam Corp' }), makeEnv()
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when body is not valid JSON', async () => {
    const req = new Request('https://contact-api.olgahelenowalker.com/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '1.2.3.4' },
      body: 'not json',
    });
    const res = await worker.fetch(req, makeEnv());
    expect(res.status).toBe(400);
  });

  it('returns 403 when Turnstile token is missing', async () => {
    const { 'cf-turnstile-response': _, ...bodyNoToken } = VALID_BODY;
    const res = await worker.fetch(makeRequest('POST', bodyNoToken), makeEnv());
    expect(res.status).toBe(403);
  });

  it('returns 403 when Turnstile verification fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: false }),
    }));
    const res = await worker.fetch(makeRequest('POST', VALID_BODY), makeEnv());
    expect(res.status).toBe(403);
  });

  it('returns 429 when rate limit is exceeded', async () => {
    const kv = makeKV({ 'rate:1.2.3.4': '5' });
    const res = await worker.fetch(
      makeRequest('POST', VALID_BODY), makeEnv({ RATE_LIMIT_KV: kv })
    );
    expect(res.status).toBe(429);
  });

  it('returns 502 when Resend fails', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ json: () => Promise.resolve({ success: true }) })
      .mockResolvedValueOnce({ ok: false })
    );
    const res = await worker.fetch(makeRequest('POST', VALID_BODY), makeEnv());
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests — expect failure (stub returns 501)**

```bash
cd worker && npm test
```

Expected: failures on every `worker.test.js` case.

- [ ] **Step 3: Replace `worker/src/index.js` with the full handler**

```javascript
import { validateBody } from './validation.js';
import { verifyTurnstile } from './turnstile.js';
import { sendEmail } from './email.js';
import { checkRateLimit } from './rateLimit.js';

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN;

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return json({ ok: false, error: 'Method not allowed' }, 405, origin);
    }

    const ip = request.headers.get('CF-Connecting-IP') ?? '0.0.0.0';

    const allowed = await checkRateLimit(ip, env.RATE_LIMIT_KV);
    if (!allowed) {
      return json({ ok: false, error: 'Too many requests. Please try again later.' }, 429, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: 'Invalid request body' }, 400, origin);
    }

    const validation = validateBody(body);
    if (!validation.valid) {
      return json({ ok: false, error: validation.error }, 400, origin);
    }

    const token = body['cf-turnstile-response'];
    if (!token) {
      return json(
        { ok: false, error: 'Security check failed. Please refresh and try again.' },
        403, origin
      );
    }

    const turnstileOk = await verifyTurnstile(token, ip, env.TURNSTILE_SECRET);
    if (!turnstileOk) {
      return json(
        { ok: false, error: 'Security check failed. Please refresh and try again.' },
        403, origin
      );
    }

    const sent = await sendEmail({
      apiKey: env.RESEND_API_KEY,
      from: env.FROM_EMAIL,
      to: env.RECIPIENT_EMAIL,
      replyTo: body.email.trim(),
      name: body.name.trim(),
      email: body.email.trim(),
      phone: body.phone?.trim() || null,
      message: body.message.trim(),
    });

    if (!sent) {
      return json(
        { ok: false, error: 'Sorry, your enquiry could not be sent. Please try again later.' },
        502, origin
      );
    }

    return json({ ok: true }, 200, origin);
  },
};
```

- [ ] **Step 4: Run all tests — expect all to pass**

```bash
cd worker && npm test
```

Expected: `41 passed` (28 from earlier tasks + 13 new integration tests)

- [ ] **Step 5: Commit**

```bash
git add worker/src/index.js worker/test/worker.test.js
git commit -m "feat: implement full Worker request handler with integration tests"
```

---

## Task 7: Contact form HTML and CSS

This task modifies `index.html`. No automated tests — verification is manual (see checklist at end of step).

**Files:**
- Modify: `index.html` (three separate edits)

### Edit A — Add Turnstile script to `<head>`

- [ ] **Step 1: Add Turnstile `<script>` to `index.html` `<head>`**

In `index.html`, find this line (after the favicon link, around line 99):

```html
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
```

Add the Turnstile script immediately after it:

```html
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <!-- Turnstile — when CSP is added later, include https://challenges.cloudflare.com in script-src -->
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
```

### Edit B — Add form CSS to `<style>`

- [ ] **Step 2: Add form CSS before the closing `</style>` tag**

In `index.html`, find the closing tag of the `:focus-visible` block (around line 449):

```html
    :focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
```

Add the form styles immediately after:

```html
    /* ── FORM ── */
    .safeguarding-note {
      font-size: 0.82rem;
      color: var(--mid);
      border: 1px solid var(--rule);
      border-left: 3px solid #c0823a;
      background: var(--white);
      border-radius: 2px;
      padding: 0.9rem 1.1rem;
      margin-top: 1.4rem;
    }

    .safeguarding-note a { color: var(--mid); }

    .enquiry-form {
      margin-top: 1.6rem;
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .form-field label {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--ink);
    }

    .field-optional {
      font-weight: 300;
      color: var(--mid);
    }

    .form-field input,
    .form-field textarea {
      font-family: 'DM Sans', sans-serif;
      font-size: 0.95rem;
      font-weight: 300;
      color: var(--ink);
      background: var(--white);
      border: 1px solid var(--rule);
      border-radius: 2px;
      padding: 0.65rem 0.85rem;
      transition: border-color 0.15s;
      width: 100%;
    }

    .form-field input:focus,
    .form-field textarea:focus {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
      border-color: var(--accent);
    }

    .form-field textarea {
      resize: vertical;
      min-height: 120px;
    }

    .form-honeypot {
      position: absolute;
      left: -9999px;
      top: 0;
    }

    .form-privacy {
      font-size: 0.78rem;
      color: var(--mid);
      font-weight: 300;
      line-height: 1.5;
    }

    .form-privacy a { color: var(--mid); }

    .form-submit {
      font-family: 'DM Sans', sans-serif;
      font-size: 0.88rem;
      font-weight: 500;
      letter-spacing: 0.04em;
      color: var(--white);
      background: var(--accent);
      border: none;
      border-radius: 2px;
      padding: 0.8rem 2rem;
      cursor: pointer;
      transition: opacity 0.15s;
      align-self: flex-start;
    }

    .form-submit:hover { opacity: 0.88; }
    .form-submit:disabled { opacity: 0.5; cursor: not-allowed; }

    .form-status {
      font-size: 0.88rem;
      min-height: 1.4em;
    }

    .form-status.success { color: var(--accent); }
    .form-status.error { color: #b94040; }
```

Also add inside the **existing** `@media (prefers-color-scheme: dark)` block (which ends around line 468), before its closing `}`:

```css
      .form-status.error { color: #e07070; }
```

So the dark mode block becomes:

```html
    @media (prefers-color-scheme: dark) {
      :root {
        --ink: #e9e4d9;
        --paper: #1c1a17;
        --accent: #8fb088;
        --mid: #9a948a;
        --rule: #322e28;
        --white: #26231f;
      }
      p { color: #c9c3b6; }
      .headshot-wrap img {
        border-color: #322e28;
      }
      .tag, .contact-note {
        background: #26231f;
      }
      .form-status.error { color: #e07070; }
    }
```

### Edit C — Replace contact section

- [ ] **Step 3: Replace the contact section in `index.html`**

Find and replace the entire `<!-- CONTACT -->` section (lines 636–660):

Old:
```html
  <!-- CONTACT -->
  <section id="contact">
    <p class="section-label">Contact</p>
    <h2>Get in touch</h2>
    <div class="contact-note">
      Enquiry details will be added here shortly. In the meantime:
      <a class="contact-link" href="https://www.linkedin.com/in/olgapwalker/" rel="noopener noreferrer" target="_blank" style="display:block; margin-top:0.6rem;">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="18" height="18"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45C23.21 24 24 23.23 24 22.28V1.72C24 .77 23.21 0 22.22 0z"/></svg>
        Connect on LinkedIn
      </a>
    </div>
    <!--
      Phase 2 — add confirmed contact details here once Olga decides which to use:

      <div class="contact-links">
        <a class="contact-link" href="mailto:EMAIL_TO_CONFIRM">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>
          EMAIL_TO_CONFIRM
        </a>
        <a class="contact-link" href="tel:PHONE_TO_CONFIRM">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          PHONE_TO_CONFIRM
        </a>
      </div>
    -->
  </section>
```

New:
```html
  <!-- CONTACT -->
  <section id="contact">
    <p class="section-label">Contact</p>
    <h2>Get in touch</h2>

    <div class="contact-note">
      <a class="contact-link" href="https://www.linkedin.com/in/olgapwalker/" rel="noopener noreferrer" target="_blank">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="18" height="18"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45C23.21 24 24 23.23 24 22.28V1.72C24 .77 23.21 0 22.22 0z"/></svg>
        Connect on LinkedIn
      </a>
    </div>

    <p class="safeguarding-note">This form is for general enquiries only and is not monitored urgently. If you or someone you know is in immediate danger, please call <strong>999</strong> or contact the <a href="https://www.samaritans.org/" rel="noopener noreferrer" target="_blank">Samaritans on 116 123</a>.</p>

    <form class="enquiry-form" id="enquiry-form" novalidate>
      <div class="form-field">
        <label for="field-name">Your name <span aria-hidden="true">*</span></label>
        <input type="text" id="field-name" name="name" required autocomplete="name">
      </div>
      <div class="form-field">
        <label for="field-email">Email address <span aria-hidden="true">*</span></label>
        <input type="email" id="field-email" name="email" required autocomplete="email">
      </div>
      <div class="form-field">
        <label for="field-phone">Phone number <span class="field-optional">(optional)</span></label>
        <input type="tel" id="field-phone" name="phone" autocomplete="tel">
      </div>
      <div class="form-field">
        <label for="field-message">Your message <span aria-hidden="true">*</span></label>
        <textarea id="field-message" name="message" required rows="5" maxlength="5000"></textarea>
      </div>
      <!-- Honeypot: visually hidden, no tab stop, no autocomplete — bots fill it, humans don't -->
      <div class="form-honeypot" aria-hidden="true">
        <label for="field-company">Company</label>
        <input type="text" id="field-company" name="company" tabindex="-1" autocomplete="off">
      </div>
      <div class="cf-turnstile" data-sitekey="TURNSTILE_SITE_KEY_PLACEHOLDER"></div>
      <!-- REVIEW_BEFORE_LAUNCH: confirm wording and ENQUIRY_EMAIL_PLACEHOLDER with Olga -->
      <p class="form-privacy">Your enquiry will be sent securely to Olga Heleno Walker and used only to respond to you. It will not be shared with third parties. Your details will be deleted once your enquiry has been resolved. You may request access to or deletion of your details at any time by emailing <a href="mailto:ENQUIRY_EMAIL_PLACEHOLDER">ENQUIRY_EMAIL_PLACEHOLDER</a>. You also have the right to raise a concern with the <a href="https://ico.org.uk/make-a-complaint/" rel="noopener noreferrer" target="_blank">Information Commissioner's Office</a>.</p>
      <button type="submit" class="form-submit">Send enquiry</button>
      <div class="form-status" role="status" aria-live="polite" aria-atomic="true"></div>
      <noscript><p style="color:#b94040;font-size:0.88rem;margin-top:0.5rem;">This form requires JavaScript. Please enable JavaScript in your browser or <a href="mailto:ENQUIRY_EMAIL_PLACEHOLDER">email Olga directly</a>.</p></noscript>
    </form>

  </section>
```

- [ ] **Step 4: Replace the two `TURNSTILE_SITE_KEY_PLACEHOLDER` instances**

Replace with the real site key from Cloudflare Turnstile (from Human prerequisites step 2). For local testing, use `1x00000000000000000000AA`.

- [ ] **Step 5: Replace all `ENQUIRY_EMAIL_PLACEHOLDER` instances (3 total)**

Replace with the confirmed from address (the address Olga will use to receive and reply to enquiries). This is from Human prerequisites step 4.

- [ ] **Step 6: Manual visual check**

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000` in a browser and verify:
- Form fields render below the LinkedIn link
- Safeguarding note has amber left border, distinct from the sage green accent
- Privacy notice appears in muted mid-tone below the Turnstile widget
- Submit button uses the sage green `--accent` colour
- Dark mode (toggle OS setting) renders all form elements legibly
- Fields have visible focus outlines when tabbed to
- No layout breakage at mobile width (≤ 600px)

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "feat: add contact form HTML and CSS to contact section"
```

---

## Task 8: Contact form JavaScript

**Files:**
- Modify: `index.html` (add inline script before `</body>`)

- [ ] **Step 1: Add the form IIFE before `</body>`**

In `index.html`, find `</body>` and add the script block immediately before it:

```html
<script>
(function () {
  var WORKER_URL = 'https://contact-api.olgahelenowalker.com/';
  var form = document.getElementById('enquiry-form');
  if (!form) return;

  var submitBtn = form.querySelector('.form-submit');
  var statusEl = form.querySelector('.form-status');

  function setStatus(type, text) {
    statusEl.className = 'form-status' + (type ? ' ' + type : '');
    statusEl.textContent = text;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    submitBtn.disabled = true;
    setStatus('', 'Sending…');

    var tokenInput = form.querySelector('[name="cf-turnstile-response"]');
    var data = {
      name: form.querySelector('[name="name"]').value.trim(),
      email: form.querySelector('[name="email"]').value.trim(),
      phone: form.querySelector('[name="phone"]').value.trim(),
      message: form.querySelector('[name="message"]').value.trim(),
      company: form.querySelector('[name="company"]').value,
      'cf-turnstile-response': tokenInput ? tokenInput.value : '',
    };

    fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    .then(function (res) { return res.json(); })
    .then(function (json) {
      if (json.ok) {
        form.reset();
        if (window.turnstile) window.turnstile.reset();
        setStatus('success', 'Thank you — your enquiry has been sent. Olga will be in touch shortly.');
      } else {
        setStatus('error', json.error || 'Something went wrong. Please try again.');
      }
      submitBtn.disabled = false;
    })
    .catch(function () {
      setStatus('error', 'Sorry, your enquiry could not be sent. Please check your connection and try again.');
      submitBtn.disabled = false;
    });
  });
}());
</script>
</body>
```

Note: plain ES5-style `.then()/.catch()` is intentional — avoids async/await in an inline script where transpilation isn't an option, and it works in every browser that supports `fetch`.

- [ ] **Step 2: Local end-to-end test with wrangler dev**

In one terminal, start the Worker locally with test Turnstile keys:

```bash
cd worker
TURNSTILE_SECRET=1x0000000000000000000000000000000AA \
RESEND_API_KEY=re_test_PLACEHOLDER \
ALLOWED_ORIGIN=http://localhost:8000 \
RECIPIENT_EMAIL=test@example.com \
FROM_EMAIL=test@olgahelenowalker.com \
npx wrangler dev --local
```

In a second terminal:
```bash
python3 -m http.server 8000
```

Temporarily change `WORKER_URL` in the inline script to `http://localhost:8787/`.

Open `http://localhost:8000` and manually verify each state:

| Test | Expected result |
|------|-----------------|
| Submit with all fields blank | Name validation error appears, button re-enabled |
| Submit with invalid email | Email validation error appears |
| Submit valid form (Turnstile test key auto-passes) | "Thank you" success message, form clears |
| Open browser devtools → Network tab → inspect the POST | Body contains name, email, message; no secrets visible |
| Tab through all form fields | Focus outline visible on each; honeypot field is not reachable |
| Toggle OS dark mode | All text readable; error/success states legible |

Revert `WORKER_URL` to `https://contact-api.olgahelenowalker.com/` before committing.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add contact form fetch handler JavaScript"
```

---

## Task 9: Date markers and llms.txt

**Files:**
- Modify: `sitemap.xml`
- Modify: `index.html` (JSON-LD `dateModified` and footer `<time>`)
- Modify: `llms.txt`

Per CLAUDE.md convention, every content change to `index.html` requires all three date markers to be bumped to the same date.

- [ ] **Step 1: Bump `sitemap.xml` `<lastmod>`**

In `sitemap.xml`, change:
```xml
    <lastmod>2026-06-08</lastmod>
```
to:
```xml
    <lastmod>2026-06-09</lastmod>
```

- [ ] **Step 2: Bump JSON-LD `dateModified` in `index.html`**

In `index.html`, change:
```json
    "dateModified": "2026-06-08T00:00:00+00:00",
```
to:
```json
    "dateModified": "2026-06-09T00:00:00+00:00",
```

- [ ] **Step 3: Bump footer `<time>` in `index.html`**

In `index.html`, change:
```html
  <p>Last updated <time datetime="2026-06-08">8 June 2026</time></p>
```
to:
```html
  <p>Last updated <time datetime="2026-06-09">9 June 2026</time></p>
```

- [ ] **Step 4: Update `llms.txt`**

Add a Contact section at the end of `llms.txt`. After the last line (`- LinkedIn: https://www.linkedin.com/in/olgapwalker/`), add:

```
## Contact

Enquiries can be submitted via the contact form at https://olgahelenowalker.com/#contact. The form is for general enquiries only and is not monitored urgently. In an emergency, contact 999 or the Samaritans on 116 123.
```

- [ ] **Step 5: Commit**

```bash
git add sitemap.xml index.html llms.txt
git commit -m "chore: bump date markers and update llms.txt for contact form"
```

---

## Task 10: Deployment README

**Files:**
- Modify: `worker/README.md` (create if absent — this is the Worker-specific README, separate from the repo root README)

- [ ] **Step 1: Create `worker/README.md`**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add worker/README.md
git commit -m "docs: add Worker deployment README with test examples"
```

---

## Self-review

**Spec coverage check:**

| Spec requirement | Covered by |
|-----------------|-----------|
| Turnstile spam protection | Tasks 3, 6 |
| Resend email delivery | Tasks 4, 6 |
| Cloudflare Worker backend | Tasks 1–6 |
| CORS — exact origin, OPTIONS preflight | Task 6 (integration tests cover both) |
| Input validation — name/email/message/length | Task 2 |
| Honeypot field | Task 2 (server), Task 7 (HTML) |
| Rate limiting via KV | Tasks 5, 6 |
| Form HTML — Name, Email, Phone, Message | Task 7 |
| Three UI states (sending/success/error) | Task 8 |
| `aria-live` for screen reader announcements | Task 7 (HTML `role="status" aria-live="polite"`) |
| UK GDPR inline privacy notice | Task 7 |
| Safeguarding disclaimer | Task 7 |
| No secrets in client code or repo | wrangler.toml `[vars]` + `wrangler secret put` |
| Dark mode form styles | Task 7 |
| Submit button disables during send | Task 8 |
| Form clears on success | Task 8 |
| Data retained on error | Task 8 (only `form.reset()` on success path) |
| No PII logged in Worker | `index.js` logs only status codes and error types |
| Three date markers bumped | Task 9 |
| llms.txt updated | Task 9 |
| Deployment README | Task 10 |
| CSP note for future | Task 7 (`<!-- comment -->` in HTML) |
| DNS — subdomain does not touch apex records | wrangler.toml + README explains auto-CNAME |
| Human prerequisites documented | Human prerequisites section + README |
| ICO registration required | Human prerequisites step 1 + README checklist |

**Placeholder scan:** No TBDs, "implement later", or vague "add error handling" steps found. Human-facing placeholders (`TURNSTILE_SITE_KEY_PLACEHOLDER`, `ENQUIRY_EMAIL_PLACEHOLDER`, `REVIEW_BEFORE_LAUNCH`) are labelled explicitly and tracked in the README's before-going-live checklist.

**Type/name consistency:** `RATE_LIMIT_KV` binding name matches in `wrangler.toml` and `env.RATE_LIMIT_KV` in `index.js`. `validateBody`, `verifyTurnstile`, `sendEmail`, `checkRateLimit` function names are consistent across source files and their respective tests.
