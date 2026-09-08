(()=>{
'use strict';
const EVENT_PATH='/resources/events/building-a-communicative-esl-lesson-with-flow/';
const path=(window.__WS_PREVIEW_PATH||location.pathname||'').replace(/\/index\.html$/,'/').replace(/^\/(vi|zh-cn|th|id|ms|ar)(?=\/)/,'');
if(!path.includes(EVENT_PATH))return;

const START=new Date('2026-09-15T14:00:00+07:00');
const DURATION_MINUTES=90;
const ROOM_OPEN_MINUTES=15;
const ZOOM_JOIN_URL='https://us05web.zoom.us/j/89878175931?pwd=GMeXxQKb9nIehaEG7cJaM5bEmrdipU.1';

const calendarUrl=()=>{
  const end=new Date(START.getTime()+DURATION_MINUTES*60000);
  const basic=d=>d.toISOString().replace(/[-:]|\.\d{3}/g,'');
  const u=new URL('https://calendar.google.com/calendar/render');
  u.searchParams.set('action','TEMPLATE');
  u.searchParams.set('text','Building a Communicative ESL Lesson with Flow');
  u.searchParams.set('dates',`${basic(START)}/${basic(end)}`);
  u.searchParams.set('details',`Free live workshop for ESL teachers with Trainer Nadia, presented by Wistudi in collaboration with Happy Teachers Academy.\n\nJoin on Zoom: ${ZOOM_JOIN_URL}\n\nEvent page: ${location.origin}${EVENT_PATH}`);
  u.searchParams.set('location',ZOOM_JOIN_URL);
  return u.toString();
};

const bindCalendar=button=>{
  if(!button||button.dataset.wsZoomCalendar==='true')return;
  button.dataset.wsZoomCalendar='true';
  button.addEventListener('click',event=>{
    event.preventDefault();
    event.stopImmediatePropagation();
    window.open(calendarUrl(),'_blank','noopener');
  },true);
};

const syncFallbackJoin=()=>{
  const button=document.getElementById('joinLiveButton');
  if(!button)return;
  const now=Date.now();
  const opens=START.getTime()-ROOM_OPEN_MINUTES*60000;
  const ends=START.getTime()+DURATION_MINUTES*60000;
  if(now>=opens&&now<=ends){
    button.classList.remove('disabled');
    button.removeAttribute('aria-disabled');
    button.href=ZOOM_JOIN_URL;
    button.target='_blank';
    button.rel='noopener';
  }
};

const sync=()=>{
  bindCalendar(document.getElementById('addCalendarTop'));
  document.querySelectorAll('[data-event-calendar],[data-event-reminder]').forEach(bindCalendar);
  syncFallbackJoin();
};

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
new MutationObserver(sync).observe(document.documentElement,{childList:true,subtree:true});
setInterval(syncFallbackJoin,30000);
})();