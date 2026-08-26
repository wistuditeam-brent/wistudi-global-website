(()=>{
  const onReady=(fn)=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
  onReady(()=>{
    const header=document.querySelector('.ws-site-header');
    const mobile=document.querySelector('.ws-mobile-menu');
    const menuBtn=document.querySelector('.ws-menu-toggle');
    if(menuBtn&&mobile){menuBtn.addEventListener('click',()=>{const open=mobile.classList.toggle('open');menuBtn.setAttribute('aria-expanded',String(open));});}
    document.querySelectorAll('.ws-lang').forEach(lang=>{
      const toggle=lang.querySelector('.ws-lang-toggle');
      if(!toggle)return;
      toggle.addEventListener('click',e=>{e.stopPropagation();const open=!lang.classList.contains('open');document.querySelectorAll('.ws-lang.open').forEach(x=>x.classList.remove('open'));lang.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open));});
    });
    document.addEventListener('click',()=>document.querySelectorAll('.ws-lang.open').forEach(x=>{x.classList.remove('open');const t=x.querySelector('.ws-lang-toggle');if(t)t.setAttribute('aria-expanded','false');}));
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelectorAll('.ws-lang.open').forEach(x=>x.classList.remove('open'));if(mobile)mobile.classList.remove('open');if(menuBtn)menuBtn.setAttribute('aria-expanded','false');}});

    // All publishing CTAs go directly to the Wistudi sign-up page.
    const SIGNUP_URL='https://wistudi.com/sign-up';
    const syncPublishingLinks=()=>{
      document.querySelectorAll('a').forEach(a=>{
        if(a.textContent.trim().toLowerCase()==='start publishing') a.href=SIGNUP_URL;
      });
    };
    syncPublishingLinks();
    // Capture clicks as an extra guarantee even if older HTML still contains wistudi.com.
    document.addEventListener('click',e=>{
      const a=e.target.closest?.('a');
      if(!a)return;
      if(a.textContent.trim().toLowerCase()==='start publishing'){
        e.preventDefault();
        window.location.assign(SIGNUP_URL);
      }
    },true);

    // Media loading optimisation without changing source quality.
    // Original image/video files are preserved; only loading/decoding/playback timing changes.
    document.querySelectorAll('img').forEach((img,index)=>{
      if(!img.hasAttribute('decoding')) img.decoding='async';
      const r=img.getBoundingClientRect();
      const aboveFold=r.top < window.innerHeight*1.15;
      if(!aboveFold && !img.hasAttribute('loading')) img.loading='lazy';
      if(index===0 && aboveFold && 'fetchPriority' in img) img.fetchPriority='high';
    });

    const siteVideos=[...document.querySelectorAll('video:not(.carousel-card video)')];
    siteVideos.forEach(video=>{
      const r=video.getBoundingClientRect();
      const aboveFold=r.top < window.innerHeight*1.15;
      if(!aboveFold && video.preload==='auto') video.preload='metadata';
    });
    if('IntersectionObserver' in window){
      const mediaObserver=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          const video=entry.target;
          if(entry.isIntersecting){if(video.autoplay) video.play().catch(()=>{});}
          else if(video.autoplay){video.pause();}
        });
      },{threshold:.08,rootMargin:'180px 0px'});
      siteVideos.forEach(video=>mediaObserver.observe(video));
    }

    // Contact CTAs can preselect the enquiry type via /contact/?type=...
    if(document.body.classList.contains('page-contact')){
      const params=new URLSearchParams(location.search);const type=params.get('type');const select=document.getElementById('enquiry');
      if(type&&select&&[...select.options].some(o=>o.value===type)){select.value=type;select.dispatchEvent(new Event('change',{bubbles:true}));}
    }

    // Shared sticky section navigation / scroll spy for Platform, Blocks & Activities, and Organisations.
    document.querySelectorAll('.subnav-wrap.ws-section-subnav').forEach(wrap=>{
      const nav=wrap.querySelector('.subnav');
      const links=[...wrap.querySelectorAll('a[href^="#"]')];
      const pairs=links.map(a=>{const id=decodeURIComponent(a.getAttribute('href').slice(1));return {a,target:document.getElementById(id)}}).filter(x=>x.target);
      if(!pairs.length)return;
      let raf=0;
      const update=()=>{
        raf=0;
        const headH=(document.querySelector('.ws-site-header')?.offsetHeight||72);
        const offset=headH+(wrap.offsetHeight||60)+24;
        let chosen=pairs[0];
        for(const pair of pairs){if(pair.target.getBoundingClientRect().top<=offset) chosen=pair; else break;}
        if(window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-4) chosen=pairs[pairs.length-1];
        pairs.forEach(p=>p.a.classList.toggle('active',p===chosen));
        const active=chosen.a;
        if(nav&&active){
          const left=active.offsetLeft-(nav.clientWidth-active.offsetWidth)/2;
          const max=Math.max(0,nav.scrollWidth-nav.clientWidth);
          nav.scrollTo({left:Math.max(0,Math.min(left,max)),behavior:'auto'});
        }
      };
      const schedule=()=>{if(!raf)raf=requestAnimationFrame(update)};
      links.forEach(a=>a.addEventListener('click',()=>{links.forEach(x=>x.classList.toggle('active',x===a));}));
      window.addEventListener('scroll',schedule,{passive:true});
      window.addEventListener('resize',schedule,{passive:true});
      update();
    });

    // Unified fast section fade for the three long-form website pages.
    if(document.body.matches('.page-platform,.page-blocks,.page-organisations')){
      const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const sections=[...document.querySelectorAll('main > section:not(.hero)')];
      if(reduced || !('IntersectionObserver' in window)){
        sections.forEach(section=>section.classList.add('ws-scroll-section','ws-section-visible'));
      }else{
        const sectionObserver=new IntersectionObserver(entries=>{
          entries.forEach(entry=>{
            if(entry.isIntersecting){entry.target.classList.add('ws-section-visible');sectionObserver.unobserve(entry.target);}
          });
        },{threshold:.045,rootMargin:'0px 0px -3% 0px'});
        sections.forEach(section=>{
          section.classList.add('ws-scroll-section');
          const r=section.getBoundingClientRect();
          if(r.top < window.innerHeight*.94 && r.bottom > 0) requestAnimationFrame(()=>section.classList.add('ws-section-visible'));
          else sectionObserver.observe(section);
        });
      }
    }

    if(document.body.classList.contains('page-blocks')){
      const stack=document.querySelector('.blocks-demo-video,.media-card.stack-video video');
      if(stack){stack.defaultPlaybackRate=1.3;stack.playbackRate=1.3;stack.addEventListener('loadedmetadata',()=>{stack.defaultPlaybackRate=1.3;stack.playbackRate=1.3;},{once:true});}

      const carouselTrack=document.getElementById('carouselTrack');
      const carouselShell=document.querySelector('.carousel-shell');

      // Replace the page's original updateCarousel calculation.
      // The original used getBoundingClientRect().width on a scaled card, so each step
      // accumulated horizontal error. offsetWidth gives the real untransformed flex width.
      if(carouselTrack&&carouselShell&&typeof window.updateCarousel==='function'){
        window.updateCarousel=function(animate=true){
          const cards=[...carouselTrack.querySelectorAll('.carousel-card')];
          if(!cards.length || !filtered.length)return;

          renderPosition=Math.max(0,Math.min(renderPosition,cards.length-1));
          currentIndex=mod(renderPosition,filtered.length);
          carouselTrack.classList.toggle('no-transition',!animate||prefersReducedMotion);

          cards.forEach((card,i)=>{
            const active=i===renderPosition;
            card.classList.toggle('active',active);
            card.setAttribute('aria-current',active?'true':'false');
            const video=card.querySelector('video');
            if(video){
              if(active&&!modalPaused) video.play().catch(()=>{});
              else{video.pause();try{if(!active)video.currentTime=0}catch(_){}}
            }
            const top=card.querySelector('.carousel-top');
            const logical=Number(card.dataset.logical);
            if(top) top.innerHTML=`<span class="chip">${filtered[logical]?.category||''}</span>${active?'<span class="chip playchip">Live preview</span>':''}`;
          });

          const styles=getComputedStyle(carouselTrack);
          const gap=parseFloat(styles.columnGap||styles.gap)||24;
          const cardW=cards[0].offsetWidth;
          const shellW=carouselShell.clientWidth;
          const offset=shellW/2-cardW/2-renderPosition*(cardW+gap);
          carouselTrack.style.transform=`translateX(${offset}px)`;

          if(!animate||prefersReducedMotion){
            requestAnimationFrame(()=>carouselTrack.classList.add('no-transition'));
          }
        };

        // Apply the corrected centre immediately, and again after layout changes.
        requestAnimationFrame(()=>window.updateCarousel(false));
        setTimeout(()=>window.updateCarousel(false),180);
        window.addEventListener('resize',()=>window.updateCarousel(false),{passive:true});
        window.addEventListener('orientationchange',()=>setTimeout(()=>window.updateCarousel(false),120),{passive:true});

        // Only the active/centred card is ever allowed to play.
        carouselTrack.addEventListener('play',e=>{
          const video=e.target;
          if(video?.tagName==='VIDEO'&&!video.closest('.carousel-card')?.classList.contains('active')){
            video.pause();try{video.currentTime=0}catch(_){ }
          }
        },true);
      }
    }
  });
})();

