(()=>{
  'use strict';
  if(window.__WISTUDI_ARTICLE_LANGUAGE__||!document.body?.classList.contains('page-resource-article'))return;
  window.__WISTUDI_ARTICLE_LANGUAGE__=true;

  const LOCALES={
    en:{label:'English',short:'EN',flag:'🇬🇧'},
    vi:{label:'Tiếng Việt',short:'VI',flag:'🇻🇳'},
    'zh-cn':{label:'简体中文',short:'中文',flag:'🇨🇳'},
    th:{label:'ไทย',short:'TH',flag:'🇹🇭'},
    id:{label:'Bahasa Indonesia',short:'ID',flag:'🇮🇩'},
    ms:{label:'Bahasa Melayu',short:'MS',flag:'🇲🇾'},
    ar:{label:'العربية',short:'AR',flag:'🌐'}
  };
  const UI={
    en:{label:'Article language',original:'Original',notice:'Automatically translated from English. Some wording may not exactly reflect the original.',view:'View original',loading:'Loading translation…',failed:'Translation could not be loaded. Showing the English original.'},
    vi:{label:'Ngôn ngữ bài viết',original:'Bản gốc',notice:'Bản dịch tự động từ tiếng Anh. Một số cách diễn đạt có thể không hoàn toàn phản ánh bản gốc.',view:'Xem bản gốc',loading:'Đang tải bản dịch…',failed:'Không thể tải bản dịch. Đang hiển thị bản gốc tiếng Anh.'},
    'zh-cn':{label:'文章语言',original:'原文',notice:'由英文自动翻译。部分措辞可能无法完全准确反映原文。',view:'查看原文',loading:'正在加载翻译…',failed:'无法加载翻译，现显示英文原文。'},
    th:{label:'ภาษาบทความ',original:'ต้นฉบับ',notice:'แปลอัตโนมัติจากภาษาอังกฤษ ถ้อยคำบางส่วนอาจไม่ตรงกับต้นฉบับทั้งหมด',view:'ดูต้นฉบับ',loading:'กำลังโหลดคำแปล…',failed:'ไม่สามารถโหลดคำแปลได้ กำลังแสดงต้นฉบับภาษาอังกฤษ'},
    id:{label:'Bahasa artikel',original:'Asli',notice:'Diterjemahkan secara otomatis dari bahasa Inggris. Beberapa ungkapan mungkin tidak sepenuhnya mencerminkan naskah asli.',view:'Lihat versi asli',loading:'Memuat terjemahan…',failed:'Terjemahan tidak dapat dimuat. Menampilkan versi asli bahasa Inggris.'},
    ms:{label:'Bahasa artikel',original:'Asal',notice:'Diterjemahkan secara automatik daripada bahasa Inggeris. Sesetengah ungkapan mungkin tidak sepenuhnya mencerminkan teks asal.',view:'Lihat versi asal',loading:'Memuatkan terjemahan…',failed:'Terjemahan tidak dapat dimuatkan. Memaparkan versi asal bahasa Inggeris.'},
    ar:{label:'لغة المقال',original:'الأصل',notice:'تُرجمت هذه المقالة تلقائيًا من الإنجليزية. قد لا تعكس بعض الصياغات النص الأصلي بدقة كاملة.',view:'عرض الأصل',loading:'جارٍ تحميل الترجمة…',failed:'تعذر تحميل الترجمة. يتم عرض النسخة الإنجليزية الأصلية.'}
  };
  const supported=Object.keys(LOCALES);
  const parts=location.pathname.split('/').filter(Boolean);
  const siteLocale=supported.includes((parts[0]||'').toLowerCase())?(parts[0]||'').toLowerCase():'en';
  const ui=UI[siteLocale]||UI.en;
  const slug=parts[parts.length-1]||'article';
  const storageKey=`wistudi.article.locale:${slug}`;
  const articleRoot=document.querySelector('.res-article-head')?.closest('article')||document.querySelector('main article');
  if(!articleRoot)return;

  const els={
    title:document.querySelector('.res-article-head h1'),
    deck:document.querySelector('.res-article-deck'),
    paragraphs:[...document.querySelectorAll('.res-article-body > p')],
    headings:[...document.querySelectorAll('.res-article-body h2[id]')],
    pullquote:document.querySelector('.res-pullquote'),
    captions:[...document.querySelectorAll('.res-inline-media figcaption')],
    source:document.querySelector('.res-source-note'),
    asideTitle:document.querySelector('.res-article-aside > strong'),
    asideLinks:[...document.querySelectorAll('.res-article-aside > a')],
    hero:document.querySelector('.res-hero-photo img'),
    inlineImages:[...document.querySelectorAll('.res-inline-media img')],
    meta:document.querySelector('meta[name="description"]')
  };
  const original={
    title:els.title?.textContent||'',deck:els.deck?.textContent||'',
    paragraphs:els.paragraphs.map(x=>x.textContent||''),
    headings:Object.fromEntries(els.headings.map(x=>[x.id,x.textContent||''])),
    pullquote:els.pullquote?.textContent||'',captions:els.captions.map(x=>x.textContent||''),
    sourceHtml:els.source?.innerHTML||'',asideTitle:els.asideTitle?.textContent||'',
    aside:Object.fromEntries(els.asideLinks.map(x=>[x.getAttribute('href')||'',x.textContent||''])),
    heroAlt:els.hero?.alt||'',inlineAlts:els.inlineImages.map(x=>x.alt||''),
    documentTitle:document.title,metaDescription:els.meta?.content||''
  };

  let current='en';
  let control=null,menu=null,notice=null,status=null;

  const setText=(el,value)=>{if(el&&typeof value==='string')el.textContent=value;};
  function restoreOriginal(){
    setText(els.title,original.title);setText(els.deck,original.deck);
    els.paragraphs.forEach((el,i)=>setText(el,original.paragraphs[i]||''));
    els.headings.forEach(el=>setText(el,original.headings[el.id]||''));
    setText(els.pullquote,original.pullquote);els.captions.forEach((el,i)=>setText(el,original.captions[i]||''));
    if(els.source)els.source.innerHTML=original.sourceHtml;
    setText(els.asideTitle,original.asideTitle);els.asideLinks.forEach(el=>setText(el,original.aside[el.getAttribute('href')||'']||''));
    if(els.hero)els.hero.alt=original.heroAlt;els.inlineImages.forEach((el,i)=>{el.alt=original.inlineAlts[i]||''});
    document.title=original.documentTitle;if(els.meta)els.meta.content=original.metaDescription;
  }
  function applyData(data){
    restoreOriginal();
    setText(els.title,data.title);setText(els.deck,data.deck);
    if(Array.isArray(data.paragraphs))els.paragraphs.forEach((el,i)=>setText(el,data.paragraphs[i]));
    if(data.headings)els.headings.forEach(el=>setText(el,data.headings[el.id]));
    setText(els.pullquote,data.pullquote);
    if(Array.isArray(data.captions))els.captions.forEach((el,i)=>setText(el,data.captions[i]));
    if(els.source&&data.sourceNote){els.source.innerHTML=`<strong>${data.sourceNote.label||''}</strong> ${data.sourceNote.text||''}`;}
    if(data.aside){setText(els.asideTitle,data.aside.title);els.asideLinks.forEach(el=>{const key=(el.getAttribute('href')||'').replace(/^#/,'');setText(el,data.aside[key]);});}
    if(data.imageAlts){if(els.hero&&data.imageAlts.hero)els.hero.alt=data.imageAlts.hero;els.inlineImages.forEach((el,i)=>{if(data.imageAlts.inline?.[i])el.alt=data.imageAlts.inline[i];});}
    if(data.seoTitle)document.title=data.seoTitle;if(els.meta&&data.metaDescription)els.meta.content=data.metaDescription;
  }
  function updateControl(locale){
    current=locale;
    document.documentElement.dataset.articleLocale=locale;
    if(control){const item=LOCALES[locale]||LOCALES.en;control.querySelector('[data-article-current]').textContent=`${item.flag} ${item.label}${locale==='en'?` — ${ui.original}`:''}`;control.setAttribute('aria-label',`${ui.label}: ${item.label}`);}
    menu?.querySelectorAll('[data-article-locale]').forEach(btn=>btn.classList.toggle('current',btn.dataset.articleLocale===locale));
    if(notice){notice.hidden=locale==='en';notice.querySelector('[data-article-notice-text]').textContent=ui.notice;notice.querySelector('[data-article-original]').textContent=ui.view;}
  }
  function updateUrl(locale,manual=true){
    const url=new URL(location.href);
    if(!manual||locale===siteLocale)url.searchParams.delete('articleLang');else url.searchParams.set('articleLang',locale);
    history.replaceState(null,'',url.pathname+(url.searchParams.size?`?${url.searchParams.toString()}`:'')+url.hash);
  }
  async function choose(locale,{manual=true}={}){
    if(!supported.includes(locale))locale='en';
    if(status){status.hidden=false;status.textContent=locale==='en'?'':ui.loading;}
    if(locale==='en'){
      restoreOriginal();updateControl('en');updateUrl('en',manual);if(status)status.hidden=true;
      if(manual)try{localStorage.setItem(storageKey,'en')}catch(_){ }
      return;
    }
    try{
      const response=await fetch(`/assets/data/article-translations/${slug}.${locale}.json`,{cache:'force-cache'});
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const data=await response.json();applyData(data);updateControl(locale);updateUrl(locale,manual);if(status)status.hidden=true;
      if(manual)try{localStorage.setItem(storageKey,locale)}catch(_){ }
    }catch(err){
      console.warn('[Wistudi article translation] unavailable',locale,err);restoreOriginal();updateControl('en');updateUrl('en',true);
      if(status){status.hidden=false;status.textContent=ui.failed;}
    }
  }
  function build(){
    const byline=document.querySelector('.res-article-head .res-byline');if(!byline)return;
    const wrap=document.createElement('div');wrap.className='res-article-language';
    wrap.innerHTML=`<div class="res-article-language-row"><span class="res-article-language-label">${ui.label}</span><div class="res-article-language-picker"><button class="res-article-language-toggle" type="button" aria-expanded="false"><span data-article-current></span><span aria-hidden="true">⌄</span></button><div class="res-article-language-menu" role="menu" hidden>${supported.map(code=>`<button type="button" role="menuitem" data-article-locale="${code}">${LOCALES[code].flag} <span>${LOCALES[code].label}</span>${code==='en'?` <small>${ui.original}</small>`:''}</button>`).join('')}</div></div></div><div class="res-article-translation-notice" hidden><span aria-hidden="true">ⓘ</span><span data-article-notice-text></span><button type="button" data-article-original>${ui.view}</button></div><div class="res-article-language-status" hidden aria-live="polite"></div>`;
    byline.insertAdjacentElement('afterend',wrap);
    control=wrap.querySelector('.res-article-language-toggle');menu=wrap.querySelector('.res-article-language-menu');notice=wrap.querySelector('.res-article-translation-notice');status=wrap.querySelector('.res-article-language-status');
    control.addEventListener('click',e=>{e.stopPropagation();const open=menu.hidden;menu.hidden=!open;control.setAttribute('aria-expanded',String(open));});
    menu.querySelectorAll('[data-article-locale]').forEach(btn=>btn.addEventListener('click',()=>{menu.hidden=true;control.setAttribute('aria-expanded','false');choose(btn.dataset.articleLocale,{manual:true});}));
    notice.querySelector('[data-article-original]').addEventListener('click',()=>choose('en',{manual:true}));
    document.addEventListener('click',()=>{if(menu&&!menu.hidden){menu.hidden=true;control?.setAttribute('aria-expanded','false');}});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu&&!menu.hidden){menu.hidden=true;control?.setAttribute('aria-expanded','false');control?.focus();}});
  }

  build();
  let initial=new URLSearchParams(location.search).get('articleLang');
  if(!supported.includes(initial||'')){
    try{const stored=localStorage.getItem(storageKey);if(supported.includes(stored||''))initial=stored;}catch(_){ }
  }
  if(!supported.includes(initial||''))initial=siteLocale;
  updateControl('en');
  choose(initial,{manual:false});
})();