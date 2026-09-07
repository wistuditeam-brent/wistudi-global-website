(()=>{
  'use strict';

  const ASSET_ROOT = '/assets/images/resources/events/communicative-esl-flow/';
  const actions = document.querySelector('.hero-actions');
  const register = actions && actions.querySelector('a.primary[href="#register"]');
  const calendar = document.getElementById('addCalendarTop');
  const oldShareWrap = document.getElementById('shareWrap');
  if (!actions || !register || !calendar || !oldShareWrap) return;

  const style = document.createElement('style');
  style.id = 'event-hero-actions-component-css';
  style.textContent = `
    .event-hero-actions{display:flex;align-items:center;gap:0;margin-top:22px;font-family:'Be Vietnam Pro',Inter,sans-serif}
    .event-hero-register{min-width:245px;min-height:76px;padding:0 28px;border-radius:20px;background:linear-gradient(135deg,#5b28eb 0%,#7b45f5 58%,#8b5cf6 100%)!important;color:#fff!important;border:0!important;box-shadow:0 16px 30px rgba(103,52,237,.24)!important;font-family:'Be Vietnam Pro',Inter,sans-serif!important;font-size:1.18rem!important;font-weight:700!important;letter-spacing:-.025em;justify-content:center;flex:0 0 auto}
    .event-hero-register:hover{transform:translateY(-2px);box-shadow:0 19px 34px rgba(103,52,237,.29)!important}
    .event-hero-utility{min-height:76px;padding:0 24px;border:0!important;background:transparent!important;color:#29233a!important;border-radius:0!important;box-shadow:none!important;display:flex;align-items:center;gap:13px;font-family:'Be Vietnam Pro',Inter,sans-serif!important;font-size:1.02rem!important;font-weight:700!important;line-height:1.2;cursor:pointer;position:relative}
    .event-hero-utility:hover{transform:none!important;color:#5f31da!important}
    .event-hero-utility+.event-hero-utility:before{content:'';position:absolute;left:0;top:20px;bottom:20px;width:1px;background:#ded5ef}
    .event-action-icon{width:58px;height:58px;flex:0 0 58px;border-radius:50%;background:#f3edff;display:grid;place-items:center;position:relative}
    .event-action-icon svg{width:34px;height:34px;display:block;overflow:visible}
    .event-action-icon.calendar-icon:after{content:'+';position:absolute;right:-4px;bottom:-2px;width:23px;height:23px;border-radius:50%;display:grid;place-items:center;background:#fff1fb;color:#d23be7;font:800 1rem/1 Inter,sans-serif;box-shadow:0 4px 12px rgba(110,53,210,.12)}
    .event-action-label{display:block;text-align:left;white-space:nowrap}

    .event-share-overlay{position:fixed;inset:0;z-index:10000;display:none;align-items:center;justify-content:center;padding:22px;background:rgba(24,16,42,.42);backdrop-filter:blur(8px)}
    .event-share-overlay.open{display:flex}
    .event-share-modal{width:min(540px,100%);background:#fff;border:1px solid #e6def1;border-radius:22px;box-shadow:0 30px 80px rgba(36,20,65,.24);overflow:hidden;font-family:'Be Vietnam Pro',Inter,sans-serif}
    .event-share-head{display:flex;align-items:flex-start;justify-content:space-between;gap:22px;padding:24px 26px 18px;border-bottom:1px solid #eee8f3;background:linear-gradient(135deg,#fbf9ff,#f6f0ff)}
    .event-share-head h3{margin:0;color:#1d1730;font-size:1.35rem;line-height:1.2;letter-spacing:-.03em}
    .event-share-head p{margin:7px 0 0;color:#756c81;font:500 .78rem/1.55 Inter,sans-serif;max-width:360px}
    .event-share-close{width:36px;height:36px;border:0;background:#fff;border-radius:50%;cursor:pointer;display:grid;place-items:center;color:#6c6278;font-size:1.25rem;box-shadow:0 4px 14px rgba(45,27,72,.08)}
    .event-share-body{padding:22px 26px 26px}
    .event-share-title{padding:0 0 17px;color:#332d3d;font-size:.82rem;line-height:1.5;font-weight:700}
    .event-share-linkrow{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:8px 8px 8px 14px;border:1px solid #ddd4e9;border-radius:13px;background:#fff}
    .event-share-linkrow span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#756d7e;font:500 .73rem/1.2 Inter,sans-serif}
    .event-share-copy{min-height:38px;padding:0 15px;border:0;border-radius:9px;background:#6432e8;color:#fff;font:700 .72rem/1 Inter,sans-serif;cursor:pointer}
    .event-share-options{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}
    .event-share-option{min-height:68px;padding:10px 14px;border:1px solid #ece5f3;border-radius:14px;background:#fff;color:#342d3f;display:flex;align-items:center;justify-content:flex-start;gap:12px;text-decoration:none;font:700 .78rem/1 Inter,sans-serif;cursor:pointer;transition:.16s ease}
    .event-share-option:hover{background:#faf7ff;color:#6233d8;border-color:#d9cceb;transform:translateY(-1px)}
    .event-share-option img{width:36px;height:36px;object-fit:contain;flex:0 0 36px}

    @media(max-width:760px){
      .event-hero-actions{display:grid;grid-template-columns:1fr 1fr;gap:0}
      .event-hero-register{grid-column:1/-1;width:100%;min-width:0;min-height:60px;border-radius:16px;margin-bottom:8px}
      .event-hero-utility{min-height:64px;padding:0 10px;justify-content:center;font-size:.88rem!important}
      .event-hero-utility+.event-hero-utility:before{top:13px;bottom:13px}
      .event-action-icon{width:46px;height:46px;flex-basis:46px}
      .event-action-icon svg{width:27px;height:27px}
      .event-action-label{white-space:normal}
    }
    @media(max-width:460px){
      .event-hero-utility{gap:8px;font-size:.78rem!important}
      .event-action-icon{width:42px;height:42px;flex-basis:42px}
      .event-share-options{grid-template-columns:1fr}
    }
  `;
  document.head.appendChild(style);

  const calendarIcon = `
    <span class="event-action-icon calendar-icon" aria-hidden="true">
      <svg viewBox="0 0 48 48" fill="none">
        <rect x="8" y="11" width="32" height="29" rx="5" stroke="#6734ed" stroke-width="3"/>
        <path d="M8 19h32M16 7v8M32 7v8" stroke="#6734ed" stroke-width="3" stroke-linecap="round"/>
        <path d="M15 25h5M27 25h5M15 32h5M27 32h5" stroke="#8b5cf6" stroke-width="3" stroke-linecap="round"/>
      </svg>
    </span>`;

  const shareIcon = `
    <span class="event-action-icon" aria-hidden="true">
      <svg viewBox="0 0 48 48" fill="none">
        <circle cx="35" cy="11" r="5" stroke="#6734ed" stroke-width="3"/>
        <circle cx="13" cy="24" r="5" stroke="#6734ed" stroke-width="3"/>
        <circle cx="35" cy="37" r="5" stroke="#6734ed" stroke-width="3"/>
        <path d="M17.5 21.5 30.5 14M17.5 26.5 30.5 34" stroke="#6734ed" stroke-width="3" stroke-linecap="round"/>
        <path d="M39 5.5v-3M43.5 10h3M41.6 3.4l2.1-2.1" stroke="#b235ea" stroke-width="2.3" stroke-linecap="round"/>
      </svg>
    </span>`;

  actions.classList.add('event-hero-actions');
  register.classList.add('event-hero-register');
  register.innerHTML = '<span>Register Free →</span>';

  calendar.className = 'event-hero-utility';
  calendar.innerHTML = `${calendarIcon}<span class="event-action-label">Add to<br>calendar</span>`;

  const shareButton = document.createElement('button');
  shareButton.type = 'button';
  shareButton.className = 'event-hero-utility';
  shareButton.setAttribute('aria-haspopup','dialog');
  shareButton.setAttribute('aria-expanded','false');
  shareButton.innerHTML = `${shareIcon}<span class="event-action-label">Share</span>`;
  oldShareWrap.replaceWith(shareButton);

  const url = location.href.split('#')[0].split('?')[0];
  const title = 'Building a Communicative ESL Lesson with Flow';
  const shareText = 'Free live workshop for ESL teachers with Trainer Nadia.';

  const overlay = document.createElement('div');
  overlay.className = 'event-share-overlay';
  overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML = `
    <div class="event-share-modal" role="dialog" aria-modal="true" aria-labelledby="eventShareTitle">
      <div class="event-share-head">
        <div>
          <h3 id="eventShareTitle">Share this workshop</h3>
          <p>Invite a teacher, colleague or school to join the live session.</p>
        </div>
        <button class="event-share-close" type="button" aria-label="Close share window">×</button>
      </div>
      <div class="event-share-body">
        <div class="event-share-title">Building a Communicative ESL Lesson with Flow</div>
        <div class="event-share-linkrow">
          <span>${url}</span>
          <button class="event-share-copy" type="button">Copy link</button>
        </div>
        <div class="event-share-options">
          <a class="event-share-option" data-share="email"><img src="${ASSET_ROOT}share-email.png" alt="" aria-hidden="true"><span>Email</span></a>
          <a class="event-share-option" data-share="whatsapp" target="_blank" rel="noopener"><img src="${ASSET_ROOT}share-whatsapp.png" alt="" aria-hidden="true"><span>WhatsApp</span></a>
          <a class="event-share-option" data-share="facebook" target="_blank" rel="noopener"><img src="${ASSET_ROOT}share-facebook.png" alt="" aria-hidden="true"><span>Facebook</span></a>
          <a class="event-share-option" data-share="linkedin" target="_blank" rel="noopener"><img src="${ASSET_ROOT}share-linkedin.png" alt="" aria-hidden="true"><span>LinkedIn</span></a>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const close = overlay.querySelector('.event-share-close');
  const copy = overlay.querySelector('.event-share-copy');
  const email = overlay.querySelector('[data-share="email"]');
  const whatsapp = overlay.querySelector('[data-share="whatsapp"]');
  const facebook = overlay.querySelector('[data-share="facebook"]');
  const linkedin = overlay.querySelector('[data-share="linkedin"]');

  email.href = 'mailto:?subject=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(`${shareText}\n\n${url}`);
  whatsapp.href = 'https://wa.me/?text=' + encodeURIComponent(`${title} ${url}`);
  facebook.href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url);
  linkedin.href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url);

  function openShare(){
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden','false');
    shareButton.setAttribute('aria-expanded','true');
    document.body.style.overflow = 'hidden';
    close.focus();
  }
  function closeShare(){
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden','true');
    shareButton.setAttribute('aria-expanded','false');
    document.body.style.overflow = '';
    shareButton.focus();
  }

  shareButton.addEventListener('click', openShare);
  close.addEventListener('click', closeShare);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeShare(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('open')) closeShare(); });

  copy.addEventListener('click', async()=>{
    try{
      await navigator.clipboard.writeText(url);
      copy.textContent = 'Copied';
      setTimeout(()=>copy.textContent='Copy link',1400);
    }catch(e){
      const input = document.createElement('textarea');
      input.value = url;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
      copy.textContent = 'Copied';
      setTimeout(()=>copy.textContent='Copy link',1400);
    }
  });
})();