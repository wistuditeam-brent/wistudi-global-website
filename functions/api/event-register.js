import { connect } from 'cloudflare:sockets';

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };
const DEFAULT_EVENTS_SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyyM-dUwPLUk8FyhoLfl-jRJciUK8cU4gn0kTf_g4aqLdQb8uYJfmkuastG1llURxGm/exec';
const EVENT_START_ISO = '2026-09-15T14:00:00+07:00';
const SMTP_HOST = 'smtp.protonmail.ch';
const SMTP_PORT = 587;

const respond = (status, payload) => new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS });
const clean = (value, max = 500) => String(value ?? '').trim().slice(0, max);
const emailOk = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const headerSafe = (value) => String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

function utf8Base64(value) {
  const bytes = new TextEncoder().encode(String(value));
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function wrapBase64(value, width = 76) {
  const output = [];
  for (let i = 0; i < value.length; i += width) output.push(value.slice(i, i + width));
  return output.join('\r\n');
}

function eventTimeForTimezone(timezone) {
  const fallback = 'Asia/Ho_Chi_Minh';
  let zone = timezone || fallback;
  try {
    new Intl.DateTimeFormat('en', { timeZone: zone }).format(new Date());
  } catch {
    zone = fallback;
  }
  const start = new Date(EVENT_START_ISO);
  const date = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: zone
  }).format(start);
  const time = new Intl.DateTimeFormat('en-GB', {
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone: zone
  }).format(start);
  return { date, time, zone };
}

class SmtpSession {
  constructor(socket) {
    this.socket = socket;
    this.reader = socket.readable.getReader();
    this.writer = socket.writable.getWriter();
    this.decoder = new TextDecoder();
    this.encoder = new TextEncoder();
    this.buffer = '';
  }

  async readResponse(expectedCodes) {
    const expected = new Set(Array.isArray(expectedCodes) ? expectedCodes : [expectedCodes]);
    const lines = [];
    let finalCode = null;

    while (finalCode === null) {
      let newline = this.buffer.indexOf('\n');
      while (newline >= 0) {
        const line = this.buffer.slice(0, newline + 1).replace(/\r?\n$/, '');
        this.buffer = this.buffer.slice(newline + 1);
        if (line) {
          lines.push(line);
          const match = line.match(/^(\d{3})([ -])/);
          if (match && match[2] === ' ') {
            finalCode = Number(match[1]);
            break;
          }
        }
        newline = this.buffer.indexOf('\n');
      }
      if (finalCode !== null) break;

      const { value, done } = await this.reader.read();
      if (done) throw new Error(`SMTP connection closed unexpectedly: ${lines.join(' | ')}`);
      this.buffer += this.decoder.decode(value, { stream: true });
    }

    if (!expected.has(finalCode)) {
      throw new Error(`SMTP ${finalCode}: ${lines.join(' | ')}`);
    }
    return { code: finalCode, lines };
  }

  async writeLine(line) {
    await this.writer.write(this.encoder.encode(`${line}\r\n`));
  }

  async command(line, expectedCodes) {
    await this.writeLine(line);
    return this.readResponse(expectedCodes);
  }

  async writeData(message) {
    const dotStuffed = message.replace(/(^|\r\n)\./g, '$1..');
    await this.writer.write(this.encoder.encode(`${dotStuffed}\r\n.\r\n`));
    return this.readResponse(250);
  }

  release() {
    try { this.reader.releaseLock(); } catch {}
    try { this.writer.releaseLock(); } catch {}
  }
}

function buildConfirmationEmail(registration, registrationId, fromEmail, fromName) {
  const { date, time } = eventTimeForTimezone(registration.timezone);
  const name = `${registration.first_name} ${registration.last_name}`.trim();
  const safeName = escapeHtml(name);
  const safeEvent = escapeHtml(registration.event_name);
  const safeEmail = escapeHtml(registration.email);
  const safeRegistrationId = escapeHtml(registrationId || '');

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f7f4fb;font-family:Arial,Helvetica,sans-serif;color:#211b27;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f4fb;padding:28px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e7dff0;border-radius:18px;overflow:hidden;">
<tr><td style="height:5px;background:linear-gradient(90deg,#ff7142,#7c3aed,#3157f5);"></td></tr>
<tr><td style="padding:32px 34px 14px;">
<div style="font-size:24px;font-weight:800;letter-spacing:-0.5px;"><span style="color:#ff7142;">Wi</span><span style="color:#201a27;">studi</span></div>
<h1 style="margin:28px 0 8px;font-size:26px;line-height:1.2;color:#1f1830;">Registration confirmed</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#6d6676;">Hi ${safeName}, your place has been saved for <strong>${safeEvent}</strong>.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf8fd;border:1px solid #eee8f3;border-radius:14px;margin:18px 0 22px;">
<tr><td style="padding:18px 20px;font-size:14px;line-height:1.8;color:#4b4354;">
<strong>Event</strong><br>${safeEvent}<br><br>
<strong>Date</strong><br>${escapeHtml(date)}<br><br>
<strong>Time</strong><br>${escapeHtml(time)}<br><br>
<strong>Format</strong><br>Live online workshop<br><br>
<strong>Cost</strong><br>Free
</td></tr></table>
<p style="margin:0 0 12px;font-size:14px;line-height:1.65;color:#5f5868;">We will send joining details and any final workshop information to <strong>${safeEmail}</strong> before the session.</p>
<p style="margin:0 0 24px;font-size:14px;line-height:1.65;color:#5f5868;">You do not need to register again.</p>
<div style="padding-top:18px;border-top:1px solid #eee8f3;font-size:12px;line-height:1.6;color:#948a9d;">Registration ID: ${safeRegistrationId}<br>Questions? Email <a href="mailto:support@wistudi.com" style="color:#6d28d9;">support@wistudi.com</a>.</div>
</td></tr></table>
</td></tr></table>
</body></html>`;

  const subject = 'Your Wistudi workshop registration is confirmed';
  const encodedHtml = wrapBase64(utf8Base64(html));
  const messageId = `<${crypto.randomUUID()}@wistudi.com>`;
  const senderName = headerSafe(fromName || 'Wistudi Events');
  const senderEmail = headerSafe(fromEmail);
  const recipient = headerSafe(registration.email);

  return [
    `From: ${senderName} <${senderEmail}>`,
    `To: ${recipient}`,
    `Reply-To: ${senderEmail}`,
    `Subject: ${subject}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: ${messageId}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    encodedHtml
  ].join('\r\n');
}

