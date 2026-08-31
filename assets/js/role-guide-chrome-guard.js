(()=>{
  const guide=()=>document.querySelector('.ws-g2');
  const NAME_KEY='wistudiVisitorName';
  const ROLE_KEY='wistudiGuideRole';
  const WELCOME_KEY='wistudiGuideWelcomedV1';
  const RETURN_CHIP_KEY='wistudiGuideReturnChipV1';
  const ROLES={
    teacher:{label:'Teacher',avatar:'/assets/images/guide-teacher.svg'},
    trainer:{label:'Trainer',avatar:'/assets/images/guide-trainer.svg'},
    publisher:{label:'Publisher',avatar:'/assets/images/guide-publisher.svg'},
    organisation:{label:'Organisation',avatar:'/assets/images/guide-organisation.svg'}
  };
  const esc=s=>String(s||'').replace(/[&<>\'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  let memoryName='';
  const readName=()=>{
    try{return (localStorage.getItem(NAME_KEY)||'').trim()}catch(_){return memoryName}
  };
  const writeName=value=>{
    memoryName=value;
    try{localStorage.setItem(NAME_KEY,value)}catch(_){ }
  };
  const writeRole=value=>{try{localStorage.setItem(ROLE_KEY,value)}catch(_){ }};

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

    /* First-open personalisation deliberately feels conversational rather than form-like. */
    .ws-g2-onboard{padding:1px 1px 2px}
    .ws-g2-on-kicker{color:#7c3aed;font:800 11px/1.2 'Be Vietnam Pro',Inter,sans-serif;letter-spacing:.02em;margin:0 40px 12px 0}
    .ws-g2-on-title{margin:0;color:#302638;font:800 21px/1.23 'Be Vietnam Pro',Inter,sans-serif;letter-spacing:-.025em}
    .ws-g2-on-copy{margin:7px 0 0;color:#746a7d;font:500 12px/1.55 Inter,sans-serif}
    .ws-g2-on-steps{display:flex;gap:5px;margin:15px 0 15px}
    .ws-g2-on-steps i{display:block;width:22px;height:4px;border-radius:99px;background:rgba(124,58,237,.13);transition:.2s ease}
    .ws-g2-on-steps i.on{width:34px;background:#7c3aed;box-shadow:0 4px 12px rgba(124,58,237,.18)}
    .ws-g2-name-shell{display:flex;align-items:center;gap:9px;margin-top:16px;padding:5px 5px 5px 16px;border:0;border-radius:17px;background:rgba(255,255,255,.56);box-shadow:inset 0 0 0 1px rgba(124,58,237,.035),0 8px 24px rgba(63,41,89,.06);transition:.2s ease}
    .ws-g2-name-shell:focus-within{background:rgba(255,255,255,.88);box-shadow:0 0 0 4px rgba(124,58,237,.09),0 10px 28px rgba(63,41,89,.08)}
    .ws-g2-name-input{min-width:0;flex:1;height:44px;padding:0;border:0;outline:0;background:transparent;color:#302638;font:650 15px/1 Inter,sans-serif}
    .ws-g2-name-input::placeholder{color:#a49baa;font-weight:550}
    .ws-g2-on-next{height:44px;min-width:102px;padding:0 16px;border:0;border-radius:13px;background:#7c3aed;color:#fff;font:800 12px/1 Inter,sans-serif;cursor:pointer;box-shadow:0 8px 18px rgba(124,58,237,.18);transition:.2s ease}
    .ws-g2-on-next:hover{transform:translateY(-1px);box-shadow:0 10px 22px rgba(124,58,237,.22)}
    .ws-g2-on-next:disabled{opacity:.36;cursor:default;transform:none;box-shadow:none}
    .ws-g2-on-error{min-height:16px;margin:6px 2px 0;color:#b45309;font-size:10px;font-weight:650}
    .ws-g2-on-roles{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:16px}
    .ws-g2-on-role{display:flex;align-items:center;gap:10px;min-height:62px;padding:8px 11px;border:0;border-radius:17px;background:rgba(255,255,255,.52);color:#473c50;cursor:pointer;text-align:left;box-shadow:0 8px 22px rgba(55,38,78,.055);transition:.2s cubic-bezier(.18,.82,.22,1)}
    .ws-g2-on-role:hover,.ws-g2-on-role:focus-visible{outline:0;background:rgba(255,255,255,.9);transform:translateY(-1px);box-shadow:0 12px 26px rgba(55,38,78,.085),0 0 0 4px rgba(124,58,237,.065)}
    .ws-g2-on-role img{width:42px;height:42px;flex:0 0 42px;border-radius:50%;object-fit:cover;background:#fff;box-shadow:0 6px 16px rgba(55,38,78,.10)}
    .ws-g2-on-role span{font:750 12px/1.25 'Be Vietnam Pro',Inter,sans-serif}
    .ws-g2-welcome{margin:0 38px 11px 0;color:#302638;font:800 15px/1.35 'Be Vietnam Pro',Inter,sans-serif;letter-spacing:-.015em}
    .ws-g2-return{position:absolute;right:calc(100% + 12px);top:13px;z-index:4;display:inline-flex;align-items:center;white-space:nowrap;min-height:36px;padding:0 13px;border:0;border-radius:999px;background:rgba(247,243,255,.96);color:#5b21b6;font:750 11px/1 Inter,sans-serif;box-shadow:0 10px 28px rgba(72,44,111,.16);cursor:pointer;opacity:0;transform:translateX(7px) scale(.96);animation:wsGuideReturnIn .34s cubic-bezier(.18,.82,.22,1) forwards}
    .ws-g2-return:after{content:'';position:absolute;right:-5px;top:50%;width:11px;height:11px;background:rgba(247,243,255,.96);transform:translateY(-50%) rotate(45deg);border-radius:2px}

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
    @keyframes wsGuideReturnIn{to{opacity:1;transform:none}}
    @media(max-width:760px){
      .ws-g2-on-title{font-size:20px}.ws-g2-on-roles{grid-template-columns:1fr 1fr}.ws-g2-on-role{min-height:60px}.ws-g2-return{right:calc(100% + 9px);top:9px}
    }
    @media(max-width:390px){
      .ws-g2-on-roles{grid-template-columns:1fr}.ws-g2-name-shell{padding-left:13px}.ws-g2-on-next{min-width:92px;padding-inline:13px}
    }
    @media(prefers-reduced-motion:reduce){
      .ws-g2.fresh .ws-g2-ring img,.ws-g2.fresh .ws-g2-ring:after,.ws-g2-return{animation:none!important;opacity:1;transform:none}
      .ws-g2-on-role,.ws-g2-on-next,.ws-g2-name-shell{transition:none!important}
    }
  `;
  document.head.append(style);

  // The guide must never open itself. A bubble/sheet may only remain open after a
  // real click on the avatar button. This blocks the legacy first-visit auto-open
  // in role-guide-v2 without changing the normal click-to-open interaction.
  let userOpened=false;
  let gestureUntil=0;
  let roleSwitchUntil=0;
  let onboardingActive=false;
  let onboardingStep=1;
  let pendingName='';
  const mobile=()=>matchMedia('(max-width:760px)').matches;
  const surface=()=>mobile()?document.querySelector('.ws-g2-sheet'):guide()?.querySelector('.ws-g2-b');
  const isOpen=()=>{
    const g=guide();
    return !!(g?.classList.contains('open')||document.body.classList.contains('ws-g2-mo'));
  };
  const setOpen=()=>{
    const g=guide();
    if(!g)return;
    // Keep this idempotent. This function can run alongside a MutationObserver;
    // repeatedly writing the same class attribute can create an observer feedback loop.
    if(g.classList.contains('min'))g.classList.remove('min');
    try{sessionStorage.setItem('wistudiGuideMinimizedV4','0')}catch(_){ }
    if(mobile()){
      if(!document.body.classList.contains('ws-g2-mo'))document.body.classList.add('ws-g2-mo');
    }else if(!g.classList.contains('open')){
      g.classList.add('open');
    }
    userOpened=true;
  };
  const removeReturnChip=()=>guide()?.querySelector('.ws-g2-return')?.remove();
  const closeOnboarding=()=>{
    onboardingActive=false;
    onboardingStep=1;
    pendingName='';
    const g=guide();
    if(g?.classList.contains('open'))g.classList.remove('open');
    if(document.body.classList.contains('ws-g2-mo'))document.body.classList.remove('ws-g2-mo');
    userOpened=false;
  };
  const restoreRoleSwitchOpen=(desktopOpen,mobileOpen)=>{
    if(performance.now()>roleSwitchUntil)return;
    const g=guide();
    if(desktopOpen&&!g?.classList.contains('open'))g?.classList.add('open');
    if(mobileOpen&&!document.body.classList.contains('ws-g2-mo'))document.body.classList.add('ws-g2-mo');
    userOpened=desktopOpen||mobileOpen;
  };
  const closeUnrequested=()=>{
    // Onboarding is already opened by a real user click. Do not rewrite classes from
    // the observer while it is active; doing so can starve the main thread on browsers.
    if(onboardingActive)return;
    if(!isOpen()){
      if(performance.now()>gestureUntil&&performance.now()>roleSwitchUntil)userOpened=false;
      return;
    }
    if(userOpened||performance.now()<=gestureUntil||performance.now()<=roleSwitchUntil)return;
    const g=guide();
    if(g?.classList.contains('open'))g.classList.remove('open');
    if(document.body.classList.contains('ws-g2-mo'))document.body.classList.remove('ws-g2-mo');
  };

  const roleChoices=()=>Object.entries(ROLES).map(([key,item])=>`<button class="ws-g2-on-role" type="button" data-on-role="${key}" aria-label="Use the ${esc(item.label)} guide"><img src="${item.avatar}" alt=""><span>${esc(item.label)}</span></button>`).join('');

  const wireOnboarding=root=>{
    root.querySelector('[data-on-close]')?.addEventListener('click',e=>{e.stopPropagation();closeOnboarding()});
    if(onboardingStep===1){
      const input=root.querySelector('[data-on-name]');
      const next=root.querySelector('[data-on-next]');
      const error=root.querySelector('[data-on-error]');
      const sync=()=>{
        const value=(input?.value||'').trim();
        if(next)next.disabled=!value;
        if(error)error.textContent='';
      };
      input?.addEventListener('input',sync);
      input?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!next?.disabled)next.click()});
      next?.addEventListener('click',()=>{
        const value=(input?.value||'').trim().replace(/\s+/g,' ').slice(0,40);
        if(!value){if(error)error.textContent='Please enter your name.';input?.focus();return}
        pendingName=value;
        onboardingStep=2;
        renderOnboarding();
      });
      requestAnimationFrame(()=>input?.focus({preventScroll:true}));
      return;
    }
    root.querySelectorAll('[data-on-role]').forEach(button=>button.addEventListener('click',()=>finishOnboarding(button.dataset.onRole)));
  };

  const renderOnboarding=()=>{
    const root=surface();
    if(!root)return;
    const close='<button class="ws-g2-x" data-on-close type="button" aria-label="Close guide">×</button>';
    if(onboardingStep===1){
      root.innerHTML=`${close}<div class="ws-g2-onboard"><div class="ws-g2-on-kicker">Personalise your guide</div><div class="ws-g2-on-steps" aria-hidden="true"><i class="on"></i><i></i></div><h3 class="ws-g2-on-title">What should I call you?</h3><p class="ws-g2-on-copy">Just your first name is enough.</p><div class="ws-g2-name-shell"><input class="ws-g2-name-input" data-on-name type="text" inputmode="text" autocomplete="given-name" maxlength="40" placeholder="Your name" aria-label="Your name"><button class="ws-g2-on-next" data-on-next type="button" disabled>Continue</button></div><div class="ws-g2-on-error" data-on-error aria-live="polite"></div></div>`;
    }else{
      root.innerHTML=`${close}<div class="ws-g2-onboard"><div class="ws-g2-on-kicker">Personalise your guide</div><div class="ws-g2-on-steps" aria-hidden="true"><i></i><i class="on"></i></div><h3 class="ws-g2-on-title">Nice to meet you, ${esc(pendingName)}.</h3><p class="ws-g2-on-copy">How would you like me to guide you?</p><div class="ws-g2-on-roles">${roleChoices()}</div></div>`;
    }
    wireOnboarding(root);
  };

  const startOnboarding=()=>{
    removeReturnChip();
    onboardingActive=true;
    onboardingStep=1;
    pendingName='';
    gestureUntil=performance.now()+1600;
    userOpened=true;
    setOpen();
    renderOnboarding();
  };

  const finishOnboarding=selectedRole=>{
    if(!pendingName||!ROLES[selectedRole])return;
    writeName(pendingName);
    writeRole(selectedRole);
    try{
      sessionStorage.setItem(WELCOME_KEY,'1');
      sessionStorage.setItem(RETURN_CHIP_KEY,'1');
    }catch(_){ }
    onboardingActive=false;
    onboardingStep=1;
    const g=guide();
    if(g?.classList.contains('open'))g.classList.remove('open');
    if(document.body.classList.contains('ws-g2-mo'))document.body.classList.remove('ws-g2-mo');
    userOpened=false;

    // Re-enter through the guide's normal click path so its own internal role state,
    // seen-message state and accessibility behavior stay authoritative.
    queueMicrotask(()=>{
      const button=g?.querySelector('.ws-g2-btn');
      button?.click();
      requestAnimationFrame(()=>{
        const root=surface();
        const roleButton=root?.querySelector(`.ws-g2-role[data-r="${selectedRole}"]`);
        if(roleButton&&!roleButton.classList.contains('on'))roleButton.click();
      });
    });
  };

  const injectWelcome=()=>{
    const name=readName();
    if(!name)return;
    let already=false;
    try{already=sessionStorage.getItem(WELCOME_KEY)==='1'}catch(_){ }
    if(already)return;
    const root=surface();
    if(!root)return;
    root.querySelector('.ws-g2-welcome')?.remove();
    const target=root.querySelector('.ws-g2-k,.ws-g2-copy');
    if(!target)return;
    const el=document.createElement('div');
    el.className='ws-g2-welcome';
    el.textContent=`Welcome back, ${name}.`;
    target.before(el);
    try{sessionStorage.setItem(WELCOME_KEY,'1')}catch(_){ }
  };

  const showReturnChip=()=>{
    const g=guide(),name=readName();
    if(!g||!name||g.querySelector('.ws-g2-return')||onboardingActive)return;
    let shown=false;
    try{shown=sessionStorage.getItem(RETURN_CHIP_KEY)==='1'}catch(_){ }
    if(shown)return;
    const chip=document.createElement('button');
    chip.type='button';
    chip.className='ws-g2-return';
    chip.textContent=`Hi, ${name}`;
    chip.setAttribute('aria-label',`Open your guide, ${name}`);
    chip.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();chip.remove();
      g.querySelector('.ws-g2-btn')?.click();
    });
    g.appendChild(chip);
    try{sessionStorage.setItem(RETURN_CHIP_KEY,'1')}catch(_){ }
    setTimeout(()=>chip.remove(),4600);
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

    // On the visitor's first intentional guide open, replace the normal guide message
    // with a two-step name + perspective conversation inside the same speech bubble/sheet.
    if(!readName()&&!onboardingActive){
      e.preventDefault();
      e.stopImmediatePropagation();
      startOnboarding();
      return;
    }

    removeReturnChip();
    const wasOpen=isOpen();
    gestureUntil=performance.now()+800;
    if(!wasOpen&&readName()){
      requestAnimationFrame(()=>injectWelcome());
      setTimeout(()=>injectWelcome(),90);
    }
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
    if(!chromeBottom){
      if(g.classList.contains('ws-under-chrome'))g.classList.remove('ws-under-chrome');
      return;
    }
    const r=g.getBoundingClientRect();
    const hidden=r.top<chromeBottom+8;
    if(g.classList.contains('ws-under-chrome')!==hidden)g.classList.toggle('ws-under-chrome',hidden);
    if(hidden){
      if(g.classList.contains('open'))g.classList.remove('open');
      if(document.body.classList.contains('ws-g2-mo'))document.body.classList.remove('ws-g2-mo');
      userOpened=false;
      roleSwitchUntil=0;
      if(onboardingActive){
        onboardingActive=false;
        onboardingStep=1;
        pendingName='';
      }
    }
  };
  const schedule=()=>{if(!raf)raf=requestAnimationFrame(sync)};
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  // Observe class/style changes only to schedule one coalesced sync. Never mutate
  // guide state directly from the observer callback itself.
  new MutationObserver(schedule).observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['class','style']});
  setTimeout(()=>{closeUnrequested();schedule();if(readName())showReturnChip();},180);
})();