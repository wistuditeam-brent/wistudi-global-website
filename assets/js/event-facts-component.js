(()=>{
  'use strict';

  const START = new Date('2026-09-15T14:00:00+07:00');
  const ASSET_ROOT = '/assets/images/resources/events/communicative-esl-flow/';
  const current = document.querySelector('section.ec.facts');
  if (!current) return;

  const style = document.createElement('style');
  style.id = 'event-facts-component-css';
  style.textContent = `
    .event-facts-strip{
      position:relative;
      width:min(calc(100% - 40px),1180px);
      margin:0 auto 34px;
      display:grid;
      grid-template-columns:1.05fr 1.08fr 1.12fr .8fr .95fr;
      border:1px solid #e9e2ef;
      border-radius:12px;
      background:#fff;
      box-shadow:0 12px 32px rgba(53,35,82,.06);
      overflow:hidden;
      isolation:isolate;
    }
    .event-facts-strip:before{
      content:'';
      position:absolute;
      left:-46px;
      bottom:-62px;
      width:250px;
      height:124px;
      border-radius:52% 48% 0 0/72% 72% 0 0;
      background:linear-gradient(125deg,rgba(245,237,255,.98),rgba(255,244,237,.92));
      transform:rotate(4deg);
      z-index:-1;
      pointer-events:none;
    }
    .event-facts-strip:after{
      content:'';
      position:absolute;
      right:-10px;
      top:-10px;
      width:102px;
      height:88px;
      background:
        repeating-linear-gradient(135deg,transparent 0 10px,rgba(111,70,228,.18) 10px 13px,transparent 13px 21px),
        linear-gradient(145deg,rgba(239,230,255,.96),rgba(255,255,255,0));
      clip-path:polygon(44% 0,100% 0,100% 100%);
      z-index:-1;
      pointer-events:none;
    }
    .event-fact{
      min-width:0;
      display:grid;
      grid-template-columns:50px minmax(0,1fr);
      gap:14px;
      align-items:center;
      padding:22px 18px;
      border-right:1px solid #eee8f3;
    }
    .event-fact:last-child{border-right:0}
    .event-fact-icon{
      width:50px;
      height:50px;
      display:grid;
      place-items:center;
    }
    .event-fact-icon img,
    .event-fact-icon svg{
      width:40px;
      height:40px;
      object-fit:contain;
      display:block;
    }
    .event-fact-copy{
      min-width:0;
      font-family:'Be Vietnam Pro',Inter,sans-serif;
    }
    .event-fact-label{
      display:block;
      margin-bottom:5px;
      color:#9a8ea4;
      font-size:.66rem;
      font-weight:800;
      letter-spacing:.075em;
      text-transform:uppercase;
    }
    .event-fact-value{
      display:block;
      color:#1d1830;
      font-size:.96rem;
      font-weight:700;
      line-height:1.34;
      letter-spacing:-.018em;
    }
    .event-fact-sub{
      display:block;
      margin-top:4px;
      color:#82778d;
      font-family:Inter,sans-serif;
      font-size:.68rem;
      font-weight:500;
      line-height:1.35;
      overflow-wrap:anywhere;
    }
    @media(max-width:980px){
      .event-facts-strip{grid-template-columns:repeat(2,1fr)}
      .event-fact{border-bottom:1px solid #eee8f3}
      .event-fact:nth-child(even){border-right:0}
      .event-fact:last-child{grid-column:1/-1;border-bottom:0}
    }
    @media(max-width:620px){
      .event-facts-strip{
        width:min(calc(100% - 26px),1180px);
        grid-template-columns:1fr;
        border-radius:10px;
      }
      .event-fact,.event-fact:nth-child(even),.event-fact:last-child{
        grid-column:auto;
        border-right:0;
        border-bottom:1px solid #eee8f3;
        padding:18px;
      }
      .event-fact:last-child{border-bottom:0}
    }
  `;
  document.head.appendChild(style);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh';
  const dateText = new Intl.DateTimeFormat(undefined, {
    day:'numeric',
    month:'long',
    year:'numeric'
  }).format(START);
  const timeText = new Intl.DateTimeFormat(undefined, {
    hour:'numeric',
    minute:'2-digit',
    timeZoneName:'short'
  }).format(START);

  const peopleIcon = `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <g fill="none" stroke="#fd7043" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="32" cy="18" r="8"/>
        <circle cx="15" cy="24" r="6"/>
        <circle cx="49" cy="24" r="6"/>
        <path d="M18 51c0-9 6-16 14-16s14 7 14 16"/>
        <path d="M4 50c0-7 5-13 11-13 3 0 6 1 8 4"/>
        <path d="M60 50c0-7-5-13-11-13-3 0-6 1-8 4"/>
      </g>
    </svg>`;

  const data = [
    {label:'Date', value:dateText, icon:'fact-date.png'},
    {label:'Your time', value:timeText, sub:timezone, icon:'fact-time.png'},
    {label:'Format', value:'Live online workshop', icon:'fact-format.png'},
    {label:'Cost', value:'Free to join', icon:'fact-cost.png'},
    {label:'For', value:'ESL teachers', html:peopleIcon}
  ];

  const section = document.createElement('section');
  section.className = 'event-facts-strip';
  section.setAttribute('aria-label','Event details');
  section.innerHTML = data.map(item => `
    <div class="event-fact">
      <div class="event-fact-icon">${item.html || `<img src="${ASSET_ROOT}${item.icon}" alt="" aria-hidden="true">`}</div>
      <div class="event-fact-copy">
        <span class="event-fact-label">${item.label}</span>
        <strong class="event-fact-value">${item.value}</strong>
        ${item.sub ? `<span class="event-fact-sub">${item.sub}</span>` : ''}
      </div>
    </div>
  `).join('');

  current.replaceWith(section);
})();