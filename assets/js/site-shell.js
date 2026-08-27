(()=>{
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
            load('/assets/js/role-guide-i18n-ui.js');
            load('/assets/js/role-guide-chrome-guard.js');
            load('/assets/js/role-guide-bubble-guard.js');
          });
        });
      });
    });
  });
})();
