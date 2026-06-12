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
