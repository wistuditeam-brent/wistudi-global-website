const SUPPORTED = ['en','vi','zh-cn','th','id','ms','ar'];
const PAGE_ROOTS = ['/', '/index.html', '/platform', '/platform/', '/platform/index.html', '/blocks-activities', '/blocks-activities/', '/blocks-activities/index.html', '/organisations', '/organisations/', '/organisations/index.html', '/contact', '/contact/', '/contact/index.html'];

function cookieLocale(cookieHeader='') {
  const match = cookieHeader.match(/(?:^|;\s*)wistudi_locale=([^;]+)/i);
  if (!match) return null;
  const value = decodeURIComponent(match[1]).toLowerCase();
  return SUPPORTED.includes(value) ? value : null;
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

function isWebsitePage(pathname) {
  const clean = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0,-1) : pathname;
  return PAGE_ROOTS.includes(pathname) || PAGE_ROOTS.includes(clean) || /^\/(blocks-activities|organisations|contact)(?:\/index\.html)?$/.test(pathname);
}

function localizedTarget(url, locale) {
  let path = url.pathname;
  if (path === '/index.html' || path === '/platform' || path === '/platform/' || path === '/platform/index.html') path = '/';
  if (!path.startsWith('/')) path = '/' + path;
  return `/${locale}${path === '/' ? '/' : path}${url.search}${url.hash}`;
}

export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);
  const explicit = explicitLocale(url.pathname);

  // On unprefixed website pages, use a saved manual choice first, then the
  // browser/device language. English remains on the canonical root URLs.
  if (!explicit && isWebsitePage(url.pathname)) {
    const preferred = cookieLocale(request.headers.get('cookie') || '') || browserLocale(request.headers.get('accept-language') || '');
    if (preferred && preferred !== 'en') {
      return Response.redirect(new URL(localizedTarget(url, preferred), url.origin), 302);
    }
  }

  const response = await context.next();
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const locale = explicit || 'en';
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const lang = locale === 'zh-cn' ? 'zh-CN' : locale;
  const preload = locale === 'en' ? '' : `
    <style id="ws-i18n-preload">html.ws-i18n-pending body{visibility:hidden}html.i18n-ready body{visibility:visible}</style>
    <script>(function(){document.documentElement.lang='${lang}';document.documentElement.dir='${dir}';document.documentElement.classList.add('ws-i18n-pending');setTimeout(function(){document.documentElement.classList.remove('ws-i18n-pending')},2500)})();</script>`;

  return new HTMLRewriter()
    .on('head', {
      element(element) {
        element.append(`${preload}<script src="/assets/js/i18n.js" defer></script>`, { html: true });
      }
    })
    .transform(response);
}
