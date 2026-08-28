(()=>{
  'use strict';
  const track=document.getElementById('carouselTrack');
  const shell=track?.closest('.carousel-shell');
  if(!track||!shell) return;

  let nearby=false;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const park=video=>{
    if(video.dataset.wsCarouselActivated==='true'||video.dataset.wsCarouselSrc) return;
    const src=video.getAttribute('src');
    if(!src) return;
    video.dataset.wsCarouselSrc=src;
    video.preload='none';
    try{video.pause();}catch(_){ }
    video.removeAttribute('src');
    try{video.load();}catch(_){ }
  };

  const restore=video=>{
    if(!video||video.dataset.wsCarouselActivated==='true') return;
    const src=video.dataset.wsCarouselSrc;
    if(!src) return;
    video.dataset.wsCarouselActivated='true';
    video.setAttribute('src',src);
    video.preload='metadata';
    try{video.load();}catch(_){ }
    if(nearby&&!reduced){
      const play=()=>video.play().catch(()=>{});
      if(video.readyState>=2) play();
      else video.addEventListener('canplay',play,{once:true});
    }
  };

  const prepare=()=>{
    track.querySelectorAll('.carousel-card video').forEach(video=>{
      const active=video.closest('.carousel-card')?.classList.contains('active');
      if(active&&nearby) restore(video);
      else park(video);
    });
  };

  const restoreActive=()=>restore(track.querySelector('.carousel-card.active video'));
  const pauseAll=()=>track.querySelectorAll('video').forEach(video=>{try{video.pause();}catch(_){ }});

  // The page exposes this controller specifically for coordinating carousel autoplay.
  window.carouselAutoController?.pause();
  prepare();

  const mutations=new MutationObserver(records=>{
    let cardsChanged=false;
    let activeChanged=false;
    records.forEach(record=>{
      if(record.type==='childList') cardsChanged=true;
      if(record.type==='attributes'&&record.attributeName==='class') activeChanged=true;
    });
    if(cardsChanged) prepare();
    if(nearby&&activeChanged) restoreActive();
  });
  mutations.observe(track,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});

  const setNearby=value=>{
    if(value===nearby) return;
    nearby=value;
    if(nearby){
      prepare();
      restoreActive();
      if(!reduced) window.carouselAutoController?.resume();
    }else{
      window.carouselAutoController?.pause();
      pauseAll();
    }
  };

  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>setNearby(entry.isIntersecting));
    },{rootMargin:'160px 0px',threshold:.01});
    observer.observe(shell);
  }else{
    setNearby(true);
  }

  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){window.carouselAutoController?.pause();pauseAll();}
    else if(nearby&&!reduced){restoreActive();window.carouselAutoController?.resume();}
  },{passive:true});
})();
