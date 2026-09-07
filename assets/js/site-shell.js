(()=>{
  'use strict';

  const loadCore=()=>{
    if(document.querySelector('script[data-ws-site-shell-core]')) return;
    const s=document.createElement('script');
    s.src='/assets/js/site-shell-core.js';
    s.async=false;
    s.dataset.wsSiteShellCore='true';
    document.head.appendChild(s);
  };
  loadCore();

  const mountHomepageEventBanner=()=>{
    const path=location.pathname.replace(/\/index\.html$/,'/');
    if(path!=='/') return;
    if(document.getElementById('ws-home-event-promo')) return;

    const header=document.querySelector('header');
    if(!header) return;

    const style=document.createElement('style');
    style.id='ws-home-event-promo-style';
    style.textContent=`
      #ws-home-event-promo{padding:18px 0 4px;background:linear-gradient(180deg,#fff 0%,#fdfbff 100%)}
      #ws-home-event-promo .ws-home-event-promo-inner{width:min(calc(100% - 40px),1320px);margin:0 auto}
      #ws-home-event-promo .ws-home-event-promo-link{position:relative;display:block;overflow:hidden;border:1px solid rgba(111,77,238,.16);border-radius:26px;background:#fff;box-shadow:0 14px 38px rgba(54,35,94,.09);isolation:isolate;transition:transform .24s ease,box-shadow .24s ease,border-color .24s ease}
      #ws-home-event-promo .ws-home-event-promo-link:before{content:'';position:absolute;inset:-45% -30%;z-index:2;pointer-events:none;background:linear-gradient(112deg,transparent 38%,rgba(255,255,255,.42) 49%,transparent 60%);transform:translateX(-52%) rotate(3deg);opacity:0;transition:transform .75s ease,opacity .2s ease}
      #ws-home-event-promo .ws-home-event-promo-image{position:relative;z-index:1;display:block;width:100%;height:auto;transform:scale(1.001);transform-origin:center;transition:transform .55s cubic-bezier(.2,.7,.2,1),filter .35s ease}
      #ws-home-event-promo .ws-home-event-promo-link:hover{transform:translateY(-3px);border-color:rgba(111,77,238,.26);box-shadow:0 22px 52px rgba(68,39,120,.14)}
      #ws-home-event-promo .ws-home-event-promo-link:hover:before{opacity:1;transform:translateX(52%) rotate(3deg)}
      #ws-home-event-promo .ws-home-event-promo-link:hover .ws-home-event-promo-image{transform:scale(1.008);filter:saturate(1.035) contrast(1.01)}
      #ws-home-event-promo .ws-home-event-promo-link:focus-visible{outline:3px solid rgba(103,52,237,.34);outline-offset:4px}
      @media(max-width:700px){#ws-home-event-promo{padding:12px 0 2px}#ws-home-event-promo .ws-home-event-promo-inner{width:min(calc(100% - 28px),1320px)}#ws-home-event-promo .ws-home-event-promo-link{border-radius:18px}}
      @media(prefers-reduced-motion:reduce){#ws-home-event-promo .ws-home-event-promo-link,#ws-home-event-promo .ws-home-event-promo-image,#ws-home-event-promo .ws-home-event-promo-link:before{transition:none!important}#ws-home-event-promo .ws-home-event-promo-link:hover{transform:none}#ws-home-event-promo .ws-home-event-promo-link:hover .ws-home-event-promo-image{transform:none}}
    `;
    document.head.appendChild(style);

    const section=document.createElement('section');
    section.id='ws-home-event-promo';
    section.setAttribute('aria-label','Featured live workshop');
    section.innerHTML=`<div class="ws-home-event-promo-inner"><a class="ws-home-event-promo-link" href="/resources/events/building-a-communicative-esl-lesson-with-flow/" aria-label="View Building a Communicative ESL Lesson with Flow live workshop"><img class="ws-home-event-promo-image" src="/resources/events/Front%20page%20banner.svg" alt="Building a Communicative ESL Lesson with Flow — live workshop for ESL teachers" loading="eager" fetchpriority="high" decoding="async"></a></div>`;
    header.insertAdjacentElement('afterend',section);
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mountHomepageEventBanner,{once:true});
  else mountHomepageEventBanner();
})();