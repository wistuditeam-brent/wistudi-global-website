(()=>{
  'use strict';

  const doc=document;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // Performance/responsiveness overrides are deliberately small and global.
  // They preserve the existing visual language while removing expensive blur-based reveals
  // and making media/flex/grid content safer on narrow screens.
  const style=doc.createElement('style');
  style.id='ws-performance-overrides';
  style.textContent=`
    img,video,iframe,svg{max-width:100%}
    img,video{height:auto}
    iframe{border:0}
    main :where(.container,.ws-container,.split,.hero-grid,.format-wrap,.org-wrap,.demo-grid,.screen-grid,.contact-wrap,.arch-grid,.library-head)>*{min-width:0}
    :where(p,h1,h2,h3,h4,a,strong,span){overflow-wrap:break-word}

    /* One fast reveal language. Remove GPU-expensive blur and long stagger delays. */
    .scroll-reveal,
    .reveal{
      filter:none!important;
      transition-delay:0ms!important;
      transition-duration:.22s,.26s!important;
      transition-timing-function:ease,cubic-bezier(.2,.76,.2,1)!important;
    }
    .scroll-reveal:not(.is-visible){transform:translate3d(0,12px,0) scale(.998)!important}
    .scroll-reveal.reveal-left:not(.is-visible){transform:translate3d(-12px,0,0) scale(.998)!important}
    .scroll-reveal.reveal-right:not(.is-visible){transform:translate3d(12px,0,0) scale(.998)!important}
    .scroll-reveal.is-visible{transform:none!important;filter:none!important}

    /* Do not stack section-level fades on top of page-level item reveals. */
    .reveal-section.reveal-pending,
    .section-shell-reveal,
    body.page-platform .ws-scroll-section,
    body.page-blocks .ws-scroll-section,
    body.page-organisations .ws-scroll-section{
      opacity:1!important;
      transform:none!important;
      filter:none!important;
      transition:none!important;
    }

    /* Avoid keeping compositor layers alive once a reveal has completed. */
    .scroll-reveal.is-visible,
    .reveal.in{will-change:auto!important}

    @media(max-width:900px){
      .ws-site-header,
      .subnav-wrap.ws-section-subnav{
        backdrop-filter:blur(8px)!important;
        -webkit-backdrop-filter:blur(8px)!important;
      }
      .section{scroll-margin-inline:0}
      .ws-footer-contact a{overflow-wrap:anywhere}
    }

    @media(max-width:700px){
      :where(.section,.booking-section,.cta){max-width:100%;overflow-x:clip}
      :where(.btn,.ws-btn,button,input,select,textarea){max-width:100%}
      .hero-grid,.split,.format-wrap,.org-wrap,.demo-grid,.screen-grid,.contact-wrap,.arch-grid{min-width:0}
    }

    @media(hover:none),(pointer:coarse){
      .visual-card:hover,.dashboard-feature-grid .card:hover,.scale-step:hover,
      .route-card:hover,.example-card:hover,.topic:hover,.ws-btn:hover,.btn:hover{
        transform:none!important;
      }
    }

    @media(prefers-reduced-motion:reduce){
      .scroll-reveal,.reveal,.section-shell-reveal,.ws-scroll-section,.reveal-section{
        opacity:1!important;transform:none!important;filter:none!important;transition:none!important;animation:none!important
      }
    }
  `;
  doc.head.appendChild(style);

  // Existing page scripts may already have assigned stagger values before this shared shell runs.
  // Remove them so content never feels as though it is waiting for the scroll animation.
  doc.querySelectorAll('.scroll-reveal').forEach(el=>el.style.setProperty('--reveal-delay','0ms'));

  // Progressive image hints. Most page images already declare these in HTML; this catches any that do not.
  const viewH=Math.max(window.innerHeight||0,600);
  doc.querySelectorAll('img').forEach(img=>{
    if(!img.hasAttribute('decoding')) img.decoding='async';
    const r=img.getBoundingClientRect();
    const nearTop=r.bottom>0&&r.top<viewH*1.15;
    if(!nearTop&&!img.hasAttribute('loading')) img.loading='lazy';
    if(nearTop&&img.closest('.hero')&&'fetchPriority' in img) img.fetchPriority='high';
  });

  // Park below-the-fold autoplay videos before they can continue buffering large MP4 files.
  // Source quality is untouched: the exact original file is restored shortly before the section enters view.
  const parked=[];
  doc.querySelectorAll('video').forEach(video=>{
    if(video.closest('.carousel-card')) return;
    if(video.closest('.hero')) return;
    if(!video.autoplay) return;
    const src=video.getAttribute('src');
    if(!src) return;
    const r=video.getBoundingClientRect();
    if(r.top<=viewH*1.2) return;

    video.dataset.wsDeferredSrc=src;
    video.dataset.wsWasAutoplay='true';
    video.autoplay=false;
    try{video.pause();}catch(_){ }
    video.removeAttribute('src');
    video.preload='none';
    try{video.load();}catch(_){ }
    parked.push(video);
  });

  const activateVideo=video=>{
    if(video.dataset.wsMediaActivated==='true') return;
    const src=video.dataset.wsDeferredSrc;
    if(!src) return;
    video.dataset.wsMediaActivated='true';
    video.setAttribute('src',src);
    video.preload='metadata';
    if(video.dataset.wsWasAutoplay==='true') video.autoplay=true;
    try{video.load();}catch(_){ }
    if(video.dataset.wsWasAutoplay==='true'&&!reduced){
      const play=()=>video.play().catch(()=>{});
      if(video.readyState>=2) play();
      else video.addEventListener('canplay',play,{once:true});
    }
  };

  if(parked.length){
    if('IntersectionObserver' in window){
      const margin=window.matchMedia?.('(max-width:700px)').matches?'180px 0px':'320px 0px';
      const mediaObserver=new IntersectionObserver((entries,observer)=>{
        entries.forEach(entry=>{
          if(!entry.isIntersecting) return;
          activateVideo(entry.target);
          observer.unobserve(entry.target);
        });
      },{rootMargin:margin,threshold:.01});
      parked.forEach(video=>mediaObserver.observe(video));
    }else{
      parked.forEach(activateVideo);
    }
  }

  // Stop decode/playback work in a background tab and resume only visible autoplay showcases on return.
  doc.addEventListener('visibilitychange',()=>{
    if(doc.hidden){
      doc.querySelectorAll('video').forEach(video=>{if(!video.paused) video.pause();});
      return;
    }
    if(reduced) return;
    doc.querySelectorAll('video').forEach(video=>{
      const shouldAuto=video.autoplay||video.dataset.wsWasAutoplay==='true';
      if(!shouldAuto||!video.getAttribute('src')) return;
      const r=video.getBoundingClientRect();
      if(r.bottom>0&&r.top<window.innerHeight) video.play().catch(()=>{});
    });
  },{passive:true});

  // Script loader. Critical shell and hero interaction start first; the decorative role guide
  // waits for an idle slot so it cannot delay initial interaction or compete with page media.
  const load=src=>new Promise((resolve,reject)=>{
    const s=doc.createElement('script');
    s.src=src;
    s.async=true;
    s.addEventListener('load',()=>resolve(s),{once:true});
    s.addEventListener('error',reject,{once:true});
    doc.head.appendChild(s);
  });

  const basePromise=load('/assets/js/site-shell-base.js').catch(()=>null);
  load('/assets/js/resources-global.js').catch(()=>null);
  const hasHeroOverview=!!doc.querySelector('.hero .hero-visual .hero-media-frame .hero-showcase-video');
  const heroPromise=hasHeroOverview?load('/assets/js/hero-video.js').catch(()=>null):Promise.resolve(null);
  if(doc.getElementById('carouselTrack')) load('/assets/js/carousel-performance.js').catch(()=>null);
  if(doc.getElementById('galleryStage')) load('/assets/js/gallery-performance.js').catch(()=>null);

  heroPromise.finally(()=>{
    if(!doc.querySelector('.ws-hero-float-shell')){
      const marker=doc.createElement('span');
      marker.className='ws-hero-float-shell';
      marker.hidden=true;
      marker.setAttribute('aria-hidden','true');
      doc.body.appendChild(marker);
    }
  });

  const runRoleGuide=async()=>{
    if(location.pathname.toLowerCase().includes('/contact')) return;
    if(!doc.querySelector('main > section')) return;
    await basePromise;
    await heroPromise;
    await load('/assets/js/role-guide-copy.js').catch(()=>null);
    await load('/assets/js/role-guide-v2.js').catch(()=>null);
    await load('/assets/js/role-guide-chrome-guard.js').catch(()=>null);
  };

  const scheduleGuide=()=>{
    if('requestIdleCallback' in window){
      requestIdleCallback(()=>runRoleGuide(),{timeout:1800});
    }else{
      setTimeout(runRoleGuide,900);
    }
  };

  if(doc.readyState==='complete') scheduleGuide();
  else window.addEventListener('load',scheduleGuide,{once:true,passive:true});
})();
