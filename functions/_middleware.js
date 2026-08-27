const SUPPORTED = ['en','vi','zh-cn','th','id','ms','ar'];
const CANONICAL_PAGES = new Set(['/', '/platform/', '/blocks-activities/', '/organisations/', '/contact/']);
const PROD_ORIGIN = 'https://global.wistudi.com';

const LOCALE_META = {
  en: { lang:'en', dir:'ltr', og:'en_GB' },
  vi: { lang:'vi', dir:'ltr', og:'vi_VN' },
  'zh-cn': { lang:'zh-CN', dir:'ltr', og:'zh_CN' },
  th: { lang:'th', dir:'ltr', og:'th_TH' },
  id: { lang:'id', dir:'ltr', og:'id_ID' },
  ms: { lang:'ms', dir:'ltr', og:'ms_MY' },
  ar: { lang:'ar', dir:'rtl', og:'ar_SA' }
};

const SEO_PAGES = {
  '/': {
    type:'WebPage',
    image:'/assets/media/024ad6399a21183c6bb8.png',
    label:{en:'Home',vi:'Trang chủ','zh-cn':'首页',th:'หน้าแรก',id:'Beranda',ms:'Laman Utama',ar:'الرئيسية'},
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
  '/platform/': {
    type:'WebPage',
    image:'/assets/media/024ad6399a21183c6bb8.png',
    label:{en:'Platform',vi:'Nền tảng','zh-cn':'平台',th:'แพลตฟอร์ม',id:'Platform',ms:'Platform',ar:'المنصة'},
    title:{
      en:'Interactive Lesson Builder & Learning Publishing Platform | Wistudi',
      vi:'Công cụ tạo bài học tương tác & nền tảng xuất bản học liệu | Wistudi',
      'zh-cn':'互动课程制作与学习内容发布平台 | Wistudi',
      th:'เครื่องมือสร้างบทเรียนแบบโต้ตอบและแพลตฟอร์มเผยแพร่การเรียนรู้ | Wistudi',
      id:'Pembuat Pelajaran Interaktif & Platform Penerbitan Pembelajaran | Wistudi',
      ms:'Pembina Pelajaran Interaktif & Platform Penerbitan Pembelajaran | Wistudi',
      ar:'منشئ دروس تفاعلية ومنصة لنشر المحتوى التعليمي | Wistudi'
    },
    description:{
      en:'Build interactive lessons, XP Video and Flows, turn digital learning into printable worksheets, manage learners, track results and connect with LMS, LTI and SSO.',
      vi:'Tạo bài học tương tác, XP Video và Flow, chuyển nội dung số thành phiếu bài tập có thể in, quản lý người học, theo dõi kết quả và kết nối LMS, LTI, SSO.',
      'zh-cn':'创建互动课程、XP Video 与 Flow，将数字学习内容转为可打印工作表，管理学习者、跟踪结果，并连接 LMS、LTI 与 SSO。',
      th:'สร้างบทเรียนแบบโต้ตอบ XP Video และ Flow แปลงการเรียนรู้ดิจิทัลเป็นใบงานพิมพ์ได้ จัดการผู้เรียน ติดตามผล และเชื่อมต่อ LMS, LTI และ SSO',
      id:'Bangun pelajaran interaktif, XP Video dan Flow, ubah pembelajaran digital menjadi lembar kerja cetak, kelola pelajar, pantau hasil, dan hubungkan LMS, LTI serta SSO.',
      ms:'Bina pelajaran interaktif, XP Video dan Flow, tukar pembelajaran digital kepada lembaran kerja boleh cetak, urus pelajar, jejak hasil dan hubungkan LMS, LTI serta SSO.',
      ar:'أنشئ دروسًا تفاعلية وXP Video وFlows، وحوّل التعلم الرقمي إلى أوراق عمل قابلة للطباعة، وأدر المتعلمين وتتبع النتائج واربط LMS وLTI وSSO.'
    }
  },
  '/blocks-activities/': {
    type:'CollectionPage',
    image:'/assets/media/10dd7a92b026aa52af3d.webp',
    label:{en:'Blocks & Activities',vi:'Khối & Hoạt động','zh-cn':'模块与活动',th:'บล็อกและกิจกรรม',id:'Blok & Aktivitas',ms:'Blok & Aktiviti',ar:'الكتل والأنشطة'},
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
    type:'WebPage',
    image:'/assets/media/024ad6399a21183c6bb8.png',
    label:{en:'Organisations',vi:'Tổ chức','zh-cn':'机构',th:'องค์กร',id:'Organisasi',ms:'Organisasi',ar:'المؤسسات'},
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
    type:'ContactPage',
    image:'/assets/media/024ad6399a21183c6bb8.png',
    label:{en:'Contact',vi:'Liên hệ','zh-cn':'联系',th:'ติดต่อ',id:'Kontak',ms:'Hubungi',ar:'تواصل'},
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
      en:'Talk to Wistudi about interactive learning, publishing, schools, training, partnerships, LMS, LTI or SSO integrations, or book a meeting directly with our team.',
      vi:'Liên hệ Wistudi về học tập tương tác, xuất bản, trường học, đào tạo, hợp tác hoặc tích hợp LMS, LTI, SSO, hoặc đặt lịch họp trực tiếp với đội ngũ của chúng tôi.',
      'zh-cn':'联系 Wistudi，了解互动学习、内容发布、学校与培训方案、合作以及 LMS、LTI、SSO 集成，或直接预约团队会议。',
      th:'ติดต่อ Wistudi เรื่องการเรียนรู้แบบโต้ตอบ การเผยแพร่ โรงเรียน การฝึกอบรม ความร่วมมือ หรือการเชื่อมต่อ LMS, LTI, SSO และจองการประชุมกับทีม',
      id:'Hubungi Wistudi tentang pembelajaran interaktif, penerbitan, sekolah, pelatihan, kemitraan atau integrasi LMS, LTI dan SSO, atau jadwalkan pertemuan dengan tim kami.',
      ms:'Hubungi Wistudi tentang pembelajaran interaktif, penerbitan, sekolah, latihan, kerjasama atau integrasi LMS, LTI dan SSO, atau tempah mesyuarat dengan pasukan kami.',
      ar:'تواصل مع Wistudi بشأن التعلم التفاعلي والنشر والمدارس والتدريب والشراكات أو تكاملات LMS وLTI وSSO، أو احجز اجتماعًا مباشرًا مع فريقنا.'
    }
  }
};

