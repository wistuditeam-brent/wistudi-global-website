const SUPPORTED = ['en','vi','zh-cn','th','id','ms','ar'];
const CANONICAL_PAGES = new Set(['/', '/blocks-activities/', '/organisations/', '/contact/']);
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
    label:{en:'Platform',vi:'Nền tảng','zh-cn':'平台',th:'แพลตฟอร์ม',id:'Platform',ms:'Platform',ar:'المنصة'},
    title:{
      en:'Wistudi — One Platform for the Whole Learning Experience',
      vi:'Wistudi — Một nền tảng cho toàn bộ trải nghiệm học tập',
      'zh-cn':'Wistudi — 一个平台，覆盖完整学习体验',
      th:'Wistudi — แพลตฟอร์มเดียวสำหรับประสบการณ์การเรียนรู้ทั้งหมด',
      id:'Wistudi — Satu Platform untuk Seluruh Pengalaman Belajar',
      ms:'Wistudi — Satu Platform untuk Keseluruhan Pengalaman Pembelajaran',
      ar:'Wistudi — منصة واحدة لتجربة التعلم كاملة'
    },
    description:{
      en:'Create, publish and manage interactive lessons, XP Video, Flows, printable worksheets, courses and learning communities with Wistudi.',
      vi:'Tạo, xuất bản và quản lý bài học tương tác, XP Video, Flow, worksheet có thể in, khóa học và cộng đồng học tập với Wistudi.',
      'zh-cn':'使用 Wistudi 创建、发布和管理互动课程、XP Video、Flow、可打印工作表、课程体系和学习社区。',
      th:'สร้าง เผยแพร่ และจัดการบทเรียนแบบโต้ตอบ XP Video, Flow, ใบงานที่พิมพ์ได้ หลักสูตร และชุมชนการเรียนรู้ด้วย Wistudi',
      id:'Buat, terbitkan, dan kelola pelajaran interaktif, XP Video, Flow, lembar kerja cetak, kursus, dan komunitas belajar dengan Wistudi.',
      ms:'Cipta, terbit dan urus pelajaran interaktif, XP Video, Flow, lembaran kerja boleh cetak, kursus dan komuniti pembelajaran dengan Wistudi.',
      ar:'أنشئ وانشر وأدر الدروس التفاعلية وXP Video وFlows وأوراق العمل القابلة للطباعة والدورات ومجتمعات التعلم باستخدام Wistudi.'
    }
  },
  '/blocks-activities/': {
    type:'CollectionPage',
    image:'/assets/media/10dd7a92b026aa52af3d.webp',
    label:{en:'Blocks & Activities',vi:'Khối & Hoạt động','zh-cn':'模块与活动',th:'บล็อกและกิจกรรม',id:'Blok & Aktivitas',ms:'Blok & Aktiviti',ar:'الكتل والأنشطة'},
    title:{
      en:'Wistudi Blocks & Activities',
      vi:'Khối & Hoạt động Wistudi',
      'zh-cn':'Wistudi 模块与活动',
      th:'บล็อกและกิจกรรม Wistudi',
      id:'Blok & Aktivitas Wistudi',
      ms:'Blok & Aktiviti Wistudi',
      ar:'كتل وأنشطة Wistudi'
    },
    description:{
      en:'Explore Wistudi blocks and activities for interactive lessons, XP Video, assessment, whiteboards, printable worksheets, live teaching and self-paced learning.',
      vi:'Khám phá các khối và hoạt động Wistudi cho bài học tương tác, XP Video, đánh giá, bảng trắng, worksheet có thể in, dạy trực tiếp và tự học.',
      'zh-cn':'探索 Wistudi 的互动学习模块与活动，适用于互动课程、XP Video、评估、白板、可打印工作表、现场教学和自主学习。',
      th:'สำรวจบล็อกและกิจกรรมของ Wistudi สำหรับบทเรียนแบบโต้ตอบ XP Video การประเมิน ไวท์บอร์ด ใบงานพิมพ์ การสอนสด และการเรียนด้วยตนเอง',
      id:'Jelajahi blok dan aktivitas Wistudi untuk pelajaran interaktif, XP Video, penilaian, papan tulis, lembar kerja cetak, pengajaran langsung, dan belajar mandiri.',
      ms:'Terokai blok dan aktiviti Wistudi untuk pelajaran interaktif, XP Video, penilaian, papan putih, lembaran kerja boleh cetak, pengajaran langsung dan pembelajaran kendiri.',
      ar:'استكشف كتل وأنشطة Wistudi للدروس التفاعلية وXP Video والتقييم والسبورات وأوراق العمل القابلة للطباعة والتعليم المباشر والتعلم الذاتي.'
    }
  },
  '/organisations/': {
    type:'WebPage',
    image:'/assets/media/024ad6399a21183c6bb8.png',
    label:{en:'Organisations',vi:'Tổ chức','zh-cn':'机构',th:'องค์กร',id:'Organisasi',ms:'Organisasi',ar:'المؤسسات'},
    title:{
      en:'Wistudi for Organisations',
      vi:'Wistudi cho Tổ chức',
      'zh-cn':'Wistudi 面向机构',
      th:'Wistudi สำหรับองค์กร',
      id:'Wistudi untuk Organisasi',
      ms:'Wistudi untuk Organisasi',
      ar:'Wistudi للمؤسسات'
    },
    description:{
      en:'Wistudi helps schools, universities, training teams, publishers and partners create, manage, integrate and scale interactive and printable learning.',
      vi:'Wistudi giúp trường học, đại học, đội ngũ đào tạo, nhà xuất bản và đối tác tạo, quản lý, tích hợp và mở rộng học tập tương tác lẫn bản in.',
      'zh-cn':'Wistudi 帮助学校、大学、培训团队、出版机构和合作伙伴创建、管理、集成并规模化互动与可打印学习内容。',
      th:'Wistudi ช่วยโรงเรียน มหาวิทยาลัย ทีมฝึกอบรม ผู้เผยแพร่ และพันธมิตรสร้าง จัดการ เชื่อมต่อ และขยายการเรียนรู้แบบโต้ตอบและแบบพิมพ์',
      id:'Wistudi membantu sekolah, universitas, tim pelatihan, penerbit, dan mitra membuat, mengelola, mengintegrasikan, dan menskalakan pembelajaran interaktif serta cetak.',
      ms:'Wistudi membantu sekolah, universiti, pasukan latihan, penerbit dan rakan kongsi mencipta, mengurus, mengintegrasi dan menskalakan pembelajaran interaktif serta boleh cetak.',
      ar:'يساعد Wistudi المدارس والجامعات وفرق التدريب والناشرين والشركاء على إنشاء التعلم التفاعلي والقابل للطباعة وإدارته ودمجه وتوسيعه.'
    }
  },
  '/contact/': {
    type:'ContactPage',
    image:'/assets/media/024ad6399a21183c6bb8.png',
    label:{en:'Contact',vi:'Liên hệ','zh-cn':'联系',th:'ติดต่อ',id:'Kontak',ms:'Hubungi',ar:'تواصل'},
    title:{
      en:'Contact Wistudi',
      vi:'Liên hệ Wistudi',
      'zh-cn':'联系 Wistudi',
      th:'ติดต่อ Wistudi',
      id:'Hubungi Wistudi',
      ms:'Hubungi Wistudi',
      ar:'تواصل مع Wistudi'
    },
    description:{
      en:'Contact Wistudi about organisations, partnerships, publishing, integrations or platform use, or book a 30-minute meeting directly with the Wistudi team.',
      vi:'Liên hệ Wistudi về tổ chức, hợp tác, xuất bản, tích hợp hoặc sử dụng nền tảng, hoặc đặt trực tiếp cuộc họp 30 phút với đội ngũ Wistudi.',
      'zh-cn':'就机构方案、合作、内容发布、集成或平台使用联系 Wistudi，或直接预约与 Wistudi 团队进行 30 分钟会议。',
      th:'ติดต่อ Wistudi เรื่ององค์กร ความร่วมมือ การเผยแพร่ การเชื่อมต่อ หรือการใช้งานแพลตฟอร์ม หรือจองการประชุม 30 นาทีกับทีม Wistudi โดยตรง',
      id:'Hubungi Wistudi tentang organisasi, kemitraan, penerbitan, integrasi, atau penggunaan platform, atau jadwalkan pertemuan 30 menit langsung dengan tim Wistudi.',
      ms:'Hubungi Wistudi tentang organisasi, kerjasama, penerbitan, integrasi atau penggunaan platform, atau tempah mesyuarat 30 minit terus dengan pasukan Wistudi.',
      ar:'تواصل مع Wistudi بشأن المؤسسات أو الشراكات أو النشر أو التكاملات أو استخدام المنصة، أو احجز اجتماعًا لمدة 30 دقيقة مباشرة مع فريق Wistudi.'
    }
  }
};

