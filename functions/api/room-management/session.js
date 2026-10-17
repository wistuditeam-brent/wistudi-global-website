const enc=new TextEncoder();
const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store',...extra}});
const hex=bytes=>Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
const fromHex=str=>new Uint8Array(str.match(/../g).map(x=>parseInt(x,16)));
async function derive(password,salt){const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);return hex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:fromHex(salt),iterations:210000,hash:'SHA-256'},key,256)))}
export async function authenticate(request,env){
 const db=env.ROOM_DB;if(!db)return null;
 const raw=(request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('wistudi_room_session='));
 const id=raw?.slice('wistudi_room_session='.length);
 if(!id||!/^[0-9a-f-]{36}$/.test(id))return null;
 return db.prepare('SELECT m.id,m.email FROM room_manager_sessions s JOIN room_managers m ON m.id=s.manager_id WHERE s.id=? AND s.expires_at>? AND m.enabled=1').bind(id,Math.floor(Date.now()/1000)).first();
}
export async function canManage(request,env,room){
 const manager=await authenticate(request,env);if(!manager||!['client','distributor','investor'].includes(room))return false;
 const permission=await env.ROOM_DB.prepare('SELECT role FROM room_manager_permissions WHERE manager_id=? AND room_id=?').bind(manager.id,room).first();
 return !!permission;
}
export async function onRequest({request,env}){
 if(!env.ROOM_DB)return json({error:'database_unavailable'},503);
 const origin=request.headers.get('origin'),same=origin===new URL(request.url).origin;
 if(request.method==='POST'){
  if(!same)return json({error:'invalid_origin'},403);
  const body=await request.json().catch(()=>null);
  const email=String(body?.email||'').trim().toLowerCase(),password=body?.password;
  if(email.length>254||!email.includes('@')||typeof password!=='string'||password.length>512)return json({error:'invalid_credentials'},401);
  const manager=await env.ROOM_DB.prepare('SELECT * FROM room_managers WHERE email=? AND enabled=1').bind(email).first();
  // Same KDF cost for unknown users to reduce account enumeration timing.
  const salt=manager?.password_salt||'00000000000000000000000000000000';
  const candidate=await derive(password,salt);
  if(!manager||candidate!==manager.password_hash)return json({error:'invalid_credentials'},401);
  const id=crypto.randomUUID(),expiry=Math.floor(Date.now()/1000)+3600;
  await env.ROOM_DB.prepare('INSERT INTO room_manager_sessions(id,manager_id,expires_at) VALUES(?,?,?)').bind(id,manager.id,expiry).run();
  return json({ok:true,expires_at:expiry},200,{'set-cookie':'wistudi_room_session='+id+'; HttpOnly; Secure; SameSite=Strict; Path=/api/room-management/; Max-Age=3600'});
 }
 if(request.method==='GET'){
  const manager=await authenticate(request,env);if(!manager)return json({error:'unauthorized'},401);
  const result=await env.ROOM_DB.prepare('SELECT room_id,role FROM room_manager_permissions WHERE manager_id=?').bind(manager.id).all();
  return json({ok:true,email:manager.email,rooms:result.results||[]});
 }
 if(request.method==='DELETE'){
  if(!same)return json({error:'invalid_origin'},403);
  const id=(request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('wistudi_room_session='))?.split('=')[1];
  if(id&&/^[0-9a-f-]{36}$/.test(id))await env.ROOM_DB.prepare('DELETE FROM room_manager_sessions WHERE id=?').bind(id).run();
  return json({ok:true},200,{'set-cookie':'wistudi_room_session=; HttpOnly; Secure; SameSite=Strict; Path=/api/room-management/; Max-Age=0'});
 }
 return json({error:'method_not_allowed'},405);
}
