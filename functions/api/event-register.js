const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };
const DEFAULT_EVENTS_SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyyM-dUwPLUk8FyhoLfl-jRJciUK8cU4gn0kTf_g4aqLdQb8uYJfmkuastG1llURxGm/exec';

const EVENTS = Object.freeze({
  'communicative-esl-flow-2026-09-15': Object.freeze({
    name: 'Building a Communicative ESL Lesson with Flow',
    startIso: '2026-09-15T14:00:00+07:00',
    zoomUrl: 'https://us05web.zoom.us/j/89878175931?pwd=GMeXxQKb9nIehaEG7cJaM5bEmrdipU.1',
    pageUrl: 'https://global.wistudi.com/resources/events/building-a-communicative-esl-lesson-with-flow/'
  })
});

const respond = (status, payload) => new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS });
const clean = (value, max = 500) => String(value ?? '').trim().slice(0, max);
const emailOk = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

function eventTimeForTimezone(startIso, timezone) {
  const fallback = 'Asia/Ho_Chi_Minh';
  let zone = timezone || fallback;
  try {
    new Intl.DateTimeFormat('en', { timeZone: zone }).format(new Date());
  } catch {
    zone = fallback;
  }
  const start = new Date(startIso);
  const date = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: zone
  }).format(start);
  const time = new Intl.DateTimeFormat('en-GB', {
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone: zone
  }).format(start);
  return { date, time, zone };
}

function buildConfirmationEmail(registration, registrationId, event) {
  const { date, time } = eventTimeForTimezone(event.startIso, registration.timezone);
  const name = `${registration.first_name} ${registration.last_name}`.trim();
  const safeName = escapeHtml(name);
  const safeEvent = escapeHtml(event.name);
  const safeEmail = escapeHtml(registration.email);
  const safeRegistrationId = escapeHtml(registrationId || '');
  const safeZoomUrl = escapeHtml(event.zoomUrl);
  const safeEventPage = escapeHtml(event.pageUrl);

  const text = [
    'Registration confirmed',
    '',
    `Hi ${name}, your place has been saved for ${event.name}.`,
    '',
    `Date: ${date}`,
    `Time: ${time}`,
    'Format: Live online workshop',
    'Cost: Free',
    '',
    'Join the live workshop on Zoom',
    'The Zoom room opens 15 minutes before the workshop.',
    event.zoomUrl,
    '',
    `Event page: ${event.pageUrl}`,
    '',
    `We’ll use ${registration.email} for any final workshop updates.`,
    `Registration ID: ${registrationId || ''}`,
    '',
    'Questions? Email support@wistudi.com.'
  ].join('\n');

  const html = `<!doctype html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="X-UA-Compatible" content="IE=edge"><title>Wistudi workshop registration confirmed</title></head>
<body style="margin:0;padding:0;background-color:#f7f4fb;font-family:Arial,Helvetica,sans-serif;color:#211b27;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:#f7f4fb;"><tr><td align="center" bgcolor="#f7f4fb" style="background-color:#f7f4fb;padding-top:28px;padding-right:12px;padding-bottom:28px;padding-left:12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:620px;background-color:#ffffff;border:1px solid #e7dff0;border-radius:18px;overflow:hidden;">
<tr><td bgcolor="#6d28d9" style="height:5px;background-color:#6d28d9;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td bgcolor="#ffffff" style="background-color:#ffffff;padding-top:32px;padding-right:34px;padding-bottom:28px;padding-left:34px;">
<p style="margin-top:0;margin-right:0;margin-bottom:24px;margin-left:0;font-family:Arial,Helvetica,sans-serif;font-size:24px;line-height:29px;color:#201a27;font-weight:800;"><span style="color:#ff7142;">Wi</span>studi</p>
<h1 style="margin-top:0;margin-right:0;margin-bottom:8px;margin-left:0;font-family:Arial,Helvetica,sans-serif;font-size:26px;line-height:32px;color:#1f1830;font-weight:800;">Registration confirmed</h1>
<p style="margin-top:0;margin-right:0;margin-bottom:20px;margin-left:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:25px;color:#6d6676;font-weight:400;">Hi ${safeName}, your place has been saved for <strong>${safeEvent}</strong>.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:#faf8fd;border:1px solid #eee8f3;border-radius:14px;"><tr><td bgcolor="#faf8fd" style="background-color:#faf8fd;padding-top:18px;padding-right:20px;padding-bottom:18px;padding-left:20px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:24px;color:#4b4354;">
<strong>Date</strong><br>${escapeHtml(date)}<br><br><strong>Time</strong><br>${escapeHtml(time)}<br><br><strong>Format</strong><br>Live online workshop<br><br><strong>Cost</strong><br>Free
</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:22px;background-color:#f6f1ff;border:1px solid #e3d8f6;border-radius:14px;"><tr><td align="center" bgcolor="#f6f1ff" style="background-color:#f6f1ff;padding-top:22px;padding-right:20px;padding-bottom:22px;padding-left:20px;text-align:center;">
<p style="margin-top:0;margin-right:0;margin-bottom:7px;margin-left:0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:22px;color:#2b2040;font-weight:800;">Join the live workshop on Zoom</p>
<p style="margin-top:0;margin-right:0;margin-bottom:17px;margin-left:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#746a80;font-weight:400;">The Zoom room opens 15 minutes before the workshop.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-left:auto;margin-right:auto;"><tr><td align="center" bgcolor="#6d28d9" style="background-color:#6d28d9;border-radius:11px;padding-top:12px;padding-right:20px;padding-bottom:12px;padding-left:20px;"><a href="${safeZoomUrl}" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#ffffff;font-weight:700;text-decoration:none;display:block;">Join Zoom session</a></td></tr></table>
<p style="margin-top:14px;margin-right:0;margin-bottom:0;margin-left:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:17px;color:#92889c;font-weight:400;word-break:break-all;">${safeZoomUrl}</p>
</td></tr></table>
<p style="margin-top:20px;margin-right:0;margin-bottom:12px;margin-left:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:23px;color:#5f5868;font-weight:400;">Your Zoom joining link is included above. We’ll use <strong>${safeEmail}</strong> for any final workshop updates.</p>
<p style="margin-top:0;margin-right:0;margin-bottom:18px;margin-left:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:23px;color:#5f5868;font-weight:400;"><a href="${safeEventPage}" style="color:#6d28d9;text-decoration:none;font-weight:700;">View the event page</a></p>
<p style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:18px;border-top:1px solid #eee8f3;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:19px;color:#948a9d;font-weight:400;">Registration ID: ${safeRegistrationId}<br>Questions? Email <a href="mailto:support@wistudi.com" style="color:#6d28d9;text-decoration:none;">support@wistudi.com</a>.</p>
</td></tr></table>
</td></tr></table>
</body></html>`;

  return { html, text };
}

