import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const write=(p,v)=>fs.writeFileSync(p,v);
function replaceOnce(text,find,repl,label){
  if(!text.includes(find))throw new Error(`Patch target missing: ${label}`);
  return text.replace(find,repl);
}

const locales=['vi','zh-cn','th','id','ms','ar'];
const articleSlug='wistudi-at-vietnam-edtech-expo-2026';
const articlePath=`/resources/community-notes/${articleSlug}/`;
const articleTranslations=Object.fromEntries(locales.map(code=>[code,JSON.parse(read(`assets/data/article-translations/${articleSlug}.${code}.json`))]));

// 1) Make global Resources navigation locale-aware instead of disabling itself on localized pages.
{
  const path='assets/js/resources-global.js';
  let s=read(path);
  s=replaceOnce(s,
`  const supported=new Set(['vi','zh-cn','th','id','ms','ar']);
  const first=(location.pathname.split('/').filter(Boolean)[0]||'').toLowerCase();
  if(supported.has(first))return;
  const ready=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();`,
`  const supported=new Set(['vi','zh-cn','th','id','ms','ar']);
  const first=(location.pathname.split('/').filter(Boolean)[0]||'').toLowerCase();
  const locale=supported.has(first)?first:'en';
  const prefix=locale==='en'?'':\`/\${locale}\`;
  const localized=path=>\`\${prefix}\${path}\`;
  const UI={
    en:{resources:'Resources',newResources:'New resources',latest:'Latest Community Note',from:'From Community Notes',read:'Read the note →'},
    vi:{resources:'Tài nguyên',newResources:'Tài nguyên mới',latest:'Ghi chú cộng đồng mới nhất',from:'Từ Ghi chú cộng đồng',read:'Đọc ghi chú →'},
    'zh-cn':{resources:'资源',newResources:'新资源',latest:'最新社区札记',from:'来自社区札记',read:'阅读札记 →'},
    th:{resources:'ทรัพยากร',newResources:'ทรัพยากรใหม่',latest:'บันทึกชุมชนล่าสุด',from:'จากบันทึกชุมชน',read:'อ่านบันทึก →'},
    id:{resources:'Sumber Daya',newResources:'Sumber daya baru',latest:'Catatan Komunitas Terbaru',from:'Dari Catatan Komunitas',read:'Baca catatan →'},
    ms:{resources:'Sumber',newResources:'Sumber baharu',latest:'Nota Komuniti Terkini',from:'Daripada Nota Komuniti',read:'Baca nota →'},
    ar:{resources:'الموارد',newResources:'موارد جديدة',latest:'أحدث ملاحظة مجتمع',from:'من ملاحظات المجتمع',read:'اقرأ الملاحظة ←'}
  }[locale]||null;
  const ready=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();`,
'localized Resources bootstrap');
  s=replaceOnce(s,
`  const isHome=()=>{const p=location.pathname.replace(/\\/+$/,'');return p===''||p==='/index.html';};`,
`  const isHome=()=>{const parts=location.pathname.split('/').filter(Boolean);if(parts.length&&supported.has(parts[0].toLowerCase()))parts.shift();const p='/'+parts.join('/');return p==='/'||p==='/index.html';};`,
'localized home detection');
  s=replaceOnce(s,
`    const a=document.createElement('a');a.href='/resources/';a.textContent='Resources';a.className='ws-resource-nav-link';a.dataset.wsResourcesLink='true';
    const b=document.createElement('span');b.className='ws-resource-badge';b.hidden=true;b.setAttribute('aria-label','New resources');`,
`    const a=document.createElement('a');a.href=localized('/resources/');a.textContent=UI.resources;a.className='ws-resource-nav-link';a.dataset.wsResourcesLink='true';
    const b=document.createElement('span');b.className='ws-resource-badge';b.hidden=true;b.setAttribute('aria-label',UI.newResources);`,
'localized Resources link');
  s=s.replaceAll(`nav.querySelector('a[href="/resources/"]')`,`nav.querySelector('a[data-ws-resources-link]')`);
  s=replaceOnce(s,
`      const a=document.createElement('a');a.href='/resources/';a.textContent='Resources';const contact=[...nav.querySelectorAll('a')].find(x=>/contact/i.test(x.textContent));`,
`      const a=document.createElement('a');a.href=localized('/resources/');a.textContent=UI.resources;const contact=[...nav.querySelectorAll('a')].find(x=>/contact/i.test(x.textContent));`,
'localized footer Resources link');
  s=replaceOnce(s,`    const a=articles[0],l=a.locales.en;`,`    const a=articles[0],l=a.locales?.[locale]||a.locales.en;`,'localized home article metadata');
  s=replaceOnce(s,
`    const section=document.createElement('section');section.className='ws-home-note-section';section.setAttribute('aria-label','Latest Community Note');
    section.innerHTML=\`<div class="ws-home-note-wrap"><a class="ws-home-note-media" href="\${l.url}"><img src="\${a.heroImage}" alt="\${escape(a.heroAlt||l.title)}" loading="lazy" decoding="async"></a><div class="ws-home-note-copy"><div class="ws-home-note-eyebrow">From Community Notes · \${escape(a.type)}</div><h2><a href="\${l.url}">\${escape(l.title)}</a></h2><p>\${escape(l.excerpt)}</p></div><a class="ws-home-note-action" href="\${l.url}">Read the note →</a></div>\`;`,
`    const section=document.createElement('section');section.className='ws-home-note-section';section.setAttribute('aria-label',UI.latest);
    section.innerHTML=\`<div class="ws-home-note-wrap"><a class="ws-home-note-media" href="\${l.url}"><img src="\${a.heroImage}" alt="\${escape(a.heroAlt||l.title)}" loading="lazy" decoding="async"></a><div class="ws-home-note-copy"><div class="ws-home-note-eyebrow">\${UI.from} · \${escape(a.type)}</div><h2><a href="\${l.url}">\${escape(l.title)}</a></h2><p>\${escape(l.excerpt)}</p></div><a class="ws-home-note-action" href="\${l.url}">\${UI.read}</a></div>\`;`,
'localized home note UI');
  write(path,s);
}

