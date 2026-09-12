import { onRequest as legacyOnRequest } from './_middleware-core.js';

const SUPPORTED = ['en','vi','zh-cn','th','id','ms','ar'];
const PROD_ORIGIN = 'https://global.wistudi.com';
const RESOURCE_PREFIX = '/resources/';
const NOINDEX_PATHS = new Set(['/resources/all/','/resources/guides/']);
const RESOURCE_LABEL = {en:'Resources',vi:'Tài nguyên','zh-cn':'资源',th:'ทรัพยากร',id:'Sumber Daya',ms:'Sumber',ar:'الموارد'};
const LOCALE_META = {
  en:{lang:'en',dir:'ltr',og:'en_GB'},
  vi:{lang:'vi',dir:'ltr',og:'vi_VN'},
  'zh-cn':{lang:'zh-CN',dir:'ltr',og:'zh_CN'},
  th:{lang:'th',dir:'ltr',og:'th_TH'},
  id:{lang:'id',dir:'ltr',og:'id_ID'},
  ms:{lang:'ms',dir:'ltr',og:'ms_MY'},
  ar:{lang:'ar',dir:'rtl',og:'ar_SA'}
};

// Search intent is deliberately split by page so the core pages do not compete
// for the same generic Wistudi terms.
const CORE_SEO = {
  '/': {
    image:'/assets/media/024ad6399a21183c6bb8.png',
    title:{
      en:'Interactive Learning Platform for Lessons, Video & Worksheets | Wistudi',
      vi:'Nền tảng học tập tương tác cho bài học, video & phiếu bài tập | Wistudi',
      'zh-cn':'互动学习平台：课程、互动视频与可打印工作表 | Wistudi',
      th:'แพลตฟอร์มการเรียนรู้แบบโต้ตอบสำหรับบทเรียน วิดีโอ และใบงาน | Wistudi',
      id:'Platform Pembelajaran Interaktif untuk Pelajaran, Video & Lembar Kerja | Wistudi',
      ms:'Platform Pembelajaran Interaktif untuk Pelajaran, Video & Lembaran Kerja | Wistudi',
      ar:'منصة تعلم تفاعلي للدروس والفيديو وأوراق العمل | Wistudi'
    },
    description:{
      en:'Create interactive lessons and interactive video, publish Flows, generate printable worksheets, manage learners and deliver training from one connected learning platform.',
      vi:'Tạo bài học tương tác và video học tập tương tác, xuất bản Flow, tạo phiếu bài tập có thể in, quản lý người học và triển khai đào tạo trên một nền tảng kết nối.',
      'zh-cn':'使用 Wistudi 创建互动课程和互动视频、发布 Flow、生成可打印工作表、管理学习者并在一个互联平台上开展教学与培训。',
      th:'สร้างบทเรียนและวิดีโอการเรียนรู้แบบโต้ตอบ เผยแพร่ Flow สร้างใบงานพิมพ์ได้ จัดการผู้เรียน และส่งมอบการฝึกอบรมบนแพลตฟอร์มเดียว',
      id:'Buat pelajaran dan video pembelajaran interaktif, terbitkan Flow, hasilkan lembar kerja cetak, kelola pelajar, dan jalankan pelatihan dalam satu platform pembelajaran.',
      ms:'Cipta pelajaran dan video pembelajaran interaktif, terbitkan Flow, hasilkan lembaran kerja boleh cetak, urus pelajar dan jalankan latihan dalam satu platform pembelajaran.',
      ar:'أنشئ دروسًا وفيديوهات تعليمية تفاعلية، وانشر Flows، وأنشئ أوراق عمل قابلة للطباعة، وأدر المتعلمين والتدريب من منصة تعلم واحدة مترابطة.'
    }
  },
  '/blocks-activities/': {
    image:'/assets/media/10dd7a92b026aa52af3d.webp',
    title:{
      en:'Interactive Learning Activities & Lesson Blocks | Wistudi',
      vi:'Hoạt động học tập tương tác & khối bài học | Wistudi',
      'zh-cn':'互动学习活动与课程模块 | Wistudi',
      th:'กิจกรรมการเรียนรู้แบบโต้ตอบและบล็อกบทเรียน | Wistudi',
      id:'Aktivitas Pembelajaran Interaktif & Blok Pelajaran | Wistudi',
      ms:'Aktiviti Pembelajaran Interaktif & Blok Pelajaran | Wistudi',
      ar:'أنشطة تعلم تفاعلية وكتل بناء الدروس | Wistudi'
    },
    description:{
      en:'Create interactive learning activities including quizzes, matching, sorting, whiteboards, polls, video checkpoints and printable worksheet activities for lessons and training.',
      vi:'Tạo hoạt động học tập tương tác như quiz, nối đáp án, sắp xếp, bảng trắng, bình chọn, điểm tương tác trong video và hoạt động phiếu bài tập có thể in.',
      'zh-cn':'创建互动学习活动，包括测验、配对、分类、白板、投票、视频互动检查点以及可打印工作表活动，适用于课程与培训。',
      th:'สร้างกิจกรรมการเรียนรู้แบบโต้ตอบ เช่น แบบทดสอบ จับคู่ จัดหมวดหมู่ ไวท์บอร์ด โพล จุดโต้ตอบในวิดีโอ และกิจกรรมใบงานพิมพ์ได้',
      id:'Buat aktivitas pembelajaran interaktif seperti kuis, mencocokkan, menyortir, papan tulis, polling, checkpoint video, dan aktivitas lembar kerja cetak.',
      ms:'Cipta aktiviti pembelajaran interaktif seperti kuiz, padanan, pengisihan, papan putih, undian, checkpoint video dan aktiviti lembaran kerja boleh cetak.',
      ar:'أنشئ أنشطة تعلم تفاعلية تشمل الاختبارات والمطابقة والفرز والسبورات والاستطلاعات ونقاط التفاعل داخل الفيديو وأنشطة أوراق العمل القابلة للطباعة.'
    }
  },
  '/organisations/': {
    image:'/assets/media/024ad6399a21183c6bb8.png',
    title:{
      en:'Learning Platform for Schools, Training Teams & Publishers | Wistudi',
      vi:'Nền tảng học tập cho trường học, đội ngũ đào tạo & nhà xuất bản | Wistudi',
      'zh-cn':'面向学校、培训团队与出版机构的学习平台 | Wistudi',
      th:'แพลตฟอร์มการเรียนรู้สำหรับโรงเรียน ทีมฝึกอบรม และผู้เผยแพร่ | Wistudi',
      id:'Platform Pembelajaran untuk Sekolah, Tim Pelatihan & Penerbit | Wistudi',
      ms:'Platform Pembelajaran untuk Sekolah, Pasukan Latihan & Penerbit | Wistudi',
      ar:'منصة تعلم للمدارس وفرق التدريب والناشرين | Wistudi'
    },
    description:{
      en:'A learning and publishing platform for schools, universities, training teams and publishers with private workspaces, learner management, reporting and LMS, LTI and SSO integrations.',
      vi:'Nền tảng học tập và xuất bản cho trường học, đại học, đội ngũ đào tạo và nhà xuất bản với workspace riêng, quản lý người học, báo cáo và tích hợp LMS, LTI, SSO.',
      'zh-cn':'面向学校、大学、培训团队与出版机构的学习与发布平台，提供私有工作区、学习者管理、数据报告以及 LMS、LTI、SSO 集成。',
      th:'แพลตฟอร์มการเรียนรู้และเผยแพร่สำหรับโรงเรียน มหาวิทยาลัย ทีมฝึกอบรม และผู้เผยแพร่ พร้อมพื้นที่ส่วนตัว การจัดการผู้เรียน รายงาน และการเชื่อมต่อ LMS, LTI, SSO',
      id:'Platform pembelajaran dan penerbitan untuk sekolah, universitas, tim pelatihan, dan penerbit dengan workspace privat, manajemen pelajar, pelaporan, serta integrasi LMS, LTI dan SSO.',
      ms:'Platform pembelajaran dan penerbitan untuk sekolah, universiti, pasukan latihan dan penerbit dengan workspace peribadi, pengurusan pelajar, pelaporan serta integrasi LMS, LTI dan SSO.',
      ar:'منصة تعلم ونشر للمدارس والجامعات وفرق التدريب والناشرين، مع مساحات عمل خاصة وإدارة المتعلمين والتقارير وتكاملات LMS وLTI وSSO.'
    }
  },
  '/contact/': {
    image:'/assets/media/024ad6399a21183c6bb8.png',
    title:{
      en:'Contact Wistudi | Interactive Learning Platform',
      vi:'Liên hệ Wistudi | Nền tảng học tập tương tác',
      'zh-cn':'联系 Wistudi | 互动学习平台',
      th:'ติดต่อ Wistudi | แพลตฟอร์มการเรียนรู้แบบโต้ตอบ',
      id:'Hubungi Wistudi | Platform Pembelajaran Interaktif',
      ms:'Hubungi Wistudi | Platform Pembelajaran Interaktif',
      ar:'تواصل مع Wistudi | منصة تعلم تفاعلي'
    },
    description:{
      en:'Talk to Wistudi about interactive learning, organisations, publishing, partnerships, LMS integrations or platform use, or book a 30-minute meeting with the team.',
      vi:'Trao đổi với Wistudi về học tập tương tác, tổ chức, xuất bản, hợp tác, tích hợp LMS hoặc sử dụng nền tảng, hoặc đặt cuộc họp 30 phút với đội ngũ.',
      'zh-cn':'联系 Wistudi，了解互动学习、机构方案、内容发布、合作、LMS 集成或平台使用，或预约与团队进行 30 分钟会议。',
      th:'พูดคุยกับ Wistudi เรื่องการเรียนรู้แบบโต้ตอบ องค์กร การเผยแพร่ ความร่วมมือ การเชื่อมต่อ LMS หรือการใช้งานแพลตฟอร์ม หรือจองการประชุม 30 นาที',
      id:'Hubungi Wistudi tentang pembelajaran interaktif, organisasi, penerbitan, kemitraan, integrasi LMS atau penggunaan platform, atau jadwalkan pertemuan 30 menit.',
      ms:'Hubungi Wistudi tentang pembelajaran interaktif, organisasi, penerbitan, kerjasama, integrasi LMS atau penggunaan platform, atau tempah mesyuarat 30 minit.',
      ar:'تواصل مع Wistudi بشأن التعلم التفاعلي والمؤسسات والنشر والشراكات وتكاملات LMS أو استخدام المنصة، أو احجز اجتماعًا لمدة 30 دقيقة مع الفريق.'
    }
  }
};

