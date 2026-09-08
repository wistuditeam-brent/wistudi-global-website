import { onRequest as legacyOnRequest } from './_middleware-core.js';

const SUPPORTED = ['en','vi','zh-cn','th','id','ms','ar'];

function localeFromPath(pathname='') {
  const first = pathname.split('/').filter(Boolean)[0]?.toLowerCase();
  return SUPPORTED.includes(first) ? first : null;
}

function stripLocalePrefix(pathname='/') {
  const hadTrailingSlash = pathname.endsWith('/');
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length && SUPPORTED.includes(parts[0].toLowerCase())) parts.shift();
  let path = '/' + parts.join('/');
  if (!parts.length) path = '/';
  else if (hadTrailingSlash && !path.endsWith('/')) path += '/';
  return path;
}

function redirectLegacyLocale(url, locale) {
  const target = new URL(url.toString());
  target.pathname = stripLocalePrefix(url.pathname);
  if (locale === 'en') target.searchParams.delete('lang');
  else target.searchParams.set('lang', locale);
  return new Response(null, {
    status: 301,
    headers: {
      Location: target.toString(),
      'Cache-Control': 'public, max-age=300'
    }
  });
}

function requestWithoutAutomaticLanguageRedirect(request) {
  const headers = new Headers(request.headers);
  const existing = headers.get('cookie') || '';
  const cookies = existing
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)
    .filter(part => !/^wistudi_locale=/i.test(part));
  cookies.push('wistudi_locale=en');
  headers.set('cookie', cookies.join('; '));
  headers.set('accept-language', 'en');
  return new Request(request, { headers });
}

const CLIENT_LOCALE_GUARD = `<script id="ws-locale-routing-guard">(function(){
  try{
    var supported=['en','vi','zh-cn','th','id','ms','ar'];
    var q=(new URLSearchParams(location.search).get('lang')||'').toLowerCase();
    var chosen=supported.indexOf(q)>-1?q:'en';
    localStorage.setItem('wistudi_locale',chosen);
    document.cookie='wistudi_locale='+encodeURIComponent(chosen)+';path=/;max-age=31536000;SameSite=Lax';
  }catch(e){
    document.cookie='wistudi_locale=en;path=/;max-age=31536000;SameSite=Lax';
  }
})();</script>`;

function stabilizeClientLocale(response) {
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html') || response.status >= 300 && response.status < 400) return response;
  let transformed = new HTMLRewriter()
    .on('head', { element(el) { el.prepend(CLIENT_LOCALE_GUARD, { html:true }); } })
    .transform(response);
  transformed = new Response(transformed.body, transformed);
  return transformed;
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const explicit = localeFromPath(url.pathname);

  // Locale-prefixed URLs were the old routing model. Canonicalise them to the
  // stable path and carry language explicitly in ?lang= so Resources, Events,
  // registration and every other public route use the same URL model.
  if (explicit) return redirectLegacyLocale(url, explicit);

  // The public website must open in English unless the URL explicitly requests
  // another language. The legacy middleware used Accept-Language/cookies to
  // redirect first-time visitors, which caused Vietnamese to appear by default
  // for browsers in Vietnam and created mixed prefix/query URLs.
  const routedRequest = requestWithoutAutomaticLanguageRedirect(context.request);
  const routedContext = { ...context, request: routedRequest };
  const response = await legacyOnRequest(routedContext);
  return stabilizeClientLocale(response);
}
