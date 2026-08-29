(()=>{
  'use strict';

  const doc=document;
  const section=doc.querySelector('body.page-platform #printable.printable-upgraded');
  if(!section||section.dataset.wsTransformReady==='true') return;
  section.dataset.wsTransformReady='true';

  const media=section.querySelector('.printable-media');
  const copy=section.querySelector('.printable-copy');
  if(!media||!copy) return;

  const BASE='/assets/media/interactive-printable/';
  const activities=[
    {
      key:'link-match',
      label:'Link & Match',
      video:BASE+'videos/LINK%20%26%20MATCH%20-%20VIDEO.mp4',
      worksheet:BASE+'worksheets/LINK%20%26%20MATCH%20-%20WS.png'
    },
    {
      key:'recall-reveal',
      label:'Recall & Reveal',
      video:BASE+'videos/RECALL%20%26%20REVEAL%20-%20VIDEO.mp4',
      worksheet:BASE+'worksheets/RECALL%20%26%20REVEAL%20-%20WS.png'
    },
    {
      key:'written-response',
      label:'Written Response',
      video:BASE+'videos/WRITTEN%20RESPONSE%20-%20VIDEO.mp4',
      worksheet:BASE+'worksheets/WRITTEN%20RESPONSE%20-%20WS.png'
    },
    {
      key:'fill-blanks',
      label:'Fill in the Blanks',
      video:BASE+'videos/FILL%20IN%20THE%20BLANKS%20-%20VIDEO.mp4',
      worksheet:BASE+'worksheets/IMAGE%20DISCOVERY%20-%20WS.png'
    }
  ];

  const icons={
    'link-match':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.4 14.6 14.6 9.4M7.2 16.8l-1.5 1.5a3.3 3.3 0 0 1-4.7-4.7l3.2-3.2a3.3 3.3 0 0 1 4.7 0M16.8 7.2l1.5-1.5a3.3 3.3 0 0 1 4.7 4.7l-3.2 3.2a3.3 3.3 0 0 1-4.7 0"/></svg>',
    'recall-reveal':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5A3.5 3.5 0 0 1 7.5 4h9A3.5 3.5 0 0 1 20 7.5v9a3.5 3.5 0 0 1-3.5 3.5h-9A3.5 3.5 0 0 1 4 16.5zM8 9h8M8 13h5M8 17h3"/></svg>',
    'written-response':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v14H5zM8 9h8M8 13h8M8 17h5"/></svg>',
    'fill-blanks':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18h16M5 6h4M12 6h7M5 11h7M15 11h4"/></svg>'
  };

  const style=doc.createElement('style');
  style.id='ws-interactive-printable-slider-style';
  style.textContent=`
    #printable.ws-transform-v2{position:relative;isolation:isolate;overflow:hidden;background:linear-gradient(180deg,#fff 0%,#fffbf8 46%,#fbf9ff 100%)!important;padding-top:96px;padding-bottom:112px}
    #printable.ws-transform-v2::before{content:"";position:absolute;z-index:-3;inset:27% -8% 10%;background:linear-gradient(112deg,rgba(124,58,237,.15) 0%,rgba(124,58,237,.055) 43%,rgba(249,115,22,.05) 59%,rgba(249,115,22,.15) 100%);clip-path:polygon(0 18%,48% 0,100% 21%,100% 87%,58% 100%,0 77%);pointer-events:none}
    #printable.ws-transform-v2::after{content:"";position:absolute;z-index:-2;width:760px;height:760px;right:-440px;top:20%;border-radius:50%;background:radial-gradient(circle,rgba(249,115,22,.13),rgba(249,115,22,0) 69%);pointer-events:none}
    #printable.ws-transform-v2 .printable-split{display:block!important;position:relative;z-index:1}
    #printable.ws-transform-v2 .printable-copy{max-width:940px!important;margin:0 auto 40px;text-align:center}
    #printable.ws-transform-v2 .printable-copy .eyebrow{justify-content:center;color:var(--purple)!important}
    #printable.ws-transform-v2 .printable-copy h2{max-width:900px!important;margin-inline:auto;font-size:clamp(2.35rem,4.7vw,4.15rem);line-height:1.03}
    #printable.ws-transform-v2 .printable-copy .lead{max-width:810px!important;margin:20px auto 0}
    #printable.ws-transform-v2 .delivery-flow{justify-content:center;margin-top:25px}
    #printable.ws-transform-v2 .printable-media{width:100%!important;max-width:1200px!important;margin:0 auto!important;overflow:visible!important;border:0!important;padding:0!important;background:transparent!important;box-shadow:none!important}

    .ws-transform-shell{position:relative;width:100%;margin:0 auto;padding:0 0 18px;isolation:isolate}
    .ws-transform-shell::before,.ws-transform-shell::after{content:"";position:absolute;z-index:-2;pointer-events:none}
    .ws-transform-shell::before{left:-10%;top:18%;width:46%;height:62%;background:linear-gradient(135deg,rgba(124,58,237,.16),rgba(124,58,237,.025));clip-path:polygon(0 22%,100% 0,82% 87%,7% 100%);border-radius:44px}
    .ws-transform-shell::after{right:-10%;top:18%;width:45%;height:60%;background:linear-gradient(225deg,rgba(249,115,22,.16),rgba(249,115,22,.025));clip-path:polygon(18% 0,100% 20%,93% 100%,0 84%);border-radius:44px}

    .ws-transform-tabs{position:relative;z-index:4;display:flex;justify-content:center;align-items:center;gap:6px;width:max-content;max-width:calc(100% - 26px);margin:0 auto 20px;padding:6px;border-radius:19px;border:1px solid rgba(94,74,126,.13);background:rgba(255,255,255,.86);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 12px 34px rgba(50,32,84,.085);overflow:auto;scrollbar-width:none}
    .ws-transform-tabs::-webkit-scrollbar{display:none}
    .ws-transform-tab{appearance:none;border:0;background:transparent;color:#5e5869;min-height:46px;padding:0 17px;border-radius:13px;display:inline-flex;align-items:center;gap:9px;white-space:nowrap;font-weight:760;font-size:.87rem;cursor:pointer;transition:background .22s ease,color .22s ease,box-shadow .22s ease,transform .22s ease}
    .ws-transform-tab svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:0 0 auto}
    .ws-transform-tab:hover{color:var(--purple);background:#faf8ff}
    .ws-transform-tab[aria-selected="true"]{color:#6428df;background:linear-gradient(135deg,#f4eeff,#fff);box-shadow:inset 0 0 0 1.5px #8b5cf6,0 7px 20px rgba(124,58,237,.12)}
    .ws-transform-tab:focus-visible{outline:3px solid rgba(124,58,237,.25);outline-offset:2px}
    .ws-transform-more{appearance:none;border:1px dashed rgba(249,115,22,.36);background:linear-gradient(135deg,#fffaf5,#fff);color:#d85d12;min-height:46px;padding:0 15px;border-radius:13px;display:inline-flex;align-items:center;gap:8px;white-space:nowrap;font-weight:800;font-size:.84rem;cursor:default}
    .ws-transform-more-mark{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:#ffedd5;color:#e85d0f;font-size:17px;line-height:1;box-shadow:0 0 0 4px rgba(249,115,22,.06)}

    .ws-transform-stage-wrap{position:relative;max-width:1120px;margin:0 auto}
    .ws-transform-stage{--split:50%;position:relative;width:100%;aspect-ratio:16/9;border-radius:32px;overflow:hidden;background:#f2eef8;border:1px solid rgba(80,57,112,.13);box-shadow:0 34px 90px rgba(58,39,92,.19),0 9px 28px rgba(58,39,92,.09);isolation:isolate;user-select:none;-webkit-user-select:none;transition:opacity .14s ease,transform .22s ease}
    .ws-transform-stage::before{content:"";position:absolute;inset:0;z-index:10;pointer-events:none;border-radius:inherit;background:linear-gradient(180deg,rgba(255,255,255,.18),transparent 13%,transparent 84%,rgba(24,14,42,.05));box-shadow:inset 0 0 0 1px rgba(255,255,255,.56)}
    .ws-transform-stage.switching{opacity:.74;transform:scale(.995)}
    .ws-transform-media,.ws-transform-paper{position:absolute;inset:0;width:100%;height:100%}
    .ws-transform-media{z-index:1;background:linear-gradient(135deg,#ece7f7,#faf8ff)}
    .ws-transform-video{width:100%;height:100%;display:block;object-fit:cover;background:#ece9f3}
    .ws-transform-media::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 50% 44%,transparent 52%,rgba(28,15,48,.08) 100%)}

    .ws-transform-paper{z-index:2;clip-path:inset(0 0 0 var(--split));will-change:clip-path;pointer-events:none;overflow:hidden;background:#f3eee9}
    .ws-transform-paper-backdrop{position:absolute;inset:-4%;width:108%;height:108%;object-fit:cover;filter:blur(25px) saturate(.88);transform:scale(1.06);opacity:.47}
    .ws-transform-paper-wash{position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.72),rgba(247,241,236,.50) 46%,rgba(255,249,244,.70));backdrop-filter:blur(2px)}
    .ws-transform-paper-foreground{position:absolute;inset:2.8%;display:flex;align-items:center;justify-content:center}
    .ws-transform-paper-image{display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;border-radius:15px;box-shadow:0 24px 58px rgba(63,47,42,.20),0 5px 15px rgba(63,47,42,.09);background:rgba(255,255,255,.90)}
    .ws-transform-paper-shine{position:absolute;inset:0;pointer-events:none;background:linear-gradient(105deg,rgba(255,255,255,.22),transparent 25%,transparent 72%,rgba(249,115,22,.04))}

    .ws-transform-label{position:absolute;z-index:5;top:18px;display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.89);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);font-size:.71rem;font-weight:800;letter-spacing:.01em;box-shadow:0 8px 24px rgba(38,25,64,.09);pointer-events:none}
    .ws-transform-label::before{content:"";width:7px;height:7px;border-radius:50%;background:currentColor;box-shadow:0 0 0 4px color-mix(in srgb,currentColor 12%,transparent)}
    .ws-transform-label.interactive{left:18px;color:#6d35e8}
    .ws-transform-label.printable{right:18px;color:#e85d0f}

    .ws-transform-divider{position:absolute;z-index:7;top:0;bottom:0;left:var(--split);width:2px;background:linear-gradient(180deg,#8b5cf6,#6428df 46%,#f97316);box-shadow:0 0 0 1px rgba(255,255,255,.46),0 0 24px rgba(124,58,237,.26);transform:translateX(-1px);pointer-events:none}
    .ws-transform-handle{position:absolute;z-index:8;left:var(--split);top:50%;width:62px;height:62px;border-radius:50%;transform:translate(-50%,-50%);border:1px solid rgba(109,61,219,.30);background:rgba(255,255,255,.97);box-shadow:0 13px 32px rgba(69,42,120,.24),0 0 0 7px rgba(255,255,255,.38);display:grid;place-items:center;color:#6d35e8;cursor:ew-resize;touch-action:none;transition:box-shadow .2s ease,scale .2s ease}
    .ws-transform-handle:hover{box-shadow:0 16px 38px rgba(69,42,120,.28),0 0 0 9px rgba(124,58,237,.09);scale:1.035}
    .ws-transform-handle:focus-visible{outline:4px solid rgba(124,58,237,.25);outline-offset:4px}
    .ws-transform-handle svg{width:29px;height:29px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
    .ws-transform-hint{position:absolute;z-index:8;left:var(--split);top:calc(50% + 45px);transform:translateX(-50%);padding:6px 10px;border-radius:9px;background:rgba(255,255,255,.94);border:1px solid rgba(124,58,237,.19);color:#6d35e8;font-size:.66rem;font-weight:800;white-space:nowrap;pointer-events:none;box-shadow:0 7px 20px rgba(70,43,120,.11);transition:opacity .25s ease,transform .25s ease}
    .ws-transform-stage.has-interacted .ws-transform-hint{opacity:0;transform:translate(-50%,6px)}
    .ws-transform-stage.dragging .ws-transform-handle{scale:1.08;box-shadow:0 19px 44px rgba(69,42,120,.31),0 0 0 10px rgba(124,58,237,.10)}

    .ws-transform-caption{display:flex;justify-content:center;align-items:center;gap:12px;margin:17px auto 0;color:#6d6775;font-size:.81rem;text-align:center}
    .ws-transform-caption strong{color:#332b3f;font-weight:800}
    .ws-transform-caption .dot{width:4px;height:4px;border-radius:50%;background:#c3b9d2}
    .ws-transform-range-note{margin:10px auto 0;text-align:center;color:#8a8291;font-size:.74rem;font-weight:620}

    @media(max-width:920px){
      #printable.ws-transform-v2{padding-top:78px;padding-bottom:88px}
      #printable.ws-transform-v2 .printable-copy{margin-bottom:34px}
      .ws-transform-tabs{justify-content:flex-start}
      .ws-transform-stage{border-radius:25px}
      .ws-transform-handle{width:56px;height:56px}
    }
    @media(max-width:700px){
      #printable.ws-transform-v2::before{inset:27% -22% 16%;clip-path:polygon(0 10%,55% 0,100% 18%,100% 92%,45% 100%,0 82%)}
      #printable.ws-transform-v2 .printable-copy h2{font-size:clamp(2.05rem,10vw,3rem)}
      .ws-transform-tabs{max-width:calc(100% - 8px);margin-bottom:14px;padding:5px;border-radius:15px}
      .ws-transform-tab,.ws-transform-more{min-height:42px;padding:0 13px;font-size:.79rem}
      .ws-transform-stage{border-radius:20px;aspect-ratio:16/10}
      .ws-transform-label{top:10px;padding:6px 9px;font-size:.61rem}.ws-transform-label.interactive{left:10px}.ws-transform-label.printable{right:10px}
      .ws-transform-handle{width:50px;height:50px}
      .ws-transform-hint{display:none}
      .ws-transform-paper-foreground{inset:2%}
      .ws-transform-paper-image{border-radius:10px}
      .ws-transform-caption{font-size:.73rem;gap:8px;flex-wrap:wrap;padding-inline:12px}
    }
    @media(prefers-reduced-motion:reduce){.ws-transform-tab,.ws-transform-handle,.ws-transform-hint,.ws-transform-stage{transition:none!important}}
  `;
  doc.head.appendChild(style);

  section.classList.add('ws-transform-v2');

  const tabs=activities.map((a,i)=>`<button class="ws-transform-tab" type="button" role="tab" aria-selected="${i===0?'true':'false'}" data-activity="${a.key}">${icons[a.key]}<span>${a.label}</span></button>`).join('');

  media.innerHTML=`
    <div class="ws-transform-shell" data-active="${activities[0].key}">
      <div class="ws-transform-tabs" role="tablist" aria-label="Choose an activity example">
        ${tabs}
        <span class="ws-transform-more" aria-label="More than twenty additional Wistudi activities"><span class="ws-transform-more-mark">+</span><span>20+ more activities</span></span>
      </div>
      <div class="ws-transform-stage-wrap">
        <div class="ws-transform-stage" style="--split:50%" data-split="50">
          <div class="ws-transform-media">
            <video class="ws-transform-video" muted loop playsinline preload="metadata" aria-label="Interactive activity example"></video>
          </div>
          <div class="ws-transform-paper" aria-hidden="true">
            <img class="ws-transform-paper-backdrop" alt="" aria-hidden="true" />
            <div class="ws-transform-paper-wash"></div>
            <div class="ws-transform-paper-foreground"><img class="ws-transform-paper-image" alt="Printable worksheet example" /></div>
            <div class="ws-transform-paper-shine"></div>
          </div>
          <div class="ws-transform-label interactive">Interactive lesson</div>
          <div class="ws-transform-label printable">Printable worksheet</div>
          <div class="ws-transform-divider" aria-hidden="true"></div>
          <button class="ws-transform-handle" type="button" role="slider" aria-label="Compare interactive lesson with printable worksheet" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" tabindex="0">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 8-4 4 4 4M4 12h16M16 8l4 4-4 4"/></svg>
          </button>
          <div class="ws-transform-hint">Drag to transform</div>
        </div>
      </div>
      <div class="ws-transform-caption"><strong>Interactive on screen</strong><span class="dot"></span><span>Drag the divider</span><span class="dot"></span><strong>Print-ready on paper</strong></div>
      <div class="ws-transform-range-note">Four examples shown here. Build with 20+ more activity types across a complete Flow.</div>
    </div>`;

  const shell=media.querySelector('.ws-transform-shell');
  const stage=media.querySelector('.ws-transform-stage');
  const handle=media.querySelector('.ws-transform-handle');
  const video=media.querySelector('.ws-transform-video');
  const paperImage=media.querySelector('.ws-transform-paper-image');
  const paperBackdrop=media.querySelector('.ws-transform-paper-backdrop');
  const tabButtons=[...media.querySelectorAll('.ws-transform-tab')];

  let activeKey=activities[0].key;
  let stageNear=false;
  let dragging=false;
  let switchTimer=0;

  const activityByKey=key=>activities.find(a=>a.key===key);
  const clamp=n=>Math.max(0,Math.min(100,n));

  const setSplit=(value,user=false)=>{
    const v=clamp(Number(value)||0);
    stage.style.setProperty('--split',`${v}%`);
    stage.dataset.split=String(Math.round(v));
    handle.setAttribute('aria-valuenow',String(Math.round(v)));
    if(user) stage.classList.add('has-interacted');
  };

  const playActive=()=>{
    if(!stageNear||doc.hidden) return;
    video.play().catch(()=>{});
  };

  const applyActivity=(activity,animate=true)=>{
    if(!activity) return;
    activeKey=activity.key;
    shell.dataset.active=activity.key;
    tabButtons.forEach(btn=>btn.setAttribute('aria-selected',btn.dataset.activity===activity.key?'true':'false'));
    const swap=()=>{
      video.pause();
      video.src=activity.video;
      video.load();
      paperImage.src=activity.worksheet;
      paperBackdrop.src=activity.worksheet;
      paperImage.alt=`${activity.label} printable worksheet example`;
      setSplit(50,false);
      stage.classList.remove('has-interacted');
      playActive();
      stage.classList.remove('switching');
    };
    clearTimeout(switchTimer);
    if(animate&&!window.matchMedia('(prefers-reduced-motion:reduce)').matches){
      stage.classList.add('switching');
      switchTimer=setTimeout(swap,115);
    }else swap();
  };

  const setActivity=key=>applyActivity(activityByKey(key),key!==activeKey);

  const valueFromPointer=e=>{
    const r=stage.getBoundingClientRect();
    return ((e.clientX-r.left)/r.width)*100;
  };

  const startDrag=e=>{
    if(e.button!==undefined&&e.button!==0) return;
    dragging=true;
    stage.classList.add('dragging','has-interacted');
    handle.setPointerCapture?.(e.pointerId);
    setSplit(valueFromPointer(e),true);
    e.preventDefault();
  };
  const moveDrag=e=>{
    if(!dragging) return;
    setSplit(valueFromPointer(e),true);
    e.preventDefault();
  };
  const endDrag=e=>{
    if(!dragging) return;
    dragging=false;
    stage.classList.remove('dragging');
    try{handle.releasePointerCapture?.(e.pointerId)}catch(_){ }
  };

  handle.addEventListener('pointerdown',startDrag);
  handle.addEventListener('pointermove',moveDrag);
  handle.addEventListener('pointerup',endDrag);
  handle.addEventListener('pointercancel',endDrag);

  stage.addEventListener('pointerdown',e=>{
    if(e.target.closest('.ws-transform-handle')) return;
    if(window.matchMedia('(pointer:fine)').matches){
      setSplit(valueFromPointer(e),true);
      handle.focus({preventScroll:true});
    }
  });

  handle.addEventListener('keydown',e=>{
    const current=Number(stage.dataset.split)||50;
    let next=current;
    if(e.key==='ArrowLeft') next=current-3;
    else if(e.key==='ArrowRight') next=current+3;
    else if(e.key==='Home') next=0;
    else if(e.key==='End') next=100;
    else return;
    e.preventDefault();
    setSplit(next,true);
  });

  tabButtons.forEach(btn=>btn.addEventListener('click',()=>setActivity(btn.dataset.activity)));

  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        stageNear=entry.isIntersecting;
        if(stageNear) playActive();
        else video.pause();
      });
    },{rootMargin:'240px 0px',threshold:.01});
    observer.observe(stage);
  }else{
    stageNear=true;
  }

  doc.addEventListener('visibilitychange',()=>{
    if(doc.hidden) video.pause();
    else playActive();
  },{passive:true});

  applyActivity(activities[0],false);

  window.WistudiInteractivePrintableSlider={
    setSplit,
    setActivity,
    activities,
    getActive:()=>activeKey
  };
})();
