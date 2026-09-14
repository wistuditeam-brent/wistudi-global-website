const ACCESS_WEBHOOK='https://hook.eu1.make.com/yvas6zo5dutxyb0lubdme3p8fg08mbkq';
const TOKEN_RE=/^WST-[A-Za-z0-9_-]{3,80}$/i;
const clean=(v,max=500)=>String(v||'').trim().slice(0,max);
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}})}

export async function onRequestPost(context){
  let body;try{body=await context.request.json()}catch(_){return json({ok:false,error:'invalid_json'},400)}
  const payload={
    full_name:clean(body.full_name,120),
    organisation:clean(body.organisation,160),
    email:clean(body.email,180),
    session_id:clean(body.session_id,140),
    wst:clean(body.wst,100),
    path:clean(body.path,240)
  };
  if(!payload.full_name||!payload.organisation||!payload.email)return json({ok:false,error:'missing_fields'},400);
  if(payload.wst&&!TOKEN_RE.test(payload.wst))return json({ok:false,error:'invalid_token'},400);

  try{
    const res=await fetch(ACCESS_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    if(!res.ok)return json({ok:false,error:'delivery_failed'},502);
    return json({ok:true});
  }catch(_){
    return json({ok:false,error:'delivery_failed'},502);
  }
}
export async function onRequest(context){if(context.request.method==='POST')return onRequestPost(context);return json({ok:false,error:'method_not_allowed'},405)}
