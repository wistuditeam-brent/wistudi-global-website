(()=>{
  'use strict';
  if(window.__WISTUDI_RESOURCES_I18N__) return;
  window.__WISTUDI_RESOURCES_I18N__=true;

  const supported=['en','vi','zh-cn','th','id','ms','ar'];
  const parts=location.pathname.split('/').filter(Boolean);
  const explicit=supported.includes((parts[0]||'').toLowerCase())?(parts[0]||'').toLowerCase():null;
  const locale=explicit||'en';
  const bare=location.pathname.replace(/^\/(vi|zh-cn|th|id|ms|ar)(?=\/)/,'')||'/';
  if(!(bare==='/resources'||bare==='/resources/'||bare.startsWith('/resources/'))) return;

  const chrome={
    vi:{'Platform':'Nền tảng','Blocks & Activities':'Khối & Hoạt động','Organisations':'Tổ chức','Resources':'Tài nguyên','Contact':'Liên hệ','Talk to us':'Trao đổi với chúng tôi','Start publishing':'Bắt đầu xuất bản','Interactive learning, publishing and delivery in one connected platform.':'Học tập tương tác, xuất bản và phân phối trong một nền tảng kết nối.','Contact Wistudi':'Liên hệ Wistudi','New resources':'Tài nguyên mới','Language':'Ngôn ngữ','Open menu':'Mở menu','Wistudi home':'Trang chủ Wistudi'},
    'zh-cn':{'Platform':'平台','Blocks & Activities':'模块与活动','Organisations':'机构','Resources':'资源','Contact':'联系','Talk to us':'联系我们','Start publishing':'开始发布','Interactive learning, publishing and delivery in one connected platform.':'互动学习、出版与交付，尽在一个互联平台。','Contact Wistudi':'联系 Wistudi','New resources':'新资源','Language':'语言','Open menu':'打开菜单','Wistudi home':'Wistudi 首页'},
    th:{'Platform':'แพลตฟอร์ม','Blocks & Activities':'บล็อกและกิจกรรม','Organisations':'องค์กร','Resources':'ทรัพยากร','Contact':'ติดต่อ','Talk to us':'พูดคุยกับเรา','Start publishing':'เริ่มเผยแพร่','Interactive learning, publishing and delivery in one connected platform.':'การเรียนรู้แบบโต้ตอบ การเผยแพร่ และการส่งมอบในแพลตฟอร์มที่เชื่อมต่อเป็นหนึ่งเดียว','Contact Wistudi':'ติดต่อ Wistudi','New resources':'ทรัพยากรใหม่','Language':'ภาษา','Open menu':'เปิดเมนู','Wistudi home':'หน้าแรก Wistudi'},
    id:{'Platform':'Platform','Blocks & Activities':'Blok & Aktivitas','Organisations':'Organisasi','Resources':'Sumber Daya','Contact':'Kontak','Talk to us':'Hubungi kami','Start publishing':'Mulai menerbitkan','Interactive learning, publishing and delivery in one connected platform.':'Pembelajaran interaktif, penerbitan, dan penyampaian dalam satu platform yang terhubung.','Contact Wistudi':'Hubungi Wistudi','New resources':'Sumber daya baru','Language':'Bahasa','Open menu':'Buka menu','Wistudi home':'Beranda Wistudi'},
    ms:{'Platform':'Platform','Blocks & Activities':'Blok & Aktiviti','Organisations':'Organisasi','Resources':'Sumber','Contact':'Hubungi','Talk to us':'Hubungi kami','Start publishing':'Mula menerbit','Interactive learning, publishing and delivery in one connected platform.':'Pembelajaran interaktif, penerbitan dan penyampaian dalam satu platform yang saling berhubung.','Contact Wistudi':'Hubungi Wistudi','New resources':'Sumber baharu','Language':'Bahasa','Open menu':'Buka menu','Wistudi home':'Laman utama Wistudi'},
    ar:{'Platform':'المنصة','Blocks & Activities':'الكتل والأنشطة','Organisations':'المؤسسات','Resources':'الموارد','Contact':'تواصل','Talk to us':'تحدث معنا','Start publishing':'ابدأ النشر','Interactive learning, publishing and delivery in one connected platform.':'التعلم التفاعلي والنشر والتقديم في منصة واحدة مترابطة.','Contact Wistudi':'تواصل مع Wistudi','New resources':'موارد جديدة','Language':'اللغة','Open menu':'فتح القائمة','Wistudi home':'الصفحة الرئيسية لـ Wistudi'}
  };

  const plural={
    vi:{note:'ghi chú',notes:'ghi chú'},'zh-cn':{note:'篇',notes:'篇'},th:{note:'รายการ',notes:'รายการ'},id:{note:'catatan',notes:'catatan'},ms:{note:'catatan',notes:'catatan'},ar:{note:'ملاحظة',notes:'ملاحظات'}
  };
  const dateLocales={vi:'vi-VN','zh-cn':'zh-CN',th:'th-TH',id:'id-ID',ms:'ms-MY',ar:'ar'};

  const pending=()=>{
    if(locale==='en') return;
    document.documentElement.classList.add('ws-res-i18n-pending');
    if(document.getElementById('ws-res-i18n-preload'))return;
    const s=document.createElement('style');
    s.id='ws-res-i18n-preload';
    s.textContent='html.ws-res-i18n-pending body{opacity:0}html.ws-res-i18n-ready body{opacity:1;transition:opacity .12s ease}';
    document.head.appendChild(s);
  };
  pending();

  const reveal=()=>{
    document.documentElement.classList.add('ws-res-i18n-ready');
    document.documentElement.classList.remove('ws-res-i18n-pending');
    document.getElementById('ws-res-i18n-preload')?.remove();
  };

  if(!explicit){
    let stored=null;
    try{stored=localStorage.getItem('wistudi_locale')}catch(_){}
    if(stored&&supported.includes(stored)&&stored!=='en'){
      const target='/'+stored+(bare.startsWith('/')?bare:'/'+bare)+location.search+location.hash;
      location.replace(target);
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
      const clean=u.pathname.replace(/^\/(vi|zh-cn|th|id|ms|ar)(?=\/)/,'');
      if(clean==='/resources'||clean==='/resources/'||clean.startsWith('/resources/')){
        el.setAttribute(attr,`/${locale}${clean.startsWith('/')?clean:'/'+clean}${u.search||''}${u.hash||''}`);
      }
    });
  };

  const fetchJson=async url=>{
    try{const r=await fetch(url,{cache:'default'});return r.ok?await r.json():null}catch(_){return null}
  };

  const translate=(dict)=>{
    const strings=Object.assign({},chrome[locale]||{},dict||{});
    const translateNode=node=>{
      if(!node)return;
      if(node.nodeType===Node.TEXT_NODE){
        const raw=node.nodeValue||'';
        const key=normalize(raw);
        if(!key)return;
        let value=strings[key];
        if(!value){
          const m=key.match(/^(\d+)\s+(note|notes)$/i);
          if(m&&plural[locale])value=`${m[1]} ${plural[locale][m[2].toLowerCase()]||plural[locale].notes}`;
        }
        if(!value)return;
        const lead=(raw.match(/^\s*/)||[''])[0];
        const trail=(raw.match(/\s*$/)||[''])[0];
        node.nodeValue=lead+value+trail;
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

    translateNode(document.body);
    const observer=new MutationObserver(records=>records.forEach(record=>{
      if(record.type==='characterData')translateNode(record.target);
      record.addedNodes?.forEach(translateNode);
    }));
    observer.observe(document.body,{childList:true,characterData:true,subtree:true});
    window.__WISTUDI_RESOURCES_TRANSLATE_NODE__=translateNode;
  };

  const localizeDates=()=>{
    if(locale==='en'||!dateLocales[locale])return;
    document.querySelectorAll('[data-ws-resource-date]').forEach(el=>{
      const raw=el.getAttribute('data-ws-resource-date');
      if(!raw)return;
      try{el.textContent=new Intl.DateTimeFormat(dateLocales[locale],{day:'numeric',month:'short',year:'numeric'}).format(new Date(raw))}catch(_){}
    });
  };

  const addRtl=()=>{
    if(locale!=='ar')return;
    document.documentElement.dir='rtl';
    if(document.getElementById('resources-rtl-fix'))return;
    const style=document.createElement('style');
    style.id='resources-rtl-fix';
    style.textContent=`
      [dir="rtl"] .res-hero-grid,[dir="rtl"] .res-head,[dir="rtl"] .res-definition,[dir="rtl"] .res-article-head,[dir="rtl"] .res-article-body,[dir="rtl"] .res-article-aside,[dir="rtl"] .res-soon-inner,[dir="rtl"] .res-control-row{direction:rtl;text-align:right}
      [dir="rtl"] .res-search,[dir="rtl"] .res-byline,[dir="rtl"] .res-card-meta,[dir="rtl"] .res-results-meta{direction:rtl}
      [dir="rtl"] .res-feature-copy,[dir="rtl"] .res-card-body,[dir="rtl"] .res-question-intro,[dir="rtl"] .res-progressive-card,[dir="rtl"] .res-related-card{text-align:right}
      [dir="rtl"] .res-list-card{direction:rtl;text-align:right}
      [dir="rtl"] .res-list-arrow{transform:scaleX(-1)}
    `;
    document.head.appendChild(style);
  };

  const apply=async()=>{
    localizeResourceLinks();
    addRtl();
    if(locale==='en'){reveal();return;}
    try{
      const [home,extra]=await Promise.all([
        fetchJson(`/assets/i18n/${locale}-resources-home.json`),
        fetchJson(`/assets/i18n/${locale}-resources-extra.json`)
      ]);
      if(!home&&!extra)throw new Error('resources translations unavailable');
      const strings=Object.assign({},home?.strings||home||{},extra?.strings||extra||{});
      translate(strings);
      const titleMap=Object.assign({},home?.titles||{},extra?.titles||{});
      const metaMap=Object.assign({},home?.descriptions||{},extra?.descriptions||{});
      if(titleMap[bare])document.title=titleMap[bare];
      const meta=document.querySelector('meta[name="description"]');
      if(metaMap[bare]&&meta)meta.setAttribute('content',metaMap[bare]);
      localizeDates();
      localizeResourceLinks();
    }catch(err){
      console.warn('[Wistudi resources i18n]',err);
    }finally{
      reveal();
    }
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});
  else apply();
})();
