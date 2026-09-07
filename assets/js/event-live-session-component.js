(()=>{
  'use strict';

  const START = new Date('2026-09-15T14:00:00+07:00');
  const DURATION_MINUTES = 90;
  const ROOM_OPEN_MINUTES = 15;
  const ZOOM_JOIN_URL = '';
  const ASSET_ROOT = '/assets/images/resources/events/communicative-esl-flow/';

  const existing = document.querySelector('section.ec.live-card');
  if (!existing) return;

  const style = document.createElement('style');
  style.id = 'event-live-session-component-css';
  style.textContent = `
    .event-live-shell{margin:0 auto 54px}
    .event-live-kicker{display:block;margin:0 0 10px 5px;font:800 .66rem/1 Inter,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#78708c}
    .event-live-card{position:relative;display:grid;grid-template-columns:minmax(0,1fr) minmax(340px,.72fr);align-items:stretch;border:1px solid #e3dcf1;border-radius:22px;background:#fff;box-shadow:0 12px 35px rgba(48,31,80,.065);overflow:hidden}
    .event-live-main{display:grid;grid-template-columns:72px minmax(0,1fr);gap:20px;align-items:center;padding:25px 30px}
    .event-live-iconbox{width:72px;height:72px;border-radius:18px;background:#f5f0ff;display:grid;place-items:center}
    .event-live-iconbox img{display:block;width:48px;height:48px;object-fit:contain}
    .event-live-copy h2{margin:0;font-family:'Be Vietnam Pro',Inter,sans-serif;font-size:1.42rem;line-height:1.15;letter-spacing:-.035em;color:#1c1730}
    .event-live-copy>p{margin:6px 0 0;font:500 .8rem/1.55 Inter,sans-serif;color:#777083}
    .event-live-countdown{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:14px;color:#817991;font:600 .74rem/1 Inter,sans-serif}
    .event-live-countdown svg{width:18px;height:18px;stroke:#8c84a0;fill:none;stroke-width:2}
    .event-live-countdown-label{margin-right:2px}
    .event-live-timechip{min-width:46px;height:34px;padding:0 9px;border-radius:9px;background:#f2ecff;color:#6433e7;display:inline-flex;align-items:center;justify-content:center;font:800 .76rem/1 Inter,sans-serif}
    .event-live-badge{margin-top:12px;display:block;width:104px;height:auto;object-fit:contain}
    .event-live-side{position:relative;padding:22px 24px 22px 28px;display:flex;flex-direction:column;justify-content:center;gap:10px}
    .event-live-side:before{content:'';position:absolute;left:0;top:23px;bottom:23px;width:1px;background:#e3dcf1}
    .event-live-statuspanel{min-height:62px;border-radius:15px;background:linear-gradient(135deg,#f6f1ff,#f2ecff);display:flex;align-items:center;gap:12px;padding:12px 15px;color:#28126e}
    .event-live-statusicon{width:36px;height:36px;flex:0 0 36px;border-radius:50%;background:#fff;display:grid;place-items:center;border:1px solid #e5dafa}
    .event-live-statusicon svg{width:19px;height:19px;stroke:#6c38e9;fill:none;stroke-width:2}
    .event-live-statusicon img{width:22px;height:22px;object-fit:contain}
    .event-live-statuspanel strong{display:block;font:800 .79rem/1.25 Inter,sans-serif}
    .event-live-statuspanel small{display:block;margin-top:3px;font:500 .67rem/1.3 Inter,sans-serif;color:#81758f}
    .event-live-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px}
    .event-live-action{min-height:42px;border-radius:12px;border:1px solid #ddd5ea;background:#fff;color:#302a3b;display:flex;align-items:center;justify-content:center;gap:8px;padding:0 13px;font:700 .72rem/1 Inter,sans-serif;cursor:pointer;transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease}
    .event-live-action:hover{transform:translateY(-1px);border-color:#cfc1e7;box-shadow:0 6px 15px rgba(65,41,105,.07)}
    .event-live-action img{width:19px;height:19px;object-fit:contain}
    .event-live-join{width:100%;min-height:58px;border:0;border-radius:14px;background:linear-gradient(135deg,#844af4,#6426df);box-shadow:0 12px 24px rgba(103,52,237,.22);color:#fff;display:flex;align-items:center;justify-content:center;gap:10px;text-decoration:none;font:800 .8rem/1 Inter,sans-serif;transition:transform .16s ease,box-shadow .16s ease}
    .event-live-join:hover{transform:translateY(-1px);box-shadow:0 15px 30px rgba(103,52,237,.28)}
    .event-live-join svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2}
    .event-live-preview-note{display:none;margin:1px 0 0;padding:8px 10px;border-radius:9px;background:#fff8e8;color:#7a5a17;font:600 .65rem/1.35 Inter,sans-serif;border:1px solid #f1dfae}
    .event-live-preview-note.show{display:block}
    .event-live-card.is-ended{background:#fff}
    .event-live-card.is-ended .event-live-iconbox{background:#f5f5f9}
    .event-live-card.is-ended .event-live-iconbox img{filter:grayscale(.35);opacity:.82}
    .event-live-card.is-ended .event-live-statuspanel{background:#f2f2f6;color:#69677a}
    .event-live-card.is-ended .event-live-statusicon{background:#e3e3ea;border-color:#e3e3ea}
    .event-live-card.is-ended .event-live-statusicon img{filter:grayscale(1);opacity:.72}
    @media(max-width:900px){.event-live-card{grid-template-columns:1fr}.event-live-side{padding:18px 24px 24px}.event-live-side:before{left:24px;right:24px;top:0;bottom:auto;width:auto;height:1px}}
    @media(max-width:620px){.event-live-shell{width:min(calc(100% - 26px),var(--max))}.event-live-main{grid-template-columns:58px minmax(0,1fr);gap:14px;padding:20px}.event-live-iconbox{width:58px;height:58px;border-radius:15px}.event-live-iconbox img{width:39px;height:39px}.event-live-copy h2{font-size:1.14rem}.event-live-side{padding:17px 20px 20px}.event-live-side:before{left:20px;right:20px}.event-live-actions{grid-template-columns:1fr}.event-live-timechip{min-width:42px}.event-live-statuspanel{min-height:58px}}
    @media(prefers-reduced-motion:reduce){.event-live-action,.event-live-join{transition:none}.event-live-action:hover,.event-live-join:hover{transform:none}}
  `;
  document.head.appendChild(style);

  const shell = document.createElement('section');
  shell.className = 'ec event-live-shell';
  shell.setAttribute('aria-live','polite');
  existing.replaceWith(shell);

  const calendarUrl = () => {
    const end = new Date(START.getTime() + DURATION_MINUTES * 60000);
    const basic = d => d.toISOString().replace(/[-:]|\.\d{3}/g,'');
    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.set('action','TEMPLATE');
    url.searchParams.set('text','Building a Communicative ESL Lesson with Flow');
    url.searchParams.set('dates',`${basic(START)}/${basic(end)}`);
    url.searchParams.set('details',`Free live workshop for ESL teachers with Trainer Nadia, presented by Wistudi in collaboration with Happy Teachers Academy.\n\nEvent page: ${location.href.split('#')[0].split('?')[0]}`);
    url.searchParams.set('location','Online');
    return url.toString();
  };

  const simulation = new URLSearchParams(location.search).get('eventState');
  const validSimulation = ['upcoming','live','ended'].includes(simulation) ? simulation : '';

  function actualState(now){
    const opens = START.getTime() - ROOM_OPEN_MINUTES * 60000;
    const ends = START.getTime() + DURATION_MINUTES * 60000;
    if (now < opens) return 'upcoming';
    if (now < ends) return 'live';
    return 'ended';
  }

  function countdownMarkup(now){
    const remaining = Math.max(0, START.getTime() - now);
    const totalMinutes = Math.floor(remaining / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    return `<div class="event-live-countdown"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span class="event-live-countdown-label">Starts in</span><span class="event-live-timechip">${days}d</span><span class="event-live-timechip">${String(hours).padStart(2,'0')}h</span><span class="event-live-timechip">${String(minutes).padStart(2,'0')}m</span></div>`;
  }

  const actionButtons = () => `<div class="event-live-actions"><button class="event-live-action" type="button" data-event-calendar><img src="${ASSET_ROOT}calendar.webp" alt="">Add to calendar</button><button class="event-live-action" type="button" data-event-reminder><img src="${ASSET_ROOT}reminder.webp" alt="">Get reminder</button></div>`;

  function render(){
    const now = Date.now();
    const state = validSimulation || actualState(now);
    let markup = '';

    if (state === 'upcoming') {
      markup = `<span class="event-live-kicker">Upcoming</span><div class="event-live-card is-upcoming"><div class="event-live-main"><div class="event-live-iconbox"><img src="${ASSET_ROOT}upcoming.webp" alt=""></div><div class="event-live-copy"><h2>Join the live session</h2><p>The live room opens 15 minutes before the workshop.</p>${countdownMarkup(now)}</div></div><div class="event-live-side"><div class="event-live-statuspanel"><span class="event-live-statusicon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10M7 21h10M8 3c0 4 1 5 4 7-3 2-4 3-4 7M16 3c0 4-1 5-4 7 3 2 4 3 4 7"/></svg></span><div><strong>Coming soon</strong><small>Get ready for the live session.</small></div></div>${actionButtons()}</div></div>`;
    } else if (state === 'live') {
      markup = `<span class="event-live-kicker">Live</span><div class="event-live-card is-live"><div class="event-live-main"><div class="event-live-iconbox"><img src="${ASSET_ROOT}live-signal.webp" alt=""></div><div class="event-live-copy"><h2>Enter live session</h2><p>The room is now open — join the workshop live.</p><img class="event-live-badge" src="${ASSET_ROOT}live-badge.webp" alt="Live now"></div></div><div class="event-live-side"><a class="event-live-join" href="${ZOOM_JOIN_URL || '#'}" data-event-join ${ZOOM_JOIN_URL ? 'target="_blank" rel="noopener"' : ''}><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg><span>Enter live session</span><span aria-hidden="true">→</span></a><div class="event-live-preview-note" data-event-preview-note>Preview only: the Zoom joining link will be connected before the event.</div>${actionButtons()}</div></div>`;
    } else {
      markup = `<span class="event-live-kicker">Event ended</span><div class="event-live-card is-ended"><div class="event-live-main"><div class="event-live-iconbox"><img src="${ASSET_ROOT}ended.webp" alt=""></div><div class="event-live-copy"><h2>Live session</h2><p>This event has already finished.</p></div></div><div class="event-live-side"><div class="event-live-statuspanel"><span class="event-live-statusicon"><img src="${ASSET_ROOT}ended.webp" alt=""></span><div><strong>Event has passed</strong><small>The live room is now closed.</small></div></div>${actionButtons()}</div></div>`;
    }

    shell.innerHTML = markup;

    shell.querySelectorAll('[data-event-calendar],[data-event-reminder]').forEach(button => {
      button.addEventListener('click',()=>window.open(calendarUrl(),'_blank','noopener'));
    });

    const join = shell.querySelector('[data-event-join]');
    if (join && !ZOOM_JOIN_URL) {
      join.addEventListener('click',event => {
        event.preventDefault();
        shell.querySelector('[data-event-preview-note]')?.classList.add('show');
      });
    }
  }

  render();
  setInterval(render, 30000);
})();
