(()=>{
  const LOCALES={
    en:{label:'English',short:'EN',htmlLang:'en',dir:'ltr',flag:'🇬🇧'},
    vi:{label:'Tiếng Việt',short:'VI',htmlLang:'vi',dir:'ltr',flag:'🇻🇳'},
    'zh-cn':{label:'简体中文',short:'中文',htmlLang:'zh-CN',dir:'ltr',flag:'🇨🇳'},
    th:{label:'ไทย',short:'TH',htmlLang:'th',dir:'ltr',flag:'🇹🇭'},
    id:{label:'Bahasa Indonesia',short:'ID',htmlLang:'id',dir:'ltr',flag:'🇮🇩'},
    ms:{label:'Bahasa Melayu',short:'MS',htmlLang:'ms',dir:'ltr',flag:'🇲🇾'},
    ar:{label:'العربية',short:'AR',htmlLang:'ar',dir:'rtl',flag:'🇸🇦'}
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
    if(parts.length&&localeCodes.includes(parts[0].toLowerCase())) parts.shift();
    let p='/'+parts.join('/');
    if(pathname.endsWith('/')&&!p.endsWith('/'))p+='/';
    if(p==='/index.html')p='/';
    if(p==='/platform/'||p==='/platform/index.html')p='/';
    return p||'/';
  };
  const basePath=stripLocale();
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
    .ws-lang-flag{display:inline-flex;align-items:center;justify-content:center;font-size:1rem;line-height:1;width:20px;flex:0 0 20px}
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
  const normalizeSeoPath=p=>p==='/'?'/':p.replace(/index\.html$/,'');
  const seoPath=normalizeSeoPath(basePath);

  const addAlternateLinks=()=>{
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el=>el.remove());
    localeCodes.forEach(code=>{
      const link=document.createElement('link');
      link.rel='alternate';
      link.hreflang=LOCALES[code].htmlLang;
      link.href=canonicalOrigin+(code==='en'?seoPath:`/${code}${seoPath}`);
      document.head.appendChild(link);
    });
    const x=document.createElement('link');x.rel='alternate';x.hreflang='x-default';x.href=canonicalOrigin+seoPath;document.head.appendChild(x);
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
      let u;
      try{u=new URL(raw,location.href)}catch(_){return}
      if(u.origin!==location.origin)return;
      const stripped=stripLocale(u.pathname);
      const normalized=stripped.replace(/index\.html$/,'')||'/';
      const recognized=knownPages.some(p=>normalizeSeoPath(p)===normalizeSeoPath(stripped))||normalized==='/'||normalized.startsWith('/blocks-activities/')||normalized.startsWith('/organisations/')||normalized.startsWith('/contact/');
      if(!recognized)return;
      const target=`/${detected}${normalized==='/'?'/':normalized}`;
      a.href=target+(u.search||'')+(u.hash||'');
    });
  };

  const normalizeText=s=>(s||'').replace(/\s+/g,' ').trim();
  const translateNode=(node,dict)=>{
    if(node.nodeType===Node.TEXT_NODE){
      const raw=node.nodeValue||'';const key=normalizeText(raw);if(!key||!dict[key])return;
      const lead=raw.match(/^\s*/)?.[0]||'';const trail=raw.match(/\s*$/)?.[0]||'';node.nodeValue=lead+dict[key]+trail;return;
    }
    if(node.nodeType!==Node.ELEMENT_NODE)return;
    const el=node;
    ['placeholder','title','aria-label','alt'].forEach(attr=>{const v=el.getAttribute?.(attr);const k=normalizeText(v);if(k&&dict[k])el.setAttribute(attr,dict[k]);});
    [...el.childNodes].forEach(child=>translateNode(child,dict));
  };

  const fetchDictionary=async url=>{
    try{const r=await fetch(url,{cache:'no-cache'});return r.ok?await r.json():null}catch(_){return null}
  };

  const revealTranslatedPage=()=>{
    document.documentElement.classList.add('i18n-ready');
    document.documentElement.classList.remove('ws-i18n-pending');
    document.getElementById('ws-i18n-preload')?.remove();
  };

  const loadTranslations=async()=>{
    if(detected==='en'){revealTranslatedPage();return;}
    try{
      const [base,site,extra]=await Promise.all([
        fetchDictionary(`/assets/i18n/${detected}.json`),
        fetchDictionary(`/assets/i18n/${detected}-site.json`),
        fetchDictionary(`/assets/i18n/${detected}-extra.json`)
      ]);
      if(!base)throw new Error('base translation unavailable');
      const dict=Object.assign({},base.strings||base,site?.strings||site||{},extra?.strings||extra||{});
      const titles=Object.assign({},base.titles||{},site?.titles||{},extra?.titles||{});
      if(titles[seoPath])document.title=titles[seoPath];
      const meta=document.querySelector('meta[name="description"]');
      if(meta){const key=normalizeText(meta.content);if(dict[key])meta.content=dict[key];}
      translateNode(document.body,dict);
      const observer=new MutationObserver(records=>records.forEach(r=>{
        r.addedNodes.forEach(n=>translateNode(n,dict));
        if(r.type==='characterData')translateNode(r.target,dict);
      }));
      observer.observe(document.body,{childList:true,characterData:true,subtree:true});
      revealTranslatedPage();
    }catch(err){
      console.warn('[Wistudi i18n] Translation dictionary unavailable:',detected,err);
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
