(()=>{
  'use strict';

  const EVENT_ID='communicative-esl-flow-2026-09-15';
  const EVENT_NAME='Building a Communicative ESL Lesson with Flow';
  const EVENT_START=new Date('2026-09-15T14:00:00+07:00');
  const EVENT_ZOOM_URL='https://us05web.zoom.us/j/89878175931?pwd=GMeXxQKb9nIehaEG7cJaM5bEmrdipU.1';
  const ENDPOINT='/api/event-register';

  const style=document.createElement('style');
  style.id='event-registration-confirmation-css';
  style.textContent=`
    .registration-card.registration-complete{padding:34px;overflow:hidden}
    .registration-complete:before{background:linear-gradient(90deg,#21a366,#6d28d9,#3157f5)}
    .reg-confirm-head{display:grid;grid-template-columns:58px 1fr;gap:18px;align-items:start;padding-bottom:25px;border-bottom:1px solid #f0ebf4}
    .reg-confirm-check{width:58px;height:58px;border-radius:18px;display:grid;place-items:center;background:#e6f7ee;color:#159957;box-shadow:0 8px 22px rgba(21,153,87,.12)}
    .reg-confirm-check svg{width:30px;height:30px;stroke:currentColor;fill:none;stroke-width:2.7}
    .reg-confirm-head h3{font-family:'Be Vietnam Pro',Inter,sans-serif;font-size:1.75rem;letter-spacing:-.04em;line-height:1.15;margin:1px 0 7px;color:#201a27}
    .reg-confirm-head p{margin:0;color:#756d7e;font-size:.86rem;line-height:1.65;max-width:690px}
    .reg-confirm-panel{margin-top:24px;padding:22px;border:1px solid #e9e2ef;border-radius:18px;background:linear-gradient(180deg,#fcfbfe,#faf8fd)}
    .reg-confirm-panel h4{margin:0 0 17px;font-family:'Be Vietnam Pro',Inter,sans-serif;font-size:1.02rem;color:#2d2635}
    .reg-confirm-grid{display:grid;grid-template-columns:minmax(120px,.42fr) minmax(0,1fr);gap:11px 22px;margin:0}
    .reg-confirm-grid dt{margin:0;color:#918799;font-size:.75rem;font-weight:650}
    .reg-confirm-grid dd{margin:0;color:#443c4c;font-size:.79rem;line-height:1.5;overflow-wrap:anywhere}
    .reg-confirm-zoom{display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center;margin-top:18px;padding:17px 18px;border-radius:15px;background:linear-gradient(135deg,#f4efff,#eee7ff);border:1px solid #dfd1f7;color:#39265f}
    .reg-confirm-zoom strong{display:block;font-size:.82rem;line-height:1.35}.reg-confirm-zoom span{display:block;margin-top:4px;color:#75688a;font-size:.7rem;line-height:1.45}
    .reg-confirm-zoom a{min-height:42px;padding:0 17px;border-radius:11px;background:#6d28d9;color:#fff;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;font-size:.74rem;font-weight:800;white-space:nowrap;box-shadow:0 8px 18px rgba(109,40,217,.18)}
    .reg-confirm-email{display:grid;grid-template-columns:42px 1fr;gap:13px;align-items:start;margin-top:18px;padding:15px 16px;border-radius:14px;background:#f6f1ff;border:1px solid #e5daf8;color:#5c4b74}
    .reg-confirm-email-icon{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:#fff;color:#6d28d9;box-shadow:0 5px 14px rgba(76,44,123,.08)}
    .reg-confirm-email-icon svg{width:19px;height:19px;stroke:currentColor;fill:none;stroke-width:2}
    .reg-confirm-email strong{color:#46355f}.reg-confirm-email p{margin:0;font-size:.76rem;line-height:1.58}
    .reg-confirm-email p+p{margin-top:3px;color:#7f7489;font-size:.7rem}
    .reg-confirm-email.email-warning{background:#fff9ed;border-color:#f0dfbc;color:#7a5c1f}.reg-confirm-email.email-warning .reg-confirm-email-icon{color:#9b6b0c}
    .reg-confirm-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:20px}
    .reg-confirm-back{min-height:46px;border:1px solid #d9cfee;border-radius:13px;background:#fff;color:#6d28d9;padding:0 18px;font:inherit;font-size:.78rem;font-weight:750;cursor:pointer;transition:.18s ease}
    .reg-confirm-back:hover{background:#faf7ff;border-color:#bea9e8}
    @media(max-width:620px){.registration-card.registration-complete{padding:22px}.reg-confirm-head{grid-template-columns:48px 1fr;gap:14px}.reg-confirm-check{width:48px;height:48px;border-radius:15px}.reg-confirm-head h3{font-size:1.45rem}.reg-confirm-panel{padding:18px}.reg-confirm-grid{grid-template-columns:1fr;gap:3px}.reg-confirm-grid dd{margin-bottom:9px}.reg-confirm-zoom{grid-template-columns:1fr}.reg-confirm-zoom a{width:100%}.reg-confirm-actions{justify-content:stretch}.reg-confirm-back{width:100%}}
  `;
  document.head.appendChild(style);

  const escapeHtml=(value)=>String(value??'')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');

  function eventLocalDetails(timezone){
    let zone=timezone||'Asia/Ho_Chi_Minh';
    try{new Intl.DateTimeFormat(undefined,{timeZone:zone}).format(new Date())}catch{zone='Asia/Ho_Chi_Minh'}
    const date=new Intl.DateTimeFormat(undefined,{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:zone}).format(EVENT_START);
    const time=new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit',timeZoneName:'short',timeZone:zone}).format(EVENT_START);
    return{date,time};
  }

  function renderConfirmation(card,payload,result){
    const {date,time}=eventLocalDetails(payload.timezone);
    const emailSent=result.confirmation_email_sent===true;
    const duplicate=result.duplicate===true;
    const orgName=payload.organisation_name||'Not provided';
    card.classList.add('registration-complete');
    card.innerHTML=`
      <div class="reg-confirm-head">
        <div class="reg-confirm-check" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg></div>
        <div>
          <h3>${duplicate?'You’re already registered':'Registration complete'}</h3>
          <p>${duplicate?'Your existing registration for this workshop is active.':'Your place has been saved for this workshop.'} The Zoom joining link is available below and is also included in your confirmation email.</p>
        </div>
      </div>
      <div class="reg-confirm-panel">
        <h4>Your details</h4>
        <dl class="reg-confirm-grid">
          <dt>Event</dt><dd>${escapeHtml(EVENT_NAME)}</dd>
          <dt>Date</dt><dd>${escapeHtml(date)}</dd>
          <dt>Time</dt><dd>${escapeHtml(time)}</dd>
          <dt>First name</dt><dd>${escapeHtml(payload.first_name)}</dd>
          <dt>Last name</dt><dd>${escapeHtml(payload.last_name)}</dd>
          <dt>Email</dt><dd>${escapeHtml(payload.email)}</dd>
          <dt>Country</dt><dd>${escapeHtml(payload.country)}</dd>
          <dt>Organisation type</dt><dd>${escapeHtml(payload.organisation_type)}</dd>
          <dt>Organisation / school name</dt><dd>${escapeHtml(orgName)}</dd>
          <dt>Role</dt><dd>${escapeHtml(payload.role)}</dd>
        </dl>
      </div>
      <div class="reg-confirm-zoom">
        <div><strong>Join the live workshop on Zoom</strong><span>The room opens 15 minutes before the workshop.</span></div>
        <a href="${EVENT_ZOOM_URL}" target="_blank" rel="noopener">Join Zoom session</a>
      </div>
      <div class="reg-confirm-email${emailSent?'':' email-warning'}">
        <div class="reg-confirm-email-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 5h18v14H3zM3 7l9 6 9-6"/></svg></div>
        <div>
          <p>${emailSent?`A confirmation email with the Zoom link has been sent to <strong>${escapeHtml(payload.email)}</strong>.`:`Your registration is saved. We could not send the confirmation email right now.`}</p>
          <p>${emailSent?'We’ll send any final workshop information to the same address before the session.':'The Zoom link is available above. If you need support, contact support@wistudi.com.'}</p>
        </div>
      </div>
      <div class="reg-confirm-actions"><button type="button" class="reg-confirm-back" id="registrationBackToEvent">Back to event</button></div>`;
    document.getElementById('registrationBackToEvent')?.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
    card.scrollIntoView({behavior:'smooth',block:'center'});
  }

  document.addEventListener('submit',async(event)=>{
    const form=event.target;
    if(!(form instanceof HTMLFormElement)||form.id!=='eventRegistrationForm') return;

    const privacy=form.querySelector('#regPrivacy');
    if(!form.checkValidity()||!privacy?.checked) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const status=document.getElementById('registrationStatus');
    const submit=document.getElementById('registrationSubmit');
    const label=submit?.querySelector('span');
    const params=new URLSearchParams(location.search);
    const timezone=Intl.DateTimeFormat().resolvedOptions().timeZone||'Asia/Ho_Chi_Minh';
    const card=form.closest('.registration-card');

    const payload=Object.fromEntries(new FormData(form).entries());
    payload.event_id=EVENT_ID;
    payload.event_name=EVENT_NAME;
    payload.timezone=timezone;
    payload.privacy_consent=true;
    payload.marketing_consent=!!form.querySelector('[name="marketing_consent"]')?.checked;
    ['utm_source','utm_medium','utm_campaign','utm_content','outreach_token'].forEach((key)=>{
      payload[key]=params.get(key)||'';
    });

    if(submit) submit.disabled=true;
    if(label) label.textContent='Registering…';
    if(status){
      status.className='registration-status show info';
      status.textContent='Saving your registration…';
    }

    try{
      const response=await fetch(ENDPOINT,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      });
      const result=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(result.error||'Unable to complete registration.');
      if(card) renderConfirmation(card,payload,result);
    }catch(error){
      if(status){
        status.className='registration-status show error';
        status.textContent=error?.message||'Unable to complete registration.';
      }
      if(submit) submit.disabled=false;
      if(label) label.textContent='Register Free';
    }
  },true);
})();