const LEGACY_ALIASES = new Map([
  ['/OPEN_WEBSITE.html','/'],
  ['/platform.html','/platform/'],
  ['/The%20Platform.html','/platform/'],
  ['/The Platform.html','/platform/'],
  ['/blocks-activities.html','/blocks-activities/'],
  ['/organisations.html','/organisations/'],
  ['/contact.html','/contact/']
]);

const STATIC_ROUTE_MAP = new Map([
  ['/index.html','/'],
  ['/OPEN_WEBSITE.html','/'],
  ['/platform','/platform/'],
  ['/platform/','/platform/'],
  ['/platform/index.html','/platform/'],
  ['/platform.html','/platform/'],
  ['/The%20Platform.html','/platform/'],
  ['/blocks-activities','/blocks-activities/'],
  ['/blocks-activities/','/blocks-activities/'],
  ['/blocks-activities/index.html','/blocks-activities/'],
  ['/blocks-activities.html','/blocks-activities/'],
  ['/organisations','/organisations/'],
  ['/organisations/','/organisations/'],
  ['/organisations/index.html','/organisations/'],
  ['/organisations.html','/organisations/'],
  ['/contact','/contact/'],
  ['/contact/','/contact/'],
  ['/contact/index.html','/contact/'],
  ['/contact.html','/contact/']
]);

function cookieLocale(cookieHeader='') {
  const match = cookieHeader.match(/(?:^|;\s*)wistudi_locale=([^;]+)/i);
  if (!match) return null;
  try {
    const value = decodeURIComponent(match[1]).toLowerCase();
    return SUPPORTED.includes(value) ? value : null;
  } catch (_) { return null; }
}

function browserLocale(header='') {
  const langs = header.split(',').map(part => part.trim().split(';')[0].toLowerCase()).filter(Boolean);
  for (const lang of langs) {
    if (lang === 'zh-cn' || lang.startsWith('zh-hans') || lang.startsWith('zh-cn') || lang.startsWith('zh-sg')) return 'zh-cn';
    if (lang.startsWith('vi')) return 'vi';
    if (lang.startsWith('th')) return 'th';
    if (lang.startsWith('id')) return 'id';
    if (lang.startsWith('ms')) return 'ms';
    if (lang.startsWith('ar')) return 'ar';
    if (lang.startsWith('en')) return 'en';
  }
  return 'en';
}

function isSearchCrawler(userAgent='') {
  return /(googlebot|google-inspectiontool|bingbot|duckduckbot|baiduspider|yandexbot|applebot|slurp)/i.test(userAgent);
}

function explicitLocale(pathname) {
  const first = pathname.split('/').filter(Boolean)[0]?.toLowerCase();
  return SUPPORTED.includes(first) ? first : null;
}

