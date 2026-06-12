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
