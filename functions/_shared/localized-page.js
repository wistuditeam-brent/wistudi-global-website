import { LOCALES, getTranslations } from './i18n/index.js';

const PAGE_CONFIG = {
  platform: { asset: '/', suffix: '/', bodyClass: 'page-platform' },
  blocks: { asset: '/blocks-activities/', suffix: '/blocks-activities/', bodyClass: 'page-blocks' },
  organisations: { asset: '/organisations/', suffix: '/organisations/', bodyClass: 'page-organisations' },
  contact: { asset: '/contact/', suffix: '/contact/', bodyClass: 'page-contact' }
};

const SEO = {
  vi: {
    platform: ['Wistudi — Một nền tảng cho toàn bộ trải nghiệm học tập', 'Tạo, xuất bản và quản lý bài học tương tác, video, worksheet, khóa học, chương trình học và cộng đồng học tập trên một nền tảng kết nối.'],
    blocks: ['Khối & Hoạt động Wistudi', 'Khám phá thư viện block mô-đun của Wistudi dành cho Flow, XP Video, dạy trực tiếp và trải nghiệm học tập kết nối với bản in.'],
    organisations: ['Wistudi dành cho tổ chức', 'Nền tảng xuất bản và học tập mô-đun dành cho trường học, đại học, đội ngũ đào tạo, nhà xuất bản và hệ sinh thái công nghệ.'],
    contact: ['Liên hệ Wistudi', 'Trao đổi với Wistudi về tổ chức, hợp tác, xuất bản, sử dụng nền tảng, tích hợp hoặc các yêu cầu chung.']
  },
  th: {
    platform: ['Wistudi — แพลตฟอร์มเดียวสำหรับประสบการณ์การเรียนรู้ทั้งหมด', 'สร้าง เผยแพร่ และจัดการบทเรียนอินเทอร์แอกทีฟ วิดีโอ ใบงาน คอร์ส หลักสูตร และชุมชนการเรียนรู้บนแพลตฟอร์มเดียวที่เชื่อมต่อกัน'],
    blocks: ['บล็อกและกิจกรรมของ Wistudi', 'สำรวจคลังบล็อกแบบโมดูลของ Wistudi สำหรับ Flow, XP Video, การสอนสด และการเรียนรู้ที่เชื่อมต่อกับสื่อพิมพ์'],
    organisations: ['Wistudi สำหรับองค์กร', 'แพลตฟอร์มการเรียนรู้และการเผยแพร่แบบโมดูลสำหรับโรงเรียน มหาวิทยาลัย ทีมฝึกอบรม ผู้เผยแพร่ และระบบเทคโนโลยี'],
    contact: ['ติดต่อ Wistudi', 'พูดคุยกับ Wistudi เกี่ยวกับองค์กร ความร่วมมือ การเผยแพร่ การใช้งานแพลตฟอร์ม การเชื่อมต่อ หรือคำถามทั่วไป']
  },
  id: {
    platform: ['Wistudi — Satu Platform untuk Seluruh Pengalaman Belajar', 'Buat, terbitkan, dan kelola pelajaran interaktif, video, lembar kerja, kursus, kurikulum, dan komunitas belajar dalam satu platform yang terhubung.'],
    blocks: ['Blok & Aktivitas Wistudi', 'Jelajahi perpustakaan blok modular Wistudi untuk Flow, XP Video, pengajaran live, dan pembelajaran yang terhubung dengan versi cetak.'],
    organisations: ['Wistudi untuk Organisasi', 'Platform pembelajaran dan penerbitan modular untuk sekolah, universitas, tim pelatihan, penerbit, dan ekosistem teknologi.'],
    contact: ['Hubungi Wistudi', 'Bicarakan organisasi, kemitraan, penerbitan, penggunaan platform, integrasi, atau pertanyaan umum dengan Wistudi.']
  },
  ms: {
    platform: ['Wistudi — Satu Platform untuk Keseluruhan Pengalaman Pembelajaran', 'Cipta, terbit dan urus pelajaran interaktif, video, lembaran kerja, kursus, kurikulum dan komuniti pembelajaran dalam satu platform yang saling berhubung.'],
    blocks: ['Blok & Aktiviti Wistudi', 'Terokai perpustakaan blok modular Wistudi untuk Flow, XP Video, pengajaran langsung dan pembelajaran yang berhubung dengan cetakan.'],
    organisations: ['Wistudi untuk Organisasi', 'Platform pembelajaran dan penerbitan modular untuk sekolah, universiti, pasukan latihan, penerbit dan ekosistem teknologi.'],
    contact: ['Hubungi Wistudi', 'Bincang dengan Wistudi tentang organisasi, kerjasama, penerbitan, penggunaan platform, integrasi atau pertanyaan umum.']
  },
  zh: {
    platform: ['Wistudi — 一个平台，贯穿完整学习体验', '在一个互联平台中创建、发布并管理互动课程、视频、学习单、课程体系和学习社区。'],
    blocks: ['Wistudi 模块与活动', '探索 Wistudi 模块化活动库，用于 Flow、XP Video、实时教学以及与打印资源连接的学习体验。'],
    organisations: ['Wistudi 机构解决方案', '面向学校、大学、培训团队、出版机构和技术生态的模块化学习与发布平台。'],
    contact: ['联系 Wistudi', '与 Wistudi 沟通机构方案、合作、发布、平台使用、集成或一般咨询。']
  }
};

