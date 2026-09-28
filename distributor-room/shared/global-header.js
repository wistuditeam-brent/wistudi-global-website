(function(){
  const FLAG_VN='<svg class="wdr-flag" viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#DA251D"/><polygon points="15,3 16.76,8.43 22.47,8.43 17.85,11.78 19.61,17.21 15,13.86 10.39,17.21 12.15,11.78 7.53,8.43 13.24,8.43" fill="#FF0"/></svg>';
  const FLAG_UK='<svg class="wdr-flag" viewBox="0 0 60 36" aria-hidden="true"><rect width="60" height="36" fill="#012169"/><path d="M0 0L60 36M60 0L0 36" stroke="#fff" stroke-width="7"/><path d="M0 0L60 36M60 0L0 36" stroke="#C8102E" stroke-width="4"/><path d="M30 0V36M0 18H60" stroke="#fff" stroke-width="11"/><path d="M30 0V36M0 18H60" stroke="#C8102E" stroke-width="7"/></svg>';
  const ICONS={
    contents:'<svg viewBox="0 0 24 24"><path d="M5 6h14M5 12h14M5 18h14"/></svg>',
    play:'<svg viewBox="0 0 24 24"><path d="m9 7 8 5-8 5V7Z"/></svg>',
    star:'<svg viewBox="0 0 24 24"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/></svg>',
    gallery:'<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>',
    download:'<svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M5 20h14"/></svg>',
    globe:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3c2.2 2.4 3.3 5.4 3.3 9S14.2 18.6 12 21M12 3C9.8 5.4 8.7 8.4 8.7 12S9.8 18.6 12 21"/></svg>',
    note:'<svg viewBox="0 0 24 24"><path d="M5 4h14v12H9l-4 4V4Z"/></svg>'
  };
  function pathFor(locale,section){
    const base=locale==='vi'?'/distributor-room/vi/':'/distributor-room/';
    if(section==='releases')return base+'feature-releases/';
    if(section==='gallery')return base+'gallery/';
    return base;
  }
  function currentSection(){
    const p=location.pathname;
    if(p.includes('/feature-releases/'))return'releases';
    if(p.includes('/gallery/'))return'gallery';
    return'contents';
  }
  function targetLanguageHref(locale,section){
    const target=locale==='vi'?'en':'vi';
    let href=pathFor(target,section);
    if(section==='contents'){
      const params=new URLSearchParams(location.search);
      const view=params.get('view')||'contents';
      const wst=params.get('wst');
      const out=new URLSearchParams();
      out.set('view',view);
      if(wst)out.set('wst',wst);
      href+='?'+out.toString();
    }else if(section==='gallery'){
      const cat=new URLSearchParams(location.search).get('category');
      if(cat)href+='?category='+encodeURIComponent(cat);
    }
    return href;
  }
  function download(locale){
    return locale==='vi'
      ?{href:'/distributor-room/vi/downloads/Wistudi_Partner_Commercial_Integration_Model_VI.pdf',title:'Mô hình Hợp tác Thương mại & Tích hợp Wistudi',meta:'Khung dành cho đối tác · PDF tiếng Việt'}
      :{href:'/distributor-room/downloads/DOC%20-%20Wistudi%20Commercial%20Partnership%20Integration%20Model.pdf',title:'Wistudi Commercial Partnership & Integration Model',meta:'Commercial partnerships and integrations · English PDF'};
  }
  function labels(locale){
    return locale==='vi'?{
      room:'Phòng Nhà phân phối',contents:'Mục lục',platform:'Video nền tảng',event:'Sự kiện Wistudi',releases:'Cập nhật tính năng',gallery:'Thư viện ảnh',downloads:'Tải xuống',notes:'Ghi chú cho Wistudi',viewing:'đang xem',website:'Truy cập website Wistudi',open:'Mở Wistudi',language:'English',code:'EN'
    }:{
      room:'Distributor Room',contents:'Contents',platform:'Platform video',event:'Wistudi Event',releases:'Feature Releases',gallery:'Gallery',downloads:'Downloads',notes:'Notes to Wistudi',viewing:'viewing',website:'Visit Wistudi website',open:'Open Wistudi',language:'Tiếng Việt',code:'VI'
    };
  }
  function navHref(locale,action){
    const base=pathFor(locale,'contents');
    const q=new URLSearchParams();
    q.set('view',action);
    const wst=new URLSearchParams(location.search).get('wst');if(wst)q.set('wst',wst);
    return base+'?'+q.toString();
  }
  function mount(host){
    if(!host||host.dataset.mounted==='1')return;
    host.dataset.mounted='1';
    const locale=host.dataset.locale==='vi'?'vi':'en';
    const section=host.dataset.section||currentSection();
    const L=labels(locale),D=download(locale);
    const langFlag=locale==='vi'?FLAG_UK:FLAG_VN;
    host.className='wdr-global-header';
    host.innerHTML='<div class="wdr-brand-wrap"><span class="wdr-brand">Wistudi</span><span class="wdr-room-title">'+L.room+'</span></div>'+
      '<nav class="wdr-nav" aria-label="'+L.room+'">'+
      '<a class="wdr-pill compact '+(section==='contents'?'is-active':'')+'" data-room-action="contents" href="'+navHref(locale,'contents')+'">'+ICONS.contents+'<span class="wdr-pill-label compact">'+L.contents+'</span></a>'+
      '<a class="wdr-pill optional" data-room-action="platform-video" href="'+navHref(locale,'platform-video')+'">'+ICONS.play+'<span class="wdr-pill-label optional">'+L.platform+'</span></a>'+
      '<a class="wdr-pill optional" data-room-action="event-video" href="'+navHref(locale,'event-video')+'">'+ICONS.play+'<span class="wdr-pill-label optional">'+L.event+'</span></a>'+
      '<a class="wdr-pill compact '+(section==='releases'?'is-active':'')+'" href="'+pathFor(locale,'releases')+'">'+ICONS.star+'<span class="wdr-pill-label compact">'+L.releases+'</span></a>'+
      '<a class="wdr-pill compact '+(section==='gallery'?'is-active':'')+'" href="'+pathFor(locale,'gallery')+'">'+ICONS.gallery+'<span class="wdr-pill-label compact">'+L.gallery+'</span></a>'+
      '<details class="wdr-downloads"><summary class="wdr-pill compact">'+ICONS.download+'<span class="wdr-pill-label compact">'+L.downloads+'</span><span aria-hidden="true">⌄</span></summary><div class="wdr-download-popover"><div class="wdr-download-head"><span>'+L.downloads+'</span><span>'+L.code+'</span></div><a class="wdr-download-item" href="'+D.href+'" download><span class="wdr-file-icon">PDF</span><span class="wdr-download-copy"><strong>'+D.title+'</strong><span>'+D.meta+'</span></span><span class="wdr-download-arrow">↓</span></a></div></details>'+
      '<span class="wdr-pill wdr-presence" aria-label="'+L.viewing+'"><span class="wdr-presence-dot"></span><span class="wdr-presence-text" data-wdr-presence>1 '+L.viewing+'</span></span>'+
      '<a class="wdr-pill optional" data-room-action="notes" href="'+navHref(locale,'notes')+'">'+ICONS.note+'<span class="wdr-pill-label optional">'+L.notes+'</span></a>'+
      '<a class="wdr-pill wdr-language" data-language-switch href="'+targetLanguageHref(locale,section)+'" title="'+L.language+'" aria-label="'+L.language+'">'+langFlag+'<span class="wdr-language-code">'+L.code+'</span></a>'+
      '<a class="wdr-icon" href="https://global.wistudi.com" target="_blank" rel="noopener" title="'+L.website+'" aria-label="'+L.website+'">'+ICONS.globe+'</a>'+
      '<a class="wdr-open" href="https://wistudi.com/sign-in" target="_blank" rel="noopener">'+L.open+'</a>'+
      '</nav>';
    document.body.classList.add('wdr-has-header');
    host.querySelector('[data-language-switch]')?.addEventListener('click',function(){
      try{sessionStorage.setItem('wistudi_distributor_language',locale==='vi'?'en':'vi')}catch(_){}
    });
    host.querySelectorAll('[data-room-action]').forEach(a=>a.addEventListener('click',function(e){
      const base=pathFor(locale,'contents').replace(/\/$/,'');
      const here=location.pathname.replace(/\/$/,'');
      if(here===base){
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('wistudi:header-action',{detail:{action:a.dataset.roomAction}}));
      }
    }));
    document.addEventListener('click',function(e){
      document.querySelectorAll('.wdr-downloads[open]').forEach(d=>{if(!d.contains(e.target))d.removeAttribute('open')});
    });
    const rootPath=pathFor(locale,'contents').replace(/\/$/,'');
    const herePath=location.pathname.replace(/\/$/,'');
    if(herePath!==rootPath)startPresence(host,locale,L);
  }
  function startPresence(host,locale,L){
    let identity=null;try{identity=JSON.parse(sessionStorage.getItem('wistudi_distributor_identity')||'null')}catch(_){}
    if(!identity?.name)return;
    const id=identity.session||('wdr-'+Date.now()+'-'+Math.random().toString(36).slice(2));
    try{
      const protocol=location.protocol==='https:'?'wss:':'ws:';
      const ws=new WebSocket(protocol+'//'+location.host+'/api/investor-room/presence?session='+encodeURIComponent(id));
      ws.addEventListener('open',()=>ws.send(JSON.stringify({type:'join',name:identity.name,organisation:identity.organisation||'',email:identity.email||'',wst:new URLSearchParams(location.search).get('wst')||''})));
      ws.addEventListener('message',e=>{try{const m=JSON.parse(e.data);if(m.type==='presence'){const n=Math.max(1,Number(m.count)||1);host.querySelectorAll('[data-wdr-presence]').forEach(el=>el.textContent=n+' '+L.viewing)}}catch(_){}});
      window.addEventListener('pagehide',()=>{try{ws.close()}catch(_){}},{once:true});
    }catch(_){}
  }
  function setPresence(count){
    const n=Math.max(1,Number(count)||1);
    document.querySelectorAll('.wdr-global-header').forEach(host=>{
      const locale=host.dataset.locale==='vi'?'vi':'en',L=labels(locale);
      host.querySelectorAll('[data-wdr-presence]').forEach(el=>el.textContent=n+' '+L.viewing);
    });
  }
  window.WistudiDistributorHeader={mount,setPresence};
  document.querySelectorAll('[data-distributor-header]').forEach(mount);
})();