async function sendResendConfirmation(env, registration, registrationId, event) {
  const apiKey = String(env.RESEND_API_KEY || '').trim();
  if (!apiKey) return { sent: false, reason: 'not_configured' };

  const from = clean(env.EVENTS_FROM_EMAIL || 'Wistudi Events <events@send.wistudi.com>', 240);
  const replyTo = clean(env.EVENTS_REPLY_TO_EMAIL || 'support@wistudi.com', 240);
  const content = buildConfirmationEmail(registration, registrationId, event);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [registration.email],
        reply_to: replyTo,
        subject: 'Your Wistudi workshop registration is confirmed',
        text: content.text,
        html: content.html,
        tags: [
          { name: 'category', value: 'event-registration' },
          { name: 'event', value: registration.event_id }
        ]
      })
    });

    if (!response.ok) {
      const providerError = await response.text();
      console.error('Resend confirmation email failed:', providerError);
      return { sent: false, reason: 'send_failed' };
    }
    const provider = await response.json().catch(() => ({}));
    return { sent: true, id: provider.id || '' };
  } catch (error) {
    console.error('Resend confirmation email failed:', error);
    return { sent: false, reason: 'send_failed' };
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json();
    if (data.event_extra_field) return respond(200, { ok: true });

    const eventId = clean(data.event_id, 120);
    const event = EVENTS[eventId];
    if (!event) return respond(400, { error: 'Unknown or unavailable event.' });

    const registration = {
      event_id: eventId,
      event_name: event.name,
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

    if (!registration.first_name || !registration.last_name || !registration.email || !registration.country || !registration.organisation_type || !registration.role) {
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
    const confirmation = await sendResendConfirmation(env, registration, storedRegistrationId, event);

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
