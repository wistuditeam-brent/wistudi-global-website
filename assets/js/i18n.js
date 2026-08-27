(()=>{
  const LOCALES={
    en:{label:'English',short:'EN',htmlLang:'en',dir:'ltr',flag:'<svg viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#012169"/><path d="M0 0 30 20M30 0 0 20" stroke="#fff" stroke-width="4"/><path d="M0 0 30 20M30 0 0 20" stroke="#C8102E" stroke-width="2"/><path d="M15 0v20M0 10h30" stroke="#fff" stroke-width="6"/><path d="M15 0v20M0 10h30" stroke="#C8102E" stroke-width="3.4"/></svg>'},
    vi:{label:'Tiếng Việt',short:'VI',htmlLang:'vi',dir:'ltr',flag:'<svg viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#DA251D"/><path fill="#FFFF00" d="m15 4.1 1.55 3.18 3.5.5-2.53 2.46.6 3.48L15 12.08l-3.12 1.64.6-3.48-2.53-2.46 3.5-.5z"/></svg>'},
    'zh-cn':{label:'简体中文',short:'中文',htmlLang:'zh-CN',dir:'ltr',flag:'<svg viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#DE2910"/><path fill="#FFDE00" d="m6 3.2.9 1.9 2.1.3-1.5 1.45.35 2.05L6 7.9 4.15 8.9l.35-2.05L3 5.4l2.1-.3z"/><circle cx="11.2" cy="3.1" r=".75" fill="#FFDE00"/><circle cx="13.2" cy="5.1" r=".75" fill="#FFDE00"/><circle cx="13.1" cy="7.7" r=".75" fill="#FFDE00"/><circle cx="10.8" cy="9.1" r=".75" fill="#FFDE00"/></svg>'},
    th:{label:'ไทย',short:'TH',htmlLang:'th',dir:'ltr',flag:'<svg viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#A51931"/><rect y="3.33" width="30" height="13.34" fill="#fff"/><rect y="6.67" width="30" height="6.66" fill="#2D2A4A"/></svg>'},
    id:{label:'Bahasa Indonesia',short:'ID',htmlLang:'id',dir:'ltr',flag:'<svg viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="10" fill="#CE1126"/><rect y="10" width="30" height="10" fill="#fff"/></svg>'},
    ms:{label:'Bahasa Melayu',short:'MS',htmlLang:'ms',dir:'ltr',flag:'<svg viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#fff"/><g fill="#CC0001"><rect y="0" width="30" height="1.54"/><rect y="3.08" width="30" height="1.54"/><rect y="6.16" width="30" height="1.54"/><rect y="9.24" width="30" height="1.54"/><rect y="12.32" width="30" height="1.54"/><rect y="15.4" width="30" height="1.54"/><rect y="18.48" width="30" height="1.52"/></g><rect width="15" height="10.78" fill="#010066"/><circle cx="6.2" cy="5.4" r="3.1" fill="#FFCC00"/><circle cx="7.25" cy="5.4" r="2.55" fill="#010066"/><path fill="#FFCC00" d="m11.2 2.7.55 1.2 1.3-.1-.98.88.5 1.22-1.13-.7-1.02.86.28-1.27-1.12-.67 1.3-.12z"/></svg>'},
    ar:{label:'العربية',short:'AR',htmlLang:'ar',dir:'rtl',flag:'<svg viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#006C35"/><path d="M7 6.3h16M8 8h14M9 9.7h12" stroke="#fff" stroke-width=".7" stroke-linecap="round"/><path d="M8 14.2h13.5c1.3 0 2.3-.45 3.1-1.15" fill="none" stroke="#fff" stroke-width="1" stroke-linecap="round"/></svg>'}
  };
  const localeCodes=Object.keys(LOCALES);
  const knownPages=['/','/index.html','/platform/','/platform/index.html','/blocks-activities/','/blocks-activities/index.html','/organisations/','/organisations/index.html','/contact/','/contact/index.html'];
  const ready=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();

  const pathParts=location.pathname.split('/').filter(Boolean);
  const explicitLocale=localeCodes.includes((pathParts[0]||'').toLowerCase())?pathParts[0].toLowerCase():null;
  const detected=explicitLocale||'en';
  const locale=LOCALES[detected]||LOCALES.en;

  const savePreference=code=>{
    if(!LOCALES[code])return;
    try{localStorage.setItem('wistudi_locale',code)}catch(_){ }
    document.cookie=`wistudi_locale=${encodeURIComponent(code)};path=/;max-age=31536000;SameSite=Lax`;
  };

  try{
    const stored=localStorage.getItem('wistudi_locale');
    if(stored&&LOCALES[stored]&&!document.cookie.includes('wistudi_locale=')){
      document.cookie=`wistudi_locale=${encodeURIComponent(stored)};path=/;max-age=31536000;SameSite=Lax`;
    }
  }catch(_){ }

  const stripLocale=(pathname=location.pathname)=>{
    const parts=pathname.split('/').filter(Boolean);
    if(parts.length&&localeCodes.includes(parts[0].toLowerCase()))parts.shift();
    let p='/'+parts.join('/');
    if(pathname.endsWith('/')&&!p.endsWith('/'))p+='/';
    if(p==='/index.html')p='/';
    return p||'/';
  };

  const basePath=stripLocale();
  const normalizeSeoPath=p=>p==='/'?'/':p.replace(/index\.html$/,'');
  const seoPath=normalizeSeoPath(basePath);

  const withLocale=(code,path=basePath)=>{
    let clean=stripLocale(path);
    if(clean==='/index.html')clean='/';
    const suffix=(location.search||'')+(location.hash||'');
    return code==='en'?clean+suffix:`/${code}${clean==='/'?'/':clean}`+suffix;
  };

  document.documentElement.lang=locale.htmlLang;
  document.documentElement.dir=locale.dir;
  document.documentElement.dataset.locale=detected;

  const style=document.createElement('style');
  style.textContent=`
    .ws-site-header{z-index:10000!important}
    .ws-lang{z-index:10020!important}
    .ws-lang-menu{z-index:10030!important}
    .ws-mobile-menu{position:relative;z-index:10010}
    .ws-lang-toggle{gap:7px}
    .ws-lang-flag{display:inline-flex;align-items:center;justify-content:center;width:24px;height:16px;flex:0 0 24px;border-radius:2px;overflow:hidden;box-shadow:0 0 0 1px rgba(24,21,35,.12)}
    .ws-lang-flag svg{display:block;width:24px;height:16px}
    .ws-lang-option[href]{text-decoration:none;cursor:pointer}
    .ws-lang-option[href]:hover{background:#faf8fd;color:#4f465b}
    .ws-lang-option-main{display:flex;align-items:center;gap:9px;min-width:0}
    [dir="rtl"] body{text-align:right}
    [dir="rtl"] .ws-lang-menu{right:auto;left:0}
    [dir="rtl"] .ws-lang-option{text-align:right}
    [dir="rtl"] .ws-nav-links,[dir="rtl"] .ws-nav-actions,[dir="rtl"] .ws-mobile-actions{direction:rtl}
    [dir="rtl"] .ws-footer-links,[dir="rtl"] .ws-footer-contact{direction:rtl}
    [dir="rtl"] .hero-copy,[dir="rtl"] .demo-copy,[dir="rtl"] .screen-copy,[dir="rtl"] .contact-copy,[dir="rtl"] .booking-intro,[dir="rtl"] .section-head{text-align:right}
    [dir="rtl"] .bullet-list,[dir="rtl"] .check-list,[dir="rtl"] .trust-list{padding-right:0}
  `;
  document.head.appendChild(style);

  const canonicalOrigin='https://global.wistudi.com';
  const addAlternateLinks=()=>{
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el=>el.remove());
    localeCodes.forEach(code=>{
      const link=document.createElement('link');
      link.rel='alternate';
      link.hreflang=LOCALES[code].htmlLang;
      link.href=canonicalOrigin+(code==='en'?seoPath:`/${code}${seoPath}`);
      document.head.appendChild(link);
    });
    const x=document.createElement('link');
    x.rel='alternate';x.hreflang='x-default';x.href=canonicalOrigin+seoPath;document.head.appendChild(x);
    const canonical=document.querySelector('link[rel="canonical"]');
    if(canonical)canonical.href=canonicalOrigin+(detected==='en'?seoPath:`/${detected}${seoPath}`);
  };

  const buildLanguageMenus=()=>{
    document.querySelectorAll('.ws-lang').forEach(box=>{
      const toggle=box.querySelector('.ws-lang-toggle');
      const menu=box.querySelector('.ws-lang-menu');
      if(toggle){
        const svg=toggle.querySelector('svg')?.outerHTML||'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 9 5 5 5-5"/></svg>';
        toggle.innerHTML=`<span class="ws-lang-flag" aria-hidden="true">${locale.flag}</span><span>${locale.short}</span>${svg}`;
        toggle.setAttribute('aria-label',`Language: ${locale.label}`);
      }
      if(menu){
        menu.innerHTML=localeCodes.map(code=>{
          const item=LOCALES[code];
          const current=code===detected?' current':'';
          const currentAttr=code===detected?' aria-current="page"':'';
          return `<a class="ws-lang-option${current}" data-locale="${code}" href="${withLocale(code)}" role="menuitem"${currentAttr}><span class="ws-lang-option-main"><span class="ws-lang-flag" aria-hidden="true">${item.flag}</span><span>${item.label}</span></span><span>${item.short}</span></a>`;
        }).join('');
        menu.querySelectorAll('a[data-locale]').forEach(a=>a.addEventListener('click',()=>savePreference(a.dataset.locale)));
      }
    });
  };

  const localizeInternalLinks=()=>{
    if(detected==='en')return;
    document.querySelectorAll('a[href]').forEach(a=>{
      if(a.matches('.ws-lang-option,[data-locale]')||a.closest('.ws-lang'))return;
      const raw=a.getAttribute('href');
      if(!raw||raw.startsWith('#')||raw.startsWith('mailto:')||raw.startsWith('tel:')||raw.startsWith('javascript:'))return;
      let u;try{u=new URL(raw,location.href)}catch(_){return}
      if(u.origin!==location.origin)return;
      const stripped=stripLocale(u.pathname);
      const normalized=stripped.replace(/index\.html$/,'')||'/';
      const recognized=knownPages.some(p=>normalizeSeoPath(p)===normalizeSeoPath(stripped))||normalized==='/'||normalized.startsWith('/platform/')||normalized.startsWith('/blocks-activities/')||normalized.startsWith('/organisations/')||normalized.startsWith('/contact/');
      if(!recognized)return;
      a.href=`/${detected}${normalized==='/'?'/':normalized}`+(u.search||'')+(u.hash||'');
    });
  };

  const normalizeText=s=>(s||'').replace(/\s+/g,' ').trim();
  const translateNode=(node,dict)=>{
    if(node.nodeType===Node.TEXT_NODE){
      const raw=node.nodeValue||'';
      const key=normalizeText(raw);
      if(!key||!dict[key])return;
      const lead=raw.match(/^\s*/)?.[0]||'';
      const trail=raw.match(/\s*$/)?.[0]||'';
      node.nodeValue=lead+dict[key]+trail;
      return;
    }
    if(node.nodeType!==Node.ELEMENT_NODE)return;
    const el=node;
    ['placeholder','title','aria-label','alt'].forEach(attr=>{
      const value=el.getAttribute?.(attr);
      const key=normalizeText(value);
      if(key&&dict[key])el.setAttribute(attr,dict[key]);
    });
    [...el.childNodes].forEach(child=>translateNode(child,dict));
  };

  const fetchDictionary=async url=>{
    const controller='AbortController'in window?new AbortController():null;
    const timer=controller?setTimeout(()=>controller.abort(),2500):null;
    try{
      const r=await fetch(url,{cache:'default',signal:controller?.signal});
      return r.ok?await r.json():null;
    }catch(_){return null}
    finally{if(timer)clearTimeout(timer)}
  };

  const revealTranslatedPage=()=>{
    document.documentElement.classList.add('i18n-ready');
    document.documentElement.classList.remove('ws-i18n-pending');
    document.getElementById('ws-i18n-preload')?.remove();
  };

  const loadTranslations=async()=>{
    if(detected==='en'){revealTranslatedPage();return}
    try{
      const [base,site,extra]=await Promise.all([
        fetchDictionary(`/assets/i18n/${detected}.json`),
        fetchDictionary(`/assets/i18n/${detected}-site.json`),
        fetchDictionary(`/assets/i18n/${detected}-extra.json`)
      ]);
      if(!base)throw new Error('base translation unavailable');
      const dict=Object.assign({},base.strings||base,site?.strings||site||{},extra?.strings||extra||{});
      // SEO title, description, canonical and hreflang are injected server-side by
      // Cloudflare middleware. Keep those authoritative after client translation.
      translateNode(document.body,dict);
      const observer=new MutationObserver(records=>records.forEach(record=>{
        record.addedNodes.forEach(node=>translateNode(node,dict));
        if(record.type==='characterData')translateNode(record.target,dict);
      }));
      observer.observe(document.body,{childList:true,characterData:true,subtree:true});
      revealTranslatedPage();
    }catch(err){
      console.warn('[Wistudi i18n] Translation unavailable:',detected,err);
      revealTranslatedPage();
    }
  };

  ready(()=>{
    const contactForm=document.getElementById('wistudiContactForm');
    if(contactForm)contactForm.setAttribute('action','/api/contact');
    document.body?.classList.add(`locale-${detected.replace(/[^a-z0-9]/g,'-')}`);
    buildLanguageMenus();
    localizeInternalLinks();
    addAlternateLinks();
    loadTranslations();
  });
})();