// 2) Extend site i18n routing and load Resources-specific dictionaries only when needed.
{
  const path='assets/js/i18n.js';
  let s=read(path);
  s=replaceOnce(s,
`  const knownPages=['/','/index.html','/platform/','/platform/index.html','/blocks-activities/','/blocks-activities/index.html','/organisations/','/organisations/index.html','/contact/','/contact/index.html'];`,
`  const knownPages=['/','/index.html','/platform/','/platform/index.html','/blocks-activities/','/blocks-activities/index.html','/organisations/','/organisations/index.html','/contact/','/contact/index.html','/resources/','/resources/all/','/resources/guides/','/resources/events/','${articlePath}'];`,
'Resources known pages');
  s=replaceOnce(s,
`      const recognized=knownPages.some(p=>normalizeSeoPath(p)===normalizeSeoPath(stripped))||normalized==='/'||normalized.startsWith('/blocks-activities/')||normalized.startsWith('/organisations/')||normalized.startsWith('/contact/');`,
`      const recognized=knownPages.some(p=>normalizeSeoPath(p)===normalizeSeoPath(stripped))||normalized==='/'||normalized.startsWith('/blocks-activities/')||normalized.startsWith('/organisations/')||normalized.startsWith('/contact/')||normalized.startsWith('/resources/');`,
'Resources internal links');
  s=replaceOnce(s,
`      const [base,site,extra]=await Promise.all([
        fetchDictionary(\`/assets/i18n/\${detected}.json\`),
        fetchDictionary(\`/assets/i18n/\${detected}-site.json\`),
        fetchDictionary(\`/assets/i18n/\${detected}-extra.json\`)
      ]);
      if(!base)throw new Error('base translation unavailable');
      const dict=Object.assign({},base.strings||base,site?.strings||site||{},extra?.strings||extra||{});
      const titles=Object.assign({},base.titles||{},site?.titles||{},extra?.titles||{});`,
`      const isResources=seoPath.startsWith('/resources/');
      const [base,site,extra,resources]=await Promise.all([
        fetchDictionary(\`/assets/i18n/\${detected}.json\`),
        fetchDictionary(\`/assets/i18n/\${detected}-site.json\`),
        fetchDictionary(\`/assets/i18n/\${detected}-extra.json\`),
        isResources?fetchDictionary(\`/assets/i18n/\${detected}-resources.json\`):Promise.resolve(null)
      ]);
      if(!base)throw new Error('base translation unavailable');
      const dict=Object.assign({},base.strings||base,site?.strings||site||{},extra?.strings||extra||{},resources?.strings||resources||{});
      const titles=Object.assign({},base.titles||{},site?.titles||{},extra?.titles||{},resources?.titles||{});`,
'Resources dictionary loader');
  write(path,s);
}

