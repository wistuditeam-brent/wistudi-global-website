(()=>{
  const guide=()=>document.querySelector('.ws-g2');
  const style=document.createElement('style');
  style.textContent=`
    .ws-g2.ws-under-chrome{opacity:0!important;pointer-events:none!important}
    .ws-g2.ws-under-chrome .ws-g2-b{pointer-events:none!important}

    /* Make an unseen guide message noticeably, but gently, call for attention.
       The avatar itself lightly throbs while a soft Wistudi-purple halo expands behind it. */
    .ws-g2.fresh:not(.min) .ws-g2-ring img{
      animation:wsGuideMessageThrob 1.18s ease-in-out 2;
      transform-origin:50% 50%;
    }
    .ws-g2.fresh:not(.min) .ws-g2-ring:before{
      border-color:#7c3aed!important;
      box-shadow:0 0 0 7px rgba(124,58,237,.13),0 0 34px rgba(124,58,237,.34)!important;
    }
    .ws-g2.fresh:not(.min) .ws-g2-ring:after{
      content:'';
      position:absolute;
      inset:-7px;
      z-index:-1;
      border-radius:50%;
      pointer-events:none;
      background:rgba(124,58,237,.16);
      box-shadow:0 8px 30px rgba(124,58,237,.30);
      opacity:0;
      animation:wsGuidePurpleHalo 1.18s ease-out 2;
    }
    @keyframes wsGuideMessageThrob{
      0%,100%{transform:scale(1)}
      45%{transform:scale(1.055)}
      68%{transform:scale(1.018)}
    }
    @keyframes wsGuidePurpleHalo{
      0%{opacity:0;transform:scale(.84)}
      30%{opacity:.8;transform:scale(1)}
      100%{opacity:0;transform:scale(1.34)}
    }
    @media(prefers-reduced-motion:reduce){
      .ws-g2.fresh .ws-g2-ring img,.ws-g2.fresh .ws-g2-ring:after{animation:none!important}
    }
  `;
  document.head.append(style);

  // The guide must never open itself. A bubble/sheet may only remain open after a
  // real click on the avatar button. This blocks the legacy first-visit auto-open
  // in role-guide-v2 without changing the normal click-to-open interaction.
  let userOpened=false;
  let gestureUntil=0;
  let roleSwitchUntil=0;
  const isOpen=()=>{
    const g=guide();
    return !!(g?.classList.contains('open')||document.body.classList.contains('ws-g2-mo'));
  };
  const restoreRoleSwitchOpen=(desktopOpen,mobileOpen)=>{
    if(performance.now()>roleSwitchUntil)return;
    const g=guide();
    if(desktopOpen)g?.classList.add('open');
    if(mobileOpen)document.body.classList.add('ws-g2-mo');
    userOpened=desktopOpen||mobileOpen;
  };
  const closeUnrequested=()=>{
    if(!isOpen()){
      if(performance.now()>gestureUntil&&performance.now()>roleSwitchUntil)userOpened=false;
      return;
    }
    if(userOpened||performance.now()<=gestureUntil||performance.now()<=roleSwitchUntil)return;
    guide()?.classList.remove('open');
    document.body.classList.remove('ws-g2-mo');
  };
  document.addEventListener('click',e=>{
    const roleButton=e.target.closest?.('.ws-g2-role');
    if(roleButton){
      const desktopOpen=!!guide()?.classList.contains('open');
      const mobileOpen=document.body.classList.contains('ws-g2-mo');
      if(desktopOpen||mobileOpen){
        // Re-rendering the selected perspective must not make the user reopen the guide.
        // Hold the explicit open state across the DOM replacement and any observer pass.
        roleSwitchUntil=performance.now()+1200;
        gestureUntil=roleSwitchUntil;
        userOpened=true;
        queueMicrotask(()=>restoreRoleSwitchOpen(desktopOpen,mobileOpen));
        requestAnimationFrame(()=>restoreRoleSwitchOpen(desktopOpen,mobileOpen));
        setTimeout(()=>restoreRoleSwitchOpen(desktopOpen,mobileOpen),80);
        setTimeout(()=>restoreRoleSwitchOpen(desktopOpen,mobileOpen),220);
      }
      return;
    }

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
      roleSwitchUntil=0;
    }
  };
  const schedule=()=>{if(!raf)raf=requestAnimationFrame(sync)};
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  new MutationObserver(()=>{closeUnrequested();schedule();}).observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['class','style']});
  setTimeout(()=>{closeUnrequested();schedule();},80);
})();
