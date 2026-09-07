(()=>{
  'use strict';
  const doc=document;
  if(doc.getElementById('ws-event-highlight-section')) return;
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
    @media(max-width:940px){#ws-event-highlight-section .event-highlight-shell{grid-template-columns:1fr;gap:30px}#ws-event-highlight-section .event-highlight-art{max-width:720px}#ws-event-highlight-section .event-highlight-art img{aspect-ratio:auto}}
    @media(max-width:620px){#ws-event-highlight-section{padding:58px 0}#ws-event-highlight-section .event-highlight-shell{width:min(calc(100% - 26px),1180px);padding:20px;border-radius:20px}#ws-event-highlight-section .event-highlight-art img{border-radius:16px}#ws-event-highlight-section .event-highlight-point{grid-template-columns:48px 1fr;gap:12px}#ws-event-highlight-section .event-highlight-icon{width:48px;height:48px}#ws-event-highlight-section .event-highlight-icon img{width:29px;height:29px}#ws-event-highlight-section .event-highlight-cta{width:100%}}
  `;
  doc.head.appendChild(style);

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
})();
