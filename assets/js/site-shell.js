(()=>{
  // Fail-open rendering: core page content must never depend on animation JS to be readable.
  // The existing reveal classes may still animate, but they can no longer leave large sections blank.
  if(!document.getElementById('ws-fail-open-rendering')){
    const style=document.createElement('style');
    style.id='ws-fail-open-rendering';
    style.textContent=`
      body.page-platform .scroll-reveal,
      body.page-platform .reveal-section,
      body.page-platform .reveal-pending,
      body.page-platform .ws-scroll-section,
      body.page-blocks .reveal,
      body.page-blocks .ws-scroll-section,
      body.page-organisations .reveal,
      body.page-organisations .section-shell-reveal,
      body.page-organisations .ws-scroll-section{
        opacity:1!important;
        visibility:visible!important;
        transform:none!important;
        filter:none!important;
      }
    `;
    document.head.appendChild(style);
  }

  // Reduce cold-preview load pressure immediately: off-screen autoplay videos are paused
  // until the existing intersection logic decides they should play.
  document.querySelectorAll('video[autoplay]').forEach(video=>{
    try{
      const r=video.getBoundingClientRect();
      if(r.top>window.innerHeight*1.15){
        video.pause();
        if(video.preload==='auto') video.preload='metadata';
      }
    }catch(_){ }
  });

  const load=(src,onload)=>{
    const s=document.createElement('script');
    s.src=src;
    s.async=false;
    if(onload)s.addEventListener('load',onload,{once:true});
    document.head.appendChild(s);
  };
  load('/assets/js/site-shell-base.js',()=>{
    load('/assets/js/hero-video.js',()=>{
      if(!document.querySelector('.ws-hero-float-shell')){
        const marker=document.createElement('span');
        marker.className='ws-hero-float-shell';
        marker.hidden=true;
        marker.setAttribute('aria-hidden','true');
        document.body.appendChild(marker);
      }
      load('/assets/js/role-guide-copy.js',()=>{
        load('/assets/js/role-guide-i18n.js',()=>{
          load('/assets/js/role-guide-v2.js',()=>{
            load('/assets/js/role-guide-click-only.js');
            load('/assets/js/role-guide-i18n-ui.js');
            load('/assets/js/role-guide-chrome-guard.js');
            load('/assets/js/role-guide-bubble-guard.js');
          });
        });
      });
    });
  });
})();
