(()=>{
'use strict';

const SUPPORTED=['en','vi','zh-cn','th','id','ms','ar'];
const RESOURCE_LABEL={
  en:'Resources',
  vi:'Tài nguyên',
  'zh-cn':'资源',
  th:'ทรัพยากร',
  id:'Sumber Daya',
  ms:'Sumber',
  ar:'الموارد'
};
const EVENT_PATH='/resources/events/building-a-communicative-esl-lesson-with-flow/';

const selectedLocale=()=>{
  const params=new URLSearchParams(location.search);
  const requested=(params.get('lang')||'').toLowerCase();
  if(SUPPORTED.includes(requested))return requested;
  const first=(location.pathname.split('/').filter(Boolean)[0]||'').toLowerCase();
  return SUPPORTED.includes(first)?first:'en';
};

const stripLocale=pathname=>{
  const parts=(pathname||'/').split('/').filter(Boolean);
  if(parts.length&&SUPPORTED.includes(parts[0].toLowerCase()))parts.shift();
  let path='/'+parts.join('/');
  if(!parts.length)path='/';
  else if((pathname||'').endsWith('/')&&!path.endsWith('/'))path+='/';
  return path;
};

const normalized=stripLocale((window.__WS_PREVIEW_PATH||location.pathname).replace(/\/index\.html$/,'/'));
const isEvent=normalized.includes(EVENT_PATH);

const internalPath=a=>{
  try{return stripLocale(new URL(a.getAttribute('href')||'',location.href).pathname)}catch(_){return''}
};
const isResourceLink=a=>a?.dataset?.wsResourcesLink==='true'||a?.classList?.contains('ws-resource-nav-link')||internalPath(a).startsWith('/resources/');

function ensureResourcesNav(){
  const locale=selectedLocale();
  const href=locale==='en'?'/resources/':`/resources/?lang=${encodeURIComponent(locale)}`;
  const active=normalized==='/resources/'||normalized.startsWith('/resources/');

  document.querySelectorAll('.ws-nav-links').forEach(nav=>{
    const candidates=[...nav.querySelectorAll('a')].filter(isResourceLink);
    let link=candidates.shift();
    candidates.forEach(extra=>extra.remove());
    if(!link){
      link=document.createElement('a');
      const contact=[...nav.querySelectorAll('a')].find(a=>internalPath(a).startsWith('/contact'));
      contact?nav.insertBefore(link,contact):nav.appendChild(link);
    }
    link.dataset.wsResourcesLink='true';
    link.classList.add('ws-resource-nav-link');
    link.classList.toggle('active',active);
    if(link.getAttribute('href')!==href)link.setAttribute('href',href);
    const badge=link.querySelector('.ws-resource-badge')||document.createElement('span');
    badge.className='ws-resource-badge';
    badge.hidden=true;
    badge.setAttribute('aria-label','New resources');
    const label=RESOURCE_LABEL[locale]||RESOURCE_LABEL.en;
    const currentLabel=[...link.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join('').trim();
    if(currentLabel!==label){
      [...link.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).forEach(n=>n.remove());
      link.prepend(document.createTextNode(label));
    }
    if(!badge.isConnected)link.appendChild(badge);
  });

  document.querySelectorAll('.ws-mobile-inner').forEach(nav=>{
    const candidates=[...nav.querySelectorAll('a')].filter(isResourceLink);
    let link=candidates.shift();
    candidates.forEach(extra=>extra.remove());
    if(!link){
      link=document.createElement('a');
      const contact=[...nav.querySelectorAll('a')].find(a=>internalPath(a).startsWith('/contact'));
      contact?nav.insertBefore(link,contact):nav.appendChild(link);
    }
    link.dataset.wsResourcesLink='true';
    link.classList.add('ws-resource-nav-link');
    link.classList.toggle('active',active);
    if(link.getAttribute('href')!==href)link.setAttribute('href',href);
    const label=RESOURCE_LABEL[locale]||RESOURCE_LABEL.en;
    if(link.textContent.trim()!==label)link.textContent=label;
  });
}

ensureResourcesNav();

// site-shell-core loads resources-global asynchronously. Its legacy nav helper only
// recognises href="/resources/" and can otherwise insert a second English Resources link
// after a translated link. Watch only the two nav containers and collapse any late duplicate.
const watchResourcesNav=()=>{
  document.querySelectorAll('.ws-nav-links,.ws-mobile-inner').forEach(nav=>{
    if(nav.dataset.wsResourcesWatched==='true')return;
    nav.dataset.wsResourcesWatched='true';
    new MutationObserver(()=>queueMicrotask(ensureResourcesNav)).observe(nav,{childList:true});
  });
};
watchResourcesNav();

const load=(src,key)=>new Promise(resolve=>{
  const absolute=new URL(src,location.href).href;
  const existing=[...document.scripts].find(script=>
    script.dataset?.[key]==='true'||script.getAttribute('src')===src||script.src===absolute
  );
  if(existing){
    const perf=performance.getEntriesByName(existing.src||absolute);
    if(existing.dataset.wsLoaded==='true'||perf.some(entry=>entry.responseEnd>0)){resolve(existing);return;}
    let settled=false;
    const done=()=>{if(settled)return;settled=true;existing.dataset.wsLoaded='true';resolve(existing)};
    existing.addEventListener('load',done,{once:true});
    existing.addEventListener('error',done,{once:true});
    setTimeout(done,5000);
    return;
  }
  const s=document.createElement('script');
  s.src=src;
  s.async=false;
  s.dataset[key]='true';
  let settled=false;
  const done=()=>{if(settled)return;settled=true;s.dataset.wsLoaded='true';resolve(s)};
  s.addEventListener('load',done,{once:true});
  s.addEventListener('error',done,{once:true});
  document.head.appendChild(s);
});

const loadWithMutationGuard=async(src,key)=>{
  const Native=window.MutationObserver;
  if(typeof Native!=='function')return load(src,key);

  class GuardedMutationObserver{
    constructor(callback){
      this.callback=callback;
      this.target=null;
      this.options=null;
      this.disconnected=false;
      this.native=new Native(records=>{
        const target=this.target;
        const options=this.options;
        this.native.disconnect();
        try{this.callback(records,this)}finally{
          if(target&&options&&!this.disconnected){
            queueMicrotask(()=>{
              if(!this.disconnected&&this.target===target)this.native.observe(target,options);
            });
          }
        }
      });
    }
    observe(target,options){
      this.target=target;
      this.options=options;
      this.disconnected=false;
      this.native.observe(target,options);
    }
    disconnect(){this.disconnected=true;this.native.disconnect()}
    takeRecords(){return this.native.takeRecords()}
  }

  window.MutationObserver=GuardedMutationObserver;
  try{return await load(src,key)}finally{window.MutationObserver=Native}
};

const bootEvent=async()=>{
  // The event detail page owns one ordered runtime. This prevents duplicate renderers,
  // duplicated timers and translation observers from competing with the registration UI.
  await load('/assets/js/analytics-events.js','wsAnalyticsEvents');
  await load('/assets/js/footer-unify.js','wsFooterUnify');
  await load('/assets/js/site-shell-base.js','wsBase');

  // Preserve every visual component that previously came from the route middleware,
  // but load each exactly once and in a deterministic order here.
  await load('/assets/js/event-media-component.js','wsEventMedia');
  await load('/assets/js/event-facts-component.js','wsEventFacts');
  await load('/assets/js/event-highlight.js','wsEventHighlight');
  await load('/assets/js/event-hero-actions-component.js','wsEventHeroActions');
  await load('/assets/js/event-live-session-component.js','wsEventLiveSession');
  await load('/assets/js/event-registration-component.js','wsEventRegistration');
  await load('/assets/js/event-registration-live-bridge.js','wsEventRegistrationLive');
  await load('/assets/js/event-mobile-stage-fix.js','wsEventMobileStageFix');
  await load('/assets/js/event-zoom-bridge.js','wsEventZoomBridge');

  await load('/assets/js/i18n.js','wsI18n');

  // event-i18n updates translated date/time values from a MutationObserver. Guard the
  // observer while its callback runs so its own text updates cannot recursively retrigger
  // the same observer and lock the page. The observer remains active for later UI changes.
  await loadWithMutationGuard('/assets/js/event-i18n.js','wsEventI18n');
  await loadWithMutationGuard('/assets/js/event-i18n-content.js','wsEventI18nContent');

  ensureResourcesNav();
  watchResourcesNav();
  document.documentElement.dataset.wsEventRuntime='ready';
  document.documentElement.dataset.wsEventPresentation='canonical-highlight';
};

const bootSite=async()=>{
  await load('/assets/js/site-shell-core.js','wsCore');
  await load('/assets/js/i18n.js','wsI18n');
  ensureResourcesNav();
  watchResourcesNav();

  // The temporary event takeover banner on the Platform homepage is intentionally off.
  // Keep the workshop promotion inside Resources until we explicitly choose to restore it.
  if(normalized==='/resources/'||normalized==='/resources'){
    await load('/assets/js/resources-event-polish.js','wsResourcesEventPolish');
  }
};

(isEvent?bootEvent():bootSite()).catch(error=>console.error('[Wistudi shell]',error));
})();