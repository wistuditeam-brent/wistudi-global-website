(()=>{
  const load=(src,onload)=>{
    const s=document.createElement('script');
    s.src=src;
    s.async=false;
    if(onload)s.addEventListener('load',onload,{once:true});
    document.head.appendChild(s);
  };
  // Resources pages only need the shared navigation shell plus the Resources UI.
  // Deliberately skip homepage video and role-guide/avatar modules here.
  load('/assets/js/resources-site.js');
  load('/assets/js/site-shell-base.js');
})();
