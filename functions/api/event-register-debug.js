const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };

export async function onRequestGet(context) {
  const env = context.env || {};
  const keys = Object.keys(env).sort();
  return new Response(JSON.stringify({
    ok: true,
    environment_has_registration_secret: Boolean(env.EVENTS_SHEETS_WEBHOOK_SECRET),
    environment_has_resend_key: Boolean(env.RESEND_API_KEY),
    available_binding_names: keys
  }), {
    status: 200,
    headers: JSON_HEADERS
  });
}
