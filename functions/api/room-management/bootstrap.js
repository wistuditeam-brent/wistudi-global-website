import { derivePassword,newSalt,audit } from './session.js';
const json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
function normalizeKey(value){
 let v=String(value??'').normalize('NFKC').trim();
 if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1).trim();
 return v.replace(/\s+/g,'');
}
function safeEqual(a,b){a=normalizeKey(a);b=normalizeKey(b);if(!a||!b||a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0}
export async function onRequestPost({request,env}){
 try{
  if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return json({error:'invalid_origin'},403);
  if(!env.ROOM_DB)return json({error:'database_unavailable',detail:'ROOM_DB is not available on this deployment.'},503);
  if(!env.ROOM_BOOTSTRAP_TOKEN)return json({error:'bootstrap_not_configured',detail:'ROOM_BOOTSTRAP_TOKEN is not available on this deployment.'},503);
  const token=normalizeKey(request.headers.get('x-room-bootstrap-key')||'');
  if(!safeEqual(token,env.ROOM_BOOTSTRAP_TOKEN)){const configured=normalizeKey(env.ROOM_BOOTSTRAP_TOKEN);return json({error:'invalid_setup_key',detail:'The one-time setup key does not match the configured Cloudflare secret.',entered_length:token.length,configured_length:configured.length},401);}
  const count=await env.ROOM_DB.prepare('SELECT COUNT(*) AS n FROM room_managers').first();
  if(Number(count?.n||0)>0)return json({error:'bootstrap_already_completed',detail:'An administrator account already exists. Use the normal sign-in form.'},409);
  const body=await request.json().catch(()=>null),email=String(body?.email||'').trim().toLowerCase(),password=body?.password;
  const rooms=Array.isArray(body?.rooms)&&body.rooms.length?body.rooms:['client'];
  if(email.length>254||!email.includes('@')||typeof password!=='string'||password.length<8||password.length>512||rooms.some(r=>!['client','distributor','investor'].includes(r)))return json({error:'invalid_input',detail:'Enter a valid email and a password of at least 8 characters.'},400);
  const id=crypto.randomUUID(),salt=newSalt(),hash=await derivePassword(password,salt);
  const statements=[
   env.ROOM_DB.prepare('INSERT INTO room_managers(id,email,password_salt,password_hash) VALUES(?,?,?,?)').bind(id,email,salt,hash),
   ...rooms.map(room=>env.ROOM_DB.prepare("INSERT INTO room_manager_permissions(manager_id,room_id,role) VALUES(?,?,'admin')").bind(id,room))
  ];
  await env.ROOM_DB.batch(statements);
  await audit(env,id,'bootstrap_manager_created',rooms.join(','));
  return json({ok:true,email,rooms},201);
 }catch(error){
  console.error('room bootstrap failure',error);
  return json({error:'bootstrap_failed',detail:'Account setup failed on the server. '+String(error?.message||error).slice(0,180)},500);
 }
}