const RESOURCE_SEO_EN = {
  '/resources/': {
    title:'Interactive Learning Guides, Events & EdTech Resources | Wistudi',
    description:'Practical guides, field notes, events and learning-design perspectives from Wistudi on interactive learning, XP Video, printable worksheets, teaching and EdTech.',
    image:'/assets/images/resources/expo-2026/expo-hero.png',
    type:'CollectionPage'
  },
  '/resources/events/': {
    title:'EdTech Workshops & Interactive Learning Events | Wistudi',
    description:'Join Wistudi workshops, webinars and community events for teachers, trainers and learning professionals exploring interactive learning and practical lesson design.',
    image:'/assets/images/resources/events/communicative-esl-flow/event-banner.webp',
    type:'CollectionPage'
  },
  '/resources/community-notes/wistudi-at-vietnam-edtech-expo-2026/': {
    title:'Wistudi at Vietnam EdTech Expo 2026 | Field Notes',
    description:'A field note from Wistudi at Vietnam EdTech Expo 2026 in Hanoi, with live demonstrations, educator conversations and new connections across the EdTech community.',
    image:'/assets/images/resources/expo-2026/expo-hero.png',
    type:'Article'
  },
  '/resources/events/building-a-communicative-esl-lesson-with-flow/': {
    title:'Free ESL Workshop: Building a Communicative Lesson with Flow | Wistudi',
    description:'Join Trainer Nadia for a free live workshop on building a purposeful communicative ESL lesson, choosing activities with intention and moving learners towards confident communication.',
    image:'/assets/images/resources/events/communicative-esl-flow/event-banner.webp',
    type:'Event'
  },
  '/resources/all/': {
    title:'Browse Community Notes | Wistudi Resources',
    description:'Search and browse Wistudi Community Notes by topic, type and date.',
    image:'/assets/images/resources/expo-2026/expo-hero.png',
    type:'CollectionPage'
  },
  '/resources/guides/': {
    title:'Interactive Learning Guides & Teaching Resources | Wistudi',
    description:'Practical Wistudi guides, teaching resources, learning-design references and downloadable materials for interactive and blended learning.',
    image:'/assets/media/024ad6399a21183c6bb8.png',
    type:'CollectionPage'
  }
};

