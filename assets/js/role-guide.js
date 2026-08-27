(()=>{
  const path=location.pathname.toLowerCase();
  if(path.includes('/contact')||document.documentElement.dataset.wsRoleGuideReady==='true')return;
  document.documentElement.dataset.wsRoleGuideReady='true';

  const R={
    teacher:{label:'Teacher',avatar:'/assets/images/guide-teacher.svg',a:'#f97316',bg:'#fff3e9',bd:'#ffc28f',gl:'rgba(249,115,22,.28)',prompt:'A thought for your classroom'},
    trainer:{label:'Trainer',avatar:'/assets/images/guide-trainer.svg',a:'#7c3aed',bg:'#f4efff',bd:'#c6b1fb',gl:'rgba(124,58,237,.25)',prompt:'A practical training idea'},
    publisher:{label:'Publisher',avatar:'/assets/images/guide-publisher.svg',a:'#9b3ee8',bg:'#fbf0ff',bd:'#ddb6f6',gl:'rgba(155,62,232,.24)',prompt:'A publishing angle'},
    organisation:{label:'Organisation',avatar:'/assets/images/guide-organisation.svg',a:'#4f46e5',bg:'#f0f2ff',bd:'#b9c0ff',gl:'rgba(79,70,229,.23)',prompt:'An organisation angle'}
  };
  const C=window.WistudiRoleGuideCopy||{};
  const RS='wistudiGuideRole',SS='wistudiGuideSeenV3',MS='wistudiGuideMinimizedV3';
  let role=R[localStorage.getItem(RS)]?localStorage.getItem(RS):'teacher';
  let minimized=sessionStorage.getItem(MS)==='1';
  let seen=new Set;try{seen=new Set(JSON.parse(sessionStorage.getItem(SS)||'[]'))}catch(_){}
  let active=null,moveTimer=0;
  const mobile=matchMedia('(max-width:760px)'),reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;

  const style=document.createElement('style');
  style.textContent=`
  .ws-g{--a:#f97316;--bg:#fff3e9;--bd:#ffc28f;--gl:rgba(249,115,22,.28);position:absolute;left:0;top:0;z-index:11850;width:76px;height:76px;transform:translate3d(-180px,-180px,0);transition:transform .72s cubic-bezier(.16,.86,.22,1),opacity .22s;will-change:transform;pointer-events:none}
  .ws-g.min{width:40px;height:40px;opacity:.64}.ws-g-btn{width:100%;height:100%;border:0;padding:0;background:none;border-radius:50%;display:block;position:relative;cursor:pointer;pointer-events:auto;filter:drop-shadow(0 13px 22px rgba(42,26,78,.16));animation:gIdle 4s ease-in-out infinite}
  .ws-g-btn:hover{transform:translateY(-2px) scale(1.035);filter:drop-shadow(0 16px 28px var(--gl))}.ws-g-ring{width:100%;height:100%;display:block;border-radius:50%;position:relative;padding:4px;background:linear-gradient(145deg,#fff,var(--bg));box-shadow:0 0 0 2px #fff,0 8px 26px rgba(48,31,83,.16)}
  .ws-g-ring:before{content:'';position:absolute;inset:-9px;border-radius:50%;pointer-events:none;opacity:0;border:2px solid var(--a)}.ws-g.fresh .ws-g-ring:before{box-shadow:0 0 0 6px color-mix(in srgb,var(--a) 12%,transparent),0 0 28px var(--gl);animation:gPulse 1.45s ease-out 2}
  .ws-g.arrive .ws-g-ring{animation:gLand .72s cubic-bezier(.18,.88,.28,1)}.ws-g-ring img{width:100%;height:100%;display:block;border-radius:50%;object-fit:cover;transition:.18s}.ws-g.swap .ws-g-ring img{opacity:.2;transform:scale(.9)}
  .ws-g.min .ws-g-btn{animation:none}.ws-g.min .ws-g-ring{padding:2px}.ws-g.min .ws-g-ring:before{display:none}
  .ws-g-b{position:absolute;right:calc(100% + 18px);bottom:4px;width:min(420px,calc(100vw - 130px));padding:22px 22px 17px;background:linear-gradient(145deg,#fff,var(--bg));border:1.5px solid var(--bd);border-radius:30px 30px 11px 30px;box-shadow:0 24px 64px rgba(38,24,66,.17),0 9px 26px var(--gl);opacity:0;transform:translateY(10px) scale(.94);transform-origin:100% 88%;pointer-events:none;transition:.28s cubic-bezier(.18,.85,.22,1);color:#302638}
  .ws-g-b:after{content:'';position:absolute;right:-10px;bottom:19px;width:22px;height:22px;background:var(--bg);border-right:1.5px solid var(--bd);border-bottom:1.5px solid var(--bd);transform:rotate(-45deg);border-radius:0 0 5px 0}.ws-g.open .ws-g-b{opacity:1;transform:none;pointer-events:auto}
  .ws-g-x{position:absolute;right:12px;top:11px;width:31px;height:31px;border:0;border-radius:50%;background:#ffffffb8;color:#72677b;cursor:pointer;font-size:20px;display:grid;place-items:center}.ws-g-k{display:flex;gap:8px;align-items:center;padding-right:34px;color:var(--a);font:800 12px/1.2 'Be Vietnam Pro',Inter,sans-serif;margin-bottom:10px}.ws-g-k:before{content:'';width:9px;height:9px;border-radius:50%;background:var(--a);box-shadow:0 0 0 5px color-mix(in srgb,var(--a) 12%,transparent)}
  .ws-g-copy{margin:0;color:#463a4d;font-size:14px;line-height:1.72;font-weight:500}.ws-g-switch{margin-top:16px;color:#766b80;font-size:11px;font-weight:750}.ws-g-roles{display:flex;gap:8px;margin-top:9px;flex-wrap:wrap}.ws-g-role{width:48px;height:48px;border-radius:50%;padding:2px;border:2px solid transparent;background:#ffffff90;cursor:pointer;position:relative}.ws-g-role img{width:100%;height:100%;border-radius:50%;object-fit:cover}.ws-g-role:hover{transform:translateY(-2px) scale(1.05)}.ws-g-role.on{border-color:var(--a);box-shadow:0 0 0 4px color-mix(in srgb,var(--a) 12%,transparent)}
  .ws-g-role:after{content:attr(data-l);position:absolute;left:50%;top:calc(100% + 7px);transform:translateX(-50%);white-space:nowrap;background:#261d30;color:#fff;border-radius:8px;padding:4px 6px;font-size:9px;font-weight:700;opacity:0;pointer-events:none}.ws-g-role:hover:after{opacity:1}.ws-g-hide{margin:15px 0 0;padding:0;border:0;background:none;color:#84798e;font-size:11px;font-weight:700;cursor:pointer}.ws-g-hide:hover{color:var(--a)}
  .ws-g-back{position:fixed;inset:0;z-index:12950;background:#120d1e6b;opacity:0;pointer-events:none;transition:.2s;backdrop-filter:blur(2px)}.ws-g-sheet{--a:#f97316;--bg:#fff3e9;--bd:#ffc28f;position:fixed;z-index:13000;left:10px;right:10px;bottom:10px;padding:20px 20px calc(19px + env(safe-area-inset-bottom));border:1.5px solid var(--bd);border-radius:28px 28px 20px 20px;background:linear-gradient(155deg,#fff,var(--bg));box-shadow:0 24px 80px #120d1e4d;transform:translateY(calc(100% + 36px));transition:transform .34s cubic-bezier(.18,.82,.22,1);max-height:min(80vh,660px);overflow:auto}.ws-g-sheet:before{content:'';display:block;width:44px;height:4px;border-radius:99px;background:var(--bd);margin:-8px auto 15px}body.ws-g-mo .ws-g-back{opacity:1;pointer-events:auto}body.ws-g-mo .ws-g-sheet{transform:none}
  .ws-g-mtop{display:grid;grid-template-columns:54px 1fr auto;gap:11px;align-items:center;margin-bottom:13px}.ws-g-mtop img{width:54px;height:54px;border-radius:50%;object-fit:cover;border:2px solid var(--bd)}.ws-g-mtop strong{font:800 15px/1.25 'Be Vietnam Pro',Inter,sans-serif;color:#2f2636}.ws-g-mtop span{display:block;margin-top:3px;color:#817686;font-size:11px}.ws-g-sheet .ws-g-x{position:static}.ws-g-sheet .ws-g-role{width:52px;height:52px}
  @keyframes gPulse{0%{opacity:0;transform:scale(.82)}32%{opacity:.95;transform:scale(1.04)}100%{opacity:0;transform:scale(1.28)}}@keyframes gLand{0%{transform:translateY(-24px) scale(.88)}60%{transform:translateY(5px) scale(1.035)}82%{transform:translateY(-2px)}100%{transform:none}}@keyframes gIdle{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
  @media(max-width:760px){.ws-g{width:58px;height:58px;z-index:11840;transition-duration:.58s}.ws-g.min{width:34px;height:34px}.ws-g-b{display:none!important}}@media(prefers-reduced-motion:reduce){.ws-g,.ws-g-btn,.ws-g-ring,.ws-g-ring:before,.ws-g-b,.ws-g-back,.ws-g-sheet{animation:none!important;transition-duration:.01ms!important}}`;
  document.head.append(style);

  const esc=s=>String(s||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const slug=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'section';
  const topic=s=>{const id=(s.id||'').toLowerCase(),h=(s.querySelector('h1,h2,h3')?.textContent||'').toLowerCase(),e=(s.querySelector('.eyebrow,.capabilities-kicker,.section-kicker,.int-kicker')?.textContent||'').toLowerCase(),t=`${id} ${h} ${e}`;if(s.classList.contains('hero'))return'hero';if(/xp.?video/.test(t))return'xpvideo';if(/flow/.test(t))return'flows';if(/print|worksheet|screen to desk|screen.*desk/.test(t))return'printable';if(/format/.test(t))return'formats';if(/block|activit/.test(t))return'blocks';if(/whiteboard|live teach|classroom|workshop/.test(t))return'live';if(/discover|dashboard|workspace/.test(t))return'dashboard';if(/analytic|report|track|insight|measure/.test(t))return'analytics';if(/integrat|architecture|lti|sso|moodle|canvas|modular|expand/.test(t))return'integrations';if(/partner|ecosystem|technology/.test(t))return'partners';if(/social|community|connect/.test(t))return'social';if(/scale|catalog|catalogue|library/.test(t))return'scale';if(/organisation|organization|team|govern|private/.test(t))return'organisation';if(/why wistudi|traditional|separate systems|problems/.test(t))return'why';if(/built for every|audience|publisher.*organisation|publisher.*organization/.test(t))return'audience';if(/core|everything you need|create.*publish|platform overview/.test(t))return'core';if(/connected|all in one|separate tools/.test(t))return'connected';return'default'};

  const main=document.querySelector('main');if(!main)return;
  const secs=[...main.querySelectorAll(':scope > section')].filter(s=>s.getBoundingClientRect().height>=250&&!s.matches('[hidden],.ws-no-role-guide'));if(!secs.length)return;
  secs.forEach((s,i)=>{s.dataset.wsGuideKey=`${path}:${s.id||slug(s.querySelector('h1,h2,h3')?.textContent||`section-${i+1}`)}`;const sentinel=document.createElement('span');sentinel.className='ws-guide-sentinel';sentinel.setAttribute('aria-hidden','true');sentinel.style.cssText='position:absolute;left:0;right:0;bottom:0;height:2px;pointer-events:none;';if(getComputedStyle(s).position==='static')s.style.position='relative';s.appendChild(sentinel)});

  const g=document.createElement('div');g.className='ws-g';g.innerHTML='<button class="ws-g-btn" type="button"><span class="ws-g-ring"><img alt="" aria-hidden="true"></span></button><div class="ws-g-b" role="dialog"></div>';document.body.append(g);
  const btn=g.querySelector('.ws-g-btn'),img=g.querySelector('img'),bubble=g.querySelector('.ws-g-b');
  const back=document.createElement('div');back.className='ws-g-back';const sheet=document.createElement('div');sheet.className='ws-g-sheet';sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');document.body.append(back,sheet);

  const theme=()=>{const r=R[role];[g,sheet].forEach(x=>{x.style.setProperty('--a',r.a);x.style.setProperty('--bg',r.bg);x.style.setProperty('--bd',r.bd);x.style.setProperty('--gl',r.gl)});btn.setAttribute('aria-label',`Open ${r.label} perspective`)};
  const buttons=()=>Object.entries(R).map(([k,r])=>`<button class="ws-g-role ${role===k?'on':''}" type="button" data-r="${k}" data-l="${r.label}" aria-label="Switch to ${r.label}"><img src="${r.avatar}" alt=""></button>`).join('');
  const currentCopy=()=>C[topic(active)]?.[role]||C.default?.[role]||'Here is one practical way this section could fit your work.';
  const wire=root=>{root.querySelector('[data-x]')?.addEventListener('click',close);root.querySelector('[data-hide]')?.addEventListener('click',()=>setMin(true));root.querySelectorAll('[data-r]').forEach(b=>b.addEventListener('click',()=>setRole(b.dataset.r)))};
  function render(){const r=R[role];if(mobile.matches){sheet.innerHTML=`<div class="ws-g-mtop"><img src="${r.avatar}" alt="${esc(r.label)} guide"><div><strong>${esc(r.prompt)}</strong><span>${esc(r.label)} perspective · switch any time</span></div><button class="ws-g-x" data-x>×</button></div><p class="ws-g-copy">${esc(currentCopy())}</p><div class="ws-g-switch">Want another perspective?</div><div class="ws-g-roles">${buttons()}</div><button class="ws-g-hide" data-hide>Hide the guide for now</button>`;wire(sheet)}else{bubble.innerHTML=`<button class="ws-g-x" data-x>×</button><div class="ws-g-k">${esc(r.prompt)}</div><p class="ws-g-copy">${esc(currentCopy())}</p><div class="ws-g-switch">Want another perspective?</div><div class="ws-g-roles">${buttons()}</div><button class="ws-g-hide" data-hide>Hide the guide for now</button>`;wire(bubble)}}
  function mark(){if(!active)return;seen.add(active.dataset.wsGuideKey);sessionStorage.setItem(SS,JSON.stringify([...seen]));g.classList.remove('fresh')}
  function close(){g.classList.remove('open');document.body.classList.remove('ws-g-mo')}
  function setMin(v){min=!!v;sessionStorage.setItem(MS,min?'1':'0');g.classList.toggle('min',min);if(min)close();moveTo(active,false)}
  function setRole(next){if(!R[next]||next===role)return;role=next;localStorage.setItem(RS,role);g.classList.add('swap');theme();setTimeout(()=>{img.src=R[role].avatar;g.classList.remove('swap');g.classList.add('fresh')},reduce?0:130);if(g.classList.contains('open')||document.body.classList.contains('ws-g-mo'))render()}
  function open(){if(min){setMin(false);return}mark();render();if(mobile.matches)document.body.classList.add('ws-g-mo');else g.classList.add('open')}
  btn.addEventListener('click',()=>mobile.matches?open():g.classList.contains('open')?close():open());back.addEventListener('click',close);document.addEventListener('keydown',e=>e.key==='Escape'&&close());

  function targetPos(section){const z=min?(mobile.matches?34:40):(mobile.matches?58:76),sr=section.getBoundingClientRect(),c=section.querySelector('.container,.ws-container,.capabilities-inner');let right=sr.right+scrollX-(mobile.matches?14:26);if(c){const cr=c.getBoundingClientRect();right=Math.min(right,cr.right+scrollX+24)}let x=right-z,y=sr.bottom+scrollY-z-(mobile.matches?18:26);const float=document.querySelector('.ws-hero-float-shell.is-visible');if(float){const fr=float.getBoundingClientRect(),vx=x-scrollX,vy=y-scrollY;if(vx<fr.right+18&&vx+z>fr.left-18&&vy<fr.bottom+18&&vy+z>fr.top-18){const left=fr.left+scrollX-z-22;if(left>12)x=left;else y=fr.top+scrollY-z-20}}return{x:Math.round(Math.max(10,x)),y:Math.round(Math.max(10,y))}}
  function moveTo(section,animate=true){if(!section)return;active=section;close();const {x,y}=targetPos(section);if(animate&&!reduce){g.classList.add('arrive');clearTimeout(moveTimer);moveTimer=setTimeout(()=>g.classList.remove('arrive'),760)}g.style.transform=`translate3d(${x}px,${y}px,0)`;if(!seen.has(section.dataset.wsGuideKey)&&!min){g.classList.remove('fresh');void g.offsetWidth;g.classList.add('fresh')}else g.classList.remove('fresh')}

  theme();img.src=R[role].avatar;g.classList.toggle('min',min);moveTo(secs[0],false);

  // The guide deliberately does NOT follow scroll. It remains parked at the previous
  // section until a section's bottom edge enters the viewport, then moves once.
  if('IntersectionObserver'in window){
    const observer=new IntersectionObserver(entries=>{
      const entered=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);
      if(!entered.length)return;
      const section=entered[entered.length-1].target.closest('section');
      if(section&&section!==active)moveTo(section,true);
    },{root:null,threshold:0,rootMargin:'-8% 0px -8% 0px'});
    secs.forEach(s=>observer.observe(s.querySelector('.ws-guide-sentinel')));
  }else{
    let ticking=false,lastY=scrollY;
    addEventListener('scroll',()=>{if(ticking)return;ticking=true;requestAnimationFrame(()=>{const down=scrollY>=lastY;lastY=scrollY;const line=innerHeight*.9;let candidate=active;for(const s of secs){const b=s.getBoundingClientRect().bottom;if(b>0&&b<=line)candidate=s}if(!down){for(let i=secs.length-1;i>=0;i--){const b=secs[i].getBoundingClientRect().bottom;if(b>=innerHeight*.1&&b<innerHeight){candidate=secs[i];break}}}if(candidate&&candidate!==active)moveTo(candidate,true);ticking=false})},{passive:true});
  }

  addEventListener('resize',()=>{close();moveTo(active,false)},{passive:true});mobile.addEventListener?.('change',()=>{close();moveTo(active,false)});
  const watchFloat=()=>{const f=document.querySelector('.ws-hero-float-shell');if(!f)return setTimeout(watchFloat,500);new MutationObserver(()=>moveTo(active,false)).observe(f,{attributes:true,attributeFilter:['class','style']})};watchFloat();
  if(!localStorage.getItem(RS)&&!mobile.matches&&!min)setTimeout(()=>active&&open(),reduce?20:900);
})();
