(()=>{
'use strict';
const EVENT_PATH='/resources/events/building-a-communicative-esl-lesson-with-flow/';
const normalized=(window.__WS_PREVIEW_PATH||location.pathname)
  .replace(/\/index\.html$/,'/')
  .replace(/^\/(vi|zh-cn|th|id|ms|ar)(?=\/)/,'');
const isEvent=normalized.includes(EVENT_PATH);

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

const bootEvent=async()=>{
  // The event detail page owns its runtime. Keep generic Resources renderers and their
  // translators out of this route so every locale starts from the same canonical DOM.
  await load('/assets/js/analytics-events.js','wsAnalyticsEvents');
  await load('/assets/js/footer-unify.js','wsFooterUnify');
  await load('/assets/js/site-shell-base.js','wsBase');

  // Canonical presentation = the version built through the workshop feature, highlight,
  // centred registration and unified hero commits. Do not load event-upgrades-v2 here;
  // it is a competing renderer and was the source of the visual rollback.
  await load('/assets/js/event-highlight.js','wsEventHighlight');
  await load('/assets/js/event-hero-actions-component.js','wsEventHeroActions');
  await load('/assets/js/event-live-session-component.js','wsEventLiveSession');
  await load('/assets/js/event-registration-component.js','wsEventRegistration');
  await load('/assets/js/event-registration-live-bridge.js','wsEventRegistrationLive');
  await load('/assets/js/event-mobile-stage-fix.js','wsEventMobileStageFix');
  await load('/assets/js/event-zoom-bridge.js','wsEventZoomBridge');

  // Translate only after the final presentation is in place. There is one event-specific
  // translator, which prevents MutationObserver loops and layout differences by locale.
  await load('/assets/js/i18n.js','wsI18n');
  await load('/assets/js/event-i18n-content.js','wsEventI18nContent');
  document.documentElement.dataset.wsEventRuntime='ready';
  document.documentElement.dataset.wsEventPresentation='canonical-highlight';
};

const bootSite=async()=>{
  await load('/assets/js/site-shell-core.js','wsCore');
  await load('/assets/js/i18n.js','wsI18n');
  if(normalized==='/') await load('/assets/js/home-event-banner-v2.js','wsHomeEventBanner');
};

(isEvent?bootEvent():bootSite()).catch(error=>console.error('[Wistudi shell]',error));
})();
