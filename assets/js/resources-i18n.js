(()=>{
  'use strict';
  const supported=['en','vi','zh-cn','th','id','ms','ar'];
  const parts=location.pathname.split('/').filter(Boolean);
  const explicit=supported.includes((parts[0]||'').toLowerCase())?(parts[0]||'').toLowerCase():null;
  const locale=explicit||'en';
  const bare=location.pathname.replace(/^\/(vi|zh-cn|th|id|ms|ar)(?=\/)/,'');
  const isHome=bare==='/resources/'||bare==='/resources'||bare==='/resources/index.html';
  if(!isHome)return;

  const reveal=()=>{
    document.documentElement.classList.add('ws-res-i18n-ready');
    document.documentElement.classList.remove('ws-res-i18n-pending');
  };

  if(!explicit){
    let stored=null;
    try{stored=localStorage.getItem('wistudi_locale')}catch(_){}
    if(stored&&supported.includes(stored)&&stored!=='en'){
      location.replace('/'+stored+'/resources/'+location.search+location.hash);
      return;
    }
  }

  const normalize=s=>(s||'').replace(/\s+/g,' ').trim();
  const localizeResourceLinks=()=>{
    if(locale==='en')return;
    document.querySelectorAll('a[href],form[action]').forEach(el=>{
      const attr=el.tagName==='FORM'?'action':'href';
      const raw=el.getAttribute(attr);
      if(!raw||raw.startsWith('#')||raw.startsWith('mailto:')||raw.startsWith('tel:')||raw.startsWith('javascript:'))return;
      let u;try{u=new URL(raw,location.href)}catch(_){return}
      if(u.origin!==location.origin)return;
      if(u.pathname==='/resources/'||u.pathname==='/resources/index.html'){
        el.setAttribute(attr,`/${locale}/resources/${u.search||''}${u.hash||''}`);
      }
    });
  };

  const translate=(dict)=>{
    const strings=dict?.strings||{};
    const translateNode=node=>{
      if(!node)return;
      if(node.nodeType===Node.TEXT_NODE){
        const raw=node.nodeValue||'';
        const key=normalize(raw);
        if(!key||!strings[key])return;
        const lead=(raw.match(/^\s*/)||[''])[0];
        const trail=(raw.match(/\s*$/)||[''])[0];
        node.nodeValue=lead+strings[key]+trail;
        return;
      }
      if(node.nodeType!==Node.ELEMENT_NODE)return;
      const el=node;
      ['placeholder','title','aria-label','alt'].forEach(attr=>{
        const raw=el.getAttribute?.(attr);
        const key=normalize(raw);
        if(key&&strings[key])el.setAttribute(attr,strings[key]);
      });
      [...el.childNodes].forEach(translateNode);
    };
    if(dict.title)document.title=dict.title;
    const meta=document.querySelector('meta[name="description"]');
    if(meta&&dict.description)meta.setAttribute('content',dict.description);
    translateNode(document.body);
    const observer=new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(translateNode)));
    observer.observe(document.body,{childList:true,subtree:true});
  };

  const addRtl=()=>{
    if(locale!=='ar')return;
    document.documentElement.dir='rtl';
    if(document.getElementById('resources-rtl-fix'))return;
    const style=document.createElement('style');
    style.id='resources-rtl-fix';
    style.textContent=`
      [dir="rtl"] .res-hero-grid,[dir="rtl"] .res-head,[dir="rtl"] .res-definition{direction:rtl;text-align:right}
      [dir="rtl"] .res-search{direction:rtl}
      [dir="rtl"] .res-feature-copy,[dir="rtl"] .res-card-body,[dir="rtl"] .res-question-intro,[dir="rtl"] .res-progressive-card{text-align:right}
      [dir="rtl"] .res-byline,[dir="rtl"] .res-card-meta{direction:rtl}
    `;
    document.head.appendChild(style);
  };

  const apply=async()=>{
    localizeResourceLinks();
    addRtl();
    if(locale==='en'){reveal();return;}
    try{
      const r=await fetch(`/assets/i18n/${locale}-resources-home.json`,{cache:'default'});
      if(!r.ok)throw new Error('resources translation unavailable');
      translate(await r.json());
    }catch(err){
      console.warn('[Wistudi resources i18n]',err);
    }finally{
      reveal();
    }
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});
  else apply();
})();
