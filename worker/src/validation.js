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