function localeFromPath(pathname='') {
  const first = pathname.split('/').filter(Boolean)[0]?.toLowerCase();
  return SUPPORTED.includes(first) ? first : null;
}

function stripLocalePrefix(pathname='/') {
  const hadTrailingSlash = pathname.endsWith('/');
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length && SUPPORTED.includes(parts[0].toLowerCase())) parts.shift();
  let path = '/' + parts.join('/');
  if (!parts.length) path = '/';
  else if (hadTrailingSlash && !path.endsWith('/')) path += '/';
  return path;
}

function normalizePagePath(pathname='/') {
  let path = stripLocalePrefix(pathname);
  if (!path || path === '/index.html' || path === '/platform' || path === '/platform/' || path === '/platform/index.html') return '/';
  path = path.replace(/\/index\.html$/i,'/');
  if (!path.endsWith('/') && !/\.[a-z0-9]{2,8}$/i.test(path)) path += '/';
  return path;
}

function localePath(locale,pagePath) {
  if (locale === 'en') return pagePath;
  return `/${locale}${pagePath === '/' ? '/' : pagePath}`;
}

function canonicalUrl(locale,pagePath) {
  return PROD_ORIGIN + localePath(locale,pagePath);
}

function requestWithoutAutomaticLanguageRedirect(request) {
  const headers = new Headers(request.headers);
  const existing = headers.get('cookie') || '';
  const cookies = existing.split(';').map(part=>part.trim()).filter(Boolean).filter(part=>!/^wistudi_locale=/i.test(part));
  cookies.push('wistudi_locale=en');
  headers.set('cookie',cookies.join('; '));
  headers.set('accept-language','en');
  return new Request(request,{headers});
}

