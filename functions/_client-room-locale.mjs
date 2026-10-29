// Client Room language selection is intentionally independent of the public site's
// wistudi_locale cookie. Only English and Vietnamese Client Room pages exist.
const PREFERENCE_COOKIE = 'wistudi_client_room_locale';
const CLIENT_ROOT = '/client-room/';

function cookiePreference(header = '') {
 const match = String(header).match(/(?:^|;\\s*)wistudi_client_room_locale=(en|vi)(?:;|$)/i);
 return match ? match[1].toLowerCase() : null;
}

function browserPreference(header = '') {
 // The browser sends languages in preference order; only en and vi are supported here.
 for (const part of String(header).split(',')) {
  const language = part.split(';')[0].trim().toLowerCase();
  if (language === 'vi' || language.startsWith('vi-')) return 'vi';
  if (language === 'en' || language.startsWith('en-')) return 'en';
 }
 return 'en';
}

function sectionFor(pathname) {
 // Only route English entry points. Vietnamese URLs are explicit choices and
 // must never be redirected, avoiding loops on /client-room/vi/.
 const match = /^\\/client-room(?:\\/(contact|partner))?\\/?$/.exec(pathname);
 return match ? (match[1] || '') : null;
}

export function preferredClientRoomLocale(request) {
 const saved = cookiePreference(request.headers.get('cookie'));
 if (saved) return saved;
 const country = String(request.cf?.country || '').toUpperCase();
 if (/^[A-Z]{2}$/.test(country) && country !== 'XX' && country !== 'T1') {
  return country === 'VN' ? 'vi' : 'en';
 }
 return browserPreference(request.headers.get('accept-language'));
}

export function clientRoomLanguageRedirect(request) {
 if (request.method !== 'GET' && request.method !== 'HEAD') return null;
 const url = new URL(request.url);
 const section = sectionFor(url.pathname);
 if (section === null || preferredClientRoomLocale(request) !== 'vi') return null;
 url.pathname = CLIENT_ROOT + 'vi/' + (section ? section + '/' : '');
 return new Response(null, {
  status: 302,
  headers: {
   location: url.toString(),
   'cache-control': 'private, no-store',
   vary: 'Cookie, Accept-Language'
  }
 });
}

export { PREFERENCE_COOKIE };
