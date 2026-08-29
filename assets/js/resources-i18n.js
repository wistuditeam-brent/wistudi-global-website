(()=>{
  'use strict';
  const supported=['en','vi','zh-cn','th','id','ms','ar'];
  const parts=location.pathname.split('/').filter(Boolean);
  const explicit=supported.includes((parts[0]||'').toLowerCase())?(parts[0]||'').toLowerCase():null;
  const locale=explicit||'en';
  const bare=location.pathname.replace(/^\/(vi|zh-cn|th|id|ms|ar)(?=\/)/,'');
  const isHome=bare==='/resources/'||bare==='/resources'||bare==='/resources/index.html';
  if(!isHome)return;

  const chrome={
    vi:{'Platform':'Nền tảng','Blocks & Activities':'Khối & Hoạt động','Organisations':'Tổ chức','Resources':'Tài nguyên','Contact':'Liên hệ','Talk to us':'Trao đổi với chúng tôi','Start publishing':'Bắt đầu xuất bản','Interactive learning, publishing and delivery in one connected platform.':'Học tập tương tác, xuất bản và phân phối trong một nền tảng kết nối.','Contact Wistudi':'Liên hệ Wistudi','New resources':'Tài nguyên mới','Language':'Ngôn ngữ','Open menu':'Mở menu','Wistudi home':'Trang chủ Wistudi'},
    'zh-cn':{'Platform':'平台','Blocks & Activities':'模块与活动','Organisations':'机构','Resources':'资源','Contact':'联系','Talk to us':'联系我们','Start publishing':'开始发布','Interactive learning, publishing and delivery in one connected platform.':'互动学习、出版与交付，尽在一个互联平台。','Contact Wistudi':'联系 Wistudi','New resources':'新资源','Language':'语言','Open menu':'打开菜单','Wistudi home':'Wistudi 首页'},
    th:{'Platform':'แพลตฟอร์ม','Blocks & Activities':'บล็อกและกิจกรรม','Organisations':'องค์กร','Resources':'ทรัพยากร','Contact':'ติดต่อ','Talk to us':'พูดคุยกับเรา','Start publishing':'เริ่มเผยแพร่','Interactive learning, publishing and delivery in one connected platform.':'การเรียนรู้แบบโต้ตอบ การเผยแพร่ และการส่งมอบในแพลตฟอร์มที่เชื่อมต่อเป็นหนึ่งเดียว','Contact Wistudi':'ติดต่อ Wistudi','New resources':'ทรัพยากรใหม่','Language':'ภาษา','Open menu':'เปิดเมนู','Wistudi home':'หน้าแรก Wistudi'},
    id:{'Platform':'Platform','Blocks & Activities':'Blok & Aktivitas','Organisations':'Organisasi','Resources':'Sumber Daya','Contact':'Kontak','Talk to us':'Hubungi kami','Start publishing':'Mulai menerbitkan','Interactive learning, publishing and delivery in one connected platform.':'Pembelajaran interaktif, penerbitan, dan penyampaian dalam satu platform yang terhubung.','Contact Wistudi':'Hubungi Wistudi','New resources':'Sumber daya baru','Language':'Bahasa','Open menu':'Buka menu','Wistudi home':'Beranda Wistudi'},
    ms:{'Platform':'Platform','Blocks & Activities':'Blok & Aktiviti','Organisations':'Organisasi','Resources':'Sumber','Contact':'Hubungi','Talk to us':'Hubungi kami','Start publishing':'Mula menerbit','Interactive learning, publishing and delivery in one connected platform.':'Pembelajaran interaktif, penerbitan dan penyampaian dalam satu platform yang saling berhubung.','Contact Wistudi':'Hubungi Wistudi','New resources':'Sumber baharu','Language':'Bahasa','Open menu':'Buka menu','Wistudi home':'Laman utama Wistudi'},
    ar:{'Platform':'المنصة','Blocks & Activities':'الكتل والأنشطة','Organisations':'المؤسسات','Resources':'الموارد','Contact':'تواصل','Talk to us':'تحدث معنا','Start publishing':'ابدأ النشر','Interactive learning, publishing and delivery in one connected platform.':'التعلم التفاعلي والنشر والتقديم في منصة واحدة مترابطة.','Contact Wistudi':'تواصل مع Wistudi','New resources':'موارد جديدة','Language':'اللغة','Open menu':'فتح القائمة','Wistudi home':'الصفحة الرئيسية لـ Wistudi'}
  };

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
    const strings=Object.assign({},chrome[locale]||{},dict?.strings||{});
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
