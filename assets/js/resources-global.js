(()=>{
  'use strict';
  if(window.__WISTUDI_RESOURCES_GLOBAL__)return;
  window.__WISTUDI_RESOURCES_GLOBAL__=true;
  const supported=new Set(['vi','zh-cn','th','id','ms','ar']);
  const first=(location.pathname.split('/').filter(Boolean)[0]||'').toLowerCase();
  if(supported.has(first))return;
  const ready=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
  const storageKey=()=>`wistudi.resources.lastSeen:${window.WISTUDI_VIEWER_ID||'anonymous'}`;
  const markSeen=()=>{try{localStorage.setItem(storageKey(),new Date().toISOString())}catch(_){}};
  const isHome=()=>{const p=location.pathname.replace(/\/+$/,'');return p===''||p==='/index.html';};
  const escape=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));

  function ensureStyle(){
    if(document.querySelector('link[href="/assets/css/resources-site.css"]'))return;
    const l=document.createElement('link');l.rel='stylesheet';l.href='/assets/css/resources-site.css';document.head.appendChild(l);
  }
  function makeLink(){
    const a=document.createElement('a');a.href='/resources/';a.textContent='Resources';a.className='ws-resource-nav-link';a.dataset.wsResourcesLink='true';
    const b=document.createElement('span');b.className='ws-resource-badge';b.hidden=true;b.setAttribute('aria-label','New resources');a.appendChild(b);a.addEventListener('click',markSeen,{capture:true});return a;
  }
  function addLinks(){
    document.querySelectorAll('.ws-nav-links').forEach(nav=>{
      let a=nav.querySelector('a[href="/resources/"]');
      if(!a){a=makeLink();const contact=[...nav.querySelectorAll('a')].find(x=>/contact/i.test(x.textContent));contact?nav.insertBefore(a,contact):nav.appendChild(a);}else if(!a.querySelector('.ws-resource-badge')){const b=document.createElement('span');b.className='ws-resource-badge';b.hidden=true;a.appendChild(b);a.addEventListener('click',markSeen,{capture:true});}
    });
    document.querySelectorAll('.ws-mobile-inner').forEach(nav=>{
      let a=nav.querySelector('a[href="/resources/"]');
      if(!a){a=makeLink();const contact=[...nav.querySelectorAll(':scope > a')].find(x=>/contact/i.test(x.textContent));const actions=nav.querySelector('.ws-mobile-actions');contact?nav.insertBefore(a,contact):nav.insertBefore(a,actions);}
    });
    document.querySelectorAll('.ws-footer-links').forEach(nav=>{
      if(nav.querySelector('a[href="/resources/"]'))return;
      const a=document.createElement('a');a.href='/resources/';a.textContent='Resources';const contact=[...nav.querySelectorAll('a')].find(x=>/contact/i.test(x.textContent));contact?nav.insertBefore(a,contact):nav.appendChild(a);
    });
  }

  function buildGallery(article,locale){
    const media=(Array.isArray(article.media)?article.media:[]).filter(m=>m?.src);
    if(!media.length&&article.heroImage)media.push({src:article.heroImage,alt:article.heroAlt||locale.title});
    if(!media.length)return null;
    const section=document.createElement('section');section.className='ws-home-note-section ws-featured-note';section.setAttribute('aria-label','Featured Community Note');
    const thumbs=media.slice(0,4).map((m,i)=>`<button class="ws-note-thumb${i===0?' is-active':''}" type="button" data-note-index="${i}" aria-label="Show photo ${i+1}"><img src="${escape(m.src)}" alt="" loading="lazy" decoding="async"></button>`).join('');
    section.innerHTML=`<div class="ws-featured-note-wrap"><div class="ws-note-gallery" data-count="${media.length}"><button class="ws-note-stage" type="button" aria-label="Open photo gallery"><img src="${escape(media[0].src)}" alt="${escape(media[0].alt||article.heroAlt||locale.title)}" loading="lazy" decoding="async"><span class="ws-note-zoom" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 5 5"/></svg></span><span class="ws-note-count">1 / ${media.length}</span></button><div class="ws-note-thumbs">${thumbs}</div></div><div class="ws-featured-note-copy"><div class="ws-home-note-eyebrow">Featured Community Note · ${escape(article.type||'Community Note')}</div><h2><a href="${escape(locale.url)}">${escape(locale.title)}</a></h2><p>${escape(locale.excerpt)}</p><div class="ws-featured-note-actions"><a class="ws-home-note-action primary" href="${escape(locale.url)}">Read the field note →</a><a class="ws-home-note-action quiet" href="/resources/">More Community Notes</a></div></div></div>`;
    let index=0,timer=null;
    const stage=section.querySelector('.ws-note-stage');const img=stage.querySelector('img');const count=stage.querySelector('.ws-note-count');const thumbEls=[...section.querySelectorAll('.ws-note-thumb')];
    const setIndex=n=>{index=(n+media.length)%media.length;const m=media[index];img.src=m.src;img.alt=m.alt||article.heroAlt||locale.title;count.textContent=`${index+1} / ${media.length}`;thumbEls.forEach((t,i)=>t.classList.toggle('is-active',i===index));};
    thumbEls.forEach(t=>t.addEventListener('click',()=>{setIndex(Number(t.dataset.noteIndex));restart();}));
    const lightbox=document.createElement('div');lightbox.className='ws-note-lightbox';lightbox.hidden=true;lightbox.innerHTML='<button class="ws-note-lightbox-close" type="button" aria-label="Close gallery">×</button><button class="ws-note-lightbox-prev" type="button" aria-label="Previous photo">‹</button><img alt=""><button class="ws-note-lightbox-next" type="button" aria-label="Next photo">›</button><div class="ws-note-lightbox-count"></div>';
    document.body.appendChild(lightbox);const lbImg=lightbox.querySelector('img');const lbCount=lightbox.querySelector('.ws-note-lightbox-count');
    const syncLightbox=()=>{const m=media[index];lbImg.src=m.src;lbImg.alt=m.alt||article.heroAlt||locale.title;lbCount.textContent=`${index+1} / ${media.length}`;};
    const open=()=>{syncLightbox();lightbox.hidden=false;document.documentElement.classList.add('ws-note-modal-open');lightbox.querySelector('.ws-note-lightbox-close').focus();};
    const close=()=>{lightbox.hidden=true;document.documentElement.classList.remove('ws-note-modal-open');stage.focus();};
    stage.addEventListener('click',open);lightbox.querySelector('.ws-note-lightbox-close').addEventListener('click',close);lightbox.querySelector('.ws-note-lightbox-prev').addEventListener('click',()=>{setIndex(index-1);syncLightbox();});lightbox.querySelector('.ws-note-lightbox-next').addEventListener('click',()=>{setIndex(index+1);syncLightbox();});
    lightbox.addEventListener('click',e=>{if(e.target===lightbox)close();});document.addEventListener('keydown',e=>{if(lightbox.hidden)return;if(e.key==='Escape')close();if(e.key==='ArrowLeft'){setIndex(index-1);syncLightbox();}if(e.key==='ArrowRight'){setIndex(index+1);syncLightbox();}});
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;const stop=()=>{if(timer)clearInterval(timer);timer=null;};const start=()=>{if(reduced||media.length<2)return;stop();timer=setInterval(()=>setIndex(index+1),6500);};const restart=()=>{stop();start();};section.addEventListener('mouseenter',stop);section.addEventListener('mouseleave',start);section.addEventListener('focusin',stop);section.addEventListener('focusout',start);start();
    return section;
  }

  async function loadContent(){
    let data;try{const r=await fetch('/assets/data/resources-manifest.json',{cache:'no-cache'});if(!r.ok)return;data=await r.json();}catch(_){return;}
    const articles=(Array.isArray(data?.articles)?data.articles:[]).filter(a=>a.status==='published'&&a.locales?.en?.url).sort((a,b)=>new Date(b.publishedAt)-new Date(a.publishedAt));
    let last='';try{last=localStorage.getItem(storageKey())||'';}catch(_){ }
    const cutoff=last?new Date(last).getTime():Date.now()-30*86400000;const count=articles.filter(a=>new Date(a.publishedAt).getTime()>cutoff).length;
    document.querySelectorAll('.ws-resource-badge').forEach(b=>{b.hidden=!count;b.textContent=count>9?'9+':String(count||'');});
    if(!isHome()||!articles.length||document.querySelector('.ws-home-note-section'))return;
    const article=articles.find(a=>a.featured===true)||articles[0];const locale=article.locales.en;const section=buildGallery(article,locale);if(!section)return;
    const target=document.querySelector('.cta')||document.querySelector('footer.ws-site-footer');target?.parentNode?.insertBefore(section,target);
  }
  ready(()=>{ensureStyle();addLinks();const run=()=>loadContent();if('requestIdleCallback'in window)requestIdleCallback(run,{timeout:1200});else setTimeout(run,400);});
})();