(()=>{
'use strict';
const load=(src,key)=>{if(document.querySelector(`script[data-${key}]`))return;const s=document.createElement('script');s.src=src;s.async=false;s.dataset[key]='true';document.head.appendChild(s)};
load('/assets/js/site-shell-core.js','wsCore');
const path=location.pathname.replace(/\/index\.html$/,'/');
if(path==='/') load('/assets/js/home-event-banner-v2.js','wsHomeEventBanner');
if(path.includes('/resources/events/building-a-communicative-esl-lesson-with-flow/')) load('/assets/js/event-upgrades-v2.js','wsEventUpgrades');
})();