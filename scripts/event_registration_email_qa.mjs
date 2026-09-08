import { onRequestPost } from '../functions/api/event-register.js';

const ZOOM = 'https://us05web.zoom.us/j/89878175931?pwd=GMeXxQKb9nIehaEG7cJaM5bEmrdipU.1';
const EVENT_ID = 'communicative-esl-flow-2026-09-15';
const EVENT_NAME = 'Building a Communicative ESL Lesson with Flow';
const originalFetch = globalThis.fetch;
const failures = [];

const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

async function runSuccessfulRegistrationTest() {
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('script.google.com')) {
      return new Response(JSON.stringify({ ok: true, duplicate: true, registration_id: 'qa-registration-id' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
    if (String(url) === 'https://api.resend.com/emails') {
      return new Response(JSON.stringify({ id: 'qa-resend-email-id' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
    throw new Error(`Unexpected fetch target: ${url}`);
  };

  const request = new Request('https://preview.example/api/event-register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      event_id: EVENT_ID,
      event_name: 'ATTACKER CONTROLLED EVENT NAME',
      first_name: 'QA',
      last_name: 'Registrant',
      email: 'qa-registrant@example.com',
      country: 'Vietnam',
      organisation_type: 'School',
      organisation_name: 'QA School',
      role: 'Teacher',
      timezone: 'Asia/Ho_Chi_Minh',
      privacy_consent: true,
      marketing_consent: false
    })
  });

  const response = await onRequestPost({
    request,
    env: {
      EVENTS_SHEETS_WEBHOOK_SECRET: 'qa-secret',
      RESEND_API_KEY: 'qa-resend-key',
      EVENTS_FROM_EMAIL: 'Wistudi Events <events@send.wistudi.com>',
      EVENTS_REPLY_TO_EMAIL: 'support@wistudi.com'
    }
  });
  const body = await response.json();

  expect(response.status === 200, `expected registration 200, got ${response.status}`);
  expect(body.ok === true, 'expected registration response ok=true');
  expect(body.duplicate === true, 'expected duplicate registrations to remain successful');
  expect(body.confirmation_email_sent === true, 'expected confirmation_email_sent=true when Resend accepts the message');
  expect(calls.length === 2, `expected two provider calls, got ${calls.length}`);

  const sheetCall = calls.find(call => call.url.includes('script.google.com'));
  const resendCall = calls.find(call => call.url === 'https://api.resend.com/emails');
  expect(!!sheetCall, 'Google Sheets storage call was not made');
  expect(!!resendCall, 'Resend confirmation call was not made');

  if (sheetCall) {
    const stored = JSON.parse(sheetCall.options.body || '{}');
    expect(stored.event_id === EVENT_ID, 'stored event ID is not the canonical event ID');
    expect(stored.event_name === EVENT_NAME, 'server did not replace client event_name with the canonical event name');
  }

  if (resendCall) {
    const email = JSON.parse(resendCall.options.body || '{}');
    expect(Array.isArray(email.to) && email.to[0] === 'qa-registrant@example.com', 'confirmation email is not addressed to the registrant email');
    expect(email.from === 'Wistudi Events <events@send.wistudi.com>', 'confirmation email sender is incorrect');
    expect(email.reply_to === 'support@wistudi.com', 'confirmation email reply-to is incorrect');
    expect(typeof email.subject === 'string' && /registration is confirmed/i.test(email.subject), 'confirmation email subject is incorrect');
    expect(typeof email.html === 'string' && email.html.includes(ZOOM), 'HTML confirmation email does not contain the exact Zoom link');
    expect(typeof email.text === 'string' && email.text.includes(ZOOM), 'plain-text confirmation email does not contain the exact Zoom link');
    expect(/Join Zoom session/.test(email.html || ''), 'HTML confirmation email does not include a Join Zoom session CTA');
  }
}

async function runUnknownEventTest() {
  let providerCalls = 0;
  globalThis.fetch = async () => {
    providerCalls += 1;
    throw new Error('Provider should not be called for an unknown event');
  };

  const request = new Request('https://preview.example/api/event-register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      event_id: 'made-up-event-id',
      event_name: 'Made Up Event',
      first_name: 'QA',
      last_name: 'Registrant',
      email: 'qa-registrant@example.com',
      country: 'Vietnam',
      organisation_type: 'School',
      role: 'Teacher',
      privacy_consent: true
    })
  });

  const response = await onRequestPost({ request, env: {} });
  const body = await response.json();
  expect(response.status === 400, `unknown event should return 400, got ${response.status}`);
  expect(/unknown|unavailable/i.test(body.error || ''), 'unknown event response does not explain the event is unavailable');
  expect(providerCalls === 0, 'unknown event reached an external provider');
}

try {
  await runSuccessfulRegistrationTest();
  await runUnknownEventTest();
} finally {
  globalThis.fetch = originalFetch;
}

if (failures.length) {
  console.error('Event registration email QA FAILED');
  failures.forEach(failure => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('Event registration confirmation QA passed: canonical event identity, registrant delivery, exact Zoom URL in HTML/text, and unknown-event rejection verified.');