// 3) Make archive rendering respect the current locale and load the article-level translation UI.
{
  const path='assets/js/resources-page-shell.js';
  let s=read(path);
  s=replaceOnce(s,
`  const FALLBACK='/assets/images/resources/media-fallback.svg';`,
`  const FALLBACK='/assets/images/resources/media-fallback.svg';
  const supported=new Set(['vi','zh-cn','th','id','ms','ar']);
  const first=(location.pathname.split('/').filter(Boolean)[0]||'').toLowerCase();
  const locale=supported.has(first)?first:'en';
  const intlLocale=locale==='zh-cn'?'zh-CN':locale;
  const localized=path=>locale==='en'?path:\`/\${locale}\${path}\`;
  const countLabels={
    en:{one:'note',many:'notes',none:'No notes available'},
    vi:{one:'ghi chú',many:'ghi chú',none:'Chưa có ghi chú'},
    'zh-cn':{one:'条札记',many:'条札记',none:'暂无札记'},
    th:{one:'บันทึก',many:'บันทึก',none:'ยังไม่มีบันทึก'},
    id:{one:'catatan',many:'catatan',none:'Belum ada catatan'},
    ms:{one:'nota',many:'nota',none:'Belum ada nota'},
    ar:{one:'ملاحظة',many:'ملاحظات',none:'لا توجد ملاحظات بعد'}
  }[locale]||null;`,
'archive locale helpers');
  s=replaceOnce(s,`    if(!articles.length){if(count&&count.textContent.includes('Loading'))count.textContent='No notes available';return;}`,`    if(!articles.length){if(count)count.textContent=countLabels.none;return;}`,'localized archive empty count');
  s=replaceOnce(s,`    const formatDate=value=>{try{return new Intl.DateTimeFormat('en',{day:'numeric',month:'short',year:'numeric'}).format(new Date(value));}catch(_){return '';}};`,`    const formatDate=value=>{try{return new Intl.DateTimeFormat(intlLocale,{day:'numeric',month:'short',year:'numeric'}).format(new Date(value));}catch(_){return '';}};`,'localized archive date');
  s=replaceOnce(s,`    const makeCard=a=>{const l=a.locales.en;return \`<a class="res-list-card" href="\${l.url}">`,`    const makeCard=a=>{const l=a.locales?.[locale]||a.locales.en;const href=l.url||(locale==='en'?a.locales.en.url:localized(a.locales.en.url));return \`<a class="res-list-card" href="\${href}">`,'localized archive card');
  s=replaceOnce(s,`      let filtered=articles.filter(a=>{const l=a.locales.en;const hay=[l.title,l.excerpt,a.type,...(a.topics||[])].join(' ').toLowerCase();`,`      let filtered=articles.filter(a=>{const l=a.locales?.[locale]||a.locales.en;const hay=[l.title,l.excerpt,a.type,...(a.topics||[])].join(' ').toLowerCase();`,'localized archive search');
  s=replaceOnce(s,`      if(count)count.textContent=\`\${filtered.length} \${filtered.length===1?'note':'notes'}\`;`,`      if(count)count.textContent=\`\${filtered.length} \${filtered.length===1?countLabels.one:countLabels.many}\`;`,'localized archive count');
  s=replaceOnce(s,
`  ready(()=>{ensureResourceStyles();markSeen();initImageFallbacks();initHeader();initLightbox();initArchive();});`,
`  ready(()=>{
    ensureResourceStyles();markSeen();initImageFallbacks();initHeader();initLightbox();initArchive();
    if(document.body.classList.contains('page-resource-article')){
      ensureStylesheet('/assets/css/article-language.css');
      if(!document.querySelector('script[src="/assets/js/article-language.js"]')){const script=document.createElement('script');script.src='/assets/js/article-language.js';script.async=true;document.head.appendChild(script);}
    }
  });`,
'article language loader');
  write(path,s);
}