function pageFromSegments(segments) {
  const first = segments[0] || '';
  if (!first || first === 'platform' || first === 'index.html') return 'platform';
  if (first === 'blocks-activities') return 'blocks';
  if (first === 'organisations') return 'organisations';
  if (first === 'contact') return 'contact';
  return null;
}

function jsonForHtml(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/-->/g, '--\\u003e');
}

function setMeta(html, locale, page) {
  const seo = SEO[locale]?.[page];
  if (!seo) return html;
  const [title, description] = seo;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  html = html.replace(/<meta\s+([^>]*name=["']description["'][^>]*)>/i, (tag) => {
    if (/content=["'][^"']*["']/i.test(tag)) return tag.replace(/content=["'][^"']*["']/i, `content="${description}"`);
    return tag.replace(/\s*\/?\s*>$/, ` content="${description}">`);
  });
  return html;
}

export async function renderLocalizedPage(context, explicitSegments) {
  const locale = String(context.params.locale || '').toLowerCase();
  if (!LOCALES[locale]) return context.next();

  const raw = explicitSegments ?? context.params.path ?? [];
  const segments = Array.isArray(raw) ? raw : (raw ? [raw] : []);
  const page = pageFromSegments(segments);
  if (!page) return context.next();

  const config = PAGE_CONFIG[page];
  const assetUrl = new URL(config.asset, context.request.url);
  assetUrl.search = '';
  assetUrl.hash = '';
  const asset = await context.env.ASSETS.fetch(assetUrl);
  if (!asset.ok) return asset;

  let html = await asset.text();
  const localeConfig = LOCALES[locale];
  const translations = getTranslations(locale, page);
  const canonical = `https://global.wistudi.com/${locale}${config.suffix === '/' ? '/' : config.suffix}`;
  const alternates = Object.entries(LOCALES).map(([key, item]) =>
    `<link rel="alternate" hreflang="${item.htmlLang}" href="https://global.wistudi.com/${key}${config.suffix === '/' ? '/' : config.suffix}">`
  ).join('') + `<link rel="alternate" hreflang="x-default" href="https://global.wistudi.com/en${config.suffix === '/' ? '/' : config.suffix}">`;

  html = setMeta(html, locale, page);
  html = html.replace(/<html\b[^>]*>/i, `<html lang="${localeConfig.htmlLang}" data-ws-locale="${locale}">`);
  html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, '');
  html = html.replace(/<head>/i, `<head>\n<base href="${config.asset}">\n<link rel="canonical" href="${canonical}">\n${alternates}\n<script>window.__WS_LOCALE__=${jsonForHtml(locale)};window.__WS_PAGE__=${jsonForHtml(page)};window.__WS_LOCALES__=${jsonForHtml(LOCALES)};window.__WS_I18N__=${jsonForHtml(translations)};<\/script>`);

  const response = new Response(html, asset);
  response.headers.set('Content-Type', 'text/html; charset=UTF-8');
  response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  response.headers.set('Content-Language', localeConfig.htmlLang);
  return response;
}
