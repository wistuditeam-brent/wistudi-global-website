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

/* Sitewide header standard: primary menus + language + contact message icon + Start Publishing. */
const installCompactHeader=()=>{
  if(document.getElementById('ws-compact-header-style')) return;

  const style=document.createElement('style');
  style.id='ws-compact-header-style';
  style.textContent=`
    .ws-site-header{position:sticky!important;top:0!important;left:0;right:0;width:100%;z-index:240}
    .ws-site-header .ws-nav-actions>.ws-btn.secondary{display:none!important}
    .ws-site-header .ws-nav-links a[href*="contact"]{display:none!important}
    .ws-site-header .ws-mobile-inner>a[href*="contact"]{display:none!important}
    .ws-site-header .ws-mobile-actions>.ws-btn.secondary{display:none!important}

    .ws-site-header .ws-nav{justify-content:space-between}
    .ws-site-header .ws-nav-actions{gap:10px;margin-left:auto}
    .ws-site-header .ws-contact-message{
      width:50px;height:50px;display:inline-flex;align-items:center;justify-content:center;
      flex:0 0 auto;text-decoration:none;border-radius:50%;
      margin-left:2px;margin-right:10px;
      transition:transform .18s ease,opacity .18s ease;
    }
    .ws-site-header .ws-contact-message:hover{transform:translateY(-1px);opacity:.9}
    .ws-site-header .ws-contact-message img{display:block;width:42px;height:42px;object-fit:contain}
    .ws-site-header .ws-nav-actions>.ws-btn.primary{display:inline-flex!important}

    @media(min-width:901px){
      .ws-site-header .ws-nav-links{display:flex!important}
      .ws-site-header .ws-menu-toggle{display:none!important}
    }

    @media(max-width:900px){
      .ws-site-header .ws-nav-links{display:none!important}
      .ws-site-header .ws-menu-toggle{display:block!important}
      .ws-site-header .ws-container{width:min(calc(100% - 22px),1180px)}
      .ws-site-header .ws-nav{height:64px;gap:9px}
      .ws-site-header .ws-brand img{width:104px}
      .ws-site-header .ws-nav-actions{gap:6px}
      .ws-site-header .ws-lang-toggle{height:40px;min-width:56px;padding:0 8px}
      .ws-site-header .ws-contact-message{width:44px;height:44px;margin-left:1px;margin-right:7px}
      .ws-site-header .ws-contact-message img{width:37px;height:37px}
      .ws-site-header .ws-nav-actions>.ws-btn.primary{
        min-height:40px;padding:0 12px;border-radius:13px;font-size:.7rem;white-space:nowrap
      }
    }

    @media(max-width:520px){
      .ws-site-header .ws-container{width:min(calc(100% - 16px),1180px)}
      .ws-site-header .ws-brand img{width:90px}
      .ws-site-header .ws-nav-actions>.ws-btn.primary{padding:0 9px;font-size:.64rem}
      .ws-site-header .ws-contact-message{width:42px;height:42px;margin-right:5px}
      .ws-site-header .ws-contact-message img{width:35px;height:35px}
    }

    @media(max-width:390px){
      .ws-site-header .ws-brand img{width:82px}
      .ws-site-header .ws-nav-actions{gap:4px}
      .ws-site-header .ws-lang-toggle{min-width:48px;height:38px;padding:0 5px;font-size:.67rem}
      .ws-site-header .ws-contact-message{width:40px;height:40px;margin-right:3px}
      .ws-site-header .ws-contact-message img{width:33px;height:33px}
      .ws-site-header .ws-nav-actions>.ws-btn.primary{min-height:38px;padding:0 7px;font-size:.6rem;border-radius:11px}
    }

    @media(prefers-reduced-motion:reduce){
      .ws-site-header .ws-contact-message{transition:none!important}
    }
  `;
  document.head.appendChild(style);

  const apply=()=>{
    document.querySelectorAll('.ws-nav-actions').forEach(actions=>{
      let link=actions.querySelector('.ws-contact-message');
      if(!link){
        link=document.createElement('a');
        link.className='ws-contact-message';
        link.href='/contact/';
        link.setAttribute('aria-label','Contact Wistudi');
        link.title='Contact Wistudi';
        link.innerHTML='<img src="/assets/media/contact-message.svg" alt="" aria-hidden="true">';
        const primary=actions.querySelector('.ws-btn.primary');
        primary?actions.insertBefore(link,primary):actions.appendChild(link);
      }
    });
  };

  apply();
  new MutationObserver(()=>queueMicrotask(apply)).observe(document.documentElement,{childList:true,subtree:true});
};

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',installCompactHeader,{once:true});
else installCompactHeader();


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

