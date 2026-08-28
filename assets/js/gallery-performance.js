(()=>{
  'use strict';
  const stage=document.getElementById('galleryStage');
  const main=document.getElementById('galleryMain');
  const thumbs=document.getElementById('galleryThumbs');
  if(!stage||!main||!thumbs) return;

  let nearby=false;
  let activated=false;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const savedBg=stage.style.getPropertyValue('--gallery-bg');

  const stop=()=>{try{window.stopAuto?.();}catch(_){ }};
  const start=()=>{if(reduced) return;try{window.startAuto?.();}catch(_){ }};

  stop();

  const parkImage=img=>{
    if(!img) return;
    if(!img.hasAttribute('decoding')) img.decoding='async';
    img.loading='lazy';
    const src=img.getAttribute('src');
    if(!src||img.dataset.wsGallerySrc) return;
    img.dataset.wsGallerySrc=src;
    img.removeAttribute('src');
  };

  const restoreImage=img=>{
    if(!img) return;
    const src=img.dataset.wsGallerySrc;
    if(src&&!img.getAttribute('src')) img.setAttribute('src',src);
  };

  const farBelow=stage.getBoundingClientRect().top>Math.max(window.innerHeight||0,600)*1.15;
  if(farBelow){
    parkImage(main);
    thumbs.querySelectorAll('img').forEach(parkImage);
    if(savedBg) stage.style.setProperty('--gallery-bg','none');
  }else{
    main.decoding='async';
    thumbs.querySelectorAll('img').forEach(img=>{img.loading='lazy';img.decoding='async';});
  }

  const activate=()=>{
    if(!activated){
      activated=true;
      restoreImage(main);
      thumbs.querySelectorAll('img').forEach(restoreImage);
      if(savedBg) stage.style.setProperty('--gallery-bg',savedBg);
    }
    start();
  };

  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        nearby=entry.isIntersecting;
        if(nearby) activate();
        else stop();
      });
    },{rootMargin:'180px 0px',threshold:.01});
    observer.observe(stage);
  }else{
    nearby=true;
    activate();
  }

  const observer=new MutationObserver(()=>{
    thumbs.querySelectorAll('img').forEach(img=>{
      img.loading='lazy';
      img.decoding='async';
      if(!activated) parkImage(img);
    });
  });
  observer.observe(thumbs,{childList:true,subtree:true});

  document.addEventListener('visibilitychange',()=>{
    if(document.hidden) stop();
    else if(nearby) start();
  },{passive:true});
})();
