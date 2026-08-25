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

const EARLY_BOOTSTRAP = `<style id="ws-i18n-preload">html.ws-i18n-pending body{visibility:hidden}html.i18n-ready body{visibility:visible}</style>
<script>(function(){
  var supported=['en','vi','zh-cn','th','id','ms','ar'];
  var parts=location.pathname.split('/').filter(Boolean);
  var explicit=supported.indexOf((parts[0]||'').toLowerCase())>-1?(parts[0]||'').toLowerCase():null;
  var map=function(lang){lang=(lang||'').toLowerCase();if(lang.indexOf('zh')===0)return'zh-cn';if(lang.indexOf('vi')===0)return'vi';if(lang.indexOf('th')===0)return'th';if(lang.indexOf('id')===0)return'id';if(lang.indexOf('ms')===0)return'ms';if(lang.indexOf('ar')===0)return'ar';if(lang.indexOf('en')===0)return'en';return null};
  var cookie=(document.cookie.match(/(?:^|;\\s*)wistudi_locale=([^;]+)/i)||[])[1];
  try{cookie=cookie?decodeURIComponent(cookie).toLowerCase():null}catch(e){cookie=null}
  var stored=null;try{stored=localStorage.getItem('wistudi_locale')}catch(e){}
  var isPage=/^\\/(?:|index\\.html|platform\\/?|platform\\/index\\.html|blocks-activities\\/?|blocks-activities\\/index\\.html|organisations\\/?|organisations\\/index\\.html|contact\\/?|contact\\/index\\.html)$/.test(location.pathname);
  if(!explicit&&isPage){
    var langs=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||'en'];
    var browser='en';for(var i=0;i<langs.length;i++){var m=map(langs[i]);if(m){browser=m;break}}
    var preferred=(stored&&supported.indexOf(stored)>-1?stored:null)||(cookie&&supported.indexOf(cookie)>-1?cookie:null)||browser;
    if(preferred&&preferred!=='en'){
      var p=location.pathname;if(p==='/index.html'||p==='/platform'||p==='/platform/'||p==='/platform/index.html')p='/';
      location.replace('/'+preferred+(p==='/'?'/':p)+location.search+location.hash);return;
    }
  }
  if(explicit&&explicit!=='en'){
    document.documentElement.lang=explicit==='zh-cn'?'zh-CN':explicit;
    document.documentElement.dir=explicit==='ar'?'rtl':'ltr';
    document.documentElement.classList.add('ws-i18n-pending');
    setTimeout(function(){document.documentElement.classList.remove('ws-i18n-pending')},2500);
  }
})();</script>`;

export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);
  const explicit = explicitLocale(url.pathname);

  // Server-side first visit routing. A saved manual choice wins; otherwise use
  // the browser/device Accept-Language header. English keeps canonical root URLs.
  if (!explicit && isWebsitePage(url.pathname)) {
    const preferred = cookieLocale(request.headers.get('cookie') || '') || browserLocale(request.headers.get('accept-language') || '');
    if (preferred && preferred !== 'en') {
      return Response.redirect(new URL(localizedTarget(url, preferred), url.origin), 302);
    }
  }

  const response = await context.next();
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
