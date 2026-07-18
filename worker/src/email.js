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
