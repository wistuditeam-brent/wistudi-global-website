(()=>{
  const guide=document.querySelector('.ws-g2');
  if(!guide)return;

  let allowUntil=0;
  const allow=()=>{allowUntil=Date.now()+900};
  const permitted=()=>Date.now()<=allowUntil;
  const closeUnauthorized=()=>{
    if(permitted())return;
    guide.classList.remove('open');
    document.body.classList.remove('ws-g2-mo');
  };

  document.addEventListener('pointerdown',e=>{
    if(e.target.closest('.ws-g2-btn'))allow();
  },true);
  document.addEventListener('click',e=>{
    if(e.target.closest('.ws-g2-btn'))allow();
  },true);
  document.addEventListener('keydown',e=>{
    if((e.key==='Enter'||e.key===' ')&&e.target.closest('.ws-g2-btn'))allow();
  },true);

  closeUnauthorized();

  new MutationObserver(closeUnauthorized).observe(guide,{attributes:true,attributeFilter:['class']});
  new MutationObserver(closeUnauthorized).observe(document.body,{attributes:true,attributeFilter:['class']});
})();
