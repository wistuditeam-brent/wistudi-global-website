// Home hero: click-to-play overview video with smooth return to the existing showcase.
(() => {
  const VIDEO_URL='/assets/media/HERO%20VIDEO.mp4';
  const COPY={
    en:'Click to watch demo',
    vi:'Nhấp để xem bản demo',
    'zh-cn':'点击观看演示',
    th:'คลิกเพื่อชมเดโม',
    id:'Klik untuk menonton demo',
    ms:'Klik untuk menonton demo',
    ar:'انقر لمشاهدة العرض'
  };

  const init=()=>{
    const hero=document.querySelector('.hero');
    const heroVisual=hero?.querySelector('.hero-visual');
    const frame=heroVisual?.querySelector('.hero-media-frame');
    const preview=frame?.querySelector('.hero-showcase-video');
    if(!hero||!heroVisual||!frame||!preview||heroVisual.dataset.heroOverviewReady==='true')return;
    heroVisual.dataset.heroOverviewReady='true';

    const first=(location.pathname.split('/').filter(Boolean)[0]||'').toLowerCase();
    const label=COPY[first]||COPY.en;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if(!document.getElementById('ws-hero-overview-style')){
      const style=document.createElement('style');
      style.id='ws-hero-overview-style';
      style.textContent=`
        .hero-visual.ws-hero-overview{transform:translateY(-16px);transition:transform .35s ease}
        .hero-media-frame.ws-hero-overview-frame{isolation:isolate;transition:box-shadow .38s ease,border-color .38s ease,transform .38s ease}
        .hero-media-frame.ws-hero-overview-frame .hero-showcase-video{position:relative;z-index:1;transition:opacity .42s ease,transform .52s cubic-bezier(.2,.75,.2,1),filter .42s ease}
        .ws-hero-main-video{position:absolute;z-index:3;inset:8px;width:calc(100% - 16px);height:calc(100% - 16px);object-fit:contain;background:#090712;border-radius:22px;opacity:0;visibility:hidden;transform:scale(.992);transition:opacity .42s ease,transform .52s cubic-bezier(.2,.75,.2,1),visibility 0s linear .42s}
        .ws-hero-video-loader{position:absolute;z-index:4;inset:8px;display:grid;place-items:center;border-radius:22px;background:rgba(14,10,27,.42);backdrop-filter:blur(4px);opacity:0;visibility:hidden;transition:opacity .22s ease,visibility 0s linear .22s;pointer-events:none}
        .ws-hero-video-loader::after{content:'';width:30px;height:30px;border-radius:50%;border:3px solid rgba(255,255,255,.28);border-top-color:#fff;animation:wsHeroSpin .8s linear infinite}
        .ws-hero-overview-frame.is-loading .ws-hero-video-loader{opacity:1;visibility:visible;transition-delay:0s}
        .ws-hero-overview-frame.is-playing{border-color:rgba(124,58,237,.34);box-shadow:0 28px 80px rgba(92,47,165,.20),0 10px 28px rgba(249,115,22,.08)}
        .ws-hero-overview-frame.is-playing .hero-showcase-video{opacity:0;transform:scale(.992);filter:saturate(.9)}
        .ws-hero-overview-frame.is-playing .ws-hero-main-video{opacity:1;visibility:visible;transform:scale(1);transition-delay:0s}
        .ws-hero-overview-frame.is-playing .ws-hero-video-loader{opacity:0;visibility:hidden}
        .ws-hero-watch{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;margin:15px auto 0;min-height:98px;text-align:center;transition:opacity .28s ease,transform .32s ease;position:relative;z-index:6}
        .ws-hero-watch.is-hidden{opacity:0;transform:translateY(-5px);pointer-events:none}
        .ws-hero-watch-label{font-size:.82rem;font-weight:800;color:#6d28d9;letter-spacing:-.01em}
        .ws-hero-watch-arrow{width:24px;height:24px;color:#7c3aed;animation:wsHeroArrow 1.8s ease-in-out infinite}
        .ws-hero-watch-button{position:relative;width:62px;height:62px;border:1px solid rgba(124,58,237,.26);border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.96);color:#7c3aed;cursor:pointer;box-shadow:0 10px 30px rgba(124,58,237,.24),0 0 0 0 rgba(124,58,237,.30);transition:transform .2s ease,box-shadow .2s ease,background .2s ease;animation:wsHeroPulse 2.2s ease-in-out infinite}
        .ws-hero-watch-button::before{content:'';position:absolute;inset:-8px;border-radius:50%;background:radial-gradient(circle,rgba(124,58,237,.17),rgba(124,58,237,0) 68%);z-index:-1;opacity:.85}
        .ws-hero-watch-button:hover{transform:translateY(-2px) scale(1.045);background:#fff;box-shadow:0 14px 38px rgba(124,58,237,.34),0 0 0 9px rgba(124,58,237,.08)}
        .ws-hero-watch-button:focus-visible{outline:3px solid rgba(124,58,237,.30);outline-offset:5px}
        .ws-hero-watch-button svg{width:25px;height:25px;fill:currentColor;margin-left:3px}
        .ws-hero-watch-button[aria-busy='true']{animation:none;cursor:progress;opacity:.82}
        @keyframes wsHeroPulse{0%,100%{box-shadow:0 10px 30px rgba(124,58,237,.22),0 0 0 0 rgba(124,58,237,.27)}50%{box-shadow:0 14px 36px rgba(124,58,237,.34),0 0 0 10px rgba(124,58,237,0)}}
        @keyframes wsHeroArrow{0%,100%{transform:translateY(0)}50%{transform:translateY(4px)}}
        @keyframes wsHeroSpin{to{transform:rotate(360deg)}}
        @media(max-width:980px){.hero-visual.ws-hero-overview{transform:none}.ws-hero-watch{margin-top:14px;min-height:94px}}
        @media(max-width:700px){.ws-hero-main-video,.ws-hero-video-loader{inset:6px;width:calc(100% - 12px);height:calc(100% - 12px);border-radius:16px}.ws-hero-watch{min-height:88px;margin-top:10px}.ws-hero-watch-button{width:58px;height:58px}.ws-hero-watch-label{font-size:.78rem}}
        @media(prefers-reduced-motion:reduce){.hero-visual.ws-hero-overview,.hero-media-frame.ws-hero-overview-frame,.hero-media-frame.ws-hero-overview-frame .hero-showcase-video,.ws-hero-main-video,.ws-hero-watch,.ws-hero-watch-arrow,.ws-hero-watch-button{animation:none!important;transition-duration:.01ms!important}}
      `;
      document.head.appendChild(style);
    }

    heroVisual.classList.add('ws-hero-overview');
    frame.classList.add('ws-hero-overview-frame');

    const mainVideo=document.createElement('video');
    mainVideo.className='ws-hero-main-video';
    mainVideo.controls=true;
    mainVideo.playsInline=true;
    mainVideo.preload='none';
    mainVideo.defaultMuted=false;
    mainVideo.muted=false;
    mainVideo.volume=1;
    mainVideo.setAttribute('aria-label','Wistudi platform overview video');
    mainVideo.dataset.src=VIDEO_URL;

    const loader=document.createElement('div');
    loader.className='ws-hero-video-loader';
    loader.setAttribute('aria-hidden','true');

    const watch=document.createElement('div');
    watch.className='ws-hero-watch';
    watch.innerHTML=`<span class="ws-hero-watch-label">${label}</span><svg class="ws-hero-watch-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 9l5 5 5-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 14l5 5 5-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity=".58"/></svg><button class="ws-hero-watch-button" type="button" aria-label="${label}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.3 5.8c0-1.05 1.15-1.7 2.05-1.15l9.15 5.55c.86.52.86 1.77 0 2.29l-9.15 5.56c-.9.54-2.05-.1-2.05-1.16V5.8Z"/></svg></button>`;

    frame.append(mainVideo,loader);
    frame.insertAdjacentElement('afterend',watch);
    const button=watch.querySelector('.ws-hero-watch-button');

    let returning=false;
    const clearMainSource=()=>{
      try{mainVideo.pause();mainVideo.removeAttribute('src');mainVideo.load();}catch(_){ }
      button.removeAttribute('aria-busy');
    };

    const restorePreview=()=>{
      if(returning)return;
      returning=true;
      preview.muted=true;
      preview.play().catch(()=>{});
      frame.classList.remove('is-loading');
      frame.classList.remove('is-playing');
      watch.classList.remove('is-hidden');
      window.setTimeout(()=>{clearMainSource();returning=false;},reduced?20:520);
    };

    const startOverview=()=>{
      if(frame.classList.contains('is-playing')||frame.classList.contains('is-loading'))return;
      returning=false;
      button.setAttribute('aria-busy','true');
      frame.classList.add('is-loading');
      if(!mainVideo.src){mainVideo.src=mainVideo.dataset.src;mainVideo.load();}
      mainVideo.currentTime=0;
      mainVideo.defaultMuted=false;
      mainVideo.muted=false;
      mainVideo.volume=1;
      const playPromise=mainVideo.play();
      if(playPromise?.catch)playPromise.catch(()=>{
        // If a browser delays audible playback, keep the controls visible and allow a second user click.
        frame.classList.add('is-playing');
        frame.classList.remove('is-loading');
        watch.classList.add('is-hidden');
      });
    };

    mainVideo.addEventListener('playing',()=>{
      preview.pause();
      frame.classList.remove('is-loading');
      frame.classList.add('is-playing');
      watch.classList.add('is-hidden');
      button.removeAttribute('aria-busy');
    });
    mainVideo.addEventListener('ended',restorePreview);
    mainVideo.addEventListener('error',restorePreview);
    button.addEventListener('click',startOverview);
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&frame.classList.contains('is-playing'))restorePreview();});
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();