// 4) Add localized metadata and URLs to the manifest so dynamic archive cards use the selected language.
{
  const path='assets/data/resources-manifest.json';
  const manifest=JSON.parse(read(path));
  const article=manifest.articles.find(a=>a.id==='wistudi-vietnam-edtech-expo-2026');
  if(!article)throw new Error('Expo article missing from manifest');
  for(const code of locales){
    const t=articleTranslations[code];
    article.locales[code]={
      slug:articleSlug,title:t.title,excerpt:t.deck,
      url:`/${code}${articlePath}`,
      seoTitle:t.seoTitle,metaDescription:t.metaDescription
    };
  }
  manifest.generatedAt='2026-08-29T20:20:00+07:00';
  write(path,JSON.stringify(manifest,null,2)+'\n');
}

// 5) Make Cloudflare serve locale-prefixed Resources routes and provide localized SEO metadata.
{
  const path='functions/_middleware.js';
  let s=read(path);
  if(!s.includes('const RESOURCE_PAGE_META =')){
    const labels={en:'Resources',vi:'Tài nguyên','zh-cn':'资源',th:'ทรัพยากร',id:'Sumber Daya',ms:'Sumber',ar:'الموارد'};
    const meta={
      '/resources/':{type:'CollectionPage',image:'/assets/images/resources/expo-2026/expo-hero.png',label:labels,title:{en:'Community Notes | Wistudi Resources',vi:'Ghi chú cộng đồng | Tài nguyên Wistudi','zh-cn':'社区札记 | Wistudi 资源',th:'บันทึกชุมชน | ทรัพยากร Wistudi',id:'Catatan Komunitas | Sumber Daya Wistudi',ms:'Nota Komuniti | Sumber Wistudi',ar:'ملاحظات المجتمع | موارد Wistudi'},description:{en:'Community Notes from Wistudi: practical ideas, observations and perspectives on learning, publishing and EdTech.',vi:'Ghi chú cộng đồng từ Wistudi: ý tưởng, quan sát và góc nhìn thực tế về học tập, xuất bản và EdTech.','zh-cn':'来自 Wistudi 的社区札记：关于学习、出版和 EdTech 的实用想法、观察与观点。',th:'บันทึกชุมชนจาก Wistudi: แนวคิด ข้อสังเกต และมุมมองเชิงปฏิบัติเกี่ยวกับการเรียนรู้ การเผยแพร่ และ EdTech',id:'Catatan Komunitas dari Wistudi: ide, pengamatan, dan perspektif praktis tentang pembelajaran, penerbitan, dan EdTech.',ms:'Nota Komuniti daripada Wistudi: idea, pemerhatian dan perspektif praktikal tentang pembelajaran, penerbitan dan EdTech.',ar:'ملاحظات مجتمع من Wistudi: أفكار وملاحظات ووجهات نظر عملية حول التعلم والنشر وEdTech.'}},
      '/resources/all/':{type:'CollectionPage',image:'/assets/images/resources/expo-2026/expo-hero.png',label:labels,title:{en:'Browse Community Notes | Wistudi Resources',vi:'Duyệt Ghi chú cộng đồng | Tài nguyên Wistudi','zh-cn':'浏览社区札记 | Wistudi 资源',th:'เรียกดูบันทึกชุมชน | ทรัพยากร Wistudi',id:'Jelajahi Catatan Komunitas | Sumber Daya Wistudi',ms:'Lihat Nota Komuniti | Sumber Wistudi',ar:'تصفح ملاحظات المجتمع | موارد Wistudi'},description:{en:'Search and browse Wistudi Community Notes by topic, type and date.',vi:'Tìm kiếm và duyệt Ghi chú cộng đồng Wistudi theo chủ đề, loại và ngày.','zh-cn':'按主题、类型和日期搜索与浏览 Wistudi 社区札记。',th:'ค้นหาและเรียกดูบันทึกชุมชน Wistudi ตามหัวข้อ ประเภท และวันที่',id:'Cari dan jelajahi Catatan Komunitas Wistudi berdasarkan topik, jenis, dan tanggal.',ms:'Cari dan lihat Nota Komuniti Wistudi mengikut topik, jenis dan tarikh.',ar:'ابحث وتصفح ملاحظات مجتمع Wistudi حسب الموضوع والنوع والتاريخ.'}},
      '/resources/guides/':{type:'CollectionPage',image:'/assets/images/resources/expo-2026/expo-demo-01.png',label:labels,title:{en:'Guides & Resources | Wistudi Resources',vi:'Hướng dẫn & Tài nguyên | Wistudi','zh-cn':'指南与资源 | Wistudi',th:'คู่มือและทรัพยากร | Wistudi',id:'Panduan & Sumber Daya | Wistudi',ms:'Panduan & Sumber | Wistudi',ar:'الأدلة والموارد | Wistudi'},description:{en:'Practical Wistudi guides, teaching resources, learning-design references and downloadable materials.',vi:'Hướng dẫn thực tế, tài nguyên giảng dạy, tài liệu tham khảo thiết kế học tập và nội dung tải xuống của Wistudi.','zh-cn':'Wistudi 实用指南、教学资源、学习设计参考资料和可下载材料。',th:'คู่มือ Wistudi เชิงปฏิบัติ ทรัพยากรการสอน เอกสารอ้างอิงด้านการออกแบบการเรียนรู้ และไฟล์ดาวน์โหลด',id:'Panduan praktis Wistudi, sumber daya pengajaran, referensi desain pembelajaran, dan materi unduhan.',ms:'Panduan praktikal Wistudi, sumber pengajaran, rujukan reka bentuk pembelajaran dan bahan muat turun.',ar:'أدلة Wistudi العملية وموارد التدريس ومراجع تصميم التعلم والمواد القابلة للتنزيل.'}},
      '/resources/events/':{type:'CollectionPage',image:'/assets/images/resources/expo-2026/expo-demo-03.png',label:labels,title:{en:'Events | Wistudi Resources',vi:'Sự kiện | Tài nguyên Wistudi','zh-cn':'活动 | Wistudi 资源',th:'กิจกรรม | ทรัพยากร Wistudi',id:'Acara | Sumber Daya Wistudi',ms:'Acara | Sumber Wistudi',ar:'الفعاليات | موارد Wistudi'},description:{en:'Upcoming and past Wistudi workshops, webinars, expos and community events.',vi:'Workshop, webinar, triển lãm và sự kiện cộng đồng Wistudi sắp tới và đã diễn ra.','zh-cn':'Wistudi 即将举行和往期的工作坊、网络研讨会、展会及社区活动。',th:'เวิร์กช็อป เว็บบินาร์ งานเอ็กซ์โป และกิจกรรมชุมชน Wistudi ทั้งที่กำลังจะมาถึงและที่ผ่านมา',id:'Lokakarya, webinar, expo, dan acara komunitas Wistudi yang akan datang dan sebelumnya.',ms:'Bengkel, webinar, ekspo dan acara komuniti Wistudi yang akan datang dan yang lalu.',ar:'ورش عمل وندوات ومعارض وفعاليات مجتمع Wistudi القادمة والسابقة.'}}
    };
    const articleMeta={type:'Article',image:'/assets/images/resources/expo-2026/expo-hero.png',label:labels,title:{en:'Wistudi at Vietnam EdTech Expo 2026 in Hanoi'},description:{en:"A field note from Wistudi's Vietnam EdTech Expo 2026 experience in Hanoi, including live demonstrations, educator conversations and new EdTech connections."}};
    for(const code of locales){articleMeta.title[code]=articleTranslations[code].seoTitle;articleMeta.description[code]=articleTranslations[code].metaDescription;}
    meta['${articlePath}']=articleMeta;
    const fallback={type:'WebPage',image:'/assets/images/resources/expo-2026/expo-hero.png',label:labels,title:{en:'Wistudi Resources',vi:'Tài nguyên Wistudi','zh-cn':'Wistudi 资源',th:'ทรัพยากร Wistudi',id:'Sumber Daya Wistudi',ms:'Sumber Wistudi',ar:'موارد Wistudi'},description:{en:'Resources, Community Notes, guides and events from Wistudi.',vi:'Tài nguyên, Ghi chú cộng đồng, hướng dẫn và sự kiện từ Wistudi.','zh-cn':'来自 Wistudi 的资源、社区札记、指南和活动。',th:'ทรัพยากร บันทึกชุมชน คู่มือ และกิจกรรมจาก Wistudi',id:'Sumber daya, Catatan Komunitas, panduan, dan acara dari Wistudi.',ms:'Sumber, Nota Komuniti, panduan dan acara daripada Wistudi.',ar:'موارد وملاحظات مجتمع وأدلة وفعاليات من Wistudi.'}};
    const insert=`\nconst RESOURCE_PAGE_META = ${JSON.stringify(meta,null,2)};\nconst RESOURCE_FALLBACK_META = ${JSON.stringify(fallback,null,2)};\nfunction pageMeta(pagePath){ return SEO_PAGES[pagePath] || RESOURCE_PAGE_META[pagePath] || (pagePath.startsWith('/resources/')?RESOURCE_FALLBACK_META:null); }\n`;
    s=replaceOnce(s,'\n};\n\nconst LEGACY_ALIASES','\n};\n'+insert+'\nconst LEGACY_ALIASES','Resource SEO metadata');
  }
  s=replaceOnce(s,`  return CANONICAL_PAGES.has(path) ? path : null;`,`  return CANONICAL_PAGES.has(path) || path.startsWith('/resources/') ? path : null;`,'localized Resources canonical path');
  s=s.replace(/  var isRootPage=.*?;\n/,`  var isRootPage=/^\\/(?:|index\\.html|platform\\/?|platform\\/index\\.html|blocks-activities\\/?|blocks-activities\\/index\\.html|organisations\\/?|organisations\\/index\\.html|contact\\/?|contact\\/index\\.html)$/.test(location.pathname)||/^\\/resources(?:\\/|$)/.test(location.pathname);\n`);
  s=s.replaceAll('const meta = SEO_PAGES[pagePath];','const meta = pageMeta(pagePath);');
  write(path,s);
}