function ensureOrganisationsMenu(){
  const integrationHref='/partners/integrations/';
  const integrationActive=normalized.startsWith('/partners/integrations/');
  const organisationsActive=normalized.startsWith('/organisations/');

  document.querySelectorAll('.ws-nav-links').forEach(nav=>{
    if(nav.querySelector('.ws-org-menu'))return;
    const orgLink=[...nav.querySelectorAll(':scope > a')].find(a=>internalPath(a).startsWith('/organisations'));
    if(!orgLink)return;

    const wrap=document.createElement('div');
    wrap.className='ws-org-menu';
    if(organisationsActive||integrationActive)wrap.classList.add('active');

    const trigger=document.createElement('div');
    trigger.className='ws-org-trigger';
    orgLink.parentNode.insertBefore(wrap,orgLink);
    wrap.appendChild(trigger);
    trigger.appendChild(orgLink);
    orgLink.classList.add('ws-org-main-link');

    const toggle=document.createElement('button');
    toggle.type='button';
    toggle.className='ws-org-toggle';
    toggle.setAttribute('aria-label','Open Organisations menu');
    toggle.setAttribute('aria-expanded','false');
    toggle.innerHTML='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7.5 5 5 5-5"/></svg>';
    trigger.appendChild(toggle);

    const menu=document.createElement('div');
    menu.className='ws-org-dropdown';
    menu.innerHTML=`
      <div class="ws-org-dropdown-label">Organisations</div>
      <a class="ws-org-dropdown-item ${organisationsActive?'active':''}" href="/organisations/">
        <span class="ws-org-item-title">Organisation overview</span>
        <span class="ws-org-item-copy">Plans, publishing and learning for schools, teams and organisations.</span>
      </a>
      <a class="ws-org-dropdown-item ${integrationActive?'active':''}" href="${integrationHref}">
        <span class="ws-org-item-title">Integration Documentation</span>
        <span class="ws-org-item-copy">Integration models, LTI 1.3, grading, data exchange and partner requirements.</span>
      </a>`;
    wrap.appendChild(menu);

    const setOpen=open=>{
      wrap.classList.toggle('open',open);
      toggle.setAttribute('aria-expanded',String(open));
    };
    toggle.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();setOpen(!wrap.classList.contains('open'))});
    wrap.addEventListener('mouseenter',()=>setOpen(true));
    wrap.addEventListener('mouseleave',()=>setOpen(false));
    wrap.addEventListener('focusin',()=>setOpen(true));
    wrap.addEventListener('focusout',e=>{if(!wrap.contains(e.relatedTarget))setOpen(false)});
    document.addEventListener('click',e=>{if(!wrap.contains(e.target))setOpen(false)});
  });

  document.querySelectorAll('.ws-mobile-inner').forEach(nav=>{
    if(nav.querySelector('.ws-mobile-org-menu'))return;
    const orgLink=[...nav.children].find(el=>el.tagName==='A'&&internalPath(el).startsWith('/organisations'));
    if(!orgLink)return;

    const details=document.createElement('details');
    details.className='ws-mobile-org-menu';
    if(organisationsActive||integrationActive)details.classList.add('active');
    const summary=document.createElement('summary');
    summary.innerHTML='Organisations <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7.5 5 5 5-5"/></svg>';
    details.appendChild(summary);

    const items=document.createElement('div');
    items.className='ws-mobile-org-items';
    items.innerHTML=`
      <a class="${organisationsActive?'active':''}" href="/organisations/">Organisation overview</a>
      <a class="${integrationActive?'active':''}" href="${integrationHref}">Integration Documentation</a>`;
    details.appendChild(items);
    nav.insertBefore(details,orgLink);
    orgLink.remove();
  });
}

ensureResourcesNav();
ensureOrganisationsMenu();

// site-shell-core loads resources-global asynchronously. Its legacy nav helper only
// recognises href="/resources/" and can otherwise insert a second English Resources link
// after a translated link. Watch only the two nav containers and collapse any late duplicate.
const watchResourcesNav=()=>{
  document.querySelectorAll('.ws-nav-links,.ws-mobile-inner').forEach(nav=>{
    if(nav.dataset.wsResourcesWatched==='true')return;
    nav.dataset.wsResourcesWatched='true';
    new MutationObserver(()=>queueMicrotask(()=>{ensureResourcesNav();ensureOrganisationsMenu();})).observe(nav,{childList:true,subtree:false});
  });
};
watchResourcesNav();

// Keep the Organisations dropdown present if a later shell/i18n pass rewrites nav links.
const watchOrganisationsMenu=()=>{
  document.querySelectorAll('.ws-nav-links,.ws-mobile-inner').forEach(nav=>{
    if(nav.dataset.wsOrganisationsWatched==='true')return;
    nav.dataset.wsOrganisationsWatched='true';
    new MutationObserver(()=>queueMicrotask(ensureOrganisationsMenu)).observe(nav,{childList:true,subtree:false});
  });
};
watchOrganisationsMenu();

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
  ensureOrganisationsMenu();
  watchResourcesNav();
  watchOrganisationsMenu();
  document.documentElement.dataset.wsEventRuntime='ready';
  document.documentElement.dataset.wsEventPresentation='canonical-highlight';
};

const bootSite=async()=>{
  await load('/assets/js/site-shell-core.js','wsCore');
  await load('/assets/js/i18n.js','wsI18n');
  ensureResourcesNav();
  ensureOrganisationsMenu();
  watchResourcesNav();
  watchOrganisationsMenu();

  if(normalized.startsWith('/partners/integrations/')){
    await load('/assets/js/integrations-mobile-nav.js','wsIntegrationsMobileNav');
  }

  // The temporary event takeover banner on the Platform homepage is intentionally off.
  // Keep the workshop promotion inside Resources until we explicitly choose to restore it.
  if(normalized==='/resources/'||normalized==='/resources'){
    await load('/assets/js/resources-event-polish.js','wsResourcesEventPolish');
  }
};

(isEvent?bootEvent():bootSite()).catch(error=>console.error('[Wistudi shell]',error));
})();