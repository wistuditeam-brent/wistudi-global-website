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
  style.textContent='.ws-g2.ws-under-chrome{opacity:0!important;pointer-events:none!important}.ws-g2.ws-under-chrome .ws-g2-b{pointer-events:none!important}';
  document.head.append(style);

  // The guide must never open itself. A bubble/sheet may only remain open after a
  // real user interaction. Once intentionally opened, interactions inside the guide
  // reinforce that state so content swaps and role changes cannot be mistaken for
  // an unrequested auto-open.
  let userOpened=false;
  let gestureUntil=0;
  const isMobileOpen=()=>document.body.classList.contains('ws-g2-mo');
  const isOpen=()=>{
    const g=guide();
    return !!(g?.classList.contains('open')||isMobileOpen());
  };
  const closeUnrequested=()=>{
    if(!isOpen()){
      if(performance.now()>gestureUntil)userOpened=false;
      return;
    }
    if(userOpened||performance.now()<=gestureUntil)return;
    guide()?.classList.remove('open');
    document.body.classList.remove('ws-g2-mo');
  };

  document.addEventListener('click',e=>{
    const button=e.target.closest?.('.ws-g2-btn');
    if(button){
      const wasOpen=isOpen();
      gestureUntil=performance.now()+900;
      queueMicrotask(()=>{
        userOpened=!wasOpen&&isOpen();
        if(wasOpen)userOpened=false;
      });
      return;
    }

    // Any deliberate interaction inside an already-open guide keeps ownership with
    // the user session. This is especially important while onboarding DOM is swapped
    // for the normal mobile sheet after choosing a role.
    const insideGuide=e.target.closest?.('.ws-g2-sheet,.ws-g2-b');
    if(insideGuide&&isOpen()){
      userOpened=true;
      gestureUntil=performance.now()+900;
    }
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

    // On desktop the bubble is physically anchored to the avatar, so crossing under
    // sticky chrome should close it. On mobile the open sheet is independent of the
    // avatar position; never collapse an intentional mobile sheet because the floating
    // avatar happens to sit under the header during keyboard/layout changes.
    if(hidden&&!isMobileOpen()){
      g.classList.remove('open');
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
