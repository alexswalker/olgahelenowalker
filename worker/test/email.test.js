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
