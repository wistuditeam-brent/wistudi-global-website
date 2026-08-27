(()=>{
  if(location.pathname.toLowerCase().includes('/contact'))return;
  const place=()=>{
    const guide=document.querySelector('.ws-g');
    const main=document.querySelector('main');
    if(!guide||!main)return setTimeout(place,60);
    const sections=[...main.querySelectorAll(':scope > section')].filter(s=>s.getBoundingClientRect().height>=250&&!s.matches('[hidden],.ws-no-role-guide'));
    if(!sections.length)return;

    // Only correct the initial position when the guide is outside the visible viewport.
    // After this, role-guide.js owns all section-to-section movement.
    const gr=guide.getBoundingClientRect();
    if(gr.top<innerHeight-8&&gr.bottom>8&&gr.left<innerWidth-8&&gr.right>8)return;

    const line=innerHeight*.56;
    let section=sections.find(s=>{const r=s.getBoundingClientRect();return r.top<=line&&r.bottom>=line;});
    if(!section)section=sections.find(s=>{const r=s.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight;})||sections[0];

    const sr=section.getBoundingClientRect();
    const z=guide.classList.contains('min')?(matchMedia('(max-width:760px)').matches?34:40):(matchMedia('(max-width:760px)').matches?58:76);
    const mobile=matchMedia('(max-width:760px)').matches;
    const container=section.querySelector('.container,.ws-container,.capabilities-inner');
    let right=sr.right+scrollX-(mobile?14:26);
    if(container){const cr=container.getBoundingClientRect();right=Math.min(right,cr.right+scrollX+24);}
    let x=Math.max(10,right-z);
    const sectionBottom=sr.bottom+scrollY-z-(mobile?18:26);
    const viewportBottom=scrollY+innerHeight-z-(mobile?18:28);
    const sectionTop=sr.top+scrollY+Math.min(110,Math.max(34,sr.height*.12));
    let y=Math.max(sectionTop,Math.min(sectionBottom,viewportBottom));

    const floater=document.querySelector('.ws-hero-float-shell.is-visible');
    if(floater){
      const fr=floater.getBoundingClientRect(),vx=x-scrollX,vy=y-scrollY;
      const hit=!(vx+z+18<fr.left||vx-18>fr.right||vy+z+18<fr.top||vy-18>fr.bottom);
      if(hit){const left=fr.left+scrollX-z-22;if(left>12)x=left;else y=Math.max(sectionTop,fr.top+scrollY-z-20);}
    }

    guide.style.transition='none';
    guide.style.transform=`translate3d(${Math.round(x)}px,${Math.round(y)}px,0)`;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{guide.style.transition='';}));
  };
  setTimeout(place,80);
})();
