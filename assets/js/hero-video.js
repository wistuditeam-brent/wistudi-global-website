// Home hero: click-to-play overview video with draggable floating mini-player.
(() => {
  const VIDEO_URL='/assets/media/HERO%20VIDEO.mp4';
  const COPY={en:'Click to watch demo',vi:'Nhấp để xem bản demo','zh-cn':'点击观看演示',th:'คลิกเพื่อชมเดโม',id:'Klik untuk menonton demo',ms:'Klik untuk menonton demo',ar:'انقر لمشاهدة العرض'};
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
        .ws-hero-watch-button svg{width:25px;height:25px;fill:currentColor;margin-left:3px}
        .ws-hero-float-shell{position:fixed;z-index:12000;width:min(410px,34vw);aspect-ratio:16/9;right:24px;bottom:24px;border-radius:20px;background:#090712;box-shadow:0 24px 70px rgba(22,14,39,.35),0 8px 24px rgba(124,58,237,.18);overflow:visible;opacity:0;transform:translateY(18px) scale(.96);pointer-events:none;transition:opacity .28s ease,transform .32s cubic-bezier(.2,.75,.2,1)}
        .ws-hero-float-shell.is-visible{opacity:1;transform:none;pointer-events:auto}
        .ws-hero-float-shell .ws-hero-main-video{position:absolute;inset:0;width:100%;height:100%;border-radius:20px;opacity:1;visibility:visible;transform:none;object-fit:contain;background:#090712}
        .ws-hero-float-bar{position:absolute;z-index:5;left:10px;right:10px;top:-32px;height:30px;border-radius:11px 11px 0 0;background:rgba(24,18,39,.92);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;cursor:grab;user-select:none;touch-action:none;box-shadow:0 -3px 14px rgba(0,0,0,.12)}
        .ws-hero-float-bar:active{cursor:grabbing}.ws-hero-float-handle{width:46px;height:4px;border-radius:99px;background:rgba(255,255,255,.65)}
        .ws-hero-float-close{position:absolute;z-index:6;top:-28px;right:14px;width:24px;height:24px;border:0;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;font-size:17px;line-height:1;cursor:pointer}
        .ws-hero-float-shell.is-ending{opacity:0;transform:scale(.92)}
        @keyframes wsHeroPulse{0%,100%{box-shadow:0 10px 30px rgba(124,58,237,.22),0 0 0 0 rgba(124,58,237,.27)}50%{box-shadow:0 14px 36px rgba(124,58,237,.34),0 0 0 10px rgba(124,58,237,0)}}
        @keyframes wsHeroArrow{0%,100%{transform:translateY(0)}50%{transform:translateY(4px)}}
        @keyframes wsHeroSpin{to{transform:rotate(360deg)}}
        @media(max-width:980px){.hero-visual.ws-hero-overview{transform:none}.ws-hero-watch{margin-top:14px;min-height:94px}.ws-hero-float-shell{width:min(380px,46vw)}}
        @media(max-width:700px){.ws-hero-main-video,.ws-hero-video-loader{inset:6px;width:calc(100% - 12px);height:calc(100% - 12px);border-radius:16px}.ws-hero-watch{min-height:88px;margin-top:10px}.ws-hero-watch-button{width:58px;height:58px}.ws-hero-watch-label{font-size:.78rem}.ws-hero-float-shell{width:min(calc(100vw - 28px),420px);right:14px;bottom:18px;border-radius:16px}.ws-hero-float-shell .ws-hero-main-video{border-radius:16px}}
        @media(prefers-reduced-motion:reduce){.hero-visual.ws-hero-overview,.hero-media-frame.ws-hero-overview-frame,.hero-media-frame.ws-hero-overview-frame .hero-showcase-video,.ws-hero-main-video,.ws-hero-watch,.ws-hero-watch-arrow,.ws-hero-watch-button,.ws-hero-float-shell{animation:none!important;transition-duration:.01ms!important}}
      `;
      document.head.appendChild(style);
    }
    heroVisual.classList.add('ws-hero-overview');frame.classList.add('ws-hero-overview-frame');
    const mainVideo=document.createElement('video');mainVideo.className='ws-hero-main-video';mainVideo.controls=true;mainVideo.playsInline=true;mainVideo.preload='none';mainVideo.defaultMuted=false;mainVideo.muted=false;mainVideo.volume=1;mainVideo.setAttribute('aria-label','Wistudi platform overview video');mainVideo.dataset.src=VIDEO_URL;
    const loader=document.createElement('div');loader.className='ws-hero-video-loader';loader.setAttribute('aria-hidden','true');
    const watch=document.createElement('div');watch.className='ws-hero-watch';watch.innerHTML=`<span class="ws-hero-watch-label">${label}</span><svg class="ws-hero-watch-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 9l5 5 5-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 14l5 5 5-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity=".58"/></svg><button class="ws-hero-watch-button" type="button" aria-label="${label}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.3 5.8c0-1.05 1.15-1.7 2.05-1.15l9.15 5.55c.86.52.86 1.77 0 2.29l-9.15 5.56c-.9.54-2.05-.1-2.05-1.16V5.8Z"/></svg></button>`;
    const floatShell=document.createElement('div');floatShell.className='ws-hero-float-shell';floatShell.innerHTML='<div class="ws-hero-float-bar" aria-label="Drag video"><span class="ws-hero-float-handle"></span></div><button class="ws-hero-float-close" type="button" aria-label="Close video">×</button>';
    document.body.appendChild(floatShell);frame.append(mainVideo,loader);frame.insertAdjacentElement('afterend',watch);
    const button=watch.querySelector('.ws-hero-watch-button');const dragBar=floatShell.querySelector('.ws-hero-float-bar');const closeBtn=floatShell.querySelector('.ws-hero-float-close');
    let returning=false,floating=false,userPositioned=false,drag=null;
    const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
    const clampFloat=()=>{if(!floating||!userPositioned)return;const r=floatShell.getBoundingClientRect();const pad=10;floatShell.style.left=`${clamp(r.left,pad,innerWidth-r.width-pad)}px`;floatShell.style.top=`${clamp(r.top,pad+30,innerHeight-r.height-pad)}px`;floatShell.style.right='auto';floatShell.style.bottom='auto';};
    const setFloating=on=>{
      if(on===floating)return;floating=on;
      if(on){
        const r=mainVideo.getBoundingClientRect();
        floatShell.style.width='';floatShell.style.height='';
        floatShell.appendChild(mainVideo);floatShell.classList.add('is-visible');
        if(!userPositioned){floatShell.style.left='';floatShell.style.top='';floatShell.style.right='24px';floatShell.style.bottom='24px';}
      }else{
        const currentTime=mainVideo.currentTime;const wasPaused=mainVideo.paused;
        frame.insertBefore(mainVideo,loader);floatShell.classList.remove('is-visible');floatShell.style.left='';floatShell.style.top='';floatShell.style.right='24px';floatShell.style.bottom='24px';userPositioned=false;
        try{mainVideo.currentTime=currentTime;if(!wasPaused)mainVideo.play().catch(()=>{});}catch(_){ }
      }
    };
    const clearMainSource=()=>{try{mainVideo.pause();mainVideo.removeAttribute('src');mainVideo.load();}catch(_){ }button.removeAttribute('aria-busy');};
    const restorePreview=()=>{if(returning)return;returning=true;floatShell.classList.add('is-ending');setTimeout(()=>{setFloating(false);floatShell.classList.remove('is-ending');},reduced?10:260);preview.muted=true;preview.play().catch(()=>{});frame.classList.remove('is-loading','is-playing');watch.classList.remove('is-hidden');setTimeout(()=>{clearMainSource();returning=false;},reduced?20:540);};
    const startOverview=()=>{if(frame.classList.contains('is-playing')||frame.classList.contains('is-loading'))return;returning=false;button.setAttribute('aria-busy','true');frame.classList.add('is-loading');if(!mainVideo.src){mainVideo.src=mainVideo.dataset.src;mainVideo.load();}mainVideo.currentTime=0;mainVideo.defaultMuted=false;mainVideo.muted=false;mainVideo.volume=1;mainVideo.play()?.catch(()=>{frame.classList.add('is-playing');frame.classList.remove('is-loading');watch.classList.add('is-hidden');});};
    const syncFloating=()=>{if(!frame.classList.contains('is-playing')||returning)return;const r=frame.getBoundingClientRect();const shouldFloat=r.bottom<84||r.top>innerHeight-80;if(shouldFloat&&!floating)setFloating(true);else if(!shouldFloat&&floating)setFloating(false);};
    mainVideo.addEventListener('playing',()=>{preview.pause();frame.classList.remove('is-loading');frame.classList.add('is-playing');watch.classList.add('is-hidden');button.removeAttribute('aria-busy');syncFloating();});
    mainVideo.addEventListener('ended',restorePreview);mainVideo.addEventListener('error',restorePreview);button.addEventListener('click',startOverview);closeBtn.addEventListener('click',restorePreview);
    window.addEventListener('scroll',syncFloating,{passive:true});window.addEventListener('resize',()=>{syncFloating();clampFloat();},{passive:true});
    dragBar.addEventListener('pointerdown',e=>{if(!floating)return;const r=floatShell.getBoundingClientRect();drag={id:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top};userPositioned=true;dragBar.setPointerCapture(e.pointerId);e.preventDefault();});
    dragBar.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const r=floatShell.getBoundingClientRect();const pad=10;const x=clamp(e.clientX-drag.dx,pad,innerWidth-r.width-pad);const y=clamp(e.clientY-drag.dy,pad+30,innerHeight-r.height-pad);floatShell.style.left=`${x}px`;floatShell.style.top=`${y}px`;floatShell.style.right='auto';floatShell.style.bottom='auto';});
    const stopDrag=e=>{if(!drag||drag.id!==e.pointerId)return;try{dragBar.releasePointerCapture(e.pointerId);}catch(_){ }drag=null;};dragBar.addEventListener('pointerup',stopDrag);dragBar.addEventListener('pointercancel',stopDrag);
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&frame.classList.contains('is-playing'))restorePreview();});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();