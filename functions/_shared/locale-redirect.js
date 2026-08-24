const VALID = new Set(['en','vi','th','id','ms','zh']);
const COUNTRY_TO_LOCALE = {
  VN: 'vi',
  TH: 'th',
  ID: 'id',
  MY: 'ms',
  CN: 'zh'
};

function getCookie(request, name) {
  const cookie = request.headers.get('Cookie') || '';
  for (const part of cookie.split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key !== name) continue;
    try { return decodeURIComponent(value.join('=')); }
    catch (_) { return value.join('='); }
  }
  return null;
}

export function chooseLocale(request) {
  const saved = getCookie(request, 'wistudi_locale');
  if (VALID.has(saved)) return saved;
  const country = String(request.cf?.country || '').toUpperCase();
  return COUNTRY_TO_LOCALE[country] || 'en';
}

export function localeRedirect(request, suffix = '/') {
  const locale = chooseLocale(request);
  const source = new URL(request.url);
  const target = new URL(`/${locale}${suffix}`, source.origin);
  target.search = source.search;
  return new Response(null, {
    status: 302,
    headers: {
      'Location': target.toString(),
      'Cache-Control': 'private, no-store, max-age=0',
      'Vary': 'Cookie'
    }
  });
}