const RESOURCE_PAGE_META = {
  "/resources/": {
    "type": "CollectionPage",
    "image": "/assets/images/resources/expo-2026/expo-hero.png",
    "label": {
      "en": "Resources",
      "vi": "Tài nguyên",
      "zh-cn": "资源",
      "th": "ทรัพยากร",
      "id": "Sumber Daya",
      "ms": "Sumber",
      "ar": "الموارد"
    },
    "title": {
      "en": "Community Notes | Wistudi Resources",
      "vi": "Ghi chú cộng đồng | Tài nguyên Wistudi",
      "zh-cn": "社区札记 | Wistudi 资源",
      "th": "บันทึกชุมชน | ทรัพยากร Wistudi",
      "id": "Catatan Komunitas | Sumber Daya Wistudi",
      "ms": "Nota Komuniti | Sumber Wistudi",
      "ar": "ملاحظات المجتمع | موارد Wistudi"
    },
    "description": {
      "en": "Community Notes from Wistudi: practical ideas, observations and perspectives on learning, publishing and EdTech.",
      "vi": "Ghi chú cộng đồng từ Wistudi: ý tưởng, quan sát và góc nhìn thực tế về học tập, xuất bản và EdTech.",
      "zh-cn": "来自 Wistudi 的社区札记：关于学习、出版和 EdTech 的实用想法、观察与观点。",
      "th": "บันทึกชุมชนจาก Wistudi: แนวคิด ข้อสังเกต และมุมมองเชิงปฏิบัติเกี่ยวกับการเรียนรู้ การเผยแพร่ และ EdTech",
      "id": "Catatan Komunitas dari Wistudi: ide, pengamatan, dan perspektif praktis tentang pembelajaran, penerbitan, dan EdTech.",
      "ms": "Nota Komuniti daripada Wistudi: idea, pemerhatian dan perspektif praktikal tentang pembelajaran, penerbitan dan EdTech.",
      "ar": "ملاحظات مجتمع من Wistudi: أفكار وملاحظات ووجهات نظر عملية حول التعلم والنشر وEdTech."
    }
  },
  "/resources/all/": {
    "type": "CollectionPage",
    "image": "/assets/images/resources/expo-2026/expo-hero.png",
    "label": {
      "en": "Resources",
      "vi": "Tài nguyên",
      "zh-cn": "资源",
      "th": "ทรัพยากร",
      "id": "Sumber Daya",
      "ms": "Sumber",
      "ar": "الموارد"
    },
    "title": {
      "en": "Browse Community Notes | Wistudi Resources",
      "vi": "Duyệt Ghi chú cộng đồng | Tài nguyên Wistudi",
      "zh-cn": "浏览社区札记 | Wistudi 资源",
      "th": "เรียกดูบันทึกชุมชน | ทรัพยากร Wistudi",
      "id": "Jelajahi Catatan Komunitas | Sumber Daya Wistudi",
      "ms": "Lihat Nota Komuniti | Sumber Wistudi",
      "ar": "تصفح ملاحظات المجتمع | موارد Wistudi"
    },
    "description": {
      "en": "Search and browse Wistudi Community Notes by topic, type and date.",
      "vi": "Tìm kiếm và duyệt Ghi chú cộng đồng Wistudi theo chủ đề, loại và ngày.",
      "zh-cn": "按主题、类型和日期搜索与浏览 Wistudi 社区札记。",
      "th": "ค้นหาและเรียกดูบันทึกชุมชน Wistudi ตามหัวข้อ ประเภท และวันที่",
      "id": "Cari dan jelajahi Catatan Komunitas Wistudi berdasarkan topik, jenis, dan tanggal.",
      "ms": "Cari dan lihat Nota Komuniti Wistudi mengikut topik, jenis dan tarikh.",
      "ar": "ابحث وتصفح ملاحظات مجتمع Wistudi حسب الموضوع والنوع والتاريخ."
    }
  },
  "/resources/guides/": {
    "type": "CollectionPage",
    "image": "/assets/images/resources/expo-2026/expo-demo-01.png",
    "label": {
      "en": "Resources",
      "vi": "Tài nguyên",
      "zh-cn": "资源",
      "th": "ทรัพยากร",
      "id": "Sumber Daya",
      "ms": "Sumber",
      "ar": "الموارد"
    },
    "title": {
      "en": "Guides & Resources | Wistudi Resources",
      "vi": "Hướng dẫn & Tài nguyên | Wistudi",
      "zh-cn": "指南与资源 | Wistudi",
      "th": "คู่มือและทรัพยากร | Wistudi",
      "id": "Panduan & Sumber Daya | Wistudi",
      "ms": "Panduan & Sumber | Wistudi",
      "ar": "الأدلة والموارد | Wistudi"
    },
    "description": {
      "en": "Practical Wistudi guides, teaching resources, learning-design references and downloadable materials.",
      "vi": "Hướng dẫn thực tế, tài nguyên giảng dạy, tài liệu tham khảo thiết kế học tập và nội dung tải xuống của Wistudi.",
      "zh-cn": "Wistudi 实用指南、教学资源、学习设计参考资料和可下载材料。",
      "th": "คู่มือ Wistudi เชิงปฏิบัติ ทรัพยากรการสอน เอกสารอ้างอิงด้านการออกแบบการเรียนรู้ และไฟล์ดาวน์โหลด",
      "id": "Panduan praktis Wistudi, sumber daya pengajaran, referensi desain pembelajaran, dan materi unduhan.",
      "ms": "Panduan praktikal Wistudi, sumber pengajaran, rujukan reka bentuk pembelajaran dan bahan muat turun.",
      "ar": "أدلة Wistudi العملية وموارد التدريس ومراجع تصميم التعلم والمواد القابلة للتنزيل."
    }
  },
  "/resources/events/": {
    "type": "CollectionPage",
    "image": "/assets/images/resources/expo-2026/expo-demo-03.png",
    "label": {
      "en": "Resources",
      "vi": "Tài nguyên",
      "zh-cn": "资源",
      "th": "ทรัพยากร",
      "id": "Sumber Daya",
      "ms": "Sumber",
      "ar": "الموارد"
    },
    "title": {
      "en": "Events | Wistudi Resources",
      "vi": "Sự kiện | Tài nguyên Wistudi",
      "zh-cn": "活动 | Wistudi 资源",
      "th": "กิจกรรม | ทรัพยากร Wistudi",
      "id": "Acara | Sumber Daya Wistudi",
      "ms": "Acara | Sumber Wistudi",
      "ar": "الفعاليات | موارد Wistudi"
    },
    "description": {
      "en": "Upcoming and past Wistudi workshops, webinars, expos and community events.",
      "vi": "Workshop, webinar, triển lãm và sự kiện cộng đồng Wistudi sắp tới và đã diễn ra.",
      "zh-cn": "Wistudi 即将举行和往期的工作坊、网络研讨会、展会及社区活动。",
      "th": "เวิร์กช็อป เว็บบินาร์ งานเอ็กซ์โป และกิจกรรมชุมชน Wistudi ทั้งที่กำลังจะมาถึงและที่ผ่านมา",
      "id": "Lokakarya, webinar, expo, dan acara komunitas Wistudi yang akan datang dan sebelumnya.",
      "ms": "Bengkel, webinar, ekspo dan acara komuniti Wistudi yang akan datang dan yang lalu.",
      "ar": "ورش عمل وندوات ومعارض وفعاليات مجتمع Wistudi القادمة والسابقة."
    }
  },
  "${articlePath}": {
    "type": "Article",
    "image": "/assets/images/resources/expo-2026/expo-hero.png",
    "label": {
      "en": "Resources",
      "vi": "Tài nguyên",
      "zh-cn": "资源",
      "th": "ทรัพยากร",
      "id": "Sumber Daya",
      "ms": "Sumber",
      "ar": "الموارد"
    },
    "title": {
      "en": "Wistudi at Vietnam EdTech Expo 2026 in Hanoi",
      "vi": "Wistudi tại Vietnam EdTech Expo 2026 ở Hà Nội",
      "zh-cn": "Wistudi 亮相河内 Vietnam EdTech Expo 2026",
      "th": "Wistudi ที่ Vietnam EdTech Expo 2026 ในฮานอย",
      "id": "Wistudi di Vietnam EdTech Expo 2026 di Hanoi",
      "ms": "Wistudi di Vietnam EdTech Expo 2026 di Hanoi",
      "ar": "Wistudi في Vietnam EdTech Expo 2026 في هانوي"
    },
    "description": {
      "en": "A field note from Wistudi's Vietnam EdTech Expo 2026 experience in Hanoi, including live demonstrations, educator conversations and new EdTech connections.",
      "vi": "Ghi chép thực tế từ trải nghiệm của Wistudi tại Vietnam EdTech Expo 2026 ở Hà Nội, gồm các buổi trình diễn trực tiếp, trao đổi với nhà giáo dục và những kết nối EdTech mới.",
      "zh-cn": "Wistudi 在河内参加 Vietnam EdTech Expo 2026 的现场记录，包括产品演示、与教育工作者的交流以及新的 EdTech 联系。",
      "th": "บันทึกภาคสนามจากประสบการณ์ของ Wistudi ที่ Vietnam EdTech Expo 2026 ในฮานอย รวมถึงการสาธิตสด การสนทนากับนักการศึกษา และการสร้างเครือข่าย EdTech ใหม่ ๆ",
      "id": "Catatan lapangan dari pengalaman Wistudi di Vietnam EdTech Expo 2026 di Hanoi, termasuk demonstrasi langsung, percakapan dengan pendidik, dan koneksi EdTech baru.",
      "ms": "Catatan lapangan daripada pengalaman Wistudi di Vietnam EdTech Expo 2026 di Hanoi, termasuk demonstrasi langsung, perbualan dengan pendidik dan hubungan EdTech baharu.",
      "ar": "ملاحظات ميدانية من تجربة Wistudi في Vietnam EdTech Expo 2026 في هانوي، بما في ذلك العروض المباشرة والنقاشات مع المعلّمين والعلاقات الجديدة في مجال EdTech."
    }
  }
};
const RESOURCE_FALLBACK_META = {
  "type": "WebPage",
  "image": "/assets/images/resources/expo-2026/expo-hero.png",
  "label": {
    "en": "Resources",
    "vi": "Tài nguyên",
    "zh-cn": "资源",
    "th": "ทรัพยากร",
    "id": "Sumber Daya",
    "ms": "Sumber",
    "ar": "الموارد"
  },
  "title": {
    "en": "Wistudi Resources",
    "vi": "Tài nguyên Wistudi",
    "zh-cn": "Wistudi 资源",
    "th": "ทรัพยากร Wistudi",
    "id": "Sumber Daya Wistudi",
    "ms": "Sumber Wistudi",
    "ar": "موارد Wistudi"
  },
  "description": {
    "en": "Resources, Community Notes, guides and events from Wistudi.",
    "vi": "Tài nguyên, Ghi chú cộng đồng, hướng dẫn và sự kiện từ Wistudi.",
    "zh-cn": "来自 Wistudi 的资源、社区札记、指南和活动。",
    "th": "ทรัพยากร บันทึกชุมชน คู่มือ และกิจกรรมจาก Wistudi",
    "id": "Sumber daya, Catatan Komunitas, panduan, dan acara dari Wistudi.",
    "ms": "Sumber, Nota Komuniti, panduan dan acara daripada Wistudi.",
    "ar": "موارد وملاحظات مجتمع وأدلة وفعاليات من Wistudi."
  }
};
function pageMeta(pagePath){ return SEO_PAGES[pagePath] || RESOURCE_PAGE_META[pagePath] || (pagePath.startsWith('/resources/')?RESOURCE_FALLBACK_META:null); }

