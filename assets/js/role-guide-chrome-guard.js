(()=>{
  const guide=()=>document.querySelector('.ws-g2');
  const style=document.createElement('style');
  style.textContent='.ws-g2.ws-under-chrome{opacity:0!important;pointer-events:none!important}.ws-g2.ws-under-chrome .ws-g2-b{pointer-events:none!important}';
  document.head.append(style);

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
      userOpened=false;
    }
  };
  const schedule=()=>{if(!raf)raf=requestAnimationFrame(sync)};
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  new MutationObserver(()=>{closeUnrequested();schedule();}).observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['class','style']});
  setTimeout(()=>{closeUnrequested();schedule();},80);
})();
