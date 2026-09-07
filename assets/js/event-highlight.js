(()=>{
  'use strict';
  const doc=document;
  if(!location.pathname.includes('/resources/events/building-a-communicative-esl-lesson-with-flow/')) return;

  const style=doc.createElement('style');
  style.textContent=`
    #ws-event-highlight-section{padding:74px 0;background:#fff}
    #ws-event-highlight-section .event-highlight-shell{width:min(calc(100% - 40px),1180px);margin:auto;display:grid;grid-template-columns:minmax(0,1.03fr) minmax(360px,.97fr);gap:46px;align-items:center;padding:34px;border:1px solid #ece6f4;border-radius:28px;background:linear-gradient(135deg,#fff 0%,#fcfaff 54%,#f7f1ff 100%);box-shadow:0 18px 54px rgba(52,35,90,.08)}
    #ws-event-highlight-section .event-highlight-art{min-width:0}
    #ws-event-highlight-section .event-highlight-art img{display:block;width:100%;height:auto;aspect-ratio:1/1;object-fit:cover;border-radius:22px;border:1px solid #e6dff0;box-shadow:0 14px 34px rgba(54,35,94,.10)}
    #ws-event-highlight-section .event-highlight-copy{min-width:0}
    #ws-event-highlight-section .event-highlight-kicker{display:inline-flex;align-items:center;gap:8px;margin-bottom:16px;padding:8px 12px;border-radius:999px;background:#f0eaff;color:#5b2de1;font:800 .7rem/1 Inter,sans-serif;letter-spacing:.07em;text-transform:uppercase}
    #ws-event-highlight-section .event-highlight-kicker:before{content:'★';font-size:.8rem}
    #ws-event-highlight-section h2{margin:0;font-family:'Be Vietnam Pro',Inter,sans-serif;font-size:clamp(2rem,3.2vw,3.1rem);line-height:1.04;letter-spacing:-.045em;color:#171329}
    #ws-event-highlight-section .event-highlight-intro{margin:16px 0 24px;color:#625b6b;font-size:1rem;line-height:1.68}
    #ws-event-highlight-section .event-highlight-points{display:grid;gap:18px}
    #ws-event-highlight-section .event-highlight-point{display:grid;grid-template-columns:56px 1fr;gap:15px;align-items:center}
    #ws-event-highlight-section .event-highlight-icon{width:56px;height:56px;border-radius:50%;display:grid;place-items:center}
    #ws-event-highlight-section .event-highlight-icon img{display:block;width:34px;height:34px;object-fit:contain}
    #ws-event-highlight-section .event-highlight-icon.play{background:#fff0f7}
    #ws-event-highlight-section .event-highlight-icon.people{background:#f2edff}
    #ws-event-highlight-section .event-highlight-icon.idea{background:#eafbf7}
    #ws-event-highlight-section .event-highlight-point strong{display:block;margin-bottom:3px;font:800 1rem/1.25 Inter,sans-serif;color:#211a31}
    #ws-event-highlight-section .event-highlight-point span{display:block;color:#6b6373;font-size:.9rem;line-height:1.48}
    #ws-event-highlight-section .event-highlight-close{margin-top:24px;padding-top:20px;border-top:1px solid #e9e3ef;color:#5d5667;font-size:.95rem;line-height:1.55}
    #ws-event-highlight-section .event-highlight-cta{display:inline-flex;align-items:center;justify-content:center;gap:10px;margin-top:18px;min-height:50px;padding:0 22px;border-radius:14px;background:linear-gradient(135deg,#5d24e8,#8c49f2 58%,#ec3c8d);color:#fff;text-decoration:none;font:800 .9rem Inter,sans-serif;box-shadow:0 12px 26px rgba(103,52,237,.20);transition:.18s ease}
    #ws-event-highlight-section .event-highlight-cta:hover{transform:translateY(-2px)}
    #ws-event-highlight-section .event-highlight-cta span{font-size:1.2rem;line-height:1}

    .ws-workshop-features{position:relative;overflow:hidden;padding:84px 0 88px!important;background:linear-gradient(180deg,#fcfbff 0%,#f8f4ff 100%)!important}
    .ws-workshop-features:before{content:'';position:absolute;left:-110px;top:-130px;width:320px;height:290px;border-radius:52% 48% 64% 36%/58% 42% 58% 42%;background:rgba(111,77,238,.075);transform:rotate(-12deg)}
    .ws-workshop-features:after{content:'';position:absolute;right:-105px;bottom:-120px;width:330px;height:300px;border-radius:54% 46% 35% 65%/42% 55% 45% 58%;background:rgba(111,77,238,.07);transform:rotate(12deg)}
    .ws-workshop-features .ec{position:relative;z-index:2}
    .ws-workshop-features .workshop-eyebrow{display:inline-flex;align-items:center;gap:13px;margin-bottom:16px;color:#6845ea;font:800 .76rem/1 Inter,sans-serif;letter-spacing:.12em;text-transform:uppercase}
    .ws-workshop-features .workshop-eyebrow:before{content:'';width:31px;height:2px;border-radius:99px;background:#6d4df0}
    .ws-workshop-features .workshop-title{max-width:1120px;margin:0 0 42px!important;font-family:'Be Vietnam Pro',Inter,sans-serif;font-size:clamp(2.35rem,4.55vw,4.25rem)!important;line-height:1.03!important;letter-spacing:-.052em!important;color:#17142f!important}
    .ws-workshop-features .workshop-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:74px;row-gap:30px;max-width:1110px}
    .ws-workshop-features .workshop-item{display:grid;grid-template-columns:108px minmax(0,1fr);gap:24px;align-items:center;min-width:0}
    .ws-workshop-features .workshop-icon{width:94px;height:94px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 36% 30%,#fbf9ff 0%,#eee8ff 78%,#e7dfff 100%);box-shadow:inset 0 0 0 1px rgba(111,77,238,.035)}
    .ws-workshop-features .workshop-icon svg{width:64px;height:64px;overflow:visible}
    .ws-workshop-features .workshop-item h3{margin:0 0 6px;font:800 clamp(1.08rem,1.7vw,1.55rem)/1.2 'Be Vietnam Pro',Inter,sans-serif;letter-spacing:-.025em;color:#1c1831}
    .ws-workshop-features .workshop-item p{margin:0;color:#69637a;font-size:clamp(.94rem,1.15vw,1.08rem);line-height:1.5}
    .ws-workshop-features .workshop-squiggle{position:absolute;left:-66px;top:188px;width:168px;height:102px;border-left:4px solid rgba(123,91,237,.16);border-bottom:4px solid rgba(123,91,237,.16);border-radius:0 0 0 120px;transform:rotate(-10deg);z-index:1;pointer-events:none}
    .ws-workshop-features .workshop-spark{position:absolute;z-index:1;pointer-events:none;width:84px;height:84px}
    .ws-workshop-features .workshop-spark span{position:absolute;width:30px;height:5px;border-radius:99px;background:rgba(122,88,240,.55)}
    .ws-workshop-features .workshop-spark.top{right:82px;top:52px}.ws-workshop-features .workshop-spark.bottom{right:22px;bottom:72px}
    .ws-workshop-features .workshop-spark span:nth-child(1){left:28px;top:0;transform:rotate(-64deg)}
    .ws-workshop-features .workshop-spark span:nth-child(2){left:46px;top:31px;transform:rotate(-23deg)}
    .ws-workshop-features .workshop-spark span:nth-child(3){left:42px;top:61px;transform:rotate(10deg)}

    @media(max-width:940px){
      #ws-event-highlight-section .event-highlight-shell{grid-template-columns:1fr;gap:30px}
      #ws-event-highlight-section .event-highlight-art{max-width:720px}
      #ws-event-highlight-section .event-highlight-art img{aspect-ratio:auto}
      .ws-workshop-features .workshop-grid{grid-template-columns:1fr;row-gap:24px}
      .ws-workshop-features .workshop-item{grid-template-columns:92px minmax(0,1fr)}
      .ws-workshop-features .workshop-icon{width:82px;height:82px}
      .ws-workshop-features .workshop-icon svg{width:56px;height:56px}
      .ws-workshop-features .workshop-spark.top{right:24px;top:42px}
    }
    @media(max-width:620px){
      #ws-event-highlight-section{padding:58px 0}
      #ws-event-highlight-section .event-highlight-shell{width:min(calc(100% - 26px),1180px);padding:20px;border-radius:20px}
      #ws-event-highlight-section .event-highlight-art img{border-radius:16px}
      #ws-event-highlight-section .event-highlight-point{grid-template-columns:48px 1fr;gap:12px}
      #ws-event-highlight-section .event-highlight-icon{width:48px;height:48px}
      #ws-event-highlight-section .event-highlight-icon img{width:29px;height:29px}
      #ws-event-highlight-section .event-highlight-cta{width:100%}
      .ws-workshop-features{padding:62px 0 64px!important}
      .ws-workshop-features .workshop-title{margin-bottom:32px!important;font-size:clamp(2.1rem,11vw,3rem)!important}
      .ws-workshop-features .workshop-item{grid-template-columns:76px minmax(0,1fr);gap:15px;align-items:start}
      .ws-workshop-features .workshop-icon{width:68px;height:68px}
      .ws-workshop-features .workshop-icon svg{width:46px;height:46px}
      .ws-workshop-features .workshop-squiggle,.ws-workshop-features .workshop-spark.bottom{display:none}
      .ws-workshop-features .workshop-spark.top{opacity:.55;right:-3px;top:24px;transform:scale(.72)}
    }
  `;
  doc.head.appendChild(style);

  const featureIcon=(type)=>{
    const common='fill="none" stroke="#6040e8" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"';
    const accent='fill="none" stroke="#ffbf2f" stroke-width="3" stroke-linecap="round"';
    const pale='stroke="#bdaeff"';
    const icons={
      idea:`<svg viewBox="0 0 72 72" aria-hidden="true"><path ${common} d="M27 50h18M29 56h14M30.5 61h11"/><path ${common} d="M36 11c-11 0-20 8.7-20 19.4 0 7.6 4.2 12.1 8 16 3.2 3.3 4.6 6.1 4.8 9.6h14.4c.2-3.5 1.6-6.3 4.8-9.6 3.8-3.9 8-8.4 8-16C56 19.7 47 11 36 11Z"/><path ${common} ${pale} d="M24 29c1-6 5-9 10-10"/><path ${accent} d="M36 2v5M13 11l4 4M59 11l-4 4M5 30h6M61 30h6"/></svg>`,
      map:`<svg viewBox="0 0 72 72" aria-hidden="true"><path ${common} d="M9 23l16-7 18 7 20-8v36l-20 8-18-7-16 7V23Z"/><path ${common} d="M25 16v36M43 23v36"/><path fill="#ffbf2f" stroke="#6040e8" stroke-width="2.5" d="M46 10c-6 0-10.5 4.6-10.5 10.2 0 7.7 10.5 18.8 10.5 18.8s10.5-11.1 10.5-18.8C56.5 14.6 52 10 46 10Z"/><circle cx="46" cy="20" r="3.5" fill="#fff"/></svg>`,
      laptop:`<svg viewBox="0 0 72 72" aria-hidden="true"><rect ${common} x="13" y="14" width="46" height="34" rx="3"/><path ${common} d="M8 52h56l-4 6H12l-4-6Z"/><path ${common} ${pale} d="M21 22h13"/><path ${accent} d="M54 6v6M59 9l4-4M60 14h6"/></svg>`,
      journey:`<svg viewBox="0 0 72 72" aria-hidden="true"><path ${common} d="M36 59V35"/><path ${common} d="M36 37C24 37 17 29 16 18c12 0 20 5 20 19Z"/><path ${common} d="M36 34c2-13 10-21 23-22-1 14-9 22-23 22Z"/><path fill="#ffe08a" stroke="#6040e8" stroke-width="2.4" d="M37 34c4-10 11-16 21-19-2 10-8 17-21 19Z"/><path ${common} d="M24 59h24"/><path ${accent} d="M57 6v5M63 9l4-4M64 15h6"/></svg>`,
      document:`<svg viewBox="0 0 72 72" aria-hidden="true"><path ${common} d="M20 10h24l12 12v40H20V10Z"/><path ${common} d="M44 10v13h12"/><path ${common} d="M28 34h20M28 42h20M28 50h15"/><path ${accent} d="M55 8l4-4M60 13h6M53 3v5"/></svg>`,
      learner:`<svg viewBox="0 0 72 72" aria-hidden="true"><circle ${common} cx="34" cy="23" r="10"/><path ${common} d="M17 57c1.6-11.2 7.4-18 17-18s15.4 6.8 17 18H17Z"/><path ${common} ${pale} d="M29 18c2-2 4-3 7-3"/><path ${accent} d="M53 15l4-4M57 21h6M50 9v5"/></svg>`
    };
    return icons[type];
  };

  const oldFeatureSection=[...doc.querySelectorAll('section.section.soft')].find(section=>section.querySelector('h2')?.textContent.includes('Everything you need for a practical and inspiring session'));
  if(oldFeatureSection){
    oldFeatureSection.classList.add('ws-workshop-features');
    oldFeatureSection.innerHTML=`
      <span class="workshop-squiggle" aria-hidden="true"></span>
      <span class="workshop-spark top" aria-hidden="true"><span></span><span></span><span></span></span>
      <span class="workshop-spark bottom" aria-hidden="true"><span></span><span></span><span></span></span>
      <div class="ec">
        <div class="workshop-eyebrow">In this workshop</div>
        <h2 class="workshop-title">Everything you need for a practical and inspiring session.</h2>
        <div class="workshop-grid">
          <article class="workshop-item"><div class="workshop-icon">${featureIcon('idea')}</div><div><h3>Practical ESL activities</h3><p>Modern, hands-on ideas for the classroom.</p></div></article>
          <article class="workshop-item"><div class="workshop-icon">${featureIcon('map')}</div><div><h3>Examples across lesson stages</h3><p>See what works at different points in a lesson.</p></div></article>
          <article class="workshop-item"><div class="workshop-icon">${featureIcon('laptop')}</div><div><h3>A complete lesson in Flow</h3><p>Explore a full communicative lesson built in Flow.</p></div></article>
          <article class="workshop-item"><div class="workshop-icon">${featureIcon('journey')}</div><div><h3>From Warm-up to Reflect</h3><p>Follow a purposeful learning journey.</p></div></article>
          <article class="workshop-item"><div class="workshop-icon">${featureIcon('document')}</div><div><h3>Interactive and printable</h3><p>Discover both digital and worksheet versions.</p></div></article>
          <article class="workshop-item"><div class="workshop-icon">${featureIcon('learner')}</div><div><h3>Experience it as a learner</h3><p>Step into the lesson from the learner’s perspective.</p></div></article>
        </div>
      </div>`;
  }

  if(!doc.getElementById('ws-event-highlight-section')){
    const section=doc.createElement('section');
    section.id='ws-event-highlight-section';
    section.innerHTML=`
      <div class="event-highlight-shell">
        <div class="event-highlight-art">
          <img src="/resources/events/Banner_section.png" alt="Wistudi lesson example showing a communicative ESL learning journey" loading="lazy" decoding="async">
        </div>
        <div class="event-highlight-copy">
          <div class="event-highlight-kicker">Event highlight</div>
          <h2>From Activities to Real Communication</h2>
          <p class="event-highlight-intro">See how a complete lesson in Wistudi can guide learners from familiarising themselves with language to using it confidently and independently.</p>
          <div class="event-highlight-points">
            <div class="event-highlight-point">
              <div class="event-highlight-icon play"><img src="/resources/events/icon-play.png" alt="" aria-hidden="true"></div>
              <div><strong>See it in action</strong><span>Explore a real lesson example built in Wistudi.</span></div>
            </div>
            <div class="event-highlight-point">
              <div class="event-highlight-icon people"><img src="/resources/events/icon-people.png" alt="" aria-hidden="true"></div>
              <div><strong>Practical ideas</strong><span>Discover activities that support each stage of learning.</span></div>
            </div>
            <div class="event-highlight-point">
              <div class="event-highlight-icon idea"><img src="/resources/events/icon-lightbulb.png" alt="" aria-hidden="true"></div>
              <div><strong>Teaching flexibility</strong><span>Get ideas you can adapt for your own students, online or offline.</span></div>
            </div>
          </div>
          <div class="event-highlight-close">Walk away with clear, practical takeaways to help your students use English with confidence.</div>
          <a class="event-highlight-cta" href="#register">Join the Event <span aria-hidden="true">→</span></a>
        </div>
      </div>`;

    const trainerSection=doc.querySelector('.trainer')?.closest('section');
    const main=doc.querySelector('main');
    if(trainerSection && trainerSection.parentNode){
      trainerSection.parentNode.insertBefore(section,trainerSection);
    }else if(main){
      const cta=main.querySelector('.cta');
      if(cta) main.insertBefore(section,cta); else main.appendChild(section);
    }
  }
})();
