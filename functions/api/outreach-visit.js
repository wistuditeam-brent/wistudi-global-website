const TOKEN_RE = /^WST-[A-Za-z0-9_-]{8,128}$/;
const SESSION_RE = /^[A-Za-z0-9-]{16,128}$/;
const EVENTS = new Set(['click','pointerdown','touchstart','keydown','scroll','visible_focus']);
const CONFIDENCE = new Set(['confirmed','probable']);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

export async function onRequestPost(context) {
  const request = context.request;
  const origin = request.headers.get('Origin');
  const expectedOrigin = new URL(request.url).origin;
  if (origin && origin !== expectedOrigin) return json({ ok: false }, 403);

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return json({ ok: false }, 400);
  }

  const token = String(body?.token || '');
  const event = String(body?.event || '');
  const confidence = String(body?.confidence || '');
  const pagePath = String(body?.page_path || '');
  const clientTimestamp = String(body?.client_timestamp || '');
  const sessionIdentifier = String(body?.session_identifier || '');

  if (!TOKEN_RE.test(token)) return json({ ok: false }, 400);
  if (!EVENTS.has(event) || !CONFIDENCE.has(confidence)) return json({ ok: false }, 400);
  if (!pagePath.startsWith('/') || pagePath.length > 500) return json({ ok: false }, 400);
  if (!SESSION_RE.test(sessionIdentifier)) return json({ ok: false }, 400);
  if (!Number.isFinite(Date.parse(clientTimestamp))) return json({ ok: false }, 400);

  const webhook = context.env.OUTREACH_VISIT_WEBHOOK_URL;
  if (!webhook) return json({ ok: false, error: 'tracking_not_configured' }, 503);

  const forwarded = {
    token,
    event,
    confidence,
    page_path: pagePath,
    client_timestamp: clientTimestamp,
    session_identifier: sessionIdentifier
  };

  try {
    const response = await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(forwarded)
    });
    if (!response.ok) return json({ ok: false }, 502);
  } catch (_) {
    return json({ ok: false }, 502);
  }

  return json({ ok: true });
}

export function onRequestGet() {
  return json({ ok: false }, 405);
}
