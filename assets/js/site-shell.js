(()=>{
  const load=(src,onload)=>{
    const s=document.createElement('script');
    s.src=src;
    s.async=false;
    if(onload)s.addEventListener('load',onload,{once:true});
    document.head.appendChild(s);
  };
  load('/assets/js/site-shell-base.js',()=>{
    load('/assets/js/hero-video.js');
    load('/assets/js/role-guide.js');
  });
})();
