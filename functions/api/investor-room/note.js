const NOTE_WEBHOOK='https://hook.eu1.make.com/uvva4h7fxjt2kae464t5v4j3edbj7j2w';
const TOKEN_RE=/^WST-[A-Za-z0-9_-]{3,80}$/i;
const clean=(v,max=500)=>String(v||'').trim().slice(0,max);
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}})}

export async function onRequestPost(context){
  let body;try{body=await context.request.json()}catch(_){return json({ok:false,error:'invalid_json'},400)}
  const payload={
    full_name:clean(body.full_name,120),
    organisation:clean(body.organisation,160),
    note:clean(body.note,2500),
    session_id:clean(body.session_id,140),
    wst:clean(body.wst,100),
    url:clean(body.url,500),
    slide:Math.max(1,Math.min(parseInt(body.slide,10)||1,500))
  };
  if(!payload.full_name||!payload.organisation||!payload.note)return json({ok:false,error:'missing_fields'},400);
  if(payload.wst&&!TOKEN_RE.test(payload.wst))return json({ok:false,error:'invalid_token'},400);

  try{
    const res=await fetch(NOTE_WEBHOOK,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    if(!res.ok)return json({ok:false,error:'delivery_failed'},502);
    return json({ok:true});
  }catch(_){
    return json({ok:false,error:'delivery_failed'},502);
  }
}
export async function onRequest(context){if(context.request.method==='POST')return onRequestPost(context);return json({ok:false,error:'method_not_allowed'},405)}
