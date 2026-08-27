(()=>{
  const mobile=matchMedia('(max-width:760px)');
  if(mobile.matches)return;

  const style=document.createElement('style');
  style.textContent=`
    .ws-g2.ws-bubble-below .ws-g2-b{bottom:auto!important;top:calc(100% + 17px)!important;transform-origin:100% 12%;border-radius:30px 12px 30px 30px}
    .ws-g2.ws-bubble-below .ws-g2-b:after{bottom:auto!important;top:18px!important}
    .ws-g2.ws-bubble-scroll .ws-g2-b{overflow:auto}
  `;
  document.head.appendChild(style);

  const topBoundary=()=>{
    let bottom=0;
    const selectors='header,nav,[class*="header"],[class*="sticky"],[class*="subnav"],[class*="submenu"],[class*="secondary-nav"]';
    const nodes=[...document.querySelectorAll(selectors)];
    for(const el of nodes){
      const r=el.getBoundingClientRect();
      const cs=getComputedStyle(el);
      if(cs.display==='none'||cs.visibility==='hidden'||r.width<innerWidth*.35||r.height<20)continue;
      // Any wide navigation/header band occupying the visible top region counts,
      // even when the sticky positioning lives on a wrapper rather than this element.
      if(r.top<220&&r.bottom>0&&r.bottom<=320)bottom=Math.max(bottom,r.bottom);
    }
    return Math.max(bottom,8);
  };

  const reset=(g,b)=>{
    g.classList.remove('ws-bubble-below','ws-bubble-scroll');
    b.style.removeProperty('top');
    b.style.removeProperty('bottom');
    b.style.removeProperty('max-height');
  };

  const fit=()=>{
    const g=document.querySelector('.ws-g2');
    const b=g?.querySelector('.ws-g2-b');
    if(!g||!b||!g.classList.contains('open'))return;

    reset(g,b);

    const pad=14;
    const topLimit=topBoundary()+pad;
    const bottomLimit=innerHeight-pad;
    const a=g.getBoundingClientRect();
    let r=b.getBoundingClientRect();

    const roomAbove=Math.max(0,a.top-topLimit-17);
    const roomBelow=Math.max(0,bottomLimit-a.bottom-17);
    const bubbleHeight=Math.max(r.height,b.scrollHeight||0);
    const shouldFlip=r.top<topLimit || (bubbleHeight>roomAbove && roomBelow>roomAbove);

    if(shouldFlip){
      g.classList.add('ws-bubble-below');
      b.style.setProperty('bottom','auto','important');
      b.style.setProperty('top','calc(100% + 17px)','important');
      r=b.getBoundingClientRect();
    }

    if(r.bottom>bottomLimit || r.top<topLimit){
      const available=g.classList.contains('ws-bubble-below')
        ? Math.max(160,bottomLimit-(a.bottom+17))
        : Math.max(160,(a.top-17)-topLimit);
      b.style.setProperty('max-height',`${Math.floor(available)}px`);
      g.classList.add('ws-bubble-scroll');
    }
  };

  const schedule=()=>requestAnimationFrame(()=>requestAnimationFrame(fit));
  document.addEventListener('click',e=>{
    if(e.target.closest('.ws-g2-btn,.ws-g2-role'))schedule();
  },false);
  document.addEventListener('keydown',e=>{
    if((e.key==='Enter'||e.key===' ')&&e.target.closest('.ws-g2-btn,.ws-g2-role'))schedule();
  },false);
  addEventListener('resize',schedule,{passive:true});
  addEventListener('scroll',()=>{
    const g=document.querySelector('.ws-g2');
    if(g?.classList.contains('open'))schedule();
  },{passive:true});
})();
