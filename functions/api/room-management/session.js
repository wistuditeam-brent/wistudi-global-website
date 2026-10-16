// Interim single-manager login. Replace with per-user identity before multi-manager rollout.
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store',...headers}});
const enc=new TextEncoder();
async function sign(secret,value){const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return [...new Uint8Array(await crypto.subtle.sign('HMAC',key,enc.encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('')}
export async function onRequest({request,env}){
 if(request.method==='POST'){
  const origin=request.headers.get('origin');if(origin!==new URL(request.url).origin)return json({ok:false,error:'invalid_origin'},403);
  const body=await request.json().catch(()=>null);const secret=env.ROOM_MANAGER_TOKEN;
  if(!secret||typeof body?.password!=='string'||body.password.length!==secret.length)return json({ok:false,error:'invalid_credentials'},401);
  let mismatch=0;for(let i=0;i<secret.length;i++)mismatch|=secret.charCodeAt(i)^body.password.charCodeAt(i);
  if(mismatch)return json({ok:false,error:'invalid_credentials'},401);
  const expiry=Math.floor(Date.now()/1000)+3600,nonce=crypto.randomUUID(),value=expiry+'.'+nonce,signature=await sign(secret,value);
  return json({ok:true,expires_at:expiry},200,{'set-cookie':'wistudi_room_session='+value+'.'+signature+'; HttpOnly; Secure; SameSite=Strict; Path=/api/room-management/; Max-Age=3600'});
 }
 if(request.method==='DELETE'){
  const origin=request.headers.get('origin');if(origin!==new URL(request.url).origin)return json({ok:false,error:'invalid_origin'},403);
  return json({ok:true},200,{'set-cookie':'wistudi_room_session=; HttpOnly; Secure; SameSite=Strict; Path=/api/room-management/; Max-Age=0'});
 }
 return json({ok:false,error:'method_not_allowed'},405);
}
