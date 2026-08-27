(()=>{
  const ui=window.WistudiRoleGuideUI;
  if(!ui)return;
  const roleKeys=['teacher','trainer','publisher','organisation'];
  const roleFromImg=img=>{
    const src=(img?.getAttribute('src')||'').toLowerCase();
    return roleKeys.find(r=>src.includes(`guide-${r}`))||'teacher';
  };
  const patch=()=>{
    const btn=document.querySelector('.ws-g2-btn');
    const activeRole=roleFromImg(document.querySelector('.ws-g2-ring img'));
    if(btn)btn.setAttribute('aria-label',`${ui.open} ${ui.roles[activeRole]||activeRole}`);
    [document.querySelector('.ws-g2-b'),document.querySelector('.ws-g2-sheet')].forEach(root=>{
      if(!root)return;
      const prompt=root.querySelector('.ws-g2-k');if(prompt)prompt.textContent=ui.prompts[activeRole]||prompt.textContent;
      const sw=root.querySelector('.ws-g2-switch');if(sw)sw.textContent=ui.switch;
      const hide=root.querySelector('.ws-g2-hide');if(hide)hide.textContent=ui.hide;
      root.querySelectorAll('.ws-g2-role').forEach(b=>{
        const r=roleFromImg(b.querySelector('img'));
        b.setAttribute('aria-label',`${ui.open} ${ui.roles[r]||r}`);
        b.setAttribute('title',ui.roles[r]||r);
      });
      if(window.WistudiRoleGuideRTL)root.setAttribute('dir','rtl');else root.removeAttribute('dir');
    });
  };
  const schedule=()=>setTimeout(patch,0);
  document.addEventListener('click',e=>{if(e.target.closest('.ws-g2-btn,.ws-g2-role'))schedule();},true);
  document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest('.ws-g2-btn,.ws-g2-role'))schedule();},true);
  setTimeout(patch,100);
  setTimeout(patch,900);
  setTimeout(patch,1600);
})();