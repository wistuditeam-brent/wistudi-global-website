(()=>{
'use strict';
const load=(src,key)=>{
  const absolute=new URL(src,location.href).href;
  if([...document.scripts].some(script=>script.dataset?.[key]==='true'||script.getAttribute('src')===src||script.src===absolute))return;
  const s=document.createElement('script');
  s.src=src;
  s.async=false;
  s.dataset[key]='true';
  document.head.appendChild(s);
};

const path=(window.__WS_PREVIEW_PATH||location.pathname)
  .replace(/\/index\.html$/,'/')
  .replace(/^\/(vi|zh-cn|th|id|ms|ar)(?=\/)/,'');
const isEvent=path.includes('/resources/events/building-a-communicative-esl-lesson-with-flow/');

// Shared shell first. Event pages must finish constructing the canonical English DOM
// before any translator runs, otherwise English-text selectors fail and the page falls
// back to its older base markup in non-English languages.
load('/assets/js/site-shell-core.js','wsCore');

if(isEvent){
  load('/assets/js/event-upgrades-v2.js','wsEventUpgrades');
  load('/assets/js/event-hero-actions-component.js','wsEventHeroActions');
  load('/assets/js/event-live-session-component.js','wsEventLiveSession');
  load('/assets/js/event-registration-component.js','wsEventRegistration');
  load('/assets/js/event-registration-live-bridge.js','wsEventRegistrationLive');
  load('/assets/js/event-mobile-stage-fix.js','wsEventMobileStageFix');
  load('/assets/js/event-zoom-bridge.js','wsEventZoomBridge');

  // Translate only after the final event structure exists. Use one event translator,
  // not two competing MutationObservers.
  load('/assets/js/i18n.js','wsI18n');
  load('/assets/js/event-i18n-content.js','wsEventI18nContent');
}else{
  load('/assets/js/i18n.js','wsI18n');
  if(path==='/') load('/assets/js/home-event-banner-v2.js','wsHomeEventBanner');
}
})();