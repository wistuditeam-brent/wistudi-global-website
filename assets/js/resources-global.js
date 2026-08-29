(()=>{
  'use strict';
  if(window.__WISTUDI_RESOURCES_GLOBAL__)return;
  window.__WISTUDI_RESOURCES_GLOBAL__=true;
  const supported=new Set(['vi','zh-cn','th','id','ms','ar']);
  const first=(location.pathname.split('/').filter(Boolean)[0]||'').toLowerCase();
  const locale=supported.has(first)?first:'en';
  const prefix=locale==='en'?'':`/${locale}`;
  const localized=path=>`${prefix}${path}`;
  const UI={
    en:{resources:'Resources',newResources:'New resources',latest:'Latest Community Note',from:'From Community Notes',read:'Read the note →'},
    vi:{resources:'Tài nguyên',newResources:'Tài nguyên mới',latest:'Ghi chú cộng đồng mới nhất',from:'Từ Ghi chú cộng đồng',read:'Đọc ghi chú →'},
    'zh-cn':{resources:'资源',newResources:'新资源',latest:'最新社区札记',from:'来自社区札记',read:'阅读札记 →'},
    th:{resources:'ทรัพยากร',newResources:'ทรัพยากรใหม่',latest:'บันทึกชุมชนล่าสุด',from:'จากบันทึกชุมชน',read:'อ่านบันทึก →'},
    id:{resources:'Sumber Daya',newResources:'Sumber daya baru',latest:'Catatan Komunitas Terbaru',from:'Dari Catatan Komunitas',read:'Baca catatan →'},
    ms:{resources:'Sumber',newResources:'Sumber baharu',latest:'Nota Komuniti Terkini',from:'Daripada Nota Komuniti',read:'Baca nota →'},
    ar:{resources:'الموارد',newResources:'موارد جديدة',latest:'أحدث ملاحظة مجتمع',from:'من ملاحظات المجتمع',read:'اقرأ الملاحظة ←'}
  }[locale]||null;
  const ready=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
  const storageKey=()=>`wistudi.resources.lastSeen:${window.WISTUDI_VIEWER_ID||'anonymous'}`;
  const markSeen=()=>{try{localStorage.setItem(storageKey(),new Date().toISOString())}catch(_){}};
  const isHome=()=>{const parts=location.pathname.split('/').filter(Boolean);if(parts.length&&supported.has(parts[0].toLowerCase()))parts.shift();const p='/'+parts.join('/');return p==='/'||p==='/index.html';};
  const escape=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));

  function ensureStyle(){
    if(document.querySelector('link[href="/assets/css/resources-site.css"]'))return;
    const l=document.createElement('link');l.rel='stylesheet';l.href='/assets/css/resources-site.css';document.head.appendChild(l);
  }
  function makeLink(){
    const a=document.createElement('a');a.href=localized('/resources/');a.textContent=UI.resources;a.className='ws-resource-nav-link';a.dataset.wsResourcesLink='true';
    const b=document.createElement('span');b.className='ws-resource-badge';b.hidden=true;b.setAttribute('aria-label',UI.newResources);a.appendChild(b);a.addEventListener('click',markSeen,{capture:true});return a;
  }
  function addLinks(){
    document.querySelectorAll('.ws-nav-links').forEach(nav=>{
      let a=nav.querySelector('a[data-ws-resources-link]');
      if(!a){a=makeLink();const contact=[...nav.querySelectorAll('a')].find(x=>/contact/i.test(x.textContent));contact?nav.insertBefore(a,contact):nav.appendChild(a);}else if(!a.querySelector('.ws-resource-badge')){const b=document.createElement('span');b.className='ws-resource-badge';b.hidden=true;a.appendChild(b);a.addEventListener('click',markSeen,{capture:true});}
    });
    document.querySelectorAll('.ws-mobile-inner').forEach(nav=>{
      let a=nav.querySelector('a[data-ws-resources-link]');
      if(!a){a=makeLink();const contact=[...nav.querySelectorAll(':scope > a')].find(x=>/contact/i.test(x.textContent));const actions=nav.querySelector('.ws-mobile-actions');contact?nav.insertBefore(a,contact):nav.insertBefore(a,actions);}
    });
    document.querySelectorAll('.ws-footer-links').forEach(nav=>{
      if(nav.querySelector('a[data-ws-resources-link]'))return;
      const a=document.createElement('a');a.href=localized('/resources/');a.textContent=UI.resources;const contact=[...nav.querySelectorAll('a')].find(x=>/contact/i.test(x.textContent));contact?nav.insertBefore(a,contact):nav.appendChild(a);
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
    const a=articles[0],l=a.locales?.[locale]||a.locales.en;
    const section=document.createElement('section');section.className='ws-home-note-section';section.setAttribute('aria-label',UI.latest);
    section.innerHTML=`<div class="ws-home-note-wrap"><a class="ws-home-note-media" href="${l.url}"><img src="${a.heroImage}" alt="${escape(a.heroAlt||l.title)}" loading="lazy" decoding="async"></a><div class="ws-home-note-copy"><div class="ws-home-note-eyebrow">${UI.from} · ${escape(a.type)}</div><h2><a href="${l.url}">${escape(l.title)}</a></h2><p>${escape(l.excerpt)}</p></div><a class="ws-home-note-action" href="${l.url}">${UI.read}</a></div>`;
    const target=document.querySelector('.cta')||document.querySelector('footer.ws-site-footer');
    target?.parentNode?.insertBefore(section,target);
  }
  ready(()=>{
    ensureStyle();addLinks();
    const run=()=>loadContent();
    if('requestIdleCallback'in window)requestIdleCallback(run,{timeout:2500});else setTimeout(run,1500);
  });
})();
