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
    const done=()=>{existing.dataset.wsLoaded='true';resolve(existing)};
    existing.addEventListener('load',done,{once:true});
    existing.addEventListener('error',done,{once:true});
    setTimeout(done,5000);
    return;
  }
  const s=document.createElement('script');
  s.src=src;
  s.async=false;
  s.dataset[key]='true';
  const done=()=>{s.dataset.wsLoaded='true';resolve(s)};
  s.addEventListener('load',done,{once:true});
  s.addEventListener('error',done,{once:true});
  document.head.appendChild(s);
});

const bootEvent=async()=>{
  // The event detail page has its own canonical runtime. Do not pass it through the
  // generic Resources shell because that shell starts its own translators before the
  // event DOM is finished, which is what caused translated pages to fall back to the
  // older layout and could leave several MutationObservers fighting over the page.
  await load('/assets/js/analytics-events.js','wsAnalyticsEvents');
  await load('/assets/js/footer-unify.js','wsFooterUnify');
  await load('/assets/js/site-shell-base.js','wsBase');

  // One presentation pipeline only. event-upgrades-v2 is the later consolidated
  // event presentation and supersedes event-highlight.js on this detail page.
  await load('/assets/js/event-upgrades-v2.js','wsEventUpgrades');
  await load('/assets/js/event-hero-actions-component.js','wsEventHeroActions');
  await load('/assets/js/event-live-session-component.js','wsEventLiveSession');
  await load('/assets/js/event-registration-component.js','wsEventRegistration');
  await load('/assets/js/event-registration-live-bridge.js','wsEventRegistrationLive');
  await load('/assets/js/event-mobile-stage-fix.js','wsEventMobileStageFix');
  await load('/assets/js/event-zoom-bridge.js','wsEventZoomBridge');

  // Translate only after the final English DOM exists. This guarantees every language
  // uses the same current layout instead of allowing translation to change selectors
  // while the page is still being constructed.
  await load('/assets/js/i18n.js','wsI18n');
  await load('/assets/js/event-i18n-content.js','wsEventI18nContent');
  document.documentElement.dataset.wsEventRuntime='ready';
};

const bootSite=async()=>{
  await load('/assets/js/site-shell-core.js','wsCore');
  await load('/assets/js/i18n.js','wsI18n');
  if(normalized==='/') await load('/assets/js/home-event-banner-v2.js','wsHomeEventBanner');
};

(isEvent?bootEvent():bootSite()).catch(error=>console.error('[Wistudi shell]',error));
})();
