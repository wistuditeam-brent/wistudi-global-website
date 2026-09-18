(()=>{'use strict';
const ready=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
ready(()=>{
  const links=[...document.querySelectorAll('.doc-scroll-nav a')];
  const targets=links.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const setActive=id=>links.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+id));
  if(targets.length&&'IntersectionObserver'in window){
    const observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);
      if(visible[0])setActive(visible[0].target.id);
    },{rootMargin:'-18% 0px -68% 0px',threshold:[0,.1,.5]});
    targets.forEach(t=>observer.observe(t));setActive(targets[0].id);
  }
});
})();