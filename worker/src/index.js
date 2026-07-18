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
