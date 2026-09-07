const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };

export async function onRequestGet(context) {
  const env = context.env || {};
  const keys = Object.keys(env).sort();
  return new Response(JSON.stringify({
    ok: true,
    environment_has_registration_secret: Boolean(env.EVENTS_SHEETS_WEBHOOK_SECRET || env.EVENTS_WEBHOOK_SECRET),
    environment_has_proton_username: Boolean(env.PROTON_SMTP_USERNAME),
    environment_has_proton_token: Boolean(env.PROTON_SMTP_TOKEN),
    environment_has_proton_from_name: Boolean(env.PROTON_SMTP_FROM_NAME),
    available_binding_names: keys
  }), {
    status: 200,
    headers: JSON_HEADERS
  });
}
