const TOKEN_RE=/^WST-[A-Za-z0-9_-]{3,80}$/i;
const clean=(v,max=500)=>String(v||'').trim().slice(0,max);
const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}})}

export async function onRequestPost(context){
  let body;try{body=await context.request.json()}catch(_){return json({ok:false,error:'invalid_json'},400)}
  const fullName=clean(body.full_name,120),organisation=clean(body.organisation,160),note=clean(body.note,2500),sessionId=clean(body.session_id,140),wst=clean(body.wst,100),url=clean(body.url,500);
  const slide=Math.max(1,Math.min(parseInt(body.slide,10)||1,500));
  if(!fullName||!organisation||!note)return json({ok:false,error:'missing_fields'},400);
  if(wst&&!TOKEN_RE.test(wst))return json({ok:false,error:'invalid_token'},400);
  if(!context.env.RESEND_API_KEY)return json({ok:false,error:'email_not_configured'},503);

  const subject='Investor Room private note — '+organisation+' — Slide '+slide;
  const html=`<div style="font-family:Arial,Helvetica,sans-serif;color:#202124;line-height:1.55">
    <h2 style="margin:0 0 18px">Investor Room private note</h2>
    <p><strong>From:</strong> ${esc(fullName)}<br>
    <strong>Organisation:</strong> ${esc(organisation)}<br>
    <strong>Slide:</strong> ${slide}<br>
    <strong>Tracking token:</strong> ${esc(wst||'Direct / unavailable')}<br>
    <strong>Session:</strong> ${esc(sessionId)}</p>
    <div style="margin:20px 0;padding:16px;border-left:4px solid #8b5cf6;background:#f7f5ff">${esc(note).replace(/\n/g,'<br>')}</div>
    <p style="font-size:12px;color:#6b7280">Investor Room: ${esc(url)}<br>Received: ${new Date().toISOString()}</p>
  </div>`;

  const res=await fetch('https://api.resend.com/emails',{
    method:'POST',
    headers:{'Authorization':'Bearer '+context.env.RESEND_API_KEY,'Content-Type':'application/json'},
    body:JSON.stringify({
      from:context.env.INVESTOR_NOTE_FROM||'Wistudi Investor Room <investor-room@wistudi.com>',
      to:[context.env.INVESTOR_NOTE_TO||'brent@wistudi.com'],
      reply_to:'brent@wistudi.com',
      subject,
      html
    })
  });
  if(!res.ok)return json({ok:false,error:'email_failed'},502);
  return json({ok:true});
}
export async function onRequest(context){if(context.request.method==='POST')return onRequestPost(context);return json({ok:false,error:'method_not_allowed'},405)}
