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
    if (key === name) return decodeURIComponent(value.join('='));
  }
  return null;
}

export function onRequest(context) {
  const saved = getCookie(context.request, 'wistudi_locale');
  const country = String(context.request.cf?.country || '').toUpperCase();
  const locale = VALID.has(saved) ? saved : (COUNTRY_TO_LOCALE[country] || 'en');
  const target = new URL(`/${locale}/`, context.request.url);
  const response = Response.redirect(target.toString(), 302);
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  response.headers.set('Vary', 'Cookie');
  return response;
}
