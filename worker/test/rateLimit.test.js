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
