(()=>{
  'use strict';

  if(window.__WS_ANALYTICS_EVENTS_LOADED__)return;
  window.__WS_ANALYTICS_EVENTS_LOADED__=true;

  const STORAGE_TOKEN='wistudi_outreach_token';
  const STORAGE_ATTR='wistudi_attribution';
  const WST_RE=/^WST-[A-Za-z0-9_-]{3,80}$/i;
  const params=new URLSearchParams(location.search);

  const getLocale=()=>document.documentElement.dataset.locale||(
    ['vi','zh-cn','th','id','ms','ar'].includes((location.pathname.split('/').filter(Boolean)[0]||'').toLowerCase())
      ? (location.pathname.split('/').filter(Boolean)[0]||'').toLowerCase()
      : 'en'
  );

  const safeStorage={
    get(key){try{return localStorage.getItem(key)}catch(_){return null}},
    set(key,value){try{localStorage.setItem(key,value)}catch(_){}}
  };

  const track=(name,eventParams={})=>{
    if(window.__WS_ANALYTICS_ALLOWED__===false)return;
    if(typeof window.gtag!=='function')return;
    const clean={
      page_path:location.pathname,
      site_locale:getLocale(),
      ...eventParams
    };
    Object.keys(clean).forEach(key=>{
      if(clean[key]===undefined||clean[key]===null||clean[key]==='')delete clean[key];
    });
    window.gtag('event',name,clean);
  };

  window.WistudiAnalytics=window.WistudiAnalytics||{};
  window.WistudiAnalytics.track=track;

  // First-party outreach attribution. The raw WST token is deliberately NOT sent to GA4.
  const incomingToken=(params.get('wst')||'').trim();
  if(incomingToken&&WST_RE.test(incomingToken)){
    safeStorage.set(STORAGE_TOKEN,incomingToken);
  }
  const outreachToken=safeStorage.get(STORAGE_TOKEN)||'';

  const incomingAttr={
    utm_source:(params.get('utm_source')||'').slice(0,120),
    utm_medium:(params.get('utm_medium')||'').slice(0,120),
    utm_campaign:(params.get('utm_campaign')||'').slice(0,160),
    utm_content:(params.get('utm_content')||'').slice(0,160),
    utm_term:(params.get('utm_term')||'').slice(0,160)
  };
  if(Object.values(incomingAttr).some(Boolean)){
    safeStorage.set(STORAGE_ATTR,JSON.stringify(incomingAttr));
  }
  let storedAttr={};
  try{storedAttr=JSON.parse(safeStorage.get(STORAGE_ATTR)||'{}')||{}}catch(_){storedAttr={}}

  let outreachVisitSent=false;
  const sendOutreachVisit=()=>{
    if(outreachVisitSent||!incomingToken||!WST_RE.test(incomingToken))return;
    if(window.__WS_ANALYTICS_ALLOWED__===false)return;
    outreachVisitSent=true;
    track('outreach_visit',{
      campaign_channel:'direct_outreach',
      outreach_present:true
    });
  };
  sendOutreachVisit();
  window.addEventListener('wistudi:analytics-ready',sendOutreachVisit);

  const injectAttributionIntoForm=()=>{
    const form=document.getElementById('wistudiContactForm');
    if(!form)return;
    const ensure=(name,value)=>{
      if(!value)return;
      let input=form.querySelector(`input[name="${name}"]`);
      if(!input){
        input=document.createElement('input');
        input.type='hidden';
        input.name=name;
        form.appendChild(input);
      }
      input.value=value;
    };
    if(outreachToken&&WST_RE.test(outreachToken))ensure('outreach_token',outreachToken);
    ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(key=>ensure(key,String(storedAttr[key]||'').slice(0,180)));
  };

  const setupContactTracking=()=>{
    const form=document.getElementById('wistudiContactForm');
    if(!form)return;
    injectAttributionIntoForm();

    let started=false;
    let lastEnquiry=form.querySelector('[name="enquiry_type"]')?.value||'general';
    const status=document.getElementById('formStatus');

    form.addEventListener('focusin',()=>{
      if(started)return;
      started=true;
      track('contact_form_start',{
        enquiry_type:form.querySelector('[name="enquiry_type"]')?.value||'general',
        outreach_present:!!outreachToken
      });
    },{passive:true});

    form.addEventListener('submit',()=>{
      lastEnquiry=form.querySelector('[name="enquiry_type"]')?.value||'general';
      if(status)delete status.dataset.gaLeadSent;
    },true);

    if(status&&'MutationObserver'in window){
      const observer=new MutationObserver(()=>{
        if(!status.classList.contains('success')||status.dataset.gaLeadSent==='true')return;
        status.dataset.gaLeadSent='true';
        track('generate_lead',{
          method:'contact_form',
          lead_type:lastEnquiry,
          outreach_present:!!outreachToken
        });
      });
      observer.observe(status,{attributes:true,childList:true,subtree:true});
    }
  };

  const classifyClick=(a)=>{
    let url;
    try{url=new URL(a.href,location.href)}catch(_){return}
    const text=(a.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
    const path=url.pathname.toLowerCase();

    if(a.matches('[data-locale],.ws-lang-option')){
      track('language_select',{language_selected:a.dataset.locale||text});
      return;
    }

    if(path.includes('/sign-up')||text.includes('start publishing')||text.includes('start creating')){
      track('signup_cta_click',{cta_text:text.slice(0,80),destination_domain:url.hostname});
      return;
    }

    if(path.includes('/login')||text==='login'||text==='log in'){
      track('login_click',{destination_domain:url.hostname});
      return;
    }

    if(path.includes('/contact')){
      track('contact_cta_click',{
        enquiry_type:url.searchParams.get('type')||'general',
        cta_text:text.slice(0,80)
      });
    }
  };

  document.addEventListener('click',event=>{
    const a=event.target.closest?.('a[href]');
    if(a)classifyClick(a);
    const route=event.target.closest?.('[data-enquiry]');
    if(route){
      track('contact_intent_select',{enquiry_type:route.dataset.enquiry||'general'});
    }
  },true);

  window.addEventListener('message',event=>{
    if(event?.data?.event==='calendly.event_scheduled'){
      track('generate_lead',{
        method:'calendly',
        lead_type:'meeting_booked',
        outreach_present:!!outreachToken
      });
    }
  });

  const ready=()=>{
    setupContactTracking();
    // Re-run after localisation/shell scripts alter the DOM.
    setTimeout(injectAttributionIntoForm,700);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});
  else ready();
})();
