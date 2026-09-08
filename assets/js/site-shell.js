(()=>{
'use strict';
const load=(src,key)=>{if(document.querySelector(`script[data-${key}]`))return;const s=document.createElement('script');s.src=src;s.async=false;s.dataset[key]='true';document.head.appendChild(s)};

// Load the shared language runtime on every public page so language changes stay on
// the current page and never fall through to incomplete locale-prefixed routes.
load('/assets/js/i18n.js','wsI18n');
load('/assets/js/site-shell-core.js','wsCore');

const path=(window.__WS_PREVIEW_PATH||location.pathname).replace(/\/index\.html$/,'/').replace(/^\/(vi|zh-cn|th|id|ms|ar)(?=\/)/,'');
if(path==='/') load('/assets/js/home-event-banner-v2.js','wsHomeEventBanner');
if(path.includes('/resources/events/building-a-communicative-esl-lesson-with-flow/')){
  load('/assets/js/event-upgrades-v2.js','wsEventUpgrades');
  load('/assets/js/event-hero-actions-component.js','wsEventHeroActions');
  load('/assets/js/event-live-session-component.js','wsEventLiveSession');
  load('/assets/js/event-registration-component.js','wsEventRegistration');
  load('/assets/js/event-registration-live-bridge.js','wsEventRegistrationLive');
  load('/assets/js/event-mobile-stage-fix.js','wsEventMobileStageFix');
  load('/assets/js/event-zoom-bridge.js','wsEventZoomBridge');
  load('/assets/js/event-i18n.js','wsEventI18n');
}
})();