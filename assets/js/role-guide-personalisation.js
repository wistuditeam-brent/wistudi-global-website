(()=>{
  'use strict';

  const NAME_KEY='wistudiVisitorName';
  const WELCOME_KEY='wistudiGuideWelcomedV2';
  const mobile=matchMedia('(max-width:760px)');
  const guide=()=>document.querySelector('.ws-g2');
  const surface=()=>mobile.matches?document.querySelector('.ws-g2-sheet'):guide()?.querySelector('.ws-g2-b');
  const isOpen=()=>mobile.matches?document.body.classList.contains('ws-g2-mo'):!!guide()?.classList.contains('open');
  const readName=()=>{try{return (localStorage.getItem(NAME_KEY)||'').trim()}catch(_){return''}};
  const writeName=value=>{try{localStorage.setItem(NAME_KEY,value)}catch(_){ }};
  const esc=s=>String(s||'').replace(/[&<>\'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  const ROLES={
    teacher:{label:'Teacher',avatar:'/assets/images/guide-teacher.svg'},
    trainer:{label:'Trainer',avatar:'/assets/images/guide-trainer.svg'},
    publisher:{label:'Publisher',avatar:'/assets/images/guide-publisher.svg'},
    organisation:{label:'Organisation',avatar:'/assets/images/guide-organisation.svg'}
  };

  const style=document.createElement('style');
  style.textContent=`
    /* Unread-message attention is CSS-only: no observer or open-state mutation. */
    .ws-g2.fresh:not(.min) .ws-g2-ring img{animation:wsGuideMessageThrob 1.18s ease-in-out 2;transform-origin:50% 50%}
    .ws-g2.fresh:not(.min) .ws-g2-ring:before{border-color:#7c3aed!important;box-shadow:0 0 0 7px rgba(124,58,237,.13),0 0 34px rgba(124,58,237,.34)!important}
    .ws-g2.fresh:not(.min) .ws-g2-ring:after{content:'';position:absolute;inset:-7px;z-index:-1;border-radius:50%;pointer-events:none;background:rgba(124,58,237,.16);box-shadow:0 8px 30px rgba(124,58,237,.30);opacity:0;animation:wsGuidePurpleHalo 1.18s ease-out 2}
    @keyframes wsGuideMessageThrob{0%,100%{transform:scale(1)}45%{transform:scale(1.055)}68%{transform:scale(1.018)}}
    @keyframes wsGuidePurpleHalo{0%{opacity:0;transform:scale(.84)}30%{opacity:.8;transform:scale(1)}100%{opacity:0;transform:scale(1.34)}}

    .ws-g2-onboard{position:relative;padding:1px 1px 2px;color:#302638}
    .ws-g2-on-kicker{margin:0 40px 11px 0;color:#7c3aed;font:800 11px/1.2 'Be Vietnam Pro',Inter,sans-serif;letter-spacing:.02em}
    .ws-g2-on-title{margin:0;color:#302638;font:800 21px/1.23 'Be Vietnam Pro',Inter,sans-serif;letter-spacing:-.025em}
    .ws-g2-on-copy{margin:7px 0 0;color:#746a7d;font:500 12px/1.55 Inter,sans-serif}
    .ws-g2-on-steps{display:flex;gap:5px;margin:15px 0}
    .ws-g2-on-steps i{display:block;width:22px;height:4px;border-radius:99px;background:rgba(124,58,237,.13)}
    .ws-g2-on-steps i.on{width:34px;background:#7c3aed;box-shadow:0 4px 12px rgba(124,58,237,.18)}
    .ws-g2-name-shell{display:flex;align-items:center;gap:9px;margin-top:16px;padding:5px 5px 5px 16px;border:0;border-radius:17px;background:rgba(255,255,255,.56);box-shadow:inset 0 0 0 1px rgba(124,58,237,.04),0 8px 24px rgba(63,41,89,.06)}
    .ws-g2-name-shell:focus-within{background:rgba(255,255,255,.9);box-shadow:0 0 0 4px rgba(124,58,237,.09),0 10px 28px rgba(63,41,89,.08)}
    .ws-g2-name-input{min-width:0;flex:1;height:44px;padding:0;border:0;outline:0;background:transparent;color:#302638;font:650 15px/1 Inter,sans-serif}
    .ws-g2-name-input::placeholder{color:#a49baa;font-weight:550}
    .ws-g2-on-next{height:44px;min-width:102px;padding:0 16px;border:0;border-radius:13px;background:#7c3aed;color:#fff;font:800 12px/1 Inter,sans-serif;cursor:pointer;box-shadow:0 8px 18px rgba(124,58,237,.18)}
    .ws-g2-on-next:disabled{opacity:.36;cursor:default;box-shadow:none}
    .ws-g2-on-error{min-height:16px;margin:6px 2px 0;color:#b45309;font-size:10px;font-weight:650}
    .ws-g2-on-roles{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:16px}
    .ws-g2-on-role{display:flex;align-items:center;gap:10px;min-height:62px;padding:8px 11px;border:0;border-radius:17px;background:rgba(255,255,255,.54);color:#473c50;cursor:pointer;text-align:left;box-shadow:0 8px 22px rgba(55,38,78,.055)}
    .ws-g2-on-role:focus-visible{outline:3px solid rgba(124,58,237,.22);outline-offset:2px}
    .ws-g2-on-role img{width:42px;height:42px;flex:0 0 42px;border-radius:50%;object-fit:cover;background:#fff;box-shadow:0 6px 16px rgba(55,38,78,.10)}
    .ws-g2-on-role span{font:750 12px/1.25 'Be Vietnam Pro',Inter,sans-serif}
    .ws-g2-welcome{margin:0 38px 11px 0;color:#302638;font:800 15px/1.35 'Be Vietnam Pro',Inter,sans-serif;letter-spacing:-.015em}

    /* Step 1 becomes a keyboard-aware floating sheet only while the name field is focused. */
    .ws-g2-sheet.ws-g2-keyboard-aware{transition:top .18s ease,transform .18s ease!important;overscroll-behavior:contain}

    @media(max-width:390px){.ws-g2-on-roles{grid-template-columns:1fr}.ws-g2-name-shell{padding-left:13px}.ws-g2-on-next{min-width:92px;padding-inline:13px}}
    @media(prefers-reduced-motion:reduce){.ws-g2.fresh .ws-g2-ring img,.ws-g2.fresh .ws-g2-ring:after{animation:none!important}.ws-g2-name-shell,.ws-g2-sheet.ws-g2-keyboard-aware{transition:none!important}}
  `;
  document.head.appendChild(style);

  let onboarding=false;
  let step=1;
  let pendingName='';
  let savedSurface=null;
  let savedNodes=null;
  let keyboardBaseline=0;
  let keyboardRaf=0;

  const clearKeyboardPosition=()=>{
    const root=document.querySelector('.ws-g2-sheet');
    if(!root)return;
    root.classList.remove('ws-g2-keyboard-aware');
    root.style.removeProperty('top');
    root.style.removeProperty('bottom');
    root.style.removeProperty('max-height');
    root.style.removeProperty('transform');
  };

  const positionStepAboveKeyboard=()=>{
    keyboardRaf=0;
    if(!mobile.matches||!onboarding||step!==1||!savedSurface){clearKeyboardPosition();return}
    const root=savedSurface;
    const input=root.querySelector('[data-on-name]');
    const vv=window.visualViewport;
    if(!input||document.activeElement!==input||!vv){clearKeyboardPosition();return}

    if(!keyboardBaseline)keyboardBaseline=Math.max(window.innerHeight||0,vv.height||0);
    const keyboardOpen=vv.height<keyboardBaseline-80;
    if(!keyboardOpen){clearKeyboardPosition();return}

    const gap=12;
    const available=Math.max(220,Math.floor(vv.height-gap*2));
    root.classList.add('ws-g2-keyboard-aware');
    root.style.bottom='auto';
    root.style.maxHeight=`${available}px`;
    root.style.transform='none';

    // Measure after max-height has been applied, then anchor the full card to the
    // bottom edge of the visible viewport rather than the layout viewport/keyboard.
    const cardHeight=Math.min(root.getBoundingClientRect().height,available);
    const top=Math.max(vv.offsetTop+gap,vv.offsetTop+vv.height-cardHeight-gap);
    root.style.top=`${Math.round(top)}px`;
  };

  const scheduleKeyboardPosition=()=>{
    if(!keyboardRaf)keyboardRaf=requestAnimationFrame(positionStepAboveKeyboard);
  };

  const restoreNormal=()=>{
    clearKeyboardPosition();
    keyboardBaseline=0;
    if(!onboarding||!savedSurface||!savedNodes)return;
    savedSurface.replaceChildren(savedNodes);
    onboarding=false;
    step=1;
    pendingName='';
    savedSurface=null;
    savedNodes=null;
  };

  const closeFromOnboarding=()=>{
    const root=savedSurface;
    restoreNormal();
    root?.querySelector('[data-x]')?.click();
  };

  const roleChoices=()=>Object.entries(ROLES).map(([key,item])=>`<button class="ws-g2-on-role" type="button" data-on-role="${key}" aria-label="Use the ${esc(item.label)} guide"><img src="${item.avatar}" alt=""><span>${esc(item.label)}</span></button>`).join('');

  const renderOnboarding=()=>{
    const root=savedSurface;
    if(!root||!onboarding)return;
    clearKeyboardPosition();

    if(step===1){
      root.innerHTML=`<button class="ws-g2-x" data-on-close type="button" aria-label="Close guide">×</button><div class="ws-g2-onboard"><div class="ws-g2-on-kicker">Personalise your guide</div><div class="ws-g2-on-steps" aria-hidden="true"><i class="on"></i><i></i></div><h3 class="ws-g2-on-title">What should I call you?</h3><p class="ws-g2-on-copy">Just your first name is enough.</p><div class="ws-g2-name-shell"><input class="ws-g2-name-input" data-on-name type="text" inputmode="text" autocomplete="given-name" maxlength="40" placeholder="Your name" aria-label="Your name"><button class="ws-g2-on-next" data-on-next type="button" disabled>Continue</button></div><div class="ws-g2-on-error" data-on-error aria-live="polite"></div></div>`;
      const input=root.querySelector('[data-on-name]');
      const next=root.querySelector('[data-on-next]');
      const error=root.querySelector('[data-on-error]');
      const sync=()=>{const value=(input?.value||'').trim();if(next)next.disabled=!value;if(error)error.textContent=''};
      input?.addEventListener('input',sync);
      input?.addEventListener('focus',()=>{
        const vv=window.visualViewport;
        keyboardBaseline=Math.max(window.innerHeight||0,vv?.height||0);
        scheduleKeyboardPosition();
        setTimeout(scheduleKeyboardPosition,80);
        setTimeout(scheduleKeyboardPosition,220);
      });
      input?.addEventListener('blur',()=>{
        clearKeyboardPosition();
        keyboardBaseline=0;
      });
      input?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!next?.disabled)next.click()});
      next?.addEventListener('click',()=>{
        const value=(input?.value||'').trim().replace(/\s+/g,' ').slice(0,40);
        if(!value){if(error)error.textContent='Please enter your name.';input?.focus();return}
        pendingName=value;
        input?.blur();
        clearKeyboardPosition();
        step=2;
        renderOnboarding();
      });
      // Do not auto-focus on mobile. Let the visitor see the full introduction first;
      // the keyboard appears only after they intentionally tap the name field.
      if(!mobile.matches)requestAnimationFrame(()=>input?.focus({preventScroll:true}));
    }else{
      root.innerHTML=`<button class="ws-g2-x" data-on-close type="button" aria-label="Close guide">×</button><div class="ws-g2-onboard"><div class="ws-g2-on-kicker">Personalise your guide</div><div class="ws-g2-on-steps" aria-hidden="true"><i></i><i class="on"></i></div><h3 class="ws-g2-on-title">Nice to meet you, ${esc(pendingName)}.</h3><p class="ws-g2-on-copy">How would you like me to guide you?</p><div class="ws-g2-on-roles">${roleChoices()}</div></div>`;
      root.querySelectorAll('[data-on-role]').forEach(button=>button.addEventListener('click',()=>{
        const selected=button.dataset.onRole;
        if(!ROLES[selected]||!pendingName)return;
        const desktopWasOpen=!!guide()?.classList.contains('open');
        const mobileWasOpen=document.body.classList.contains('ws-g2-mo');
        writeName(pendingName);
        const normalRoot=savedSurface;
        restoreNormal();
        normalRoot?.querySelector(`.ws-g2-role[data-r="${selected}"]`)?.click();
        requestAnimationFrame(()=>{
          if(desktopWasOpen)guide()?.classList.add('open');
          if(mobileWasOpen)document.body.classList.add('ws-g2-mo');
        });
        try{sessionStorage.setItem(WELCOME_KEY,'1')}catch(_){ }
      }));
    }
    root.querySelector('[data-on-close]')?.addEventListener('click',closeFromOnboarding);
  };

  const beginOnboarding=()=>{
    if(onboarding||readName()||!isOpen())return;
    const root=surface();
    if(!root||!root.childNodes.length)return;
    onboarding=true;
    step=1;
    pendingName='';
    keyboardBaseline=Math.max(window.innerHeight||0,window.visualViewport?.height||0);
    savedSurface=root;
    savedNodes=document.createDocumentFragment();
    while(root.firstChild)savedNodes.appendChild(root.firstChild);
    renderOnboarding();
  };

  const injectWelcome=()=>{
    const name=readName();
    if(!name||onboarding||!isOpen())return;
    try{if(sessionStorage.getItem(WELCOME_KEY)==='1')return}catch(_){ }
    const root=surface();
    if(!root||root.querySelector('.ws-g2-welcome'))return;
    const target=root.querySelector('.ws-g2-k,.ws-g2-copy');
    if(!target)return;
    const welcome=document.createElement('div');
    welcome.className='ws-g2-welcome';
    welcome.textContent=`Welcome back, ${name}.`;
    target.before(welcome);
    try{sessionStorage.setItem(WELCOME_KEY,'1')}catch(_){ }
  };

  // Observe intent only. The original role-guide-v2 click handler remains responsible
  // for opening desktop and mobile; this layer waits until that native open has finished.
  document.addEventListener('click',e=>{
    const button=e.target.closest?.('.ws-g2-btn');
    if(button){
      if(!readName()&&!onboarding){
        requestAnimationFrame(()=>requestAnimationFrame(beginOnboarding));
      }else if(readName()){
        requestAnimationFrame(()=>injectWelcome());
      }
      return;
    }

    const roleButton=e.target.closest?.('.ws-g2-role');
    if(roleButton&&!onboarding){
      const desktopWasOpen=!!guide()?.classList.contains('open');
      const mobileWasOpen=document.body.classList.contains('ws-g2-mo');
      requestAnimationFrame(()=>{
        if(desktopWasOpen)guide()?.classList.add('open');
        if(mobileWasOpen)document.body.classList.add('ws-g2-mo');
      });
    }
  },true);

  // Track the visible viewport while a soft keyboard is opening, closing or changing size.
  // This is the source of truth for step 1 on mobile; no hard-coded keyboard height is used.
  window.visualViewport?.addEventListener('resize',scheduleKeyboardPosition,{passive:true});
  window.visualViewport?.addEventListener('scroll',scheduleKeyboardPosition,{passive:true});
  addEventListener('orientationchange',()=>{
    keyboardBaseline=0;
    clearKeyboardPosition();
    setTimeout(scheduleKeyboardPosition,180);
  },{passive:true});

  // If the existing guide closes because the user scrolls into another section,
  // restore the preserved normal DOM without attempting to reopen anything.
  addEventListener('scroll',()=>{if(onboarding&&!isOpen())restoreNormal()},{passive:true});

  // role-guide-v2 deliberately creates the avatar off-screen and positions it at the end
  // of its synchronous setup. Late font/media layout can still make that first coordinate
  // stale, especially on mobile or a returning visit. Ask the native guide to recalculate
  // only when the avatar is genuinely outside the viewport; this never opens the guide.
  const ensureAvatarInViewport=()=>{
    const g=guide();
    if(!g)return;
    const r=g.getBoundingClientRect();
    const outside=r.right<=8||r.left>=innerWidth-8||r.bottom<=8||r.top>=innerHeight-8;
    if(outside)dispatchEvent(new Event('resize'));
  };
  requestAnimationFrame(ensureAvatarInViewport);
  setTimeout(ensureAvatarInViewport,180);
  setTimeout(ensureAvatarInViewport,650);
})();