function redirectLanguageQuery(url,locale) {
  const target = new URL(url.toString());
  const clean = normalizePagePath(target.pathname);
  target.searchParams.delete('lang');
  target.pathname = locale === 'en' ? clean : localePath(locale,clean);
  return new Response(null,{status:301,headers:{Location:target.toString(),'Cache-Control':'public, max-age=300'}});
}

function redirectEnglishPrefix(url) {
  const target = new URL(url.toString());
  target.pathname = normalizePagePath(url.pathname);
  target.searchParams.delete('lang');
  return new Response(null,{status:301,headers:{Location:target.toString(),'Cache-Control':'public, max-age=300'}});
}

const CLIENT_LOCALE_GUARD = `<script id="ws-locale-routing-guard">(function(){
  try{
    var supported=['en','vi','zh-cn','th','id','ms','ar'];
    var first=(location.pathname.split('/').filter(Boolean)[0]||'').toLowerCase();
    var chosen=supported.indexOf(first)>-1?first:'en';
    localStorage.setItem('wistudi_locale',chosen);
    document.cookie='wistudi_locale='+encodeURIComponent(chosen)+';path=/;max-age=31536000;SameSite=Lax';
  }catch(e){}
})();</script>`;

async function fetchJsonAsset(context,path) {
  try {
    const url = new URL(path,context.request.url);
    const response = await context.env.ASSETS.fetch(url);
    return response.ok ? await response.json() : null;
  } catch (_) { return null; }
}

