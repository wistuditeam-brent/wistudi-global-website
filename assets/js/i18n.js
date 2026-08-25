(()=>{
  const LOCALES={
    en:{label:'English',short:'EN',htmlLang:'en',dir:'ltr'},
    vi:{label:'Tiếng Việt',short:'VI',htmlLang:'vi',dir:'ltr'},
    'zh-cn':{label:'简体中文',short:'中文',htmlLang:'zh-CN',dir:'ltr'},
    th:{label:'ไทย',short:'TH',htmlLang:'th',dir:'ltr'},
    id:{label:'Bahasa Indonesia',short:'ID',htmlLang:'id',dir:'ltr'},
    ms:{label:'Bahasa Melayu',short:'MS',htmlLang:'ms',dir:'ltr'},
    ar:{label:'العربية',short:'AR',htmlLang:'ar',dir:'rtl'}
  };
  const localeCodes=Object.keys(LOCALES);
  const knownPages=['/','/index.html','/platform/','/platform/index.html','/blocks-activities/','/blocks-activities/index.html','/organisations/','/organisations/index.html','/contact/','/contact/index.html'];

  const ready=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
  const pathParts=location.pathname.split('/').filter(Boolean);
  const detected=localeCodes.includes((pathParts[0]||'').toLowerCase())?pathParts[0].toLowerCase():'en';
  const locale=LOCALES[detected]||LOCALES.en;

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
  document.body?.classList.add(`locale-${detected.replace(/[^a-z0-9]/g,'-')}`);

  const style=document.createElement('style');
  style.textContent=`
    .ws-lang-option[href]{text-decoration:none;cursor:pointer}
    .ws-lang-option[href]:hover{background:#faf8fd;color:#4f465b}
    [dir="rtl"] body{text-align:right}
    [dir="rtl"] .ws-lang-menu{right:auto;left:0}
    [dir="rtl"] .ws-lang-option{text-align:right}
    [dir="rtl"] .ws-nav-links,[dir="rtl"] .ws-nav-actions,[dir="rtl"] .ws-mobile-actions{direction:rtl}
    [dir="rtl"] .ws-footer-links,[dir="rtl"] .ws-footer-contact{direction:rtl}
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
        toggle.innerHTML=`${locale.short} ${svg}`;
        toggle.setAttribute('aria-label',`Language: ${locale.label}`);
      }
      if(menu){
        menu.innerHTML=localeCodes.map(code=>{
          const item=LOCALES[code];
          const current=code===detected?' current':'';
          const currentAttr=code===detected?' aria-current="page"':'';
          return `<a class="ws-lang-option${current}" href="${withLocale(code)}" role="menuitem"${currentAttr}><span>${item.label}</span><span>${item.short}</span></a>`;
        }).join('');
      }
    });
  };

  const localizeInternalLinks=()=>{
    if(detected==='en')return;
    document.querySelectorAll('a[href]').forEach(a=>{
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
    ['placeholder','title','aria-label'].forEach(attr=>{const v=el.getAttribute?.(attr);const k=normalizeText(v);if(k&&dict[k])el.setAttribute(attr,dict[k]);});
    if(el.tagName==='META'&&el.getAttribute('name')==='description'){const v=el.getAttribute('content');const k=normalizeText(v);if(k&&dict[k])el.setAttribute('content',dict[k]);}
    [...el.childNodes].forEach(child=>translateNode(child,dict));
  };

  const loadTranslations=async()=>{
    if(detected==='en')return;
    try{
      const response=await fetch(`/assets/i18n/${detected}.json`,{cache:'no-cache'});
      if(!response.ok)throw new Error(`translation ${response.status}`);
      const data=await response.json();
      const dict=data.strings||data;
      if(data.titles?.[seoPath])document.title=data.titles[seoPath];
      translateNode(document.body,dict);
      const observer=new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(n=>translateNode(n,dict))));
      observer.observe(document.body,{childList:true,subtree:true});
      document.documentElement.classList.add('i18n-ready');
    }catch(err){console.warn('[Wistudi i18n] Translation dictionary unavailable:',detected,err)}
  };

  ready(()=>{
    buildLanguageMenus();
    localizeInternalLinks();
    addAlternateLinks();
    loadTranslations();
  });
})();
