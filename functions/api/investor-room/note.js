const NOTE_WEBHOOK='https://hook.eu1.make.com/uvva4h7fxjt2kae464t5v4j3edbj7j2w';
const TOKEN_RE=/^WST-[A-Za-z0-9_-]{3,80}$/i;
const clean=(v,max=500)=>String(v||'').trim().slice(0,max);
const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}})}

export async function onRequestPost(context){
  let body;try{body=await context.request.json()}catch(_){return json({ok:false,error:'invalid_json'},400)}
  const full_name=clean(body.full_name,120),organisation=clean(body.organisation,160),email=clean(body.email,180),session_id=clean(body.session_id,140),wst=clean(body.wst,100),url=clean(body.url,500);
  if(!full_name||!organisation||!email)return json({ok:false,error:'missing_fields'},400);
  if(wst&&!TOKEN_RE.test(wst))return json({ok:false,error:'invalid_token'},400);
  const notes=Array.isArray(body.notes)?body.notes.slice(0,100).map(item=>({slide:Math.max(1,Math.min(parseInt(item?.slide,10)||1,500)),note:clean(item?.note,2500)})).filter(item=>item.note):[];
  if(!notes.length)return json({ok:false,error:'missing_notes'},400);

  const notes_html=notes.map(item=>'<div style="margin:0 0 18px;padding:14px 16px;border-left:4px solid #8b5cf6;background:#f7f5ff"><div style="font-weight:700;margin-bottom:6px">Slide '+item.slide+'</div><div>'+esc(item.note).replace(/\n/g,'<br>')+'</div></div>').join('');
  const payload={full_name,organisation,email,session_id,wst,url,note_count:notes.length,notes_html};

  try{
    const res=await fetch(NOTE_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    if(!res.ok)return json({ok:false,error:'delivery_failed'},502);
    return json({ok:true});
  }catch(_){
    return json({ok:false,error:'delivery_failed'},502);
  }
}
export async function onRequest(context){if(context.request.method==='POST')return onRequestPost(context);return json({ok:false,error:'method_not_allowed'},405)}