async function resourceLocalizedMeta(context,locale,pagePath) {
  const base = RESOURCE_SEO_EN[pagePath];
  if (!base) return null;
  if (locale === 'en') return base;
  const [home,extra] = await Promise.all([
    fetchJsonAsset(context,`/assets/i18n/${locale}-resources-home.json`),
    fetchJsonAsset(context,`/assets/i18n/${locale}-resources-extra.json`)
  ]);
  let title = base.title;
  let description = base.description;
  if (pagePath === '/resources/') {
    title = home?.title || title;
    description = home?.description || description;
  } else {
    title = extra?.titles?.[pagePath] || title;
    description = extra?.descriptions?.[pagePath] || description;
  }
  return {...base,title,description};
}

function escapeHtml(value='') {
  return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function baseResourceSchema(locale,pagePath,meta,pageUrl) {
  const lang = LOCALE_META[locale]?.lang || 'en';
  const graph = [
    {
      '@type':'Organization','@id':`${PROD_ORIGIN}/#organization`,name:'Wistudi',url:`${PROD_ORIGIN}/`,
      logo:{'@type':'ImageObject',url:`${PROD_ORIGIN}/assets/images/wistudi-logo.png`}
    },
    {'@type':'WebSite','@id':`${PROD_ORIGIN}/#website`,url:`${PROD_ORIGIN}/`,name:'Wistudi',publisher:{'@id':`${PROD_ORIGIN}/#organization`}},
    {
      '@type':meta.type === 'Article' ? 'WebPage' : (meta.type === 'Event' ? 'WebPage' : 'CollectionPage'),
      '@id':`${pageUrl}#webpage`,url:pageUrl,name:meta.title,description:meta.description,inLanguage:lang,
      isPartOf:{'@id':`${PROD_ORIGIN}/#website`},about:{'@id':`${PROD_ORIGIN}/#organization`}
    },
    {
      '@type':'BreadcrumbList','@id':`${pageUrl}#breadcrumb`,
      itemListElement:[
        {'@type':'ListItem',position:1,name:'Wistudi',item:`${PROD_ORIGIN}/`},
        {'@type':'ListItem',position:2,name:RESOURCE_LABEL[locale]||RESOURCE_LABEL.en,item:canonicalUrl(locale,'/resources/')},
        ...(pagePath === '/resources/' ? [] : [{'@type':'ListItem',position:3,name:meta.title,item:pageUrl}])
      ]
    }
  ];
  return graph;
}

function resourceStructuredData(locale,pagePath,meta,pageUrl) {
  const graph = baseResourceSchema(locale,pagePath,meta,pageUrl);
  if (pagePath === '/resources/events/building-a-communicative-esl-lesson-with-flow/') {
    graph.push({
      '@type':'Event','@id':`${pageUrl}#event`,name:'Building a Communicative ESL Lesson with Flow',
      description:'A free live workshop for ESL teachers exploring purposeful activity choices, learner support and communicative lesson design with Flow.',
      startDate:'2026-09-15T14:00:00+07:00',eventStatus:'https://schema.org/EventScheduled',
      eventAttendanceMode:'https://schema.org/OnlineEventAttendanceMode',isAccessibleForFree:true,
      image:[`${PROD_ORIGIN}/assets/images/resources/events/communicative-esl-flow/event-banner.webp`],
      url:pageUrl,location:{'@type':'VirtualLocation',url:pageUrl},
      organizer:{'@type':'Organization','@id':`${PROD_ORIGIN}/#organization`,name:'Wistudi',url:`${PROD_ORIGIN}/`},
      offers:{'@type':'Offer',price:'0',priceCurrency:'USD',availability:'https://schema.org/InStock',url:`${pageUrl}#register`}
    });
  }
  if (pagePath === '/resources/events/') {
    graph.push({
      '@type':'ItemList','@id':`${pageUrl}#events`,name:'Wistudi events',numberOfItems:1,
      itemListElement:[{'@type':'ListItem',position:1,url:canonicalUrl(locale,'/resources/events/building-a-communicative-esl-lesson-with-flow/'),name:'Building a Communicative ESL Lesson with Flow'}]
    });
  }
  return JSON.stringify({'@context':'https://schema.org','@graph':graph}).replace(/</g,'\\u003c');
}

function seoHeadMarkup(locale,pagePath,meta,isProduction) {
  const localeMeta = LOCALE_META[locale] || LOCALE_META.en;
  const pageUrl = canonicalUrl(locale,pagePath);
  const image = PROD_ORIGIN + meta.image;
  const robots = !isProduction ? 'noindex,nofollow,noarchive' : (NOINDEX_PATHS.has(pagePath) ? 'noindex,follow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');
  const alternates = SUPPORTED.map(code=>`<link rel="alternate" hreflang="${LOCALE_META[code].lang}" href="${canonicalUrl(code,pagePath)}">`).join('') + `<link rel="alternate" hreflang="x-default" href="${canonicalUrl('en',pagePath)}">`;
  return `
<link rel="canonical" href="${pageUrl}">
${alternates}
<link rel="sitemap" type="application/xml" href="/sitemap.xml">
<meta name="robots" content="${robots}">
<meta property="og:type" content="${meta.type === 'Article' ? 'article' : 'website'}">
<meta property="og:site_name" content="Wistudi">
<meta property="og:locale" content="${localeMeta.og}">
<meta property="og:title" content="${escapeHtml(meta.title)}">
<meta property="og:description" content="${escapeHtml(meta.description)}">
<meta property="og:url" content="${pageUrl}">
<meta property="og:image" content="${image}">
<meta property="og:image:alt" content="${escapeHtml(meta.title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(meta.title)}">
<meta name="twitter:description" content="${escapeHtml(meta.description)}">
<meta name="twitter:image" content="${image}">`;
}

function canonicalizeInternalHref(raw,currentUrl,locale) {
  if (!raw || raw.startsWith('#') || /^(mailto:|tel:|javascript:)/i.test(raw)) return null;
  let parsed;
  try { parsed = new URL(raw,currentUrl); } catch (_) { return null; }
  if (parsed.origin !== currentUrl.origin && parsed.origin !== PROD_ORIGIN) return null;
  let path = normalizePagePath(parsed.pathname);
  if (path.startsWith('/assets/') || path.startsWith('/api/') || path.startsWith('/functions/')) return null;
  parsed.pathname = localePath(locale,path);
  parsed.searchParams.delete('lang');
  return parsed.pathname + (parsed.search||'') + (parsed.hash||'');
}

async function optimizeHtml(response,context,url,locale,pagePath) {
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html') || (response.status >= 300 && response.status < 400)) return response;
  const isProduction = url.hostname === 'global.wistudi.com';
  const core = CORE_SEO[pagePath];
  const resource = await resourceLocalizedMeta(context,locale,pagePath);
  const meta = core ? {title:core.title[locale]||core.title.en,description:core.description[locale]||core.description.en,image:core.image,type:'WebPage'} : resource;
  if (!meta) return response;

  let desktopInserted=false,mobileInserted=false,footerInserted=false;
  const resourceHref=localePath(locale,'/resources/');
  const resourceLabel=RESOURCE_LABEL[locale]||RESOURCE_LABEL.en;
  const addResourceBeforeContact=(el,kind)=>{
    if (pagePath.startsWith('/resources/')) return;
    const href=(el.getAttribute('href')||'').toLowerCase();
    if (!href.includes('contact')) return;
    if (kind==='desktop'&&desktopInserted || kind==='mobile'&&mobileInserted || kind==='footer'&&footerInserted) return;
    el.before(`<a class="ws-resource-nav-link" data-ws-resources-link="true" href="${resourceHref}">${escapeHtml(resourceLabel)}</a>`,{html:true});
    if(kind==='desktop')desktopInserted=true;if(kind==='mobile')mobileInserted=true;if(kind==='footer')footerInserted=true;
  };

  const schema = pagePath.startsWith('/resources/') && !NOINDEX_PATHS.has(pagePath) ? resourceStructuredData(locale,pagePath,meta,canonicalUrl(locale,pagePath)) : '';
  const isEventDetail = pagePath === '/resources/events/building-a-communicative-esl-lesson-with-flow/';

  let transformed = new HTMLRewriter()
    .on('html',{element(el){el.setAttribute('lang',LOCALE_META[locale].lang);el.setAttribute('dir',LOCALE_META[locale].dir);el.setAttribute('data-locale',locale)}})
    .on('title',{element(el){el.setInnerContent(meta.title)}})
    .on('meta[name="description"]',{element(el){el.setAttribute('content',meta.description)}})
    .on('link[rel="canonical"]',{element(el){el.remove()}})
    .on('link[rel="alternate"][hreflang]',{element(el){el.remove()}})
    .on('link[rel="sitemap"]',{element(el){el.remove()}})
    .on('meta[name="robots"]',{element(el){el.remove()}})
    .on('meta[property^="og:"]',{element(el){el.remove()}})
    .on('meta[name^="twitter:"]',{element(el){el.remove()}})
    .on('script[type="application/ld+json"]',{element(el){if(isEventDetail)el.remove()}})
    .on('head',{element(el){el.prepend(CLIENT_LOCALE_GUARD,{html:true});el.append(`${seoHeadMarkup(locale,pagePath,meta,isProduction)}${schema?`<script type="application/ld+json">${schema}</script>`:''}`,{html:true})}})
    .on('.ws-nav-links a[href]',{element(el){addResourceBeforeContact(el,'desktop');const next=canonicalizeInternalHref(el.getAttribute('href'),url,locale);if(next)el.setAttribute('href',next)}})
    .on('.ws-mobile-inner > a[href]',{element(el){addResourceBeforeContact(el,'mobile');const next=canonicalizeInternalHref(el.getAttribute('href'),url,locale);if(next)el.setAttribute('href',next)}})
    .on('.ws-footer-links a[href]',{element(el){addResourceBeforeContact(el,'footer');const next=canonicalizeInternalHref(el.getAttribute('href'),url,locale);if(next)el.setAttribute('href',next)}})
    .on('main a[href]',{element(el){const next=canonicalizeInternalHref(el.getAttribute('href'),url,locale);if(next)el.setAttribute('href',next)}})
    .transform(response);

  transformed = new Response(transformed.body,transformed);
  transformed.headers.set('Content-Language',LOCALE_META[locale].lang);
  transformed.headers.set('Vary','Accept-Language, Cookie');
  if (!isProduction || NOINDEX_PATHS.has(pagePath)) transformed.headers.set('X-Robots-Tag',!isProduction?'noindex, nofollow, noarchive':'noindex, follow');
  return transformed;
}

async function fetchLocalizedResource(context,url,locale,pagePath) {
  const assetUrl = new URL(url.toString());
  assetUrl.pathname = pagePath;
  assetUrl.searchParams.delete('lang');
  return context.env.ASSETS.fetch(assetUrl);
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const explicit = localeFromPath(url.pathname);
  const queryLocale = (url.searchParams.get('lang')||'').toLowerCase();

  // The stable multilingual model is one crawlable path per language. Query-based
  // language URLs are kept only as migration aliases and are permanently redirected.
  if (SUPPORTED.includes(queryLocale)) return redirectLanguageQuery(url,queryLocale);
  if (explicit === 'en') return redirectEnglishPrefix(url);

  const locale = explicit || 'en';
  const pagePath = normalizePagePath(url.pathname);

  // Resources use physical English source files. Locale-prefixed resource routes are
  // proxied to those assets while preserving their own public URL, then the shared
  // translation runtime renders the selected language. This also makes deep event URLs
  // such as /vi/resources/events/... stable instead of 404ing or falling back to query URLs.
  if (explicit && pagePath.startsWith(RESOURCE_PREFIX)) {
    const response = await fetchLocalizedResource(context,url,locale,pagePath);
    return optimizeHtml(response,context,url,locale,pagePath);
  }

  let response;
  if (explicit) {
    response = await legacyOnRequest(context);
  } else {
    const routedRequest = requestWithoutAutomaticLanguageRedirect(context.request);
    response = await legacyOnRequest({...context,request:routedRequest});
  }

  return optimizeHtml(response,context,url,locale,pagePath);
}
