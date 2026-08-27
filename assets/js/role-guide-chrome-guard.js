(()=>{
  const guide=()=>document.querySelector('.ws-g2');
  const style=document.createElement('style');
  style.textContent='.ws-g2.ws-under-chrome{opacity:0!important;pointer-events:none!important}.ws-g2.ws-under-chrome .ws-g2-b{pointer-events:none!important}';
  document.head.append(style);

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
    const g=guide();if(!g)return;
    const chromeBottom=visibleTopChrome();
    if(!chromeBottom){g.classList.remove('ws-under-chrome');return;}
    const r=g.getBoundingClientRect();
    const hidden=r.top<chromeBottom+8;
    g.classList.toggle('ws-under-chrome',hidden);
    if(hidden){
      g.classList.remove('open');
      document.body.classList.remove('ws-g2-mo');
    }
  };
  const schedule=()=>{if(!raf)raf=requestAnimationFrame(sync)};
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  new MutationObserver(schedule).observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['class','style']});
  setTimeout(schedule,80);
})();
