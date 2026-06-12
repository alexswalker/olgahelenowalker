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
