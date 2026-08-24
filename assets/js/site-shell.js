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
        // Near the bottom, make sure the final reachable section can become active.
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
            if(entry.isIntersecting){
              entry.target.classList.add('ws-section-visible');
              sectionObserver.unobserve(entry.target);
            }
          });
        },{threshold:.045,rootMargin:'0px 0px -3% 0px'});
        sections.forEach(section=>{
          section.classList.add('ws-scroll-section');
          const r=section.getBoundingClientRect();
          if(r.top < window.innerHeight*.94 && r.bottom > 0){
            requestAnimationFrame(()=>section.classList.add('ws-section-visible'));
          }else{
            sectionObserver.observe(section);
          }
        });
      }
    }

    if(document.body.classList.contains('page-blocks')){
      // Requirement: the block-stack demo plays 30% faster.
      const stack=document.querySelector('.blocks-demo-video,.media-card.stack-video video');
      if(stack){stack.defaultPlaybackRate=1.3;stack.playbackRate=1.3;stack.addEventListener('loadedmetadata',()=>{stack.defaultPlaybackRate=1.3;stack.playbackRate=1.3;},{once:true});}

      // Requirement: only the centred/active carousel block may play, on desktop and mobile.
      const track=document.getElementById('carouselTrack');
      const enforce=()=>{
        if(!track)return;
        track.querySelectorAll('.carousel-card').forEach(card=>{
          const v=card.querySelector('video');if(!v)return;
          if(!card.classList.contains('active')){v.pause();try{v.currentTime=0}catch(_){}}
        });
      };
      if(track){new MutationObserver(enforce).observe(track,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});track.addEventListener('play',e=>{const v=e.target;if(v&&v.tagName==='VIDEO'&&!v.closest('.carousel-card')?.classList.contains('active')){v.pause();try{v.currentTime=0}catch(_){}}},true);setInterval(enforce,900);setTimeout(enforce,250);}
    }
  });
})();

// Keep every long-form page section submenu pinned exactly below the live header height.
(() => {
  const header = document.querySelector('.ws-site-header');
  const subnav = document.querySelector('.ws-section-subnav');
  if (!header || !subnav) return; // Contact intentionally has no section submenu.

  const syncStickyOffsets = () => {
    const headerHeight = Math.ceil(header.getBoundingClientRect().height || 0);
    const subnavHeight = Math.ceil(subnav.getBoundingClientRect().height || 0);
    if (headerHeight) document.documentElement.style.setProperty('--ws-header-height', `${headerHeight}px`);
    if (subnavHeight) document.documentElement.style.setProperty('--ws-subnav-height', `${subnavHeight}px`);
  };

  syncStickyOffsets();
  window.addEventListener('resize', syncStickyOffsets, {passive:true});
  window.addEventListener('orientationchange', syncStickyOffsets, {passive:true});
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(syncStickyOffsets);
    ro.observe(header);
    ro.observe(subnav);
  }
})();


// ACTUAL VIEWPORT-STICKY SUBNAV FIX
// The submenu begins below the hero in normal document flow.
// Once it reaches the main header, it remains fixed directly beneath it.
(() => {
  const init = () => {
    const header = document.querySelector('.ws-site-header');
    const subnav = document.querySelector('.ws-section-subnav');
    if (!header || !subnav) return; // Contact page intentionally has no submenu.

    const placeholder = document.createElement('div');
    placeholder.className = 'ws-subnav-placeholder';
    subnav.parentNode.insertBefore(placeholder, subnav);

    let triggerY = 0;
    let ticking = false;

    const setVars = () => {
      const headerH = Math.ceil(header.getBoundingClientRect().height || 0);
      const subnavH = Math.ceil(subnav.getBoundingClientRect().height || 0);
      if (headerH) document.documentElement.style.setProperty('--ws-header-height', `${headerH}px`);
      if (subnavH) document.documentElement.style.setProperty('--ws-subnav-height', `${subnavH}px`);
      return {headerH, subnavH};
    };

    const update = () => {
      ticking = false;
      const {headerH, subnavH} = setVars();
      const shouldFix = window.scrollY >= triggerY;

      if (shouldFix) {
        placeholder.style.height = `${subnavH}px`;
        placeholder.classList.add('active');
        subnav.classList.add('ws-subnav-fixed');
      } else {
        subnav.classList.remove('ws-subnav-fixed');
        placeholder.classList.remove('active');
        placeholder.style.height = '0px';
      }
    };

    const measure = () => {
      // Measure from the submenu's real position in normal flow.
      subnav.classList.remove('ws-subnav-fixed');
      placeholder.classList.remove('active');
      placeholder.style.height = '0px';

      const {headerH} = setVars();
      triggerY = subnav.getBoundingClientRect().top + window.scrollY - headerH;
      update();
    };

    const schedule = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(measure);
    window.addEventListener('scroll', schedule, {passive:true});
    window.addEventListener('resize', measure, {passive:true});
    window.addEventListener('orientationchange', measure, {passive:true});

    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(measure);
      ro.observe(header);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {once:true});
  } else {
    init();
  }
})();
