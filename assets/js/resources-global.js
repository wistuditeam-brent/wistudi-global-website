(()=>{
  'use strict';
  if(window.__WISTUDI_RESOURCES_GLOBAL__)return;
  window.__WISTUDI_RESOURCES_GLOBAL__=true;

  const supported=new Set(['vi','zh-cn','th','id','ms','ar']);
  const first=(location.pathname.split('/').filter(Boolean)[0]||'').toLowerCase();
  if(supported.has(first))return;

  const doc=document;
  const ready=fn=>doc.readyState==='loading'?doc.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
  const storageKey=()=>`wistudi.resources.lastSeen:${window.WISTUDI_VIEWER_ID||'anonymous'}`;
  const markSeen=()=>{try{localStorage.setItem(storageKey(),new Date().toISOString())}catch(_){}};
  const isHome=()=>{const p=location.pathname.replace(/\/+$/,'');return p===''||p==='/index.html';};
  const escape=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  function ensureStyle(){
    if(doc.querySelector('link[href="/assets/css/resources-site.css"]'))return;
    const l=doc.createElement('link');
    l.rel='stylesheet';l.href='/assets/css/resources-site.css';
    doc.head.appendChild(l);
  }

  function makeLink(){
    const a=doc.createElement('a');
    a.href='/resources/';a.textContent='Resources';a.className='ws-resource-nav-link';a.dataset.wsResourcesLink='true';
    const b=doc.createElement('span');b.className='ws-resource-badge';b.hidden=true;b.setAttribute('aria-label','New resources');
    a.appendChild(b);a.addEventListener('click',markSeen,{capture:true});
    return a;
  }

  function addLinks(){
    doc.querySelectorAll('.ws-nav-links').forEach(nav=>{
      let a=nav.querySelector('a[href="/resources/"]');
      if(!a){
        a=makeLink();
        const contact=[...nav.querySelectorAll('a')].find(x=>/contact/i.test(x.textContent));
        contact?nav.insertBefore(a,contact):nav.appendChild(a);
      }else if(!a.querySelector('.ws-resource-badge')){
        const b=doc.createElement('span');b.className='ws-resource-badge';b.hidden=true;a.appendChild(b);a.addEventListener('click',markSeen,{capture:true});
      }
    });
    doc.querySelectorAll('.ws-mobile-inner').forEach(nav=>{
      let a=nav.querySelector('a[href="/resources/"]');
      if(!a){
        a=makeLink();
        const contact=[...nav.querySelectorAll(':scope > a')].find(x=>/contact/i.test(x.textContent));
        const actions=nav.querySelector('.ws-mobile-actions');
        contact?nav.insertBefore(a,contact):nav.insertBefore(a,actions);
      }
    });
    doc.querySelectorAll('.ws-footer-links').forEach(nav=>{
      if(nav.querySelector('a[href="/resources/"]'))return;
      const a=doc.createElement('a');a.href='/resources/';a.textContent='Resources';
      const contact=[...nav.querySelectorAll('a')].find(x=>/contact/i.test(x.textContent));
      contact?nav.insertBefore(a,contact):nav.appendChild(a);
    });
  }

  const optimizedSrc=src=>{
    if(!src||!src.startsWith('/assets/images/'))return src;
    return `/cdn-cgi/image/width=2000,quality=88,format=auto${src}`;
  };

  function buildGallery(section,article,locale){
    const sourceMedia=Array.isArray(article.media)&&article.media.length?article.media:[{src:article.heroImage,alt:article.heroAlt||locale.title}];
    const media=sourceMedia.filter(item=>item?.src).map(item=>({src:item.src,alt:item.alt||article.heroAlt||locale.title}));
    if(!media.length)return;

    const stageImg=section.querySelector('[data-gallery-stage-img]');
    const counter=section.querySelector('[data-gallery-counter]');
    const thumbs=[...section.querySelectorAll('[data-gallery-thumb]')];
    const prev=section.querySelector('[data-gallery-prev]');
    const next=section.querySelector('[data-gallery-next]');
    const open=section.querySelector('[data-gallery-open]');
    const shell=section.querySelector('.ws-featured-gallery');
    let index=0,timer=null,resumeTimer=null;

    const setImage=(img,item)=>{
      const original=item.src;
      const preferred=optimizedSrc(original);
      img.onerror=()=>{
        img.onerror=null;
        if(img.getAttribute('src')!==original)img.src=original;
      };
      img.src=preferred||original;
      img.alt=item.alt;
    };

    const show=(value,{manual=false}={})=>{
      index=(value+media.length)%media.length;
      setImage(stageImg,media[index]);
      if(counter)counter.textContent=`${index+1} / ${media.length}`;
      thumbs.forEach((thumb,i)=>{
        const active=i===index;
        thumb.classList.toggle('is-active',active);
        thumb.setAttribute('aria-current',active?'true':'false');
      });
      if(manual)pauseThenResume();
    };

    const stop=()=>{if(timer){clearInterval(timer);timer=null;}};
    const start=()=>{
      stop();
      if(reduced||media.length<2||doc.hidden)return;
      timer=setInterval(()=>show(index+1),6500);
    };
    const pauseThenResume=()=>{
      stop();
      if(resumeTimer)clearTimeout(resumeTimer);
      resumeTimer=setTimeout(start,9000);
    };

    prev?.addEventListener('click',()=>show(index-1,{manual:true}));
    next?.addEventListener('click',()=>show(index+1,{manual:true}));
    thumbs.forEach((thumb,i)=>thumb.addEventListener('click',()=>show(i,{manual:true})));
    shell?.addEventListener('mouseenter',stop);
    shell?.addEventListener('mouseleave',start);
    shell?.addEventListener('focusin',stop);
    shell?.addEventListener('focusout',e=>{if(!shell.contains(e.relatedTarget))start();});
    doc.addEventListener('visibilitychange',()=>doc.hidden?stop():start(),{passive:true});

    const lightbox=doc.createElement('div');
    lightbox.className='ws-gallery-lightbox';
    lightbox.hidden=true;
    lightbox.setAttribute('role','dialog');
    lightbox.setAttribute('aria-modal','true');
    lightbox.setAttribute('aria-label',`${locale.title} photo gallery`);
    lightbox.innerHTML=`
      <button class="ws-gallery-lightbox-close" type="button" aria-label="Close gallery">×</button>
      <button class="ws-gallery-lightbox-nav prev" type="button" aria-label="Previous photo">‹</button>
      <figure class="ws-gallery-lightbox-figure">
        <img alt="" data-lightbox-img>
        <figcaption><span data-lightbox-counter></span></figcaption>
      </figure>
      <button class="ws-gallery-lightbox-nav next" type="button" aria-label="Next photo">›</button>`;
    doc.body.appendChild(lightbox);

    const lbImg=lightbox.querySelector('[data-lightbox-img]');
    const lbCounter=lightbox.querySelector('[data-lightbox-counter]');
    const closeBtn=lightbox.querySelector('.ws-gallery-lightbox-close');
    let lastFocus=null,touchX=null;

    const syncLightbox=()=>{
      setImage(lbImg,media[index]);
      lbCounter.textContent=`${index+1} / ${media.length}`;
    };
    const openLightbox=()=>{
      lastFocus=doc.activeElement;
      syncLightbox();
      lightbox.hidden=false;
      doc.documentElement.classList.add('ws-lightbox-open');
      stop();
      requestAnimationFrame(()=>closeBtn.focus());
    };
    const closeLightbox=()=>{
      lightbox.hidden=true;
      doc.documentElement.classList.remove('ws-lightbox-open');
      lastFocus?.focus?.();
      start();
    };
    const lbStep=delta=>{show(index+delta,{manual:true});syncLightbox();};

    open?.addEventListener('click',openLightbox);
    closeBtn.addEventListener('click',closeLightbox);
    lightbox.querySelector('.prev').addEventListener('click',()=>lbStep(-1));
    lightbox.querySelector('.next').addEventListener('click',()=>lbStep(1));
    lightbox.addEventListener('click',e=>{if(e.target===lightbox)closeLightbox();});
    lightbox.addEventListener('touchstart',e=>{touchX=e.changedTouches[0]?.clientX??null;},{passive:true});
    lightbox.addEventListener('touchend',e=>{
      if(touchX===null)return;
      const end=e.changedTouches[0]?.clientX??touchX;
      const delta=end-touchX;touchX=null;
      if(Math.abs(delta)>45)lbStep(delta>0?-1:1);
    },{passive:true});
    doc.addEventListener('keydown',e=>{
      if(lightbox.hidden)return;
      if(e.key==='Escape')closeLightbox();
      if(e.key==='ArrowLeft')lbStep(-1);
      if(e.key==='ArrowRight')lbStep(1);
    });

    show(0);
    start();
  }

  function renderFeatured(articles){
    if(!isHome()||!articles.length||doc.querySelector('.ws-home-note-section'))return;

    const featured=articles.find(article=>article.featured===true)||articles[0];
    const locale=featured.locales.en;
    const media=(Array.isArray(featured.media)&&featured.media.length?featured.media:[{src:featured.heroImage,alt:featured.heroAlt||locale.title}]).filter(x=>x?.src);
    const more=articles.filter(a=>a.id!==featured.id).slice(0,2);
    const thumbs=media.map((item,i)=>`<button class="ws-gallery-thumb${i===0?' is-active':''}" type="button" data-gallery-thumb aria-label="Show photo ${i+1}" aria-current="${i===0?'true':'false'}"><img src="${escape(optimizedSrc(item.src)||item.src)}" data-fallback="${escape(item.src)}" alt="" loading="lazy" decoding="async"></button>`).join('');
    const moreMarkup=more.length?`<div class="ws-home-note-more"><span>More from Wistudi</span>${more.map(item=>{const l=item.locales.en;return `<a href="${escape(l.url)}"><small>${escape(item.type||'Resource')}</small>${escape(l.title)}</a>`;}).join('')}</div>`:'';

    const section=doc.createElement('section');
    section.className='ws-home-note-section';
    section.setAttribute('aria-label','Featured Community Note');
    section.innerHTML=`
      <div class="ws-home-note-wrap">
        <div class="ws-featured-gallery" aria-label="${escape(locale.title)} photo gallery">
          <button class="ws-gallery-stage" type="button" data-gallery-open aria-label="Open photo gallery">
            <img data-gallery-stage-img src="${escape(optimizedSrc(media[0]?.src||featured.heroImage))}" alt="${escape(media[0]?.alt||featured.heroAlt||locale.title)}" loading="lazy" decoding="async">
            <span class="ws-gallery-zoom" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path></svg></span>
            <span class="ws-gallery-counter" data-gallery-counter>1 / ${media.length}</span>
          </button>
          ${media.length>1?`<div class="ws-gallery-controls"><button type="button" data-gallery-prev aria-label="Previous photo">‹</button><div class="ws-gallery-thumbs">${thumbs}</div><button type="button" data-gallery-next aria-label="Next photo">›</button></div>`:''}
        </div>
        <div class="ws-home-note-copy">
          <div class="ws-home-note-eyebrow">Featured · Community Notes · ${escape(featured.type)}</div>
          <h2><a href="${escape(locale.url)}">${escape(locale.title)}</a></h2>
          <p>${escape(locale.excerpt)}</p>
          <a class="ws-home-note-action" href="${escape(locale.url)}">Read the field note <span aria-hidden="true">→</span></a>
          ${moreMarkup}
        </div>
      </div>`;

    section.querySelectorAll('.ws-gallery-thumb img').forEach(img=>{
      img.addEventListener('error',()=>{const fallback=img.dataset.fallback;if(fallback&&img.src!==fallback)img.src=fallback;},{once:true});
    });

    const target=doc.querySelector('.cta')||doc.querySelector('footer.ws-site-footer');
    target?.parentNode?.insertBefore(section,target);
    buildGallery(section,featured,locale);
  }

  async function loadContent(){
    let data;
    try{
      const r=await fetch('/assets/data/resources-manifest.json',{cache:'no-cache'});
      if(!r.ok)return;
      data=await r.json();
    }catch(_){return;}

    const articles=(Array.isArray(data?.articles)?data.articles:[])
      .filter(a=>a.status==='published'&&a.locales?.en?.url)
      .sort((a,b)=>new Date(b.publishedAt)-new Date(a.publishedAt));

    let last='';try{last=localStorage.getItem(storageKey())||'';}catch(_){ }
    const cutoff=last?new Date(last).getTime():Date.now()-30*86400000;
    const count=articles.filter(a=>new Date(a.publishedAt).getTime()>cutoff).length;
    doc.querySelectorAll('.ws-resource-badge').forEach(b=>{b.hidden=!count;b.textContent=count>9?'9+':String(count||'');});
    renderFeatured(articles);
  }

  ready(()=>{
    ensureStyle();
    addLinks();
    const run=()=>loadContent();
    if('requestIdleCallback'in window)requestIdleCallback(run,{timeout:1400});
    else setTimeout(run,500);
  });
})();
