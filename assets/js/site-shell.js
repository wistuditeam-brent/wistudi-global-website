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

  const iconSvg=(type)=>{
    const common='viewBox="0 0 64 64" aria-hidden="true" focusable="false"';
    if(type==='sorting') return `<svg ${common}><rect x="10" y="10" width="18" height="18" rx="5" fill="#ff6b2f"/><rect x="36" y="10" width="18" height="18" rx="5" fill="#7a45ef"/><rect x="10" y="36" width="18" height="18" rx="5" fill="#3181ef"/><rect x="36" y="36" width="18" height="18" rx="5" fill="#ffbd20"/></svg>`;
    if(type==='video') return `<svg ${common}><rect x="7" y="12" width="50" height="40" rx="10" fill="#2f73ee"/><path d="M27 23.5v17l14-8.5z" fill="#fff"/><path d="M12 17c8-5 26-7 39-1" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="4" stroke-linecap="round"/></svg>`;
    if(type==='reflection') return `<svg ${common}><rect x="10" y="10" width="35" height="43" rx="6" fill="#fff" stroke="#42b96b" stroke-width="5"/><path d="M18 22h19M18 30h16M18 38h11" stroke="#42b96b" stroke-width="4" stroke-linecap="round"/><path d="M34 44l15-19 8 6-16 19-9 2z" fill="#2f73ee"/><path d="M49 25l4-5 8 6-4 5z" fill="#ff7046"/></svg>`;
    if(type==='discussion') return `<svg ${common}><path d="M9 14c0-5 4-9 9-9h28c5 0 9 4 9 9v22c0 5-4 9-9 9H28L15 55l3-10c-5 0-9-4-9-9z" fill="#ff4d86"/><circle cx="24" cy="25" r="4" fill="#fff"/><circle cx="32" cy="25" r="4" fill="#fff"/><circle cx="40" cy="25" r="4" fill="#fff"/></svg>`;
    if(type==='quiz') return `<svg ${common}><rect x="13" y="14" width="38" height="39" rx="8" fill="none" stroke="#6e35ee" stroke-width="6"/><path d="M22 34l7 7 14-17" fill="none" stroke="#6e35ee" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M25 9h14" stroke="#6e35ee" stroke-width="6" stroke-linecap="round"/></svg>`;
    return `<svg ${common}><path d="M8 11h20v10c5-3 10 0 10 5s-5 8-10 5v20H18c3-5 0-10-5-10s-8 5-5 10V31c5 3 10 0 10-5s-5-8-10-5z" fill="#ffc323"/><path d="M56 11H36v10c-5-3-10 0-10 5s5 8 10 5v20h10c-3-5 0-10 5-10s8 5 5 10V31c-5 3-10 0-10-5s5-8 10-5z" fill="#7a45ef"/></svg>`;
  };

  const mountHomepageEventBanner=()=>{
    const path=location.pathname.replace(/\/index\.html$/,'/');
    if(path!=='/' || document.getElementById('ws-home-event-promo')) return;
    const header=document.querySelector('header');
    if(!header) return;

    const style=document.createElement('style');
    style.id='ws-home-event-promo-style';
    style.textContent=`
      #ws-home-event-promo{padding:18px 0 8px;background:linear-gradient(180deg,#fff 0%,#fdfbff 100%)}
      #ws-home-event-promo *{box-sizing:border-box}
      #ws-home-event-promo .ws-he-wrap{width:min(calc(100% - 40px),1320px);margin:0 auto}
      #ws-home-event-promo .ws-he-card{position:relative;display:grid;grid-template-columns:minmax(0,.9fr) minmax(520px,1.1fr);min-height:470px;overflow:hidden;text-decoration:none;color:#17142f;border:1px solid rgba(112,77,232,.18);border-radius:30px;background:linear-gradient(135deg,#fff 0%,#fdf9ff 48%,#f3e9ff 100%);box-shadow:0 20px 55px rgba(73,42,126,.12);isolation:isolate;transition:transform .28s ease,box-shadow .28s ease,border-color .28s ease}
      #ws-home-event-promo .ws-he-card:before{content:'';position:absolute;width:520px;height:520px;border-radius:50%;right:-115px;top:-155px;background:radial-gradient(circle at 40% 40%,rgba(178,140,255,.38),rgba(123,67,234,.13) 56%,transparent 72%);z-index:0}
      #ws-home-event-promo .ws-he-card:after{content:'';position:absolute;left:-90px;bottom:-130px;width:390px;height:260px;border-radius:52% 48% 0 0;background:rgba(127,87,239,.06);transform:rotate(-9deg);z-index:0}
      #ws-home-event-promo .ws-he-copy{position:relative;z-index:3;padding:46px 28px 42px 48px;display:flex;flex-direction:column;justify-content:center}
      #ws-home-event-promo .ws-he-live{display:inline-flex;align-items:center;gap:9px;width:max-content;margin-bottom:20px;padding:9px 15px;border-radius:999px;background:#3719b9;color:#fff;font:800 13px/1.1 Inter,system-ui,sans-serif;letter-spacing:.045em;text-transform:uppercase;box-shadow:0 8px 22px rgba(56,25,185,.15)}
      #ws-home-event-promo .ws-he-live b{padding:3px 7px;border-radius:6px;background:#ff4d70;font-weight:900}
      #ws-home-event-promo .ws-he-live i{width:8px;height:8px;border-radius:50%;background:#ff5f7f;box-shadow:0 0 0 4px rgba(255,95,127,.16);animation:wsLivePulse 1.9s ease-in-out infinite}
      #ws-home-event-promo .ws-he-title{max-width:600px;margin:0;font:900 clamp(44px,4.5vw,70px)/.94 Inter,system-ui,sans-serif;letter-spacing:-.055em;color:#17142f;text-wrap:balance}
      #ws-home-event-promo .ws-he-title strong{color:#6333eb;font-weight:900}
      #ws-home-event-promo .ws-he-sub{max-width:520px;margin:20px 0 0;font:700 clamp(20px,1.8vw,29px)/1.28 Inter,system-ui,sans-serif;color:#302a46}
      #ws-home-event-promo .ws-he-sub span{position:relative;white-space:nowrap;color:#6136e7}
      #ws-home-event-promo .ws-he-sub span:after{content:'';position:absolute;left:0;right:0;bottom:-6px;height:4px;border-radius:99px;background:#6136e7;transform:rotate(-1deg)}
      #ws-home-event-promo .ws-he-meta{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}
      #ws-home-event-promo .ws-he-meta-item{display:flex;align-items:center;gap:11px;min-height:54px;padding:9px 14px;border-radius:17px;background:rgba(255,255,255,.83);border:1px solid rgba(108,70,226,.12);box-shadow:0 8px 18px rgba(76,48,124,.06)}
      #ws-home-event-promo .ws-he-meta-icon{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:#f1ebff;color:#6333e8;flex:none}
      #ws-home-event-promo .ws-he-meta-icon svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
      #ws-home-event-promo .ws-he-meta-text{display:flex;flex-direction:column;gap:2px;font:700 13px/1.15 Inter,system-ui,sans-serif;color:#17142f}
      #ws-home-event-promo .ws-he-meta-text small{font:600 10px/1.1 Inter,system-ui,sans-serif;color:#736d82;text-transform:uppercase;letter-spacing:.055em}
      #ws-home-event-promo .ws-he-cta{display:inline-flex;align-items:center;gap:12px;width:max-content;margin-top:24px;padding:15px 22px;border-radius:16px;background:linear-gradient(135deg,#6231e9,#9846ef);color:#fff;font:800 15px/1 Inter,system-ui,sans-serif;box-shadow:0 13px 25px rgba(106,52,231,.24);transition:transform .2s ease,box-shadow .2s ease}
      #ws-home-event-promo .ws-he-cta span{font-size:20px;line-height:0;transition:transform .2s ease}
      #ws-home-event-promo .ws-he-scene{position:relative;z-index:2;min-height:470px;overflow:hidden}
      #ws-home-event-promo .ws-he-blob{position:absolute;right:-55px;top:12px;width:430px;height:500px;border-radius:47% 53% 0 0;background:linear-gradient(155deg,rgba(196,162,255,.52),rgba(116,62,231,.9));transform:rotate(4deg);filter:saturate(1.03)}
      #ws-home-event-promo .ws-he-trainer{position:absolute;right:0;bottom:0;width:min(390px,58%);max-height:450px;object-fit:contain;object-position:bottom right;filter:drop-shadow(0 18px 18px rgba(54,30,99,.18));z-index:4}
      #ws-home-event-promo .ws-he-note{position:absolute;right:270px;top:32px;z-index:4;font:700 17px/1.15 'Comic Sans MS','Segoe Print',cursive;color:#5d3ec6;transform:rotate(-4deg)}
      #ws-home-event-promo .ws-he-route{position:absolute;left:46px;top:63px;width:430px;height:360px;z-index:1;overflow:visible}
      #ws-home-event-promo .ws-he-route path{fill:none;stroke:#6640df;stroke-width:3.5;stroke-linecap:round;stroke-dasharray:7 10;opacity:.82;animation:wsRoute 9s linear infinite}
      #ws-home-event-promo .ws-he-route circle{fill:#fff;stroke:#6640df;stroke-width:3}
      #ws-home-event-promo .ws-he-activity{position:absolute;z-index:3;width:106px;height:106px;padding:8px 8px 9px;border-radius:19px;background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(255,255,255,.90));border:2px solid rgba(255,255,255,.92);box-shadow:0 11px 23px rgba(70,42,121,.15),0 0 0 1px rgba(91,56,191,.10);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;transform:translateZ(0);animation:wsActivityPop 7.2s ease-in-out infinite;transition:transform .2s ease,box-shadow .2s ease}
      #ws-home-event-promo .ws-he-activity:before{content:'';position:absolute;inset:-8px;border-radius:25px;background:radial-gradient(circle,rgba(120,74,235,.18),transparent 68%);opacity:0;z-index:-1;animation:wsAura 7.2s ease-in-out infinite}
      #ws-home-event-promo .ws-he-activity svg{width:62px;height:62px;display:block}
      #ws-home-event-promo .ws-he-activity b{font:900 10px/1 Inter,system-ui,sans-serif;color:#1e1932;letter-spacing:.02em}
      #ws-home-event-promo .a-discussion{left:238px;top:55px;animation-delay:0s}.a-discussion:before{animation-delay:0s}
      #ws-home-event-promo .a-matching{left:135px;top:130px;animation-delay:1.2s}.a-matching:before{animation-delay:1.2s}
      #ws-home-event-promo .a-sorting{left:62px;top:225px;animation-delay:2.4s}.a-sorting:before{animation-delay:2.4s}
      #ws-home-event-promo .a-quiz{left:205px;top:225px;animation-delay:3.6s}.a-quiz:before{animation-delay:3.6s}
      #ws-home-event-promo .a-video{left:88px;top:340px;animation-delay:4.8s}.a-video:before{animation-delay:4.8s}
      #ws-home-event-promo .a-reflection{left:230px;top:338px;animation-delay:6s}.a-reflection:before{animation-delay:6s}
      #ws-home-event-promo .ws-he-trainer-label{position:absolute;right:12px;bottom:20px;z-index:5;padding:13px 20px;border-radius:15px;background:rgba(255,255,255,.95);box-shadow:0 9px 25px rgba(64,35,112,.15);font:700 15px/1 'Segoe Print','Comic Sans MS',cursive;color:#5d3ec6;transform:rotate(-3deg)}
      #ws-home-event-promo .ws-he-trainer-label strong{font-size:26px;color:#17142f;font-weight:700}
      #ws-home-event-promo .ws-he-card:hover{transform:translateY(-3px);border-color:rgba(111,77,238,.28);box-shadow:0 28px 66px rgba(73,42,126,.16)}
      #ws-home-event-promo .ws-he-card:hover .ws-he-cta{transform:translateY(-2px);box-shadow:0 16px 30px rgba(106,52,231,.3)}
      #ws-home-event-promo .ws-he-card:hover .ws-he-cta span{transform:translateX(4px)}
      #ws-home-event-promo .ws-he-card:focus-visible{outline:3px solid rgba(103,52,237,.34);outline-offset:4px}
      @keyframes wsLivePulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(.76);opacity:.55}}
      @keyframes wsRoute{to{stroke-dashoffset:-34}}
      @keyframes wsActivityPop{0%,72%,100%{transform:translateY(0) scale(1)}7%,14%{transform:translateY(-8px) scale(1.045)}20%{transform:translateY(0) scale(1)}}
      @keyframes wsAura{0%,72%,100%{opacity:0;transform:scale(.88)}7%,18%{opacity:1;transform:scale(1.08)}24%{opacity:0;transform:scale(1.13)}}
      @media(max-width:1120px){#ws-home-event-promo .ws-he-card{grid-template-columns:minmax(0,.95fr) minmax(440px,1.05fr)}#ws-home-event-promo .ws-he-copy{padding-left:36px}#ws-home-event-promo .ws-he-note{display:none}#ws-home-event-promo .ws-he-activity{width:92px;height:92px}#ws-home-event-promo .ws-he-activity svg{width:52px;height:52px}#ws-home-event-promo .a-discussion{left:218px}.a-matching{left:120px!important}.a-quiz{left:194px!important}.a-reflection{left:212px!important}}
      @media(max-width:900px){#ws-home-event-promo .ws-he-card{grid-template-columns:1fr;min-height:0}#ws-home-event-promo .ws-he-copy{padding:34px 34px 26px}#ws-home-event-promo .ws-he-title{font-size:clamp(42px,8vw,62px);max-width:720px}#ws-home-event-promo .ws-he-scene{min-height:410px;border-top:1px solid rgba(111,77,238,.08)}#ws-home-event-promo .ws-he-route{left:50%;transform:translateX(-54%)}#ws-home-event-promo .ws-he-blob{right:-20px;width:360px;height:440px}#ws-home-event-promo .ws-he-trainer{width:330px}#ws-home-event-promo .ws-he-trainer-label{right:18px}}
      @media(max-width:620px){#ws-home-event-promo{padding:10px 0 4px}#ws-home-event-promo .ws-he-wrap{width:min(calc(100% - 24px),1320px)}#ws-home-event-promo .ws-he-card{border-radius:22px}#ws-home-event-promo .ws-he-copy{padding:26px 22px 24px}#ws-home-event-promo .ws-he-live{font-size:10px;padding:8px 11px;margin-bottom:15px}#ws-home-event-promo .ws-he-title{font-size:40px;line-height:.98}#ws-home-event-promo .ws-he-sub{font-size:18px;margin-top:15px}#ws-home-event-promo .ws-he-meta{gap:8px;margin-top:22px}#ws-home-event-promo .ws-he-meta-item{flex:1 1 calc(50% - 4px);min-width:0;padding:8px 10px}#ws-home-event-promo .ws-he-meta-icon{width:32px;height:32px}#ws-home-event-promo .ws-he-meta-text{font-size:11px}#ws-home-event-promo .ws-he-cta{margin-top:18px;padding:14px 18px}#ws-home-event-promo .ws-he-scene{min-height:auto;padding:22px 16px 205px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;overflow:hidden}#ws-home-event-promo .ws-he-route{display:none}#ws-home-event-promo .ws-he-activity{position:relative!important;left:auto!important;top:auto!important;width:100%;height:auto;min-height:92px;padding:7px 4px;border-radius:16px}#ws-home-event-promo .ws-he-activity svg{width:48px;height:48px}#ws-home-event-promo .ws-he-activity b{font-size:8px}#ws-home-event-promo .ws-he-blob{width:280px;height:245px;right:-70px;top:auto;bottom:-40px}#ws-home-event-promo .ws-he-trainer{width:205px;right:-2px}#ws-home-event-promo .ws-he-trainer-label{right:9px;bottom:8px;padding:8px 10px;font-size:10px;border-radius:10px}#ws-home-event-promo .ws-he-trainer-label strong{font-size:17px}}
      @media(max-width:410px){#ws-home-event-promo .ws-he-title{font-size:36px}#ws-home-event-promo .ws-he-meta-item{flex-basis:100%}#ws-home-event-promo .ws-he-scene{grid-template-columns:repeat(2,1fr);padding-bottom:190px}}
      @media(prefers-reduced-motion:reduce){#ws-home-event-promo .ws-he-live i,#ws-home-event-promo .ws-he-route path,#ws-home-event-promo .ws-he-activity,#ws-home-event-promo .ws-he-activity:before{animation:none!important}#ws-home-event-promo .ws-he-card,#ws-home-event-promo .ws-he-cta{transition:none!important}#ws-home-event-promo .ws-he-card:hover{transform:none}}
    `;
    document.head.appendChild(style);

    const eventUrl='/resources/events/building-a-communicative-esl-lesson-with-flow/';
    const section=document.createElement('section');
    section.id='ws-home-event-promo';
    section.setAttribute('aria-label','Featured live workshop');
    section.innerHTML=`
      <div class="ws-he-wrap">
        <a class="ws-he-card" href="${eventUrl}" aria-label="View Building a Communicative ESL Lesson with Flow live workshop">
          <div class="ws-he-copy">
            <div class="ws-he-live"><i></i><b>LIVE</b> Workshop for ESL teachers</div>
            <h2 class="ws-he-title">Building a <strong>Communicative ESL Lesson</strong> with Flow</h2>
            <p class="ws-he-sub">Learn how to guide your students <span>step by step.</span></p>
            <div class="ws-he-meta">
              <div class="ws-he-meta-item"><div class="ws-he-meta-icon"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/></svg></div><div class="ws-he-meta-text"><small>Your date</small><time class="ws-he-date">15 September 2026</time></div></div>
              <div class="ws-he-meta-item"><div class="ws-he-meta-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></svg></div><div class="ws-he-meta-text"><small>Your local time</small><time class="ws-he-time">2:00 PM GMT+7</time></div></div>
            </div>
            <div class="ws-he-cta">Register free <span>→</span></div>
          </div>
          <div class="ws-he-scene" aria-hidden="true">
            <div class="ws-he-blob"></div>
            <div class="ws-he-note">Engaging activities.<br>Meaningful learning.</div>
            <svg class="ws-he-route" viewBox="0 0 430 360" preserveAspectRatio="none"><path d="M300 45 C235 70 235 105 225 125 S125 145 110 205 S175 245 225 250 S300 285 245 315 S145 310 125 350"/><circle cx="300" cy="45" r="6"/><circle cx="225" cy="125" r="6"/><circle cx="110" cy="205" r="6"/><circle cx="225" cy="250" r="6"/><circle cx="125" cy="350" r="6"/><circle cx="245" cy="315" r="6"/></svg>
            <div class="ws-he-activity a-discussion">${iconSvg('discussion')}<b>DISCUSSION</b></div>
            <div class="ws-he-activity a-matching">${iconSvg('matching')}<b>MATCHING</b></div>
            <div class="ws-he-activity a-sorting">${iconSvg('sorting')}<b>SORTING</b></div>
            <div class="ws-he-activity a-quiz">${iconSvg('quiz')}<b>QUIZ</b></div>
            <div class="ws-he-activity a-video">${iconSvg('video')}<b>VIDEO</b></div>
            <div class="ws-he-activity a-reflection">${iconSvg('reflection')}<b>REFLECTION</b></div>
            <img class="ws-he-trainer" src="/resources/events/trainer-nadia.png" alt="" loading="eager" decoding="async">
            <div class="ws-he-trainer-label">with <strong>Trainer Nadia</strong></div>
          </div>
        </a>
      </div>`;
    header.insertAdjacentElement('afterend',section);

    const start=new Date('2026-09-15T14:00:00+07:00');
    const dateEl=section.querySelector('.ws-he-date');
    const timeEl=section.querySelector('.ws-he-time');
    try{
      const dateFmt=new Intl.DateTimeFormat(undefined,{day:'numeric',month:'long',year:'numeric'});
      const timeFmt=new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit',timeZoneName:'short'});
      if(dateEl) dateEl.textContent=dateFmt.format(start);
      if(timeEl) timeEl.textContent=timeFmt.format(start);
      const local=dateFmt.format(start)+' · '+timeFmt.format(start);
      dateEl?.setAttribute('datetime',start.toISOString());
      timeEl?.setAttribute('datetime',start.toISOString());
      section.querySelector('.ws-he-card')?.setAttribute('aria-label',`View Building a Communicative ESL Lesson with Flow live workshop, ${local}`);
    }catch(e){}
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mountHomepageEventBanner,{once:true});
  else mountHomepageEventBanner();
})();