// Keep every long-form page section submenu pinned exactly below the live header height.
(() => {
  const header=document.querySelector('.ws-site-header');
  const subnav=document.querySelector('.ws-section-subnav');
  if(!header||!subnav)return;
  const syncStickyOffsets=()=>{
    const headerHeight=Math.ceil(header.getBoundingClientRect().height||0);
    const subnavHeight=Math.ceil(subnav.getBoundingClientRect().height||0);
    if(headerHeight)document.documentElement.style.setProperty('--ws-header-height',`${headerHeight}px`);
    if(subnavHeight)document.documentElement.style.setProperty('--ws-subnav-height',`${subnavHeight}px`);
  };
  syncStickyOffsets();
  window.addEventListener('resize',syncStickyOffsets,{passive:true});
  window.addEventListener('orientationchange',syncStickyOffsets,{passive:true});
  if('ResizeObserver'in window){const ro=new ResizeObserver(syncStickyOffsets);ro.observe(header);ro.observe(subnav);}
})();

// ACTUAL VIEWPORT-STICKY SUBNAV FIX
(() => {
  const init=()=>{
    const header=document.querySelector('.ws-site-header');
    const subnav=document.querySelector('.ws-section-subnav');
    if(!header||!subnav)return;
    const placeholder=document.createElement('div');
    placeholder.className='ws-subnav-placeholder';
    subnav.parentNode.insertBefore(placeholder,subnav);
    let triggerY=0;
    let ticking=false;
    const setVars=()=>{
      const headerH=Math.ceil(header.getBoundingClientRect().height||0);
      const subnavH=Math.ceil(subnav.getBoundingClientRect().height||0);
      if(headerH)document.documentElement.style.setProperty('--ws-header-height',`${headerH}px`);
      if(subnavH)document.documentElement.style.setProperty('--ws-subnav-height',`${subnavH}px`);
      return{headerH,subnavH};
    };
    const update=()=>{
      ticking=false;
      const{subnavH}=setVars();
      const shouldFix=window.scrollY>=triggerY;
      if(shouldFix){placeholder.style.height=`${subnavH}px`;placeholder.classList.add('active');subnav.classList.add('ws-subnav-fixed');}
      else{subnav.classList.remove('ws-subnav-fixed');placeholder.classList.remove('active');placeholder.style.height='0px';}
    };
    const measure=()=>{
      subnav.classList.remove('ws-subnav-fixed');
      placeholder.classList.remove('active');
      placeholder.style.height='0px';
      const{headerH}=setVars();
      triggerY=subnav.getBoundingClientRect().top+window.scrollY-headerH;
      update();
    };
    const schedule=()=>{if(!ticking){ticking=true;requestAnimationFrame(update);}};
    requestAnimationFrame(measure);
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',measure,{passive:true});
    window.addEventListener('orientationchange',measure,{passive:true});
    if('ResizeObserver'in window){const ro=new ResizeObserver(measure);ro.observe(header);}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();

// Blocks & Activities integration conversation banner.
(() => {
  const COPY={
    en:{title:'Powerful on its own. Designed to connect.',body:'Use Wistudi independently or connect it with LMS, identity, content and specialist learning technology.',cta:'Discuss an integration',aria:'Wistudi integration options'},
    vi:{title:'Mạnh mẽ khi hoạt động độc lập. Được thiết kế để kết nối.',body:'Sử dụng Wistudi độc lập hoặc kết nối với LMS, hệ thống định danh, nội dung và công nghệ học tập chuyên biệt.',cta:'Trao đổi về tích hợp',aria:'Các tùy chọn tích hợp Wistudi'},
    'zh-cn':{title:'独立使用同样强大，也为连接而设计。',body:'可独立使用 Wistudi，也可连接 LMS、身份系统、内容和专业学习技术。',cta:'讨论集成方案',aria:'Wistudi 集成选项'},
    th:{title:'ทรงพลังด้วยตัวเอง และออกแบบมาเพื่อเชื่อมต่อ',body:'ใช้ Wistudi ได้อย่างอิสระ หรือเชื่อมต่อกับ LMS ระบบยืนยันตัวตน เนื้อหา และเทคโนโลยีการเรียนรู้เฉพาะทาง',cta:'พูดคุยเรื่องการเชื่อมต่อ',aria:'ตัวเลือกการเชื่อมต่อ Wistudi'},
    id:{title:'Kuat digunakan sendiri. Dirancang untuk terhubung.',body:'Gunakan Wistudi secara mandiri atau hubungkan dengan LMS, identitas, konten, dan teknologi pembelajaran khusus.',cta:'Diskusikan integrasi',aria:'Opsi integrasi Wistudi'},
    ms:{title:'Berkuasa secara kendiri. Direka untuk berhubung.',body:'Gunakan Wistudi secara kendiri atau hubungkannya dengan LMS, identiti, kandungan dan teknologi pembelajaran khusus.',cta:'Bincangkan integrasi',aria:'Pilihan integrasi Wistudi'},
    ar:{title:'قوي بمفرده، ومصمم للاتصال.',body:'استخدم Wistudi بشكل مستقل أو اربطه بأنظمة إدارة التعلم والهوية والمحتوى وتقنيات التعلم المتخصصة.',cta:'ناقش تكاملاً',aria:'خيارات تكامل Wistudi'}
  };
  const supported=Object.keys(COPY);
  const init=()=>{
    if(!document.body?.classList.contains('page-blocks')||document.querySelector('.ws-integration-banner'))return;
    const header=document.querySelector('.ws-site-header');
    if(!header)return;
    const first=(location.pathname.split('/').filter(Boolean)[0]||'').toLowerCase();
    const locale=supported.includes(first)?first:'en';
    const copy=COPY[locale]||COPY.en;
    const contactUrl=locale==='en'?'/contact/?type=partnership#contact-form':`/${locale}/contact/?type=partnership#contact-form`;

    if(!document.getElementById('ws-integration-banner-style')){
      const style=document.createElement('style');
      style.id='ws-integration-banner-style';
      style.textContent=`
        .ws-integration-banner{position:relative;z-index:2;overflow:hidden;border-bottom:1px solid rgba(124,58,237,.12);background:linear-gradient(100deg,#f8f4ff 0%,#fbf9ff 44%,#fff8f2 100%);opacity:0;transform:translateY(-4px);transition:opacity .28s ease,transform .28s ease}
        .ws-integration-banner.is-ready{opacity:1;transform:none}
        .ws-integration-inner{width:min(calc(100% - 40px),1180px);min-height:126px;margin-inline:auto;display:grid;grid-template-columns:92px minmax(300px,1.25fr) auto auto;gap:24px;align-items:center;padding:18px 0}
        .ws-integration-main-icon{width:86px;height:86px;object-fit:contain;filter:drop-shadow(0 12px 24px rgba(91,33,182,.14));transition:transform .28s ease}
        .ws-integration-banner:hover .ws-integration-main-icon{transform:translateY(-2px) scale(1.035)}
        .ws-integration-copy h2{margin:0;font-family:'Be Vietnam Pro',Inter,Arial,sans-serif;font-size:clamp(1.12rem,1.6vw,1.45rem);line-height:1.22;letter-spacing:-.025em;color:#181523}
        .ws-integration-copy p{margin:7px 0 0;max-width:620px;color:#6d6878;font-size:.88rem;line-height:1.55}
        .ws-integration-tech{display:flex;align-items:center;gap:7px;white-space:nowrap}
        .ws-integration-tech-icon{width:44px;height:44px;border:1px solid rgba(124,58,237,.14);border-radius:13px;background:rgba(255,255,255,.72);display:grid;place-items:center;box-shadow:0 8px 22px rgba(61,43,101,.05)}
        .ws-integration-tech-icon img{width:38px;height:38px;object-fit:contain;filter:drop-shadow(0 5px 10px rgba(91,33,182,.09))}
        .ws-integration-standards{display:inline-flex;align-items:center;gap:6px;margin-left:3px;padding:8px 12px;border:1px solid rgba(124,58,237,.14);border-radius:999px;background:rgba(255,255,255,.72);color:#7c3aed;font-size:.67rem;font-weight:800;letter-spacing:.02em}
        .ws-integration-cta{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:46px;padding:0 18px;border-radius:14px;background:linear-gradient(135deg,#f97316,#fb923c);color:#fff;font-size:.78rem;font-weight:800;box-shadow:0 13px 28px rgba(249,115,22,.25);transition:transform .2s ease,box-shadow .2s ease;white-space:nowrap}
        .ws-integration-cta:hover{transform:translateY(-2px);box-shadow:0 17px 34px rgba(249,115,22,.32)}
        .ws-integration-cta svg{width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2.2}
        @media(max-width:1080px){.ws-integration-inner{grid-template-columns:76px 1fr auto;gap:18px}.ws-integration-main-icon{width:72px;height:72px}.ws-integration-tech{grid-column:2/4;justify-content:flex-start;margin-top:-8px}.ws-integration-inner{padding:16px 0}}
        @media(max-width:760px){.ws-integration-inner{width:min(calc(100% - 28px),1180px);grid-template-columns:62px 1fr;gap:13px;min-height:0;padding:16px 0}.ws-integration-main-icon{width:58px;height:58px}.ws-integration-copy h2{font-size:1.05rem}.ws-integration-copy p{font-size:.8rem;line-height:1.48}.ws-integration-tech{grid-column:1/-1;gap:6px;margin:0;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}.ws-integration-tech::-webkit-scrollbar{display:none}.ws-integration-tech-icon{width:40px;height:40px;flex:0 0 40px}.ws-integration-tech-icon img{width:34px;height:34px}.ws-integration-standards{font-size:.62rem}.ws-integration-cta{grid-column:1/-1;width:100%;min-height:44px;margin-top:1px}}
        @media(prefers-reduced-motion:reduce){.ws-integration-banner,.ws-integration-main-icon,.ws-integration-cta{transition:none!important}}
      `;
      document.head.appendChild(style);
    }

    const banner=document.createElement('aside');
    banner.className='ws-integration-banner';
    banner.setAttribute('aria-label',copy.aria);
    banner.innerHTML=`<div class="ws-integration-inner"><img class="ws-integration-main-icon" src="/assets/images/integration-connector.svg" alt="" aria-hidden="true"><div class="ws-integration-copy"><h2>${copy.title}</h2><p>${copy.body}</p></div><div class="ws-integration-tech" aria-hidden="true"><span class="ws-integration-tech-icon"><img src="/assets/images/integration-cloud.svg" alt=""></span><span class="ws-integration-tech-icon"><img src="/assets/images/integration-identity.svg" alt=""></span><span class="ws-integration-tech-icon"><img src="/assets/images/integration-learning.svg" alt=""></span><span class="ws-integration-tech-icon"><img src="/assets/images/integration-code.svg" alt=""></span><span class="ws-integration-standards">LTI&nbsp; • &nbsp;SSO&nbsp; • &nbsp;LMS&nbsp; • &nbsp;API</span></div><a class="ws-integration-cta" href="${contactUrl}">${copy.cta}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></div>`;
    header.insertAdjacentElement('afterend',banner);
    requestAnimationFrame(()=>banner.classList.add('is-ready'));
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
