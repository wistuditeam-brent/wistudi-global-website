const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

const respond = (status, payload) => new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS });
const clean = (value, max = 500) => String(value ?? '').trim().slice(0, max);
const emailOk = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const DEFAULT_EVENTS_SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyyM-dUwPLUk8FyhoLfl-jRJciUK8cU4gn0kTf_g4aqLdQb8uYJfmkuastG1llURxGm/exec';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json();

    // Honeypot: silently accept bot submissions without storing anything.
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

    if (!env.EVENTS_SHEETS_WEBHOOK_SECRET) {
      console.error('Event registration storage secret is not configured.');
      return respond(503, { error: 'Registration storage is being connected. Please try again shortly.' });
    }

    const registrationId = crypto.randomUUID();
    const registeredAt = new Date().toISOString();

    const storageResponse = await fetch(sheetsWebhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        secret: env.EVENTS_SHEETS_WEBHOOK_SECRET,
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

    // Duplicate registrations are treated as success so the attendee is not blocked.
    if (storage.duplicate) {
      return respond(200, { ok: true, duplicate: true, registration_id: storage.registration_id || null });
    }

    // Optional internal notification. Registration storage remains the source of truth.
    if (env.RESEND_API_KEY) {
      const from = env.EVENTS_FROM_EMAIL || 'Wistudi Events <website@send.wistudi.com>';
      const to = env.EVENTS_NOTIFY_EMAIL || 'support@wistudi.com';
      const safe = (value) => String(value || '').replace(/[<>]/g, '');
      const text = [
        'New Wistudi event registration', '',
        `Event: ${safe(registration.event_name)}`,
        `Registration ID: ${safe(registrationId)}`,
        `Name: ${safe(registration.first_name)} ${safe(registration.last_name)}`,
        `Email: ${safe(registration.email)}`,
        `Country: ${safe(registration.country)}`,
        `Organisation type: ${safe(registration.organisation_type)}`,
        `Organisation / school: ${safe(registration.organisation_name)}`,
        `Role: ${safe(registration.role)}`,
        `Timezone: ${safe(registration.timezone)}`,
        `Marketing consent: ${registration.marketing_consent ? 'Yes' : 'No'}`,
        `Registered: ${registeredAt}`
      ].join('\n');

      try {
        const mail = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
          body: JSON.stringify({ from, to: [to], reply_to: registration.email, subject: `New event registration — ${registration.event_name}`, text })
        });
        if (!mail.ok) console.error('Event registration notification email failed:', await mail.text());
      } catch (mailError) {
        console.error('Event registration notification email error:', mailError);
      }
    }

    return respond(200, { ok: true, registration_id: registrationId });
  } catch (error) {
    console.error('Event registration processing error:', error);
    return respond(500, { error: 'Unable to process registration.' });
  }
}