// 6) Add localized Resources URLs to sitemap.
{
  const path='sitemap.xml';
  let s=read(path);
  const resourcePaths=['/resources/','/resources/all/','/resources/guides/','/resources/events/','${articlePath}'];
  let extra='';
  for(const code of locales){for(const p of resourcePaths){const loc=`https://global.wistudi.com/${code}${p}`;if(!s.includes(`<loc>${loc}</loc>`))extra+=`  <url>\n    <loc>${loc}</loc>\n    <lastmod>2026-08-29</lastmod>\n  </url>\n`;}}
  if(extra)s=s.replace('</urlset>',extra+'</urlset>');
  write(path,s);
}

// 7) Wire localization checks into Resources QA, including the working branch.
{
  const path='.github/workflows/resources-qa.yml';
  let s=read(path);
  if(!s.includes('fix/resources-localization-article-language'))s=s.replace(`      - main\n    paths:`,`      - main\n      - fix/resources-localization-article-language\n    paths:`);
  const anchor=`      - 'assets/data/resources-manifest.json'`;
  const extras=`\n      - 'assets/data/article-translations/**'\n      - 'assets/i18n/*-resources.json'\n      - 'assets/js/article-language.js'\n      - 'assets/css/article-language.css'\n      - 'assets/js/i18n.js'\n      - 'functions/_middleware.js'\n      - 'scripts/resources_localization_qa.mjs'`;
  s=s.replaceAll(anchor,anchor+extras);
  s=replaceOnce(s,`          node --check assets/js/resources-page-shell.js`,`          node --check assets/js/resources-page-shell.js\n          node --check assets/js/article-language.js\n          node --check assets/js/i18n.js\n          node --check scripts/resources_localization_qa.mjs`,'localization syntax checks');
  s=replaceOnce(s,`      - name: Render, scroll, click and inspect desktop and mobile pages\n        run: node scripts/resources_browser_qa.mjs`,`      - name: Render, scroll, click and inspect desktop and mobile pages\n        run: node scripts/resources_browser_qa.mjs\n      - name: Verify Resources localization and article language switching\n        run: node scripts/resources_localization_qa.mjs`,'localization browser QA');
  write(path,s);
}

console.log('Resources localization patch applied successfully.');