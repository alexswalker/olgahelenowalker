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