function stripLocale(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length && SUPPORTED.includes(parts[0].toLowerCase())) parts.shift();
  return '/' + parts.join('/');
}

function canonicalPagePath(pathname) {
  let path = stripLocale(pathname);
  if (!path || path === '/' || path === '/index.html') return '/';
  path = path.replace(/\/index\.html$/i, '/');
  if (!path.endsWith('/')) path += '/';
  return CANONICAL_PAGES.has(path) ? path : null;
}

function localePath(locale, pagePath) {
  return locale === 'en' ? pagePath : `/${locale}${pagePath}`;
}

function canonicalUrl(locale, pagePath) {
  return PROD_ORIGIN + localePath(locale, pagePath);
}

function localizedTarget(url, locale) {
  const page = canonicalPagePath(url.pathname) || '/';
  return `${localePath(locale, page)}${url.search}${url.hash}`;
}

function canonicalAssetUrl(url) {
  const stripped = stripLocale(url.pathname);
  if (!stripped.startsWith('/assets/')) return null;
  const assetUrl = new URL(url.toString());
  assetUrl.pathname = stripped;
  return assetUrl;
}

function canonicalInternalHref(rawHref, locale) {
  if (!rawHref || rawHref.startsWith('#') || /^(?:mailto:|tel:|javascript:|data:)/i.test(rawHref)) return null;
  let working = rawHref;
  if (/^https?:\/\//i.test(working)) {
    try {
      const absolute = new URL(working);
      if (absolute.origin !== PROD_ORIGIN) return null;
      working = `${absolute.pathname}${absolute.search}${absolute.hash}`;
    } catch (_) { return null; }
  }
  const hashIndex = working.indexOf('#');
  const hash = hashIndex >= 0 ? working.slice(hashIndex) : '';
  if (hashIndex >= 0) working = working.slice(0,hashIndex);
  const queryIndex = working.indexOf('?');
  const query = queryIndex >= 0 ? working.slice(queryIndex) : '';
  if (queryIndex >= 0) working = working.slice(0,queryIndex);
  if (!working) return null;
  working = working.replace(/^(?:\.\.\/)+/,'/').replace(/^\.\//,'/');
  if (!working.startsWith('/')) working = '/' + working;
  const alreadyLocalized = explicitLocale(working);
  if (alreadyLocalized) return null;
  let target = STATIC_ROUTE_MAP.get(working);
  if (!target) {
    const normalized = canonicalPagePath(working);
    if (normalized) target = normalized;
  }
  return target ? `${localePath(locale,target)}${query}${hash}` : null;
}

function redirectResponse(url, path, status=301) {
  const target = new URL(path, url.origin);
  target.search = url.search;
  const headers = new Headers({ Location: target.toString(), Vary: 'Accept-Language, Cookie' });
  return new Response(null, { status, headers });
}

function escapeHtml(value='') {
  return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function structuredData(locale, pagePath, meta) {
  const url = canonicalUrl(locale, pagePath);
  const lang = LOCALE_META[locale]?.lang || 'en';
  const graph = [
    {
      '@type':'Organization',
      '@id':`${PROD_ORIGIN}/#organization`,
      name:'Wistudi',
      url:`${PROD_ORIGIN}/`,
      logo:{'@type':'ImageObject',url:`${PROD_ORIGIN}/assets/images/wistudi-logo.png`},
      email:'support@wistudi.com',
      telephone:'+84 879 876 624',
      areaServed:'Worldwide',
      address:{'@type':'PostalAddress',streetAddress:'85 Great Portland Street, First Floor',addressLocality:'London',addressCountry:'GB'},
      contactPoint:[
        {'@type':'ContactPoint',contactType:'customer support',email:'support@wistudi.com',telephone:'+84 879 876 624',availableLanguage:['English','Vietnamese']},
        {'@type':'ContactPoint',contactType:'partnerships',email:'partnerships@wistudi.com'}
      ]
    },
    {
      '@type':'WebSite',
      '@id':`${PROD_ORIGIN}/#website`,
      url:`${PROD_ORIGIN}/`,
      name:'Wistudi',
      publisher:{'@id':`${PROD_ORIGIN}/#organization`},
      inLanguage:['en','vi','zh-CN','th','id','ms','ar']
    },
    {
      '@type':meta.type,
      '@id':`${url}#webpage`,
      url,
      name:meta.title[locale] || meta.title.en,
      description:meta.description[locale] || meta.description.en,
      inLanguage:lang,
      isPartOf:{'@id':`${PROD_ORIGIN}/#website`},
      about:{'@id':`${PROD_ORIGIN}/#organization`},
      audience:{'@type':'EducationalAudience',educationalRole:['teacher','trainer','publisher','learner']},
      primaryImageOfPage:{'@type':'ImageObject',url:PROD_ORIGIN + meta.image}
    }
  ];
  if (pagePath === '/' || pagePath === '/platform/') {
    graph.push({
      '@type':'SoftwareApplication',
      '@id':`${PROD_ORIGIN}/#software`,
      name:'Wistudi',
      url:`${PROD_ORIGIN}/platform/`,
      applicationCategory:'EducationalApplication',
      operatingSystem:'Web',
      description:SEO_PAGES['/platform/'].description[locale] || SEO_PAGES['/platform/'].description.en,
      publisher:{'@id':`${PROD_ORIGIN}/#organization`},
      featureList:['Interactive lessons','Interactive video','Learning Flows','Printable worksheets','Learner management','Assessment and reporting','LMS, LTI and SSO integration']
    });
  }
  if (pagePath !== '/') {
    graph.push({
      '@type':'BreadcrumbList',
      '@id':`${url}#breadcrumb`,
      itemListElement:[
        {'@type':'ListItem',position:1,name:'Wistudi',item:`${PROD_ORIGIN}/`},
        {'@type':'ListItem',position:2,name:meta.label[locale] || meta.label.en,item:url}
      ]
    });
  }
  return JSON.stringify({'@context':'https://schema.org','@graph':graph}).replace(/</g,'\\u003c');
}

const EARLY_BOOTSTRAP = `<style id="ws-i18n-preload">
html.ws-i18n-pending body{opacity:0;transition:opacity .12s ease}
html.i18n-ready body,html:not(.ws-i18n-pending) body{opacity:1}
</style>
<script>(function(){
  var supported=['en','vi','zh-cn','th','id','ms','ar'];
  var parts=location.pathname.split('/').filter(Boolean);
  var explicit=supported.indexOf((parts[0]||'').toLowerCase())>-1?(parts[0]||'').toLowerCase():null;
  var stored=null;try{stored=localStorage.getItem('wistudi_locale')}catch(e){}
  var cookie=(document.cookie.match(/(?:^|;\\s*)wistudi_locale=([^;]+)/i)||[])[1];
  try{cookie=cookie?decodeURIComponent(cookie).toLowerCase():null}catch(e){cookie=null}
  var isRootPage=/^\\/(?:|index\\.html|platform\\/?|platform\\/index\\.html|blocks-activities\\/?|blocks-activities\\/index\\.html|organisations\\/?|organisations\\/index\\.html|contact\\/?|contact\\/index\\.html)$/.test(location.pathname);
  if(!explicit&&isRootPage&&stored&&supported.indexOf(stored)>-1&&stored!=='en'&&stored!==cookie){
    var p=location.pathname;
    if(p==='/index.html')p='/';
    else if(p==='/platform'||p==='/platform/index.html')p='/platform/';
    else if(p==='/blocks-activities'||p==='/blocks-activities/index.html')p='/blocks-activities/';
    else if(p==='/organisations'||p==='/organisations/index.html')p='/organisations/';
    else if(p==='/contact'||p==='/contact/index.html')p='/contact/';
    location.replace('/'+stored+(p==='/'?'/':p)+location.search+location.hash);return;
  }
  if(explicit&&explicit!=='en'){
    document.documentElement.lang=explicit==='zh-cn'?'zh-CN':explicit;
    document.documentElement.dir=explicit==='ar'?'rtl':'ltr';
    document.documentElement.classList.add('ws-i18n-pending');
    setTimeout(function(){document.documentElement.classList.remove('ws-i18n-pending')},900);
  }
})();</script>`;

function seoHeadMarkup(locale, pagePath, isProduction) {
  const meta = SEO_PAGES[pagePath];
  const localeMeta = LOCALE_META[locale] || LOCALE_META.en;
  const pageUrl = canonicalUrl(locale, pagePath);
  const title = meta.title[locale] || meta.title.en;
  const description = meta.description[locale] || meta.description.en;
  const image = PROD_ORIGIN + meta.image;
  const robots = isProduction ? 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1' : 'noindex,nofollow,noarchive';
  const alternates = SUPPORTED.map(code => `<link rel="alternate" hreflang="${LOCALE_META[code].lang}" href="${canonicalUrl(code,pagePath)}">`).join('') + `<link rel="alternate" hreflang="x-default" href="${canonicalUrl('en',pagePath)}">`;
  const ogAlternates = SUPPORTED.filter(code=>code!==locale).map(code=>`<meta property="og:locale:alternate" content="${LOCALE_META[code].og}">`).join('');
  return `
<link rel="canonical" href="${pageUrl}">
${alternates}
<link rel="sitemap" type="application/xml" href="/sitemap.xml">
<meta name="robots" content="${robots}">
<meta name="application-name" content="Wistudi">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Wistudi">
<meta property="og:locale" content="${localeMeta.og}">
${ogAlternates}
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${pageUrl}">
<meta property="og:image" content="${image}">
<meta property="og:image:alt" content="Wistudi interactive learning and publishing platform">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${image}">
<script type="application/ld+json">${structuredData(locale,pagePath,meta)}</script>`;
}

function injectPage(response, locale, pagePath, isProduction) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;
  const meta = SEO_PAGES[pagePath];
  const localeMeta = LOCALE_META[locale] || LOCALE_META.en;
  let transformed = new HTMLRewriter()
    .on('html', { element(el) { el.setAttribute('lang',localeMeta.lang); el.setAttribute('dir',localeMeta.dir); el.setAttribute('data-locale',locale); } })
    .on('title', { element(el) { el.setInnerContent(meta.title[locale] || meta.title.en); } })
    .on('meta[name="description"]', { element(el) { el.setAttribute('content',meta.description[locale] || meta.description.en); } })
    .on('link[rel="canonical"]', { element(el) { el.remove(); } })
    .on('link[rel="alternate"][hreflang]', { element(el) { el.remove(); } })
    .on('a[href]', { element(el) { const canonical = canonicalInternalHref(el.getAttribute('href'),locale); if (canonical) el.setAttribute('href',canonical); } })
    .on('.ws-brand', { element(el) { el.setAttribute('href',localePath(locale,'/')); } })
    .on('.ws-nav-links a:first-child', { element(el) { el.setAttribute('href',localePath(locale,'/platform/')); } })
    .on('.ws-mobile-inner > a:first-child', { element(el) { el.setAttribute('href',localePath(locale,'/platform/')); } })
    .on('.ws-footer-links a:first-child', { element(el) { el.setAttribute('href',localePath(locale,'/platform/')); } })
    .on('.ws-nav-actions a.ws-btn.secondary', { element(el) { el.setAttribute('href',localePath(locale,'/platform/')); } })
    .on('.ws-mobile-actions a.ws-btn.secondary', { element(el) { el.setAttribute('href',localePath(locale,'/platform/')); } })
    .on('head', { element(el) { el.append(`${seoHeadMarkup(locale,pagePath,isProduction)}${EARLY_BOOTSTRAP}<script src="/assets/js/i18n.js" defer></script>`, { html:true }); } })
    .transform(response);
  transformed = new Response(transformed.body, transformed);
  transformed.headers.set('Content-Language',localeMeta.lang);
  transformed.headers.set('Vary','Accept-Language, Cookie');
  if (!isProduction) transformed.headers.set('X-Robots-Tag','noindex, nofollow, noarchive');
  return transformed;
}

export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);
  const isProduction = url.hostname === 'global.wistudi.com';
  const explicit = explicitLocale(url.pathname);

  if (explicit) {
    const assetUrl = canonicalAssetUrl(url);
    if (assetUrl) return context.env.ASSETS.fetch(assetUrl);
  }

  const legacy = LEGACY_ALIASES.get(url.pathname);
  if (!explicit && legacy) return redirectResponse(url, legacy, 301);

  const pagePath = canonicalPagePath(url.pathname);

  if (pagePath) {
    const locale = explicit || 'en';
    const expectedPath = localePath(locale,pagePath);
    if (url.pathname !== expectedPath) return redirectResponse(url, expectedPath, 301);

    if (!explicit && !isSearchCrawler(request.headers.get('user-agent') || '')) {
      const preferred = cookieLocale(request.headers.get('cookie') || '') || browserLocale(request.headers.get('accept-language') || '');
      if (preferred && preferred !== 'en') return redirectResponse(url, localizedTarget(url,preferred).split('?')[0], 302);
    }

    if (explicit) {
      const assetUrl = new URL(url.toString());
      assetUrl.pathname = pagePath;
      const response = await context.env.ASSETS.fetch(assetUrl);
      return injectPage(response, locale, pagePath, isProduction);
    }

    const response = await context.next();
    return injectPage(response, 'en', pagePath, isProduction);
  }

  const response = await context.next();
  if (!isProduction && (response.headers.get('content-type') || '').includes('text/html')) {
    const safe = new Response(response.body,response);
    safe.headers.set('X-Robots-Tag','noindex, nofollow, noarchive');
    return safe;
  }
  return response;
}
