(()=>{
  'use strict';

  const doc=document;

  // Load first-party analytics/event instrumentation before page-specific shell delegation.
  // This keeps conversion tracking active on both the main website and Resources pages.
  if(!doc.querySelector('script[data-ws-analytics-events]')){
    const analytics=doc.createElement('script');
    analytics.src='/assets/js/analytics-events.js';
    analytics.async=true;
    analytics.dataset.wsAnalyticsEvents='true';
    doc.head.appendChild(analytics);
  }

  // Keep the footer structure and social destinations consistent across the full site,
  // including Resources pages which use their own page runtime below.
  if(!doc.querySelector('script[data-ws-footer-unify]')){
    const footerUnify=doc.createElement('script');
    footerUnify.src='/assets/js/footer-unify.js';
    footerUnify.async=false;
    footerUnify.dataset.wsFooterUnify='true';
    doc.head.appendChild(footerUnify);
  }

  // Keep Partners & LTI visible in the shared site header across preview pages.
  // Individual page HTML can still provide the link itself; this only fills it in when missing.
  const ensurePartnersNav=()=>{
    const href='/technology-partners/';
    const label='Partners & LTI';
    const isPartners=location.pathname.toLowerCase().includes('/technology-partners');

    const insertLink=(nav,selector)=>{
      if(!nav||nav.querySelector('a[href*="technology-partners"]')) return;
      const link=doc.createElement('a');
      link.href=href;
      link.textContent=label;
      if(isPartners) link.classList.add('active');
      const contact=nav.querySelector(selector);
      if(contact) nav.insertBefore(link,contact);
      else nav.appendChild(link);
    };

    insertLink(doc.querySelector('.ws-nav-links'),'a[href*="contact"]');
    insertLink(doc.querySelector('.ws-mobile-inner'),'a[href*="contact"]');
  };
  ensurePartnersNav();

  // Platform publishing ownership spotlight.
  // Replaces the older Activity → Lesson → Course scale block, which repeated the later
  // audience/organisation scaling story, with the stronger Wistudi publisher proposition.
  const upgradePlatformPublishing=()=>{
    if(!doc.body?.classList.contains('page-platform')) return;
    const heading=[...doc.querySelectorAll('main .section h2')]
      .find(el=>el.textContent.trim()==='Start with one activity. Build an entire learning catalogue.');
    const section=heading?.closest('section');
    if(!section) return;

    if(!doc.getElementById('ws-publisher-spotlight-style')){
      const publisherStyle=doc.createElement('style');
      publisherStyle.id='ws-publisher-spotlight-style';
      publisherStyle.textContent=`
        .publisher-spotlight{position:relative;overflow:hidden;background:linear-gradient(180deg,#fff 0%,#faf7ff 100%)}
        .publisher-spotlight::before{content:"";position:absolute;width:620px;height:620px;border-radius:50%;left:-360px;top:-250px;background:radial-gradient(circle,rgba(124,58,237,.10),transparent 68%);pointer-events:none}
        .publisher-panel{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,.90fr) minmax(0,1.10fr);gap:54px;align-items:center;padding:clamp(34px,5vw,62px);border-radius:36px;color:#fff;background:radial-gradient(circle at 93% 9%,rgba(249,115,22,.25),transparent 27%),radial-gradient(circle at 6% 92%,rgba(139,92,246,.30),transparent 30%),linear-gradient(135deg,#171025 0%,#2e1550 48%,#512078 100%);box-shadow:0 32px 78px rgba(58,32,96,.20);overflow:hidden}
        .publisher-panel::after{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:38px 38px;mask-image:linear-gradient(to bottom,#000,transparent 92%);pointer-events:none}
        .publisher-copy,.publisher-visual{position:relative;z-index:1;min-width:0}
        .publisher-copy .eyebrow{color:#ffbe8b}.publisher-copy .eyebrow::before{background:#f97316}
        .publisher-copy h2{color:#fff;max-width:620px}.publisher-copy .lead{color:#d8d0e1;max-width:640px}
        .publisher-benefits{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-top:28px}
        .publisher-benefit{padding:15px 16px;border:1px solid rgba(255,255,255,.10);border-radius:15px;background:rgba(255,255,255,.055);backdrop-filter:blur(8px)}
        .publisher-benefit strong{display:block;color:#fff;font-size:.82rem;margin-bottom:4px}.publisher-benefit span{display:block;color:#bfb6ca;font-size:.72rem;line-height:1.5}
        .publisher-signature{margin-top:24px;padding-left:16px;border-left:3px solid #f97316;font:750 1.04rem/1.45 'Be Vietnam Pro',Inter,sans-serif;color:#fff}
        .publisher-visual{padding:25px;border:1px solid rgba(255,255,255,.11);border-radius:28px;background:rgba(8,7,16,.25);box-shadow:inset 0 1px 0 rgba(255,255,255,.04)}
        .publisher-kicker{text-align:center;font-size:.62rem;font-weight:850;letter-spacing:.12em;text-transform:uppercase;color:#a9a0b5;margin-bottom:9px}
        .publisher-origin{padding:14px 16px;border:1px solid rgba(255,255,255,.11);border-radius:15px;background:rgba(255,255,255,.06);text-align:center;font:750 .78rem/1.4 'Be Vietnam Pro',Inter,sans-serif;color:#fff}
        .publisher-arrow{text-align:center;padding:10px 0;font-size:.64rem;font-weight:850;letter-spacing:.06em;color:#b69aee}
        .publisher-core{padding:15px 17px;border-radius:16px;text-align:center;background:linear-gradient(135deg,#6d28d9,#8b5cf6);box-shadow:0 12px 28px rgba(79,37,157,.30)}
        .publisher-core b{display:block;font:800 .9rem 'Be Vietnam Pro',Inter,sans-serif;color:#fff}.publisher-core span{display:block;margin-top:3px;font-size:.64rem;color:#e7ddff}
        .publisher-output-grid{display:flex;gap:10px;flex-wrap:wrap}
        .publisher-output{flex:1 1 210px;min-height:108px;padding:15px;border-radius:16px;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.055)}
        .publisher-output.interactive{border-color:rgba(169,130,255,.34);background:rgba(124,58,237,.13)}
        .publisher-output.printable{border-color:rgba(255,163,84,.34);background:rgba(249,115,22,.11)}
        .publisher-output b{display:block;font-size:.76rem;color:#fff;margin-bottom:5px}.publisher-output span{font-size:.65rem;line-height:1.5;color:#bdb4c7}
        .publisher-commerce{margin-top:11px;padding:14px 16px;border:1px solid rgba(255,181,117,.35);border-radius:16px;text-align:center;background:linear-gradient(90deg,rgba(249,115,22,.18),rgba(124,58,237,.19))}
        .publisher-commerce b{display:block;font:800 .82rem 'Be Vietnam Pro',Inter,sans-serif;letter-spacing:.02em;color:#fff}.publisher-commerce span{display:block;margin-top:3px;font-size:.64rem;color:#d4cbdc}
        .publisher-owner-note{text-align:center;margin-top:10px;font-size:.62rem;font-weight:700;color:#9f96aa}
        @media(max-width:980px){.publisher-panel{grid-template-columns:1fr;gap:38px}.publisher-copy{max-width:760px}.publisher-benefits{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:620px){.publisher-panel{padding:26px 20px;border-radius:27px}.publisher-benefits{grid-template-columns:1fr}.publisher-visual{padding:18px;border-radius:22px}.publisher-output{flex-basis:100%}}
        @media(prefers-reduced-motion:reduce){.publisher-panel *{animation:none!important;transition:none!important}}
      `;
      doc.head.appendChild(publisherStyle);
    }

    section.id='publishing-power';
    section.className='section publisher-spotlight';
    section.innerHTML=`
      <div class="container">
        <div class="publisher-panel">
          <div class="publisher-copy">
            <span class="eyebrow">Create. Publish. Own.</span>
            <h2>Be the publisher, not just the creator.</h2>
            <p class="lead">Wistudi gives educators, publishers and organisations the tools to turn what they create into complete learning products, not just individual activities or lessons. Build a curriculum, interactive story, course or resource collection, then deliver it in the formats your audience needs.</p>
            <div class="publisher-benefits" aria-label="Wistudi publishing capabilities">
              <div class="publisher-benefit"><strong>Interactive</strong><span>Publish complete digital learning experiences through Flows, XP Video and connected activities.</span></div>
              <div class="publisher-benefit"><strong>Printable</strong><span>Create worksheets, handouts and offline resources that complement the interactive experience.</span></div>
              <div class="publisher-benefit"><strong>Together</strong><span>Offer the interactive experience and its printable counterpart as one connected learning product.</span></div>
              <div class="publisher-benefit"><strong>Publish & sell</strong><span>Package learning for your own audience and build commercially viable products from the same publishing environment.</span></div>
            </div>
            <div class="publisher-signature">One creation. Multiple formats. Your learning product.</div>
          </div>
          <div class="publisher-visual" aria-label="Create once, publish interactive and printable learning products">
            <div class="publisher-kicker">One creation</div>
            <div class="publisher-origin">Curriculum · Course · Interactive Story · Resource Collection</div>
            <div class="publisher-arrow">↓ BUILD & PACKAGE IN WISTUDI ↓</div>
            <div class="publisher-core"><b>WISTUDI</b><span>Author · build · connect · package</span></div>
            <div class="publisher-arrow">↓ PUBLISH IN MULTIPLE FORMATS ↓</div>
            <div class="publisher-output-grid">
              <div class="publisher-output interactive"><b>Interactive experience</b><span>Flow · XP Video · activities · digital learning journey</span></div>
              <div class="publisher-output printable"><b>Printable resources</b><span>Worksheets · handouts · companion materials · offline learning</span></div>
            </div>
            <div class="publisher-commerce"><b>PUBLISH · SELL · DELIVER</b><span>Build a commercially viable learning product around what you create.</span></div>
            <div class="publisher-owner-note">Your content · your audience · your publishing model</div>
          </div>
        </div>
      </div>
    `;
  };
  upgradePlatformPublishing();

  // Resources has its own isolated runtime for image fallbacks, archive behavior and
  // resource navigation state. Delegate immediately so the general website shell cannot
  // bypass those protections or attach duplicate UI handlers.
  if(doc.body?.classList.contains('page-resources')){
    const resourceShell=doc.createElement('script');
    resourceShell.src='/assets/js/resources-page-shell.js';
    resourceShell.async=false;
    doc.head.appendChild(resourceShell);
    return;
  }

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
  if(doc.body?.classList.contains('page-platform')&&doc.getElementById('printable')){
    load('/assets/js/interactive-printable-slider.js')
      .then(()=>load('/assets/js/interactive-printable-slider-fixes.js'))
      .catch(()=>null);
  }
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
