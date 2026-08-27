(()=>{
  const mobile=matchMedia('(max-width:760px)');
  if(mobile.matches)return;

  const style=document.createElement('style');
  style.textContent=`
    .ws-g2.ws-bubble-below .ws-g2-b{bottom:auto;top:calc(100% + 17px);transform-origin:100% 12%;border-radius:30px 12px 30px 30px}
    .ws-g2.ws-bubble-below .ws-g2-b:after{bottom:auto;top:18px}
    .ws-g2.ws-bubble-scroll .ws-g2-b{overflow:auto}
  `;
  document.head.appendChild(style);

  const chromeBottom=()=>{
    let bottom=0;
    const nodes=[...document.querySelectorAll('header,nav,[class*="sticky"],[class*="subnav"],[class*="submenu"],[class*="secondary-nav"]')];
    for(const el of nodes){
      const cs=getComputedStyle(el),r=el.getBoundingClientRect();
      if((cs.position!=='fixed'&&cs.position!=='sticky')||r.width<innerWidth*.45||r.bottom<=0||r.top>12)continue;
      if(r.bottom>bottom)bottom=r.bottom;
    }
    return bottom;
  };

  const fit=()=>{
    const g=document.querySelector('.ws-g2');
    const b=g?.querySelector('.ws-g2-b');
    if(!g||!b||!g.classList.contains('open'))return;

    g.classList.remove('ws-bubble-below','ws-bubble-scroll');
    b.style.maxHeight='';

    const pad=14;
    const topLimit=chromeBottom()+pad;
    const a=g.getBoundingClientRect();
    let r=b.getBoundingClientRect();

    const crossesTop=r.top<topLimit;
    if(crossesTop){
      g.classList.add('ws-bubble-below');
      r=b.getBoundingClientRect();
    }

    const bottomLimit=innerHeight-pad;
    if(r.bottom>bottomLimit){
      const available=g.classList.contains('ws-bubble-below')
        ? Math.max(150,bottomLimit-(a.bottom+17))
        : Math.max(150,(a.top-17)-topLimit);
      b.style.maxHeight=`${Math.floor(available)}px`;
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
})();
