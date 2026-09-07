(()=>{
  'use strict';

  const EVENT_ID='communicative-esl-flow-2026-09-15';
  const EVENT_NAME='Building a Communicative ESL Lesson with Flow';
  const ENDPOINT='/api/event-register';

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

      if(status){
        status.className='registration-status show info';
        status.textContent=result.duplicate
          ? 'You’re already registered for this event. Your existing registration is still active.'
          : 'You’re registered. Your place has been saved and we’ll send your joining details by email.';
      }
      if(!result.duplicate) form.reset();
    }catch(error){
      if(status){
        status.className='registration-status show error';
        status.textContent=error?.message||'Unable to complete registration.';
      }
    }finally{
      if(submit) submit.disabled=false;
      if(label) label.textContent='Register Free';
    }
  },true);
})();
