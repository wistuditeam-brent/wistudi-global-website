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
  async function loadContent(){
    let data;
    try{const r=await fetch('/assets/data/resources-manifest.json',{cache:'force-cache'});if(!r.ok)return;data=await r.json();}catch(_){return;}
    const articles=(Array.isArray(data?.articles)?data.articles:[]).filter(a=>a.status==='published'&&a.locales?.en?.url).sort((a,b)=>new Date(b.publishedAt)-new Date(a.publishedAt));
    let last='';try{last=localStorage.getItem(storageKey())||'';}catch(_){ }
    const cutoff=last?new Date(last).getTime():Date.now()-30*86400000;
    const count=articles.filter(a=>new Date(a.publishedAt).getTime()>cutoff).length;
    document.querySelectorAll('.ws-resource-badge').forEach(b=>{b.hidden=!count;b.textContent=count>9?'9+':String(count||'');});
    if(!isHome()||!articles.length||document.querySelector('.ws-home-note-section'))return;
    const a=articles[0],l=a.locales.en;
    const section=document.createElement('section');section.className='ws-home-note-section';section.setAttribute('aria-label','Latest Community Note');
    section.innerHTML=`<div class="ws-home-note-wrap"><a class="ws-home-note-media" href="${l.url}"><img src="${a.heroImage}" alt="${escape(a.heroAlt||l.title)}" loading="lazy" decoding="async"></a><div class="ws-home-note-copy"><div class="ws-home-note-eyebrow">From Community Notes · ${escape(a.type)}</div><h2><a href="${l.url}">${escape(l.title)}</a></h2><p>${escape(l.excerpt)}</p></div><a class="ws-home-note-action" href="${l.url}">Read the note →</a></div>`;
    const target=document.querySelector('.cta')||document.querySelector('footer.ws-site-footer');
    target?.parentNode?.insertBefore(section,target);
  }
  ready(()=>{
    ensureStyle();addLinks();
    const run=()=>loadContent();
    if('requestIdleCallback'in window)requestIdleCallback(run,{timeout:2500});else setTimeout(run,1500);
  });
})();
