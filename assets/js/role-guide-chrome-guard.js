(()=>{
  const guide=()=>document.querySelector('.ws-g2');

  // Branch-preview helper only. Never runs on the production domain.
  // Add ?guideReset=1 to clear old guide test state before opening the avatar.
  try{
    const previewHost=location.hostname.endsWith('.pages.dev');
    const reset=new URLSearchParams(location.search).get('guideReset')==='1';
    if(previewHost&&reset){
      localStorage.removeItem('wistudiVisitorName');
      localStorage.removeItem('wistudiGuideRole');
      sessionStorage.removeItem('wistudiGuideWelcomedV1');
      sessionStorage.removeItem('wistudiGuideWelcomedV2');
      sessionStorage.removeItem('wistudiGuideReturnChipV1');
      sessionStorage.removeItem('wistudiGuideSeenV4');
      sessionStorage.removeItem('wistudiGuideMinimizedV4');
    }
  }catch(_){ }

  const style=document.createElement('style');
  style.textContent=`
    .ws-g2.ws-under-chrome{opacity:0!important;pointer-events:none!important}
    .ws-g2.ws-under-chrome .ws-g2-b{pointer-events:none!important}
    @media(max-width:760px){
      .ws-g2-sheet.ws-g2-keyboard-aware{
        top:calc(var(--ws-guide-vv-top,0px) + 10px)!important;
        bottom:auto!important;
        max-height:calc(var(--ws-guide-vv-height,100vh) - 20px)!important;
        overflow:auto!important;
        overscroll-behavior:contain;
        scroll-padding-bottom:18px;
      }
      body.ws-g2-mo .ws-g2-sheet.ws-g2-keyboard-aware{transform:none!important}
    }
  `;
  document.head.append(style);

  // Keep mobile step 1 inside the visual viewport while the soft keyboard is visible.
  // Step 2 has no text field and immediately returns to the normal bottom-sheet position.
  const vv=window.visualViewport;
  let keyboardAware=false;
  const syncKeyboardViewport=()=>{
    if(!keyboardAware)return;
    const sheet=document.querySelector('.ws-g2-sheet');
    if(!sheet)return;
    const top=vv?.offsetTop||0;
    const height=vv?.height||innerHeight;
    sheet.style.setProperty('--ws-guide-vv-top',`${Math.max(0,Math.round(top))}px`);
    sheet.style.setProperty('--ws-guide-vv-height',`${Math.max(220,Math.round(height))}px`);
  };
  const enableKeyboardLayout=()=>{
    if(!matchMedia('(max-width:760px)').matches)return;
    const sheet=document.querySelector('.ws-g2-sheet');
    if(!sheet)return;
    keyboardAware=true;
    sheet.classList.add('ws-g2-keyboard-aware');
    syncKeyboardViewport();
    requestAnimationFrame(syncKeyboardViewport);
  };
  const disableKeyboardLayout=()=>{
    keyboardAware=false;
    const sheet=document.querySelector('.ws-g2-sheet');
    if(!sheet)return;
    sheet.classList.remove('ws-g2-keyboard-aware');
    sheet.style.removeProperty('--ws-guide-vv-top');
    sheet.style.removeProperty('--ws-guide-vv-height');
  };
  document.addEventListener('focusin',e=>{
    if(e.target?.matches?.('[data-on-name],.ws-g2-name-input'))enableKeyboardLayout();
  },true);
  document.addEventListener('focusout',e=>{
    if(!e.target?.matches?.('[data-on-name],.ws-g2-name-input'))return;
    setTimeout(()=>{
      if(!document.activeElement?.matches?.('[data-on-name],.ws-g2-name-input'))disableKeyboardLayout();
    },0);
  },true);
  document.addEventListener('click',e=>{
    if(e.target.closest?.('[data-on-next],[data-on-close],[data-on-role]'))setTimeout(disableKeyboardLayout,0);
  },true);
  vv?.addEventListener('resize',syncKeyboardViewport,{passive:true});
  vv?.addEventListener('scroll',syncKeyboardViewport,{passive:true});

  // The guide must never open itself. A bubble/sheet may only remain open after a
  // real click on the avatar button. This blocks the legacy first-visit auto-open
  // in role-guide-v2 without changing the normal click-to-open interaction.
  let userOpened=false;
  let gestureUntil=0;
  const isOpen=()=>{
    const g=guide();
    return !!(g?.classList.contains('open')||document.body.classList.contains('ws-g2-mo'));
  };
  const closeUnrequested=()=>{
    if(!isOpen()){
      if(performance.now()>gestureUntil)userOpened=false;
      return;
    }
    if(userOpened||performance.now()<=gestureUntil)return;
    guide()?.classList.remove('open');
    document.body.classList.remove('ws-g2-mo');
    disableKeyboardLayout();
  };
  document.addEventListener('click',e=>{
    const button=e.target.closest?.('.ws-g2-btn');
    if(!button)return;
    const wasOpen=isOpen();
    gestureUntil=performance.now()+800;
    queueMicrotask(()=>{
      userOpened=!wasOpen&&isOpen();
      if(wasOpen)userOpened=false;
    });
  },true);

  const visibleTopChrome=()=>{
    let bottom=0;
    const nodes=[...document.querySelectorAll('header,nav,[class*="sticky"],[class*="subnav"],[class*="submenu"],[class*="secondary-nav"]')];
    for(const el of nodes){
      if(!el.offsetParent&&getComputedStyle(el).position!=='fixed')continue;
      const cs=getComputedStyle(el),r=el.getBoundingClientRect();
      if((cs.position!=='fixed'&&cs.position!=='sticky')||r.width<innerWidth*.45||r.bottom<=0||r.top>10)continue;
      if(r.bottom>bottom)bottom=r.bottom;
    }
    return bottom;
  };

  let raf=0;
  const sync=()=>{
    raf=0;
    closeUnrequested();
    const g=guide();if(!g)return;
    const chromeBottom=visibleTopChrome();
    if(!chromeBottom){g.classList.remove('ws-under-chrome');return;}
    const r=g.getBoundingClientRect();
    const hidden=r.top<chromeBottom+8;
    g.classList.toggle('ws-under-chrome',hidden);
    if(hidden){
      g.classList.remove('open');
      document.body.classList.remove('ws-g2-mo');
      disableKeyboardLayout();
      userOpened=false;
    }
  };
  const schedule=()=>{if(!raf)raf=requestAnimationFrame(sync)};
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  new MutationObserver(()=>{closeUnrequested();schedule();}).observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['class','style']});

  // role-guide-v2 starts the avatar off-screen and normally animates its first placement.
  // On a fast tap, especially on mobile/return visits, that can leave the button technically
  // outside the tappable viewport for part of a second. If that happens, temporarily disable
  // only the initial transform transition and ask the native resize handler to recalculate.
  // Normal section-to-section movement keeps its animation after this one-time correction.
  let initialPositionSettled=false;
  const settleInitialPosition=()=>{
    if(initialPositionSettled)return;
    const g=guide();
    if(!g)return;
    const r=g.getBoundingClientRect();
    const outside=r.right<=8||r.left>=innerWidth-8||r.bottom<=8||r.top>=innerHeight-8;
    if(!outside){initialPositionSettled=true;return;}
    const inlineTransition=g.style.transition;
    g.style.transition='none';
    dispatchEvent(new Event('resize'));
    void g.offsetWidth;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      g.style.transition=inlineTransition;
      initialPositionSettled=true;
      schedule();
    }));
  };

  requestAnimationFrame(settleInitialPosition);
  setTimeout(settleInitialPosition,80);
  setTimeout(settleInitialPosition,220);
  setTimeout(()=>{closeUnrequested();settleInitialPosition();schedule();},700);
})();
