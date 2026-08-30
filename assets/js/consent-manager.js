(()=>{
  'use strict';

  const ID=window.__WS_GA_ID__||'G-ET3M465Y98';
  const KEY='wistudi_analytics_consent';
  const required=window.__WS_CONSENT_REQUIRED__===true;
  const locale=()=>document.documentElement.dataset.locale||(
    ['vi','zh-cn','th','id','ms','ar'].includes((location.pathname.split('/').filter(Boolean)[0]||'').toLowerCase())
      ? (location.pathname.split('/').filter(Boolean)[0]||'').toLowerCase()
      : 'en'
  );

  const COPY={
    en:{title:'Help us improve Wistudi',body:'We use analytics cookies to understand how this website is used and improve the experience. You can accept analytics or continue without them.',accept:'Accept analytics',reject:'Continue without analytics',settings:'Cookie settings'},
    vi:{title:'Giúp chúng tôi cải thiện Wistudi',body:'Chúng tôi sử dụng cookie phân tích để hiểu cách trang web được sử dụng và cải thiện trải nghiệm. Bạn có thể chấp nhận phân tích hoặc tiếp tục mà không sử dụng chúng.',accept:'Chấp nhận phân tích',reject:'Tiếp tục không phân tích',settings:'Cài đặt cookie'},
    'zh-cn':{title:'帮助我们改进 Wistudi',body:'我们使用分析 Cookie 来了解网站的使用方式并改进体验。你可以接受分析，也可以在不启用分析的情况下继续。',accept:'接受分析',reject:'不启用分析并继续',settings:'Cookie 设置'},
    th:{title:'ช่วยเราปรับปรุง Wistudi',body:'เราใช้คุกกี้เพื่อการวิเคราะห์เพื่อทำความเข้าใจการใช้งานเว็บไซต์และปรับปรุงประสบการณ์ คุณสามารถยอมรับการวิเคราะห์หรือใช้งานต่อโดยไม่เปิดใช้ได้',accept:'ยอมรับการวิเคราะห์',reject:'ใช้งานต่อโดยไม่วิเคราะห์',settings:'การตั้งค่าคุกกี้'},
    id:{title:'Bantu kami meningkatkan Wistudi',body:'Kami menggunakan cookie analitik untuk memahami bagaimana situs ini digunakan dan meningkatkan pengalaman. Anda dapat menerima analitik atau melanjutkan tanpa analitik.',accept:'Terima analitik',reject:'Lanjut tanpa analitik',settings:'Pengaturan cookie'},
    ms:{title:'Bantu kami menambah baik Wistudi',body:'Kami menggunakan kuki analitik untuk memahami cara laman ini digunakan dan menambah baik pengalaman. Anda boleh menerima analitik atau meneruskan tanpa analitik.',accept:'Terima analitik',reject:'Teruskan tanpa analitik',settings:'Tetapan kuki'},
    ar:{title:'ساعدنا على تحسين Wistudi',body:'نستخدم ملفات تعريف ارتباط للتحليلات لفهم كيفية استخدام هذا الموقع وتحسين التجربة. يمكنك قبول التحليلات أو المتابعة بدونها.',accept:'قبول التحليلات',reject:'المتابعة بدون تحليلات',settings:'إعدادات ملفات الارتباط'}
  };

  const read=()=>{
    try{
      const value=localStorage.getItem(KEY);
      return value==='granted'||value==='denied'?value:null;
    }catch(_){return null}
  };

  const write=value=>{
    try{localStorage.setItem(KEY,value)}catch(_){ }
    document.cookie=`${KEY}=${value};path=/;max-age=15552000;SameSite=Lax;Secure`;
  };

  const consentUpdate=value=>{
    window.dataLayer=window.dataLayer||[];
    window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
    window.gtag('consent','update',{
      analytics_storage:value==='granted'?'granted':'denied',
      ad_storage:'denied',
      ad_user_data:'denied',
      ad_personalization:'denied'
    });
  };

  const loadGoogleAnalytics=()=>{
    if(window.__WS_GA_LOADED__)return;
    window.__WS_GA_LOADED__=true;
    window.dataLayer=window.dataLayer||[];
    window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
    window.gtag('js',new Date());
    window.gtag('config',ID,{
      allow_google_signals:false,
      allow_ad_personalization_signals:false
    });
    const script=document.createElement('script');
    script.async=true;
    script.src=`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ID)}`;
    script.dataset.wsGa='true';
    document.head.appendChild(script);
  };

  const clearGaCookies=()=>{
    document.cookie.split(';').map(v=>v.trim().split('=')[0]).filter(name=>name==='_ga'||name.startsWith('_ga_')).forEach(name=>{
      document.cookie=`${name}=;path=/;max-age=0;SameSite=Lax;Secure`;
      document.cookie=`${name}=;path=/;domain=.wistudi.com;max-age=0;SameSite=Lax;Secure`;
    });
  };

  const style=()=>{
    if(document.getElementById('ws-consent-style'))return;
    const el=document.createElement('style');
    el.id='ws-consent-style';
    el.textContent=`
      .ws-consent{position:fixed;z-index:2147483000;left:50%;bottom:22px;transform:translateX(-50%);width:min(calc(100% - 32px),780px);padding:18px;border:1px solid #e6e0eb;border-radius:20px;background:rgba(255,255,255,.98);box-shadow:0 24px 70px rgba(34,24,64,.20);font-family:Inter,Arial,sans-serif;color:#181523;backdrop-filter:blur(14px)}
      .ws-consent-inner{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:22px;align-items:center}.ws-consent-copy strong{display:block;font-family:'Be Vietnam Pro',Inter,sans-serif;font-size:.98rem;margin-bottom:4px}.ws-consent-copy p{margin:0;color:#6d6878;font-size:.78rem;line-height:1.55}.ws-consent-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end}.ws-consent button{font:inherit;border:0;cursor:pointer;min-height:42px;padding:0 14px;border-radius:11px;font-size:.76rem;font-weight:700}.ws-consent-reject{background:#f7f5f9;color:#544d5e;border:1px solid #e5e0e9!important}.ws-consent-accept{background:#7c3aed;color:#fff;box-shadow:0 8px 20px rgba(124,58,237,.18)}.ws-cookie-settings{appearance:none;border:0;background:none;color:inherit;text-decoration:underline;text-underline-offset:3px;cursor:pointer;font:inherit;padding:0;opacity:.78}.ws-cookie-settings:hover{opacity:1}
      @media(max-width:700px){.ws-consent{bottom:12px;padding:16px;border-radius:17px}.ws-consent-inner{grid-template-columns:1fr;gap:14px}.ws-consent-actions{justify-content:stretch}.ws-consent button{flex:1 1 180px}.ws-consent-copy p{font-size:.75rem}}
    `;
    document.head.appendChild(el);
  };

  let banner=null;
  const hide=()=>{banner?.remove();banner=null};

  const show=()=>{
    if(!required||banner)return;
    style();
    const copy=COPY[locale()]||COPY.en;
    banner=document.createElement('div');
    banner.className='ws-consent';
    banner.setAttribute('role','dialog');
    banner.setAttribute('aria-label',copy.title);
    banner.innerHTML=`<div class="ws-consent-inner"><div class="ws-consent-copy"><strong>${copy.title}</strong><p>${copy.body}</p></div><div class="ws-consent-actions"><button type="button" class="ws-consent-reject">${copy.reject}</button><button type="button" class="ws-consent-accept">${copy.accept}</button></div></div>`;
    banner.querySelector('.ws-consent-accept').addEventListener('click',()=>set('granted'));
    banner.querySelector('.ws-consent-reject').addEventListener('click',()=>set('denied'));
    document.body.appendChild(banner);
  };

  const addSettingsLink=()=>{
    if(!required||document.querySelector('.ws-cookie-settings'))return;
    const footer=document.querySelector('footer');
    if(!footer)return;
    const copy=COPY[locale()]||COPY.en;
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='ws-cookie-settings';
    btn.textContent=copy.settings;
    btn.addEventListener('click',show);
    const target=footer.querySelector('.ws-footer-contact,.ws-footer-links')||footer;
    target.appendChild(btn);
  };

  function set(value){
    write(value);
    consentUpdate(value);
    window.__WS_ANALYTICS_ALLOWED__=value==='granted';
    if(value==='granted')loadGoogleAnalytics();
    else clearGaCookies();
    hide();
    addSettingsLink();
  }

  window.WistudiConsent={
    open:show,
    get:read,
    set
  };

  if(!required){
    window.__WS_ANALYTICS_ALLOWED__=true;
    return;
  }

  const saved=read();
  if(saved==='granted'){
    consentUpdate('granted');
    window.__WS_ANALYTICS_ALLOWED__=true;
    loadGoogleAnalytics();
  }else if(saved==='denied'){
    consentUpdate('denied');
    window.__WS_ANALYTICS_ALLOWED__=false;
    clearGaCookies();
  }else{
    window.__WS_ANALYTICS_ALLOWED__=false;
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',show,{once:true});
    else show();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addSettingsLink,{once:true});
  else addSettingsLink();
})();
