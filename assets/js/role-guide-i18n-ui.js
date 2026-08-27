(()=>{
  const ui=window.WistudiRoleGuideUI;
  if(!ui)return;
  const roleKeys=['teacher','trainer','publisher','organisation'];
  const roleFromImg=img=>{
    const src=(img?.getAttribute('src')||'').toLowerCase();
    return roleKeys.find(r=>src.includes(`guide-${r}`))||'teacher';
  };
  const localize=root=>{
    if(!root)return;
    const activeImg=document.querySelector('.ws-g2-ring img');
    const activeRole=roleFromImg(activeImg);
    const prompt=root.querySelector('.ws-g2-k');if(prompt)prompt.textContent=ui.prompts[activeRole]||prompt.textContent;
    const sw=root.querySelector('.ws-g2-switch');if(sw)sw.textContent=ui.switch;
    const hide=root.querySelector('.ws-g2-hide');if(hide)hide.textContent=ui.hide;
    root.querySelectorAll('.ws-g2-role').forEach(b=>{
      const r=roleFromImg(b.querySelector('img'));
      b.setAttribute('aria-label',`${ui.open} ${ui.roles[r]||r}`);
      b.setAttribute('title',ui.roles[r]||r);
    });
    if(window.WistudiRoleGuideRTL)root.setAttribute('dir','rtl');
  };
  const sync=()=>{
    const btn=document.querySelector('.ws-g2-btn');
    if(btn){const r=roleFromImg(document.querySelector('.ws-g2-ring img'));btn.setAttribute('aria-label',`${ui.open} ${ui.roles[r]||r}`)}
    localize(document.querySelector('.ws-g2-b'));
    localize(document.querySelector('.ws-g2-sheet'));
  };
  // Event delegation only for the guide itself. No MutationObserver and no page-wide DOM changes.
  document.addEventListener('click',e=>{
    if(e.target.closest('.ws-g2-btn,.ws-g2-role'))setTimeout(sync,0);
  },false);
  document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest('.ws-g2-btn,.ws-g2-role'))setTimeout(sync,0)},false);
  setTimeout(sync,120);
})();
