(()=>{
  'use strict';

  const doc=document;
  const section=doc.querySelector('body.page-platform #printable.printable-upgraded');
  if(!section||section.dataset.wsTransformReady==='true') return;
  section.dataset.wsTransformReady='true';

  const split=section.querySelector('.printable-split');
  const copy=section.querySelector('.printable-copy');
  const media=section.querySelector('.printable-media');
  if(!split||!copy||!media) return;

  const sourceVideo=media.querySelector('video');
  const videoSrc=sourceVideo?.getAttribute('src')||sourceVideo?.dataset.wsDeferredSrc||'';

  const activities=[
    {key:'link-match',label:'Link & Match',worksheetTitle:'Link & Match worksheet',worksheetPrompt:'Connect each item to its matching answer.'},
    {key:'smart-sorting',label:'Smart Sorting',worksheetTitle:'Smart Sorting worksheet',worksheetPrompt:'Sort each item into the correct group.'},
    {key:'sequence',label:'Sequence',worksheetTitle:'Sequence worksheet',worksheetPrompt:'Put the steps in the correct order.'},
    {key:'fill-blanks',label:'Fill in the Blanks',worksheetTitle:'Fill in the Blanks worksheet',worksheetPrompt:'Complete each sentence using the word bank.'}
  ];

  const icons={
    'link-match':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.3 14.7 14.7 9.3M7.2 16.8l-1.4 1.4a3.4 3.4 0 0 1-4.8-4.8l3.1-3.1a3.4 3.4 0 0 1 4.8 0M16.8 7.2l1.4-1.4A3.4 3.4 0 0 1 23 10.6l-3.1 3.1a3.4 3.4 0 0 1-4.8 0"/></svg>',
    'smart-sorting':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h4v4H5zM15 5h4v4h-4zM10 15h4v4h-4zM7 9v2.5c0 1.9 1.6 3.5 3.5 3.5M17 9v2.5c0 1.9-1.6 3.5-3.5 3.5"/></svg>',
    'sequence':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12M3.5 5.5h1v1h-1zM3.5 11.5h1v1h-1zM3.5 17.5h1v1h-1z"/></svg>',
    'fill-blanks':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18h16M5 6h4M12 6h7M5 11h7M15 11h4"/></svg>'
  };

  const style=doc.createElement('style');
  style.id='ws-interactive-printable-slider-style';
  style.textContent=`
    #printable.ws-transform-v1{position:relative;isolation:isolate;overflow:hidden;background:linear-gradient(180deg,#fff 0%,#fffaf7 47%,#fbf9ff 100%)!important;padding-top:96px;padding-bottom:104px}
    #printable.ws-transform-v1::before{content:"";position:absolute;z-index:-3;inset:30% -8% 12%;background:linear-gradient(113deg,rgba(124,58,237,.13) 0%,rgba(124,58,237,.06) 43%,rgba(249,115,22,.05) 59%,rgba(249,115,22,.14) 100%);clip-path:polygon(0 18%,49% 0,100% 23%,100% 86%,58% 100%,0 76%);pointer-events:none}
    #printable.ws-transform-v1::after{content:"";position:absolute;z-index:-2;width:680px;height:680px;right:-390px;top:21%;border-radius:50%;background:radial-gradient(circle,rgba(249,115,22,.12),rgba(249,115,22,0) 69%);pointer-events:none}
    #printable.ws-transform-v1 .printable-split{display:block!important;position:relative;z-index:1}
    #printable.ws-transform-v1 .printable-copy{max-width:910px!important;margin:0 auto 42px;text-align:center}
    #printable.ws-transform-v1 .printable-copy .eyebrow{justify-content:center;color:var(--purple)!important}
    #printable.ws-transform-v1 .printable-copy h2{max-width:880px!important;margin-inline:auto;font-size:clamp(2.35rem,4.7vw,4.15rem);line-height:1.03}
    #printable.ws-transform-v1 .printable-copy .lead{max-width:780px!important;margin:20px auto 0}
    #printable.ws-transform-v1 .delivery-flow{justify-content:center;margin-top:25px}
    #printable.ws-transform-v1 .printable-media{width:100%!important;max-width:1180px!important;margin:0 auto!important;overflow:visible!important;border:0!important;padding:0!important;background:transparent!important;box-shadow:none!important}

    .ws-transform-shell{position:relative;width:100%;margin:0 auto;padding:0 0 18px;isolation:isolate}
    .ws-transform-shell::before,.ws-transform-shell::after{content:"";position:absolute;z-index:-2;pointer-events:none;filter:blur(.1px)}
    .ws-transform-shell::before{left:-9%;top:17%;width:44%;height:59%;background:linear-gradient(135deg,rgba(124,58,237,.14),rgba(124,58,237,.035));clip-path:polygon(0 22%,100% 0,81% 86%,8% 100%);border-radius:40px}
    .ws-transform-shell::after{right:-9%;top:19%;width:43%;height:57%;background:linear-gradient(225deg,rgba(249,115,22,.14),rgba(249,115,22,.035));clip-path:polygon(19% 0,100% 21%,93% 100%,0 83%);border-radius:40px}

    .ws-transform-tabs{position:relative;z-index:4;display:flex;justify-content:center;align-items:center;gap:6px;width:max-content;max-width:calc(100% - 32px);margin:0 auto 18px;padding:6px;border-radius:18px;border:1px solid rgba(94,74,126,.14);background:rgba(255,255,255,.84);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 10px 30px rgba(50,32,84,.08);overflow:auto;scrollbar-width:none}
    .ws-transform-tabs::-webkit-scrollbar{display:none}
    .ws-transform-tab{appearance:none;border:0;background:transparent;color:#5e5869;min-height:46px;padding:0 17px;border-radius:13px;display:inline-flex;align-items:center;gap:9px;white-space:nowrap;font-weight:750;font-size:.88rem;cursor:pointer;transition:background .22s ease,color .22s ease,box-shadow .22s ease,transform .22s ease}
    .ws-transform-tab svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:0 0 auto}
    .ws-transform-tab:hover{color:var(--purple);background:#faf8ff}
    .ws-transform-tab[aria-selected="true"]{color:#6428df;background:linear-gradient(135deg,#f5efff,#fff);box-shadow:inset 0 0 0 1.5px #8b5cf6,0 6px 18px rgba(124,58,237,.12)}
    .ws-transform-tab:focus-visible{outline:3px solid rgba(124,58,237,.25);outline-offset:2px}

    .ws-transform-stage-wrap{position:relative;max-width:1120px;margin:0 auto}
    .ws-transform-stage{--split:50%;position:relative;width:100%;aspect-ratio:16/9;border-radius:30px;overflow:hidden;background:#f3f0f8;border:1px solid rgba(80,57,112,.14);box-shadow:0 28px 74px rgba(58,39,92,.16),0 4px 16px rgba(58,39,92,.06);isolation:isolate;user-select:none;-webkit-user-select:none}
    .ws-transform-stage::after{content:"";position:absolute;inset:0;z-index:9;pointer-events:none;border-radius:inherit;box-shadow:inset 0 0 0 1px rgba(255,255,255,.56)}
    .ws-transform-media,.ws-transform-paper{position:absolute;inset:0;width:100%;height:100%}
    .ws-transform-media{z-index:1;background:linear-gradient(135deg,#ece7f7,#faf8ff)}
    .ws-transform-video{width:100%;height:100%;display:block;object-fit:cover;background:#ece9f3}
    .ws-transform-media-empty{position:absolute;inset:0;display:grid;place-items:center;color:#6f6878;font-size:.9rem;background:linear-gradient(135deg,#f5f1ff,#fff)}

    .ws-transform-paper{z-index:2;clip-path:inset(0 0 0 var(--split));will-change:clip-path;background:linear-gradient(145deg,#f1f2f5,#e8eaee);pointer-events:none}
    .ws-transform-paper-canvas{position:absolute;inset:0;display:grid;place-items:center;padding:4.5% 7%;background:linear-gradient(145deg,#eef0f3,#e7eaee)}
    .ws-transform-paper-sheet{width:min(72%,720px);height:92%;background:#fff;border-radius:4px;box-shadow:0 14px 34px rgba(45,49,60,.16);padding:5.5% 6%;color:#25262a;overflow:hidden}
    .ws-paper-top{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;border-bottom:1px solid #d8d9dd;padding-bottom:3.5%;margin-bottom:4%}
    .ws-paper-title{font-family:"Be Vietnam Pro",sans-serif;font-size:clamp(.9rem,1.8vw,1.55rem);font-weight:800;line-height:1.15}
    .ws-paper-meta{display:flex;gap:12px;color:#70737a;font-size:clamp(.42rem,.7vw,.66rem);white-space:nowrap;padding-top:3px}
    .ws-paper-prompt{font-size:clamp(.5rem,.8vw,.76rem);line-height:1.5;color:#575a61;margin-bottom:4%}
    .ws-paper-bank{display:grid;grid-template-columns:repeat(4,1fr);gap:2%;margin-bottom:5%}
    .ws-paper-bank span{border:1px solid #aeb1b8;border-radius:4px;padding:7% 4%;text-align:center;font-size:clamp(.42rem,.72vw,.66rem);font-weight:700;background:#fff}
    .ws-paper-body{display:grid;grid-template-columns:1fr 1fr;gap:6%;height:52%}
    .ws-paper-lines,.ws-paper-boxes{display:grid;align-content:space-around;gap:8%}
    .ws-paper-line{height:1px;background:#b8bbc1;position:relative}
    .ws-paper-line::after{content:"";position:absolute;right:0;top:-14px;width:42%;height:28px;border:1px solid #b8bbc1;background:#fff;border-radius:3px}
    .ws-paper-figure{position:relative;border:1px solid #d1d3d8;border-radius:50%;width:70%;aspect-ratio:1;margin:auto;background:radial-gradient(circle at 50% 44%,#fff 0 24%,#e6e8ec 25% 28%,#fff 29% 44%,#cfd2d8 45% 47%,#fff 48%)}
    .ws-paper-figure::before,.ws-paper-figure::after{content:"";position:absolute;background:#8f939b;left:50%;transform:translateX(-50%)}
    .ws-paper-figure::before{width:1px;height:72%;top:14%}.ws-paper-figure::after{height:1px;width:72%;top:50%}
    .ws-paper-footer{display:flex;justify-content:space-between;border-top:1px solid #d8d9dd;margin-top:4%;padding-top:2.5%;font-size:clamp(.38rem,.65vw,.58rem);font-weight:650;color:#676a72}
    .ws-transform-paper.has-image .ws-transform-paper-canvas{padding:0;background:#eceef2}
    .ws-transform-paper-image{display:none;width:100%;height:100%;object-fit:cover}
    .ws-transform-paper.has-image .ws-transform-paper-image{display:block}
    .ws-transform-paper.has-image .ws-transform-paper-sheet{display:none}

    .ws-transform-label{position:absolute;z-index:5;top:18px;display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.88);backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px);font-size:.72rem;font-weight:800;letter-spacing:.01em;box-shadow:0 7px 22px rgba(38,25,64,.08);pointer-events:none;transition:opacity .18s ease}
    .ws-transform-label::before{content:"";width:7px;height:7px;border-radius:50%;background:currentColor;box-shadow:0 0 0 4px color-mix(in srgb,currentColor 12%,transparent)}
    .ws-transform-label.interactive{left:18px;color:#6d35e8}
    .ws-transform-label.printable{right:18px;color:#e85d0f}

    .ws-transform-divider{position:absolute;z-index:7;top:0;bottom:0;left:var(--split);width:2px;background:linear-gradient(180deg,#7c3aed,#5b21b6 48%,#f97316);box-shadow:0 0 0 1px rgba(255,255,255,.48),0 0 20px rgba(124,58,237,.22);transform:translateX(-1px);pointer-events:none}
    .ws-transform-handle{position:absolute;z-index:8;left:var(--split);top:50%;width:62px;height:62px;border-radius:50%;transform:translate(-50%,-50%);border:1px solid rgba(109,61,219,.32);background:rgba(255,255,255,.96);box-shadow:0 12px 28px rgba(69,42,120,.22),0 0 0 7px rgba(255,255,255,.36);display:grid;place-items:center;color:#6d35e8;cursor:ew-resize;touch-action:none;transition:box-shadow .2s ease,scale .2s ease}
    .ws-transform-handle:hover{box-shadow:0 15px 34px rgba(69,42,120,.26),0 0 0 8px rgba(124,58,237,.09);scale:1.035}
    .ws-transform-handle:focus-visible{outline:4px solid rgba(124,58,237,.25);outline-offset:4px}
    .ws-transform-handle svg{width:29px;height:29px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
    .ws-transform-hint{position:absolute;z-index:8;left:var(--split);top:calc(50% + 45px);transform:translateX(-50%);padding:6px 10px;border-radius:9px;background:rgba(255,255,255,.93);border:1px solid rgba(124,58,237,.2);color:#6d35e8;font-size:.67rem;font-weight:800;white-space:nowrap;pointer-events:none;box-shadow:0 6px 18px rgba(70,43,120,.11);transition:opacity .25s ease,transform .25s ease}
    .ws-transform-stage.has-interacted .ws-transform-hint{opacity:0;transform:translate(-50%,6px)}
    .ws-transform-stage.dragging .ws-transform-handle{scale:1.08;box-shadow:0 18px 42px rgba(69,42,120,.3),0 0 0 10px rgba(124,58,237,.10)}

    .ws-transform-caption{display:flex;justify-content:center;align-items:center;gap:12px;margin:16px auto 0;color:#6d6775;font-size:.82rem;text-align:center}
    .ws-transform-caption strong{color:#332b3f;font-weight:800}
    .ws-transform-caption .dot{width:4px;height:4px;border-radius:50%;background:#c3b9d2}

    @media (max-width:900px){
      #printable.ws-transform-v1{padding-top:78px;padding-bottom:86px}
      #printable.ws-transform-v1 .printable-copy{margin-bottom:34px}
      .ws-transform-tabs{justify-content:flex-start}
      .ws-transform-stage{border-radius:24px}
      .ws-transform-handle{width:56px;height:56px}
      .ws-transform-paper-sheet{width:78%;height:91%}
    }
    @media (max-width:700px){
      #printable.ws-transform-v1::before{inset:27% -22% 16%;clip-path:polygon(0 10%,55% 0,100% 18%,100% 92%,45% 100%,0 82%)}
      #printable.ws-transform-v1 .printable-copy h2{font-size:clamp(2.05rem,10vw,3rem)}
      .ws-transform-tabs{max-width:calc(100% - 8px);margin-bottom:14px;padding:5px;border-radius:15px}
      .ws-transform-tab{min-height:42px;padding:0 13px;font-size:.8rem}
      .ws-transform-stage{aspect-ratio:1.22;border-radius:20px}
      .ws-transform-label{top:10px;padding:6px 9px;font-size:.62rem}.ws-transform-label.interactive{left:10px}.ws-transform-label.printable{right:10px}
      .ws-transform-handle{width:52px;height:52px}
      .ws-transform-hint{display:none}
      .ws-transform-paper-canvas{padding:7% 5%}
      .ws-transform-paper-sheet{width:86%;height:92%;padding:7% 6%}
      .ws-paper-bank{grid-template-columns:repeat(2,1fr);gap:5px}.ws-paper-bank span:nth-child(n+3){display:none}
      .ws-transform-caption{font-size:.74rem;gap:8px;flex-wrap:wrap;padding-inline:12px}
    }
    @media (prefers-reduced-motion:reduce){.ws-transform-tab,.ws-transform-handle,.ws-transform-hint{transition:none!important}}
  `;
  doc.head.appendChild(style);

  section.classList.add('ws-transform-v1');

  const tabs=activities.map((a,i)=>`<button class="ws-transform-tab" type="button" role="tab" aria-selected="${i===0?'true':'false'}" data-activity="${a.key}">${icons[a.key]}<span>${a.label}</span></button>`).join('');

  media.innerHTML=`
    <div class="ws-transform-shell" data-active="${activities[0].key}">
      <div class="ws-transform-tabs" role="tablist" aria-label="Choose an activity example">${tabs}</div>
      <div class="ws-transform-stage-wrap">
        <div class="ws-transform-stage" style="--split:50%" data-split="50">
          <div class="ws-transform-media">
            ${videoSrc?`<video class="ws-transform-video" muted loop playsinline preload="metadata" aria-label="Interactive activity example"></video>`:`<div class="ws-transform-media-empty">Interactive activity video goes here</div>`}
          </div>
          <div class="ws-transform-paper" aria-hidden="true">
            <div class="ws-transform-paper-canvas">
              <img class="ws-transform-paper-image" alt="" />
              <div class="ws-transform-paper-sheet">
                <div class="ws-paper-top"><div class="ws-paper-title">${activities[0].worksheetTitle}</div><div class="ws-paper-meta"><span>Name: ______</span><span>Date: ______</span></div></div>
                <div class="ws-paper-prompt">${activities[0].worksheetPrompt}</div>
                <div class="ws-paper-bank"><span>Item A</span><span>Item B</span><span>Item C</span><span>Item D</span></div>
                <div class="ws-paper-body"><div class="ws-paper-lines"><div class="ws-paper-line"></div><div class="ws-paper-line"></div><div class="ws-paper-line"></div></div><div class="ws-paper-figure"></div></div>
                <div class="ws-paper-footer"><span>Printable worksheet preview</span><span>1 / 1</span></div>
              </div>
            </div>
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
      <div class="ws-transform-caption"><strong>Interactive on screen</strong><span class="dot"></span><span>Drag anywhere along the divider</span><span class="dot"></span><strong>Print-ready on paper</strong></div>
    </div>`;

  const shell=media.querySelector('.ws-transform-shell');
  const stage=media.querySelector('.ws-transform-stage');
  const handle=media.querySelector('.ws-transform-handle');
  const paper=media.querySelector('.ws-transform-paper');
  const paperTitle=media.querySelector('.ws-paper-title');
  const paperPrompt=media.querySelector('.ws-paper-prompt');
  const paperImage=media.querySelector('.ws-transform-paper-image');
  const video=media.querySelector('.ws-transform-video');
  const tabButtons=[...media.querySelectorAll('.ws-transform-tab')];

  if(video&&videoSrc){
    const startVideo=()=>{
      if(video.dataset.started==='true') return;
      video.dataset.started='true';
      video.src=videoSrc;
      video.autoplay=true;
      video.load();
      video.play().catch(()=>{});
    };
    if('IntersectionObserver' in window){
      const observer=new IntersectionObserver(entries=>{
        if(entries.some(e=>e.isIntersecting)){
          startVideo();
          observer.disconnect();
        }
      },{rootMargin:'260px 0px',threshold:.01});
      observer.observe(stage);
    }else startVideo();
    doc.addEventListener('visibilitychange',()=>{
      if(doc.hidden) video.pause();
      else if(video.dataset.started==='true') video.play().catch(()=>{});
    },{passive:true});
  }

  const clamp=n=>Math.max(0,Math.min(100,n));
  const setSplit=(value,user=false)=>{
    const v=clamp(value);
    stage.style.setProperty('--split',`${v}%`);
    stage.dataset.split=String(Math.round(v));
    handle.setAttribute('aria-valuenow',String(Math.round(v)));
    if(user) stage.classList.add('has-interacted');
  };

  const valueFromPointer=e=>{
    const r=stage.getBoundingClientRect();
    return ((e.clientX-r.left)/r.width)*100;
  };

  let dragging=false;
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

  const setActivity=key=>{
    const activity=activities.find(a=>a.key===key);
    if(!activity) return;
    shell.dataset.active=key;
    tabButtons.forEach(btn=>btn.setAttribute('aria-selected',btn.dataset.activity===key?'true':'false'));
    paperTitle.textContent=activity.worksheetTitle;
    paperPrompt.textContent=activity.worksheetPrompt;
    const worksheetSrc=activity.worksheet||'';
    paper.classList.toggle('has-image',!!worksheetSrc);
    if(worksheetSrc) paperImage.src=worksheetSrc;
    else paperImage.removeAttribute('src');
    setSplit(50,false);
    stage.classList.remove('has-interacted');
  };

  tabButtons.forEach(btn=>btn.addEventListener('click',()=>setActivity(btn.dataset.activity)));

  // Public hook for dropping in the real worksheet/activity assets later without rebuilding the component.
  window.WistudiInteractivePrintableSlider={
    setSplit,
    setActivity,
    setWorksheet:(key,src)=>{
      const item=activities.find(a=>a.key===key);
      if(!item) return false;
      item.worksheet=src||'';
      if(shell.dataset.active===key) setActivity(key);
      return true;
    },
    setVideo:(key,src)=>{
      const item=activities.find(a=>a.key===key);
      if(!item) return false;
      item.video=src||'';
      if(shell.dataset.active===key&&video&&src){video.src=src;video.play().catch(()=>{})}
      return true;
    }
  };
})();
