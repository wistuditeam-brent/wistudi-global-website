const MAKE_TRACKING_WEBHOOK = 'https://hook.eu1.make.com/wzyluoaup7e7yp8kinsr2fk4c8n2pcgu';
const TOKEN_RE = /^WST-[A-Za-z0-9_-]{3,80}$/i;
const ALLOWED_EVENTS = new Set(['website_visit','investor_room_visit']);

function json(data,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{
      'Content-Type':'application/json; charset=utf-8',
      'Cache-Control':'no-store'
    }
  });
}

export async function onRequestPost(context){
  let body;
  try{ body=await context.request.json(); }
  catch(_){ return json({ok:false,error:'invalid_json'},400); }

  const token=String(body?.token||'').trim();
  const event=String(body?.event||'').trim();
  const confidence=String(body?.confidence||'').slice(0,80);
  const path=String(body?.path||'').slice(0,240);
  const clientTimestamp=String(body?.client_timestamp||'').slice(0,80);
  const sessionKey=String(body?.session_key||'').slice(0,120);

  if(!TOKEN_RE.test(token)) return json({ok:false,error:'invalid_token'},400);
  if(!ALLOWED_EVENTS.has(event)) return json({ok:false,error:'invalid_event'},400);
  if(!path.startsWith('/')) return json({ok:false,error:'invalid_path'},400);

  const payload={
    token,
    event,
    confidence:confidence||'direct_unique_link',
    path,
    client_timestamp:clientTimestamp||new Date().toISOString(),
    session_key:sessionKey
  };

  try{
    const res=await fetch(MAKE_TRACKING_WEBHOOK,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });

    if(!res.ok) return json({ok:false,error:'tracker_unavailable'},502);
    return json({ok:true});
  }catch(_){
    return json({ok:false,error:'tracker_unavailable'},502);
  }
}

export async function onRequest(context){
  if(context.request.method==='POST') return onRequestPost(context);
  return json({ok:false,error:'method_not_allowed'},405);
}
