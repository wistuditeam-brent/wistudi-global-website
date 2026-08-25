const SUPPORTED = ['en','vi','zh-cn','th','id','ms','ar'];
const CANONICAL_PAGES = new Set(['/', '/blocks-activities/', '/organisations/', '/contact/']);

function cookieLocale(cookieHeader='') {
  const match = cookieHeader.match(/(?:^|;\s*)wistudi_locale=([^;]+)/i);
  if (!match) return null;
  try {
    const value = decodeURIComponent(match[1]).toLowerCase();
    return SUPPORTED.includes(value) ? value : null;
  } catch (_) {
    return null;
  }
}

function browserLocale(header='') {
  const langs = header.split(',').map(part => part.trim().split(';')[0].toLowerCase()).filter(Boolean);
  for (const lang of langs) {
    if (lang === 'zh-cn' || lang.startsWith('zh-hans') || lang.startsWith('zh-cn') || lang.startsWith('zh-sg')) return 'zh-cn';
    if (lang.startsWith('vi')) return 'vi';
    if (lang.startsWith('th')) return 'th';
    if (lang.startsWith('id')) return 'id';
    if (lang.startsWith('ms')) return 'ms';
    if (lang.startsWith('ar')) return 'ar';
    if (lang.startsWith('en')) return 'en';
  }
  return 'en';
}

function explicitLocale(pathname) {
  const first = pathname.split('/').filter(Boolean)[0]?.toLowerCase();
  return SUPPORTED.includes(first) ? first : null;
}

function stripLocale(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length && SUPPORTED.includes(parts[0].toLowerCase())) parts.shift();
  return '/' + parts.join('/');
}

function canonicalPagePath(pathname) {
  let path = stripLocale(pathname);
  if (!path || path === '/' || path === '/index.html' || path === '/platform' || path === '/platform/' || path === '/platform/index.html') return '/';
  path = path.replace(/\/index\.html$/i, '/');
  if (!path.endsWith('/')) path += '/';
  return CANONICAL_PAGES.has(path) ? path : null;
}

function isCanonicalWebsitePage(pathname) {
  return canonicalPagePath(pathname) !== null && !explicitLocale(pathname);
}

function localizedTarget(url, locale) {
  const page = canonicalPagePath(url.pathname) || '/';
  return `/${locale}${page}${url.search}${url.hash}`;
}

function canonicalAssetUrl(url) {
  const stripped = stripLocale(url.pathname);
  if (!stripped.startsWith('/assets/')) return null;
  const assetUrl = new URL(url.toString());
  assetUrl.pathname = stripped;
  return assetUrl;
}

const EARLY_BOOTSTRAP = `<style id="ws-i18n-preload">
html.ws-i18n-pending body{opacity:0;transition:opacity .12s ease}
html.i18n-ready body,html:not(.ws-i18n-pending) body{opacity:1}
</style>
<script>(function(){
  var supported=['en','vi','zh-cn','th','id','ms','ar'];
  var parts=location.pathname.split('/').filter(Boolean);
  var explicit=supported.indexOf((parts[0]||'').toLowerCase())>-1?(parts[0]||'').toLowerCase():null;
  var stored=null;try{stored=localStorage.getItem('wistudi_locale')}catch(e){}
  var cookie=(document.cookie.match(/(?:^|;\\s*)wistudi_locale=([^;]+)/i)||[])[1];
  try{cookie=cookie?decodeURIComponent(cookie).toLowerCase():null}catch(e){cookie=null}
  var isRootPage=/^\\/(?:|index\\.html|platform\\/?|platform\\/index\\.html|blocks-activities\\/?|blocks-activities\\/index\\.html|organisations\\/?|organisations\\/index\\.html|contact\\/?|contact\\/index\\.html)$/.test(location.pathname);
  if(!explicit&&isRootPage&&stored&&supported.indexOf(stored)>-1&&stored!=='en'&&stored!==cookie){
    var p=location.pathname;
    if(p==='/index.html'||p==='/platform'||p==='/platform/'||p==='/platform/index.html')p='/';
    location.replace('/'+stored+(p==='/'?'/':p)+location.search+location.hash);return;
  }
  if(explicit&&explicit!=='en'){
    document.documentElement.lang=explicit==='zh-cn'?'zh-CN':explicit;
    document.documentElement.dir=explicit==='ar'?'rtl':'ltr';
    document.documentElement.classList.add('ws-i18n-pending');
    setTimeout(function(){document.documentElement.classList.remove('ws-i18n-pending')},900);
  }
})();</script>`;

function injectLocaleController(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;
  return new HTMLRewriter()
    .on('head', {
      element(element) {
        element.append(`${EARLY_BOOTSTRAP}<script src="/assets/js/i18n.js" defer></script>`, { html: true });
      }
    })
    .transform(response);
}

export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);
  const explicit = explicitLocale(url.pathname);

  // Locale-prefixed static assets are served directly from the canonical /assets path.
  // This avoids relying on _redirects, which Cloudflare does not apply to Pages Function routes.
  if (explicit) {
    const assetUrl = canonicalAssetUrl(url);
    if (assetUrl) return context.env.ASSETS.fetch(assetUrl);
  }

  // First visit: saved cookie preference wins; otherwise use browser/device language.
  // A manual choice is written to the cookie by assets/js/i18n.js.
  if (!explicit && isCanonicalWebsitePage(url.pathname)) {
    const preferred = cookieLocale(request.headers.get('cookie') || '') || browserLocale(request.headers.get('accept-language') || '');
    if (preferred && preferred !== 'en') {
      return Response.redirect(new URL(localizedTarget(url, preferred), url.origin), 302);
    }
  }

  // Locale-prefixed page URLs are served from the current canonical English HTML source.
  // The visible copy is localized client-side, while layout/assets remain a single source of truth.
  if (explicit) {
    const pagePath = canonicalPagePath(url.pathname);
    if (pagePath) {
      const assetUrl = new URL(url.toString());
      assetUrl.pathname = pagePath;
      const response = await context.env.ASSETS.fetch(assetUrl);
      return injectLocaleController(response);
    }
  }

  const response = await context.next();
  return injectLocaleController(response);
}
