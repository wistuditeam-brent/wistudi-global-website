(()=>{
'use strict';
const d=document;
const supported=['en','vi','zh-cn','th','id','ms','ar'];
const bare=(window.__WS_PREVIEW_PATH||location.pathname)
  .replace(/\/index\.html$/,'/')
  .replace(/^\/(vi|zh-cn|th|id|ms|ar)(?=\/)/,'');
if(!(bare==='/resources/'||bare==='/resources')) return;

const card=d.querySelector('.res-event-card');
if(!card) return;

if(!d.getElementById('ws-res-event-polish')){
  const style=d.createElement('style');
  style.id='ws-res-event-polish';
  style.textContent=`
  .res-event-feature{padding:72px 0 78px!important}
  .res-event-card{grid-template-columns:minmax(0,1.18fr) minmax(340px,.82fr)!important;align-items:center!important;overflow:hidden!important;border-radius:26px!important;width:100%!important;max-width:1120px!important;margin-left:auto!important;margin-right:auto!important}
  .res-event-art{display:block!important;width:100%!important;min-width:0!important;aspect-ratio:16/9!important;align-self:center!important;overflow:hidden!important;background:#f7f2ff!important}
  .res-event-art img{display:block!important;width:100%!important;height:100%!important;min-height:0!important;aspect-ratio:16/9!important;object-fit:contain!important;object-position:center center!important;background:#fff!important}
  .res-event-copy{align-self:stretch!important;justify-content:center!important;padding:36px 40px!important;min-width:0!important}
  .res-event-copy h2{max-width:520px!important}
  .res-event-copy p{max-width:520px!important}
  .res-event-link{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:10px!important;width:max-content!important;min-width:190px!important;min-height:54px!important;margin-top:26px!important;padding:0 24px!important;border-radius:14px!important;background:linear-gradient(135deg,#6334ea,#7d43f2)!important;color:#fff!important;font-size:.9rem!important;font-weight:800!important;box-shadow:0 12px 24px rgba(103,52,237,.22)!important;transition:transform .16s ease,box-shadow .16s ease,filter .16s ease!important}
  .res-event-link:hover{color:#fff!important;transform:translateY(-2px)!important;box-shadow:0 16px 30px rgba(103,52,237,.28)!important;filter:saturate(1.04)!important}
  .res-event-link span{font-size:1.05rem!important;transition:transform .16s ease!important}
  .res-event-link:hover span{transform:translateX(3px)!important}
  [dir="rtl"] .res-event-copy{text-align:right}
  [dir="rtl"] .res-event-link:hover span{transform:translateX(-3px)!important}
  @media(max-width:900px){
    .res-event-card{grid-template-columns:1fr!important;align-items:stretch!important;max-width:760px!important}
    .res-event-art{aspect-ratio:16/9!important}
    .res-event-copy{padding:30px!important}
  }
  @media(max-width:560px){
    .res-event-feature{padding:50px 0 56px!important}
    .res-event-card{border-radius:20px!important;max-width:none!important}
    .res-event-copy{padding:24px 20px!important}
    .res-event-link{width:100%!important;min-width:0!important;min-height:52px!important;margin-top:22px!important}
  }
  @media(prefers-reduced-motion:reduce){.res-event-link,.res-event-link span{transition:none!important}.res-event-link:hover{transform:none!important}}
  `;
  d.head.appendChild(style);
}

const params=new URLSearchParams(location.search);
const first=(location.pathname.split('/').filter(Boolean)[0]||'').toLowerCase();
let stored='';try{stored=localStorage.getItem('wistudi_locale')||''}catch(_){ }
const requested=(params.get('lang')||'').toLowerCase();
const locale=supported.includes(requested)?requested:(supported.includes(first)?first:(supported.includes(stored)?stored:'en'));

const T={
  en:{live:'Upcoming live workshop',title:'Building a Communicative ESL Lesson with Flow',desc:'Join Trainer Nadia for a free practical workshop on choosing activities with intention and guiding learners step by step towards confident communication.',date:'15 September 2026',free:'Free to join',audience:'ESL teachers',cta:'Register Free',aria:'Open Building a Communicative ESL Lesson with Flow event page',alt:'Building a Communicative ESL Lesson with Flow workshop with Trainer Nadia',arrow:'→'},
  vi:{live:'Workshop trực tiếp sắp diễn ra',title:'Xây dựng một bài học ESL giao tiếp với Flow',desc:'Tham gia cùng Trainer Nadia trong workshop thực hành miễn phí về cách lựa chọn hoạt động có chủ đích và hướng dẫn người học từng bước để giao tiếp tự tin hơn.',date:'15 tháng 9, 2026',free:'Tham gia miễn phí',audience:'Giáo viên ESL',cta:'Đăng ký miễn phí',aria:'Mở trang sự kiện Xây dựng một bài học ESL giao tiếp với Flow',alt:'Workshop Xây dựng một bài học ESL giao tiếp với Flow cùng Trainer Nadia',arrow:'→'},
  'zh-cn':{live:'即将举行的直播工作坊',title:'用 Flow 构建交际式 ESL 课程',desc:'参加 Trainer Nadia 的免费实操工作坊，学习如何有目的地选择活动，并一步步引导学习者走向更自信的交流。',date:'2026年9月15日',free:'免费参加',audience:'ESL 教师',cta:'免费报名',aria:'打开“用 Flow 构建交际式 ESL 课程”活动页面',alt:'Trainer Nadia 的“用 Flow 构建交际式 ESL 课程”工作坊',arrow:'→'},
  th:{live:'เวิร์กช็อปสดที่กำลังจะมาถึง',title:'สร้างบทเรียน ESL เพื่อการสื่อสารด้วย Flow',desc:'เข้าร่วมเวิร์กช็อปเชิงปฏิบัติฟรีกับ Trainer Nadia เพื่อเรียนรู้การเลือกกิจกรรมอย่างมีจุดประสงค์และค่อย ๆ พาผู้เรียนไปสู่การสื่อสารอย่างมั่นใจ',date:'15 กันยายน 2026',free:'เข้าร่วมฟรี',audience:'ครู ESL',cta:'ลงทะเบียนฟรี',aria:'เปิดหน้ากิจกรรมสร้างบทเรียน ESL เพื่อการสื่อสารด้วย Flow',alt:'เวิร์กช็อปสร้างบทเรียน ESL เพื่อการสื่อสารด้วย Flow กับ Trainer Nadia',arrow:'→'},
  id:{live:'Workshop langsung mendatang',title:'Membangun Pelajaran ESL Komunikatif dengan Flow',desc:'Ikuti workshop praktik gratis bersama Trainer Nadia tentang memilih aktivitas dengan tujuan yang jelas dan membimbing peserta didik langkah demi langkah menuju komunikasi yang percaya diri.',date:'15 September 2026',free:'Gratis untuk bergabung',audience:'Guru ESL',cta:'Daftar Gratis',aria:'Buka halaman acara Membangun Pelajaran ESL Komunikatif dengan Flow',alt:'Workshop Membangun Pelajaran ESL Komunikatif dengan Flow bersama Trainer Nadia',arrow:'→'},
  ms:{live:'Bengkel langsung akan datang',title:'Membina Pelajaran ESL Komunikatif dengan Flow',desc:'Sertai bengkel praktikal percuma bersama Trainer Nadia tentang memilih aktiviti dengan tujuan yang jelas dan membimbing pelajar langkah demi langkah ke arah komunikasi yang yakin.',date:'15 September 2026',free:'Sertai secara percuma',audience:'Guru ESL',cta:'Daftar Percuma',aria:'Buka halaman acara Membina Pelajaran ESL Komunikatif dengan Flow',alt:'Bengkel Membina Pelajaran ESL Komunikatif dengan Flow bersama Trainer Nadia',arrow:'→'},
  ar:{live:'ورشة مباشرة قادمة',title:'بناء درس ESL تواصلي باستخدام Flow',desc:'انضم إلى Trainer Nadia في ورشة عملية مجانية حول اختيار الأنشطة بقصد واضح وتوجيه المتعلمين خطوة بخطوة نحو تواصل أكثر ثقة.',date:'15 سبتمبر 2026',free:'المشاركة مجانية',audience:'معلمو ESL',cta:'سجّل مجانًا',aria:'افتح صفحة فعالية بناء درس ESL تواصلي باستخدام Flow',alt:'ورشة بناء درس ESL تواصلي باستخدام Flow مع Trainer Nadia',arrow:'←'}
};

const t=T[locale]||T.en;
const live=card.querySelector('.res-event-live');
const title=card.querySelector('.res-event-copy h2');
const desc=card.querySelector('.res-event-copy p');
const meta=[...card.querySelectorAll('.res-event-meta span')];
const link=card.querySelector('.res-event-link');
const art=card.querySelector('.res-event-art');
const img=card.querySelector('.res-event-art img');
if(live)live.textContent=t.live;
if(title)title.textContent=t.title;
if(desc)desc.textContent=t.desc;
if(meta[0])meta[0].textContent=t.date;
if(meta[1])meta[1].textContent=t.free;
if(meta[2])meta[2].textContent=t.audience;
if(link)link.innerHTML=`${t.cta} <span aria-hidden="true">${t.arrow}</span>`;
if(art)art.setAttribute('aria-label',t.aria);
if(img)img.alt=t.alt;
})();