async function sendProtonConfirmation(env, registration, registrationId) {
  const username = clean(env.PROTON_SMTP_USERNAME, 240);
  const token = String(env.PROTON_SMTP_TOKEN || '');
  const fromName = clean(env.PROTON_SMTP_FROM_NAME || 'Wistudi Events', 120);
  if (!username || !token) return { sent: false, reason: 'not_configured' };

  let socket;
  let secureSocket;
  try {
    socket = connect({ hostname: SMTP_HOST, port: SMTP_PORT }, { secureTransport: 'starttls' });
    await socket.opened;
    const plain = new SmtpSession(socket);
    await plain.readResponse(220);
    await plain.command('EHLO wistudi.com', 250);
    await plain.command('STARTTLS', 220);
    plain.release();

    secureSocket = socket.startTls();
    await secureSocket.opened;
    const smtp = new SmtpSession(secureSocket);
    await smtp.command('EHLO wistudi.com', 250);

    const auth = btoa(`\u0000${username}\u0000${token}`);
    await smtp.command(`AUTH PLAIN ${auth}`, 235);
    await smtp.command(`MAIL FROM:<${username}>`, 250);
    await smtp.command(`RCPT TO:<${registration.email}>`, [250, 251]);
    await smtp.command('DATA', 354);
    await smtp.writeData(buildConfirmationEmail(registration, registrationId, username, fromName));
    try { await smtp.command('QUIT', 221); } catch {}
    smtp.release();
    try { await secureSocket.close(); } catch {}
    return { sent: true };
  } catch (error) {
    console.error('Proton SMTP confirmation email failed:', error);
    try { if (secureSocket) await secureSocket.close(); } catch {}
    try { if (socket) await socket.close(); } catch {}
    return { sent: false, reason: 'send_failed' };
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json();

    if (data.event_extra_field) return respond(200, { ok: true });

    const registration = {
      event_id: clean(data.event_id, 120),
      event_name: clean(data.event_name, 240),
      first_name: clean(data.first_name, 100),
      last_name: clean(data.last_name, 100),
      email: clean(data.email, 200).toLowerCase(),
      country: clean(data.country, 120),
      organisation_type: clean(data.organisation_type, 160),
      organisation_name: clean(data.organisation_name, 200),
      role: clean(data.role, 180),
      timezone: clean(data.timezone, 120),
      privacy_consent: Boolean(data.privacy_consent),
      marketing_consent: Boolean(data.marketing_consent),
      utm_source: clean(data.utm_source, 160),
      utm_medium: clean(data.utm_medium, 160),
      utm_campaign: clean(data.utm_campaign, 200),
      utm_content: clean(data.utm_content, 200),
      outreach_token: clean(data.outreach_token, 200)
    };

    if (!registration.event_id || !registration.event_name || !registration.first_name || !registration.last_name || !registration.email || !registration.country || !registration.organisation_type || !registration.role) {
      return respond(400, { error: 'Please complete all required registration fields.' });
    }
    if (!emailOk(registration.email)) return respond(400, { error: 'Please enter a valid email address.' });
    if (!registration.privacy_consent) return respond(400, { error: 'Privacy Policy agreement is required.' });

    const sheetsWebhookUrl = env.EVENTS_SHEETS_WEBHOOK_URL || DEFAULT_EVENTS_SHEETS_WEBHOOK_URL;
    const sheetsWebhookSecret = env.EVENTS_SHEETS_WEBHOOK_SECRET || env.EVENTS_WEBHOOK_SECRET || '';

    if (!sheetsWebhookSecret) {
      console.error('Event registration storage secret is not configured.');
      return respond(503, { error: 'Registration storage is being connected. Please try again shortly.' });
    }

    const registrationId = crypto.randomUUID();
    const registeredAt = new Date().toISOString();

    const storageResponse = await fetch(sheetsWebhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        secret: sheetsWebhookSecret,
        action: 'register',
        registration_id: registrationId,
        registered_at: registeredAt,
        ...registration
      })
    });

    if (!storageResponse.ok) {
      const providerError = await storageResponse.text();
      console.error('Event registration sheet webhook failed:', providerError);
      return respond(502, { error: 'We could not save your registration. Please try again.' });
    }

    const storage = await storageResponse.json().catch(() => ({}));
    if (!storage.ok) {
      console.error('Event registration sheet webhook rejected request:', storage);
      return respond(502, { error: storage.error || 'We could not save your registration. Please try again.' });
    }

    const storedRegistrationId = storage.registration_id || registrationId;
    const confirmation = await sendProtonConfirmation(env, registration, storedRegistrationId);

    return respond(200, {
      ok: true,
      duplicate: Boolean(storage.duplicate),
      registration_id: storedRegistrationId,
      confirmation_email_sent: confirmation.sent,
      confirmation_email_status: confirmation.reason || 'sent'
    });
  } catch (error) {
    console.error('Event registration processing error:', error);
    return respond(500, { error: 'Unable to process registration.' });
  }
}
