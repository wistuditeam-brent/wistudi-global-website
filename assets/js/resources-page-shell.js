(()=>{
  'use strict';
  if(window.__WISTUDI_RESOURCE_PAGE__) return;
  window.__WISTUDI_RESOURCE_PAGE__=true;

  const localeCodes=['en','vi','zh-cn','th','id','ms','ar'];
  const first=location.pathname.split('/').filter(Boolean)[0]?.toLowerCase();
  const locale=localeCodes.includes(first)?first:'en';
  const intlLocale={en:'en',vi:'vi-VN','zh-cn':'zh-CN',th:'th-TH',id:'id-ID',ms:'ms-MY',ar:'ar'}[locale]||'en';
  const noteWords={en:['note','notes'],vi:['ghi chú','ghi chú'],'zh-cn':['篇','篇'],th:['รายการ','รายการ'],id:['catatan','catatan'],ms:['catatan','catatan'],ar:['ملاحظة','ملاحظات']}[locale]||['note','notes'];

  const ensureScript=src=>new Promise(resolve=>{
    const existing=[...document.scripts].find(s=>new URL(s.src||'',location.href).pathname===src);
    if(existing){resolve(existing);return;}
    const s=document.createElement('script');
    s.src=src;s.async=false;
    s.addEventListener('load',()=>resolve(s),{once:true});
    s.addEventListener('error',()=>resolve(null),{once:true});
    document.head.appendChild(s);
  });
  ensureScript('/assets/js/i18n.js').then(()=>ensureScript('/assets/js/resources-i18n.js'));

  const ready=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
  const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[ch]));
  const storageKey=()=>`wistudi.resources.lastSeen:${window.WISTUDI_VIEWER_ID||'anonymous'}`;
  const FALLBACK='/assets/images/resources/media-fallback.svg';

  function ensureStylesheet(href){
    if(document.querySelector(`link[href="${href}"]`)) return;
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=href;
    document.head.appendChild(link);
  }

  function ensureResourceStyles(){
    ensureStylesheet('/assets/css/resources-site.css');
    ensureStylesheet('/assets/css/resources-image-integrity.css');
  }

  function markSeen(){
    try{localStorage.setItem(storageKey(),new Date().toISOString())}catch(_){ }
    document.querySelectorAll('.ws-resource-badge').forEach(b=>{b.hidden=true;b.textContent='';});
  }

  function initImageFallbacks(){
    const apply=img=>{
      if(!img || img.dataset.wsFallback==='1' || img.src.endsWith('/media-fallback.svg')) return;
      img.dataset.wsOriginalSrc=img.currentSrc||img.src||'';
      img.dataset.wsFallback='1';
      img.src=FALLBACK;
      img.alt='Wistudi image temporarily unavailable';
      img.classList.add('res-image-fallback');
    };
    document.querySelectorAll('img').forEach(img=>{
      img.addEventListener('error',()=>apply(img),{once:true});
      if(img.complete && img.naturalWidth===0) apply(img);
    });
  }

  function initHeader(){
    const mobile=document.querySelector('.ws-mobile-menu');
    const toggle=document.querySelector('.ws-menu-toggle');
    if(toggle&&mobile){
      toggle.addEventListener('click',()=>{
        const open=mobile.classList.toggle('open');
        toggle.setAttribute('aria-expanded',String(open));
      });
    }
    document.querySelectorAll('.ws-lang').forEach(lang=>{
      const button=lang.querySelector('.ws-lang-toggle');
      if(!button)return;
      button.addEventListener('click',e=>{
        e.stopPropagation();
        const open=!lang.classList.contains('open');
        document.querySelectorAll('.ws-lang.open').forEach(x=>x.classList.remove('open'));
        lang.classList.toggle('open',open);
        button.setAttribute('aria-expanded',String(open));
      });
    });
    document.addEventListener('click',()=>document.querySelectorAll('.ws-lang.open').forEach(x=>x.classList.remove('open')));
    document.addEventListener('keydown',e=>{
      if(e.key!=='Escape')return;
      document.querySelectorAll('.ws-lang.open').forEach(x=>x.classList.remove('open'));
      mobile?.classList.remove('open');
      toggle?.setAttribute('aria-expanded','false');
    });
  }

  function initLightbox(){
    const box=document.querySelector('.res-lightbox');
    if(!box)return;
    const image=box.querySelector('img');
    const close=()=>{box.classList.remove('open');document.body.style.overflow='';};
    document.querySelectorAll('[data-res-lightbox]').forEach(button=>button.addEventListener('click',()=>{
      if(image){image.src=button.dataset.full||button.querySelector('img')?.dataset.wsOriginalSrc||button.querySelector('img')?.src||'';image.alt=button.querySelector('img')?.alt||'';}
      box.classList.add('open');document.body.style.overflow='hidden';
    }));
    box.querySelector('.res-lightbox-close')?.addEventListener('click',close);
    box.addEventListener('click',e=>{if(e.target===box)close();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&box.classList.contains('open'))close();});
  }

  async function initArchive(){
    const root=document.querySelector('[data-res-archive]');
    if(!root)return;
    const list=root.querySelector('[data-res-list]');
    const search=root.querySelector('[data-res-search]');
    const topic=root.querySelector('[data-res-topic]');
    const type=root.querySelector('[data-res-type]');
    const sort=root.querySelector('[data-res-sort]');
    const count=root.querySelector('[data-res-count]');
    const empty=root.querySelector('[data-res-empty]');
    if(!list)return;

    let articles=[];
    try{
      const response=await fetch('/assets/data/resources-manifest.json',{cache:'force-cache'});
      if(response.ok){
        const data=await response.json();
        articles=(Array.isArray(data?.articles)?data.articles:[]).filter(a=>a.status==='published'&&a.locales?.en?.url);
      }
    }catch(_){ }

    if(!articles.length){if(count&&count.textContent.includes('Loading'))count.textContent='No notes available';return;}
    const formatDate=value=>{try{return new Intl.DateTimeFormat(intlLocale,{day:'numeric',month:'short',year:'numeric'}).format(new Date(value));}catch(_){return '';}};
    const localizedUrl=url=>locale==='en'?url:`/${locale}${url.startsWith('/')?url:'/'+url}`;
    const makeCard=a=>{const l=a.locales.en;return `<a class="res-list-card" href="${localizedUrl(l.url)}"><div class="res-list-image"><img src="${a.heroImage}" alt="${escapeHtml(a.heroAlt||l.title)}" loading="lazy" decoding="async"></div><div><div class="res-type">${escapeHtml(a.type)}</div><h2>${escapeHtml(l.title)}</h2><p>${escapeHtml(l.excerpt)}</p><div class="res-card-meta"><span>${escapeHtml((a.topics||[]).slice(0,3).join(' · '))}</span><span data-ws-resource-date="${escapeHtml(a.publishedAt)}">${formatDate(a.publishedAt)}</span></div></div><span class="res-list-arrow" aria-hidden="true">→</span></a>`;};
    const initial=new URLSearchParams(location.search).get('q')||'';
    if(search)search.value=initial;
    const apply=()=>{
      const q=(search?.value||'').trim().toLowerCase(); const topicValue=topic?.value||'all'; const typeValue=type?.value||'all'; const sortValue=sort?.value||'newest';
      let filtered=articles.filter(a=>{const l=a.locales.en;const hay=[l.title,l.excerpt,a.type,...(a.topics||[])].join(' ').toLowerCase();return(!q||hay.includes(q))&&(topicValue==='all'||(a.topics||[]).includes(topicValue))&&(typeValue==='all'||a.type===typeValue);});
      filtered.sort((a,b)=>sortValue==='oldest'?new Date(a.publishedAt)-new Date(b.publishedAt):new Date(b.publishedAt)-new Date(a.publishedAt));
      list.innerHTML=filtered.map(makeCard).join('');
      initImageFallbacks();
      if(count)count.textContent=`${filtered.length} ${filtered.length===1?noteWords[0]:noteWords[1]}`;
      empty?.classList.toggle('show',filtered.length===0);
      window.__WISTUDI_RESOURCES_TRANSLATE_NODE__?.(list);
    };
    search?.addEventListener('input',apply,{passive:true}); topic?.addEventListener('change',apply); type?.addEventListener('change',apply); sort?.addEventListener('change',apply); apply();
  }

  ready(()=>{ensureResourceStyles();markSeen();initImageFallbacks();initHeader();initLightbox();initArchive();});
})();