const LEGACY_ALIASES = new Map([
  ['/OPEN_WEBSITE.html','/'],
  ['/platform.html','/'],
  ['/The%20Platform.html','/'],
  ['/The Platform.html','/'],
  ['/blocks-activities.html','/blocks-activities/'],
  ['/organisations.html','/organisations/'],
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
  if (!path || path === '/' || path === '/index.html' || path === '/platform' || path === '/platform/' || path === '/platform/index.html') return '/';
  path = path.replace(/\/index\.html$/i, '/');
  if (!path.endsWith('/')) path += '/';
  return CANONICAL_PAGES.has(path) || path.startsWith('/resources/') ? path : null;
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
      primaryImageOfPage:{'@type':'ImageObject',url:PROD_ORIGIN + meta.image}
    }
  ];
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
  var isRootPage=/^\/(?:|index\.html|platform\/?|platform\/index\.html|blocks-activities\/?|blocks-activities\/index\.html|organisations\/?|organisations\/index\.html|contact\/?|contact\/index\.html)$/.test(location.pathname)||/^\/resources(?:\/|$)/.test(location.pathname);
  if(!explicit&&isRootPage&&stored&&supported.indexOf(stored)>-1&&stored!=='en'&&stored!==cookie){
    var p=location.pathname;
    if(p==='/index.html'||p==='/platform'||p==='/platform/'||p==='/platform/index.html')p='/';
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
  const meta = pageMeta(pagePath);
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
<meta property="og:type" content="website">
<meta property="og:site_name" content="Wistudi">
<meta property="og:locale" content="${localeMeta.og}">
${ogAlternates}
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${pageUrl}">
<meta property="og:image" content="${image}">
<meta property="og:image:alt" content="Wistudi learning publishing platform">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${image}">
<script type="application/ld+json">${structuredData(locale,pagePath,meta)}</script>`;
}

function injectPage(response, locale, pagePath, isProduction) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;
  const meta = pageMeta(pagePath);
  const localeMeta = LOCALE_META[locale] || LOCALE_META.en;
  let transformed = new HTMLRewriter()
    .on('html', { element(el) { el.setAttribute('lang',localeMeta.lang); el.setAttribute('dir',localeMeta.dir); el.setAttribute('data-locale',locale); } })
    .on('title', { element(el) { el.setInnerContent(meta.title[locale] || meta.title.en); } })
    .on('meta[name="description"]', { element(el) { el.setAttribute('content',meta.description[locale] || meta.description.en); } })
    .on('link[rel="canonical"]', { element(el) { el.remove(); } })
    .on('link[rel="alternate"][hreflang]', { element(el) { el.remove(); } })
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
