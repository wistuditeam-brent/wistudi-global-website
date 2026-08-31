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

    if(hidden&&!isMobileOpen()){
      g.classList.remove('open');
      userOpened=false;
    }
  };
  const schedule=()=>{if(!raf)raf=requestAnimationFrame(sync)};
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  new MutationObserver(()=>{closeUnrequested();schedule();}).observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['class','style']});

  // role-guide-v2 creates the avatar with an off-screen transform. Do not animate
  // that first correction: immediately ask the native resize/placement logic for its
  // real coordinates while transform transitions are disabled. Subsequent section
  // movement keeps the normal animation from role-guide-v2.
  let initialPositionSettled=false;
  const settleInitialPosition=()=>{
    if(initialPositionSettled)return;
    const g=guide();
    if(!g)return;
    const previousInlineTransition=g.style.transition;
    g.style.transition='none';
    dispatchEvent(new Event('resize'));
    void g.offsetWidth;
    requestAnimationFrame(()=>{
      if(previousInlineTransition)g.style.transition=previousInlineTransition;
      else g.style.removeProperty('transition');
      initialPositionSettled=true;
      schedule();
    });
  };

  // Run synchronously because the native guide has already been loaded before this guard.
  settleInitialPosition();
  setTimeout(settleInitialPosition,80);
  setTimeout(()=>{closeUnrequested();schedule();},700);
})();
