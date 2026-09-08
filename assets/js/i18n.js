(()=>{
  'use strict';

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
  const ready=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
  const params=new URLSearchParams(location.search);
  const requested=(params.get('lang')||'').toLowerCase();
  const pathParts=location.pathname.split('/').filter(Boolean);
  const explicitLocale=localeCodes.includes((pathParts[0]||'').toLowerCase())?pathParts[0].toLowerCase():null;

  // A URL has one language. Stored/browser preferences never silently translate the
  // English canonical URL; users move to an explicit language path instead.
  const detected=explicitLocale||(localeCodes.includes(requested)?requested:'en');
  const locale=LOCALES[detected]||LOCALES.en;

  const stripLocale=(pathname=location.pathname)=>{
    const parts=pathname.split('/').filter(Boolean);
    if(parts.length&&localeCodes.includes(parts[0].toLowerCase()))parts.shift();
    let p='/'+parts.join('/');
    if(pathname.endsWith('/')&&!p.endsWith('/'))p+='/';
    if(p==='/index.html'||p==='/platform/'||p==='/platform/index.html'||p==='/platform')p='/';
    return p||'/';
  };

  const normalizeSeoPath=p=>{
    if(!p||p==='/')return'/';
    let clean=p.replace(/\/index\.html$/i,'/');
    if(clean==='/platform/'||clean==='/platform')return'/';
    return clean;
  };
  const basePath=normalizeSeoPath(stripLocale());

  const savePreference=code=>{
    if(!LOCALES[code])return;
    try{localStorage.setItem('wistudi_locale',code)}catch(_){ }
    document.cookie=`wistudi_locale=${encodeURIComponent(code)};path=/;max-age=31536000;SameSite=Lax`;
  };

  const withoutLangQuery=search=>{
    const source=new URLSearchParams(search||'');
    source.delete('lang');
    const value=source.toString();
    return value?`?${value}`:'';
  };

  const withLocale=(code,path=basePath,search=location.search,hash=location.hash)=>{
    const clean=normalizeSeoPath(stripLocale(path));
    const prefix=code==='en'?'':`/${code}`;
    const pathname=clean==='/'?`${prefix}/`:`${prefix}${clean}`;
    return pathname+withoutLangQuery(search)+(hash||'');
  };

  // Client-side migration fallback for cached pages. The edge middleware performs the
  // same migration as a 301, but this keeps old cached ?lang= links from lingering.
  if(!explicitLocale&&localeCodes.includes(requested)){
    const target=withLocale(requested,basePath);
    if(target!==location.pathname+location.search+location.hash){location.replace(target);return;}
  }

  document.documentElement.lang=locale.htmlLang;
  document.documentElement.dir=locale.dir;
  document.documentElement.dataset.locale=detected;
  savePreference(detected);

  const style=document.createElement('style');
  style.textContent=`
    .ws-site-header{z-index:10000!important}.ws-lang{z-index:10020!important}.ws-lang-menu{z-index:10030!important}.ws-mobile-menu{position:relative;z-index:10010}.ws-lang-toggle{gap:7px}
    .ws-lang-flag{display:inline-flex;align-items:center;justify-content:center;width:24px;height:16px;flex:0 0 24px;border-radius:2px;overflow:hidden;box-shadow:0 0 0 1px rgba(24,21,35,.12)}.ws-lang-flag svg{display:block;width:24px;height:16px}
    .ws-lang-option[href]{text-decoration:none;cursor:pointer}.ws-lang-option[href]:hover{background:#faf8fd;color:#4f465b}.ws-lang-option-main{display:flex;align-items:center;gap:9px;min-width:0}
    [dir="rtl"] body{text-align:right}[dir="rtl"] .ws-lang-menu{right:auto;left:0}[dir="rtl"] .ws-lang-option{text-align:right}[dir="rtl"] .ws-nav-links,[dir="rtl"] .ws-nav-actions,[dir="rtl"] .ws-mobile-actions{direction:rtl}[dir="rtl"] .ws-footer-links,[dir="rtl"] .ws-footer-contact{direction:rtl}
  `;
  document.head.appendChild(style);

  const canonicalOrigin='https://global.wistudi.com';
  const seoPath=basePath;
  const seoUrl=(code,path=seoPath)=>canonicalOrigin+withLocale(code,path,'','');

  const addAlternateLinks=()=>{
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el=>el.remove());
    localeCodes.forEach(code=>{
      const link=document.createElement('link');
      link.rel='alternate';
      link.hreflang=LOCALES[code].htmlLang;
      link.href=seoUrl(code);
      document.head.appendChild(link);
    });
    const x=document.createElement('link');
    x.rel='alternate';x.hreflang='x-default';x.href=seoUrl('en');document.head.appendChild(x);
    const canonical=document.querySelector('link[rel="canonical"]');
    if(canonical)canonical.href=seoUrl(detected);
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

  const desiredInternalUrl=(raw)=>{
    if(!raw||raw.startsWith('#')||/^(mailto:|tel:|javascript:)/i.test(raw))return null;
    let u;try{u=new URL(raw,location.href)}catch(_){return null}
    if(u.origin!==location.origin)return null;
    const cleanPath=normalizeSeoPath(stripLocale(u.pathname));
    if(cleanPath.startsWith('/assets/')||cleanPath.startsWith('/api/')||cleanPath.startsWith('/functions/'))return null;
    return withLocale(detected,cleanPath,u.search,u.hash);
  };

  const localizeElementLink=el=>{
    if(!el||el.closest?.('.ws-lang')||el.matches?.('.ws-lang-option,[data-locale]'))return;
    const attr=el.tagName==='FORM'?'action':'href';
    const raw=el.getAttribute?.(attr);
    const desired=desiredInternalUrl(raw);
    if(desired&&raw!==desired)el.setAttribute(attr,desired);
  };

  const localizeInternalLinks=(root=document)=>{
    if(root.matches?.('a[href],form[action]'))localizeElementLink(root);
    root.querySelectorAll?.('a[href],form[action]').forEach(localizeElementLink);
  };

  const normalizeText=s=>(s||'').replace(/\s+/g,' ').trim();
  const translateNode=(node,dict)=>{
    if(node.nodeType===Node.TEXT_NODE){
      const raw=node.nodeValue||'';const key=normalizeText(raw);if(!key||!dict[key])return;
      const lead=raw.match(/^\s*/)?.[0]||'';const trail=raw.match(/\s*$/)?.[0]||'';node.nodeValue=lead+dict[key]+trail;return;
    }
    if(node.nodeType!==Node.ELEMENT_NODE)return;
    const el=node;
    ['placeholder','title','aria-label','alt'].forEach(attr=>{const value=el.getAttribute?.(attr);const key=normalizeText(value);if(key&&dict[key])el.setAttribute(attr,dict[key])});
    [...el.childNodes].forEach(child=>translateNode(child,dict));
  };

  const fetchDictionary=async url=>{try{const r=await fetch(url,{cache:'default'});return r.ok?await r.json():null}catch(_){return null}};
  const revealTranslatedPage=()=>{document.documentElement.classList.add('i18n-ready');document.documentElement.classList.remove('ws-i18n-pending');document.getElementById('ws-i18n-preload')?.remove()};

  const loadTranslations=async()=>{
    if(detected==='en'){revealTranslatedPage();return null}
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
      translateNode(document.body,dict);
      window.__WISTUDI_TRANSLATE_NODE__=node=>translateNode(node,dict);
      revealTranslatedPage();
      return dict;
    }catch(err){console.warn('[Wistudi i18n] Translation unavailable:',detected,err);revealTranslatedPage();return null}
  };

  ready(async()=>{
    document.body?.classList.add(`locale-${detected.replace(/[^a-z0-9]/g,'-')}`);
    buildLanguageMenus();
    localizeInternalLinks();
    addAlternateLinks();
    const dict=await loadTranslations();

    let rewriting=false;
    const observer=new MutationObserver(records=>{
      if(rewriting)return;
      rewriting=true;
      try{
        records.forEach(record=>{
          if(record.type==='attributes')localizeElementLink(record.target);
          if(record.type==='characterData'&&dict)translateNode(record.target,dict);
          record.addedNodes?.forEach(node=>{
            if(dict)translateNode(node,dict);
            if(node.nodeType===Node.ELEMENT_NODE)localizeInternalLinks(node);
          });
        });
      }finally{queueMicrotask(()=>{rewriting=false})}
    });
    observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['href','action']});
    // A few shared components initialise after DOM ready. One final pass keeps their
    // links on the same language path without waiting for a user interaction.
    setTimeout(()=>localizeInternalLinks(),0);
    setTimeout(()=>localizeInternalLinks(),350);
  });
})();