const enc=new TextEncoder();
const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff',...extra}});
const hex=bytes=>Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
const fromHex=str=>new Uint8Array((str.match(/../g)||[]).map(x=>parseInt(x,16)));
export async function derivePassword(password,salt){
 const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
 return hex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:fromHex(salt),iterations:210000,hash:'SHA-256'},key,256)));
}
export function newSalt(){const b=new Uint8Array(16);crypto.getRandomValues(b);return hex(b)}
function safeEqual(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0}
async function throttleKey(request,email){
 const ip=request.headers.get('cf-connecting-ip')||'unknown';
 const digest=await crypto.subtle.digest('SHA-256',enc.encode(email+'|'+ip));
 return hex(new Uint8Array(digest));
}
async function throttleState(db,key,now){
 const row=await db.prepare('SELECT attempts,window_started,blocked_until FROM room_login_throttle WHERE throttle_key=?').bind(key).first();
 if(!row)return {attempts:0,window_started:now,blocked_until:0};
 if(Number(row.blocked_until)>now)return row;
 if(now-Number(row.window_started)>900)return {attempts:0,window_started:now,blocked_until:0};
 return row;
}
async function failedLogin(db,key,state,now){
 const attempts=Number(state.attempts||0)+1,blocked=attempts>=5?now+900:0;
 await db.prepare('INSERT INTO room_login_throttle(throttle_key,attempts,window_started,blocked_until) VALUES(?,?,?,?) ON CONFLICT(throttle_key) DO UPDATE SET attempts=excluded.attempts,window_started=excluded.window_started,blocked_until=excluded.blocked_until').bind(key,attempts,Number(state.window_started||now),blocked).run();
 return blocked;
}
export async function authenticate(request,env){
 const db=env.ROOM_DB;if(!db)return null;
 const raw=(request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('wistudi_room_session='));
 const id=raw?.slice('wistudi_room_session='.length);
 if(!id||!/^[0-9a-f-]{36}$/.test(id))return null;
 return db.prepare('SELECT m.id,m.email FROM room_manager_sessions s JOIN room_managers m ON m.id=s.manager_id WHERE s.id=? AND s.expires_at>? AND m.enabled=1').bind(id,Math.floor(Date.now()/1000)).first();
}
export async function permissionFor(request,env,room){
 const manager=await authenticate(request,env);if(!manager||!['client','distributor','investor'].includes(room))return null;
 const permission=await env.ROOM_DB.prepare('SELECT role FROM room_manager_permissions WHERE manager_id=? AND room_id=?').bind(manager.id,room).first();
 return permission?{manager,role:permission.role}:null;
}
export async function canManage(request,env,room){return !!(await permissionFor(request,env,room))}
export async function isAdmin(request,env,room){const p=await permissionFor(request,env,room);return !!p&&p.role==='admin'}
export async function audit(env,actor,action,room=null,target=null){
 if(!env.ROOM_DB)return;
 await env.ROOM_DB.prepare('INSERT INTO room_management_audit(id,actor_manager_id,action,room_id,target_id) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),actor||null,action,room,target).run();
}
export async function onRequest({request,env}){
 if(!env.ROOM_DB)return json({error:'database_unavailable'},503);
 const origin=request.headers.get('origin'),same=origin===new URL(request.url).origin;
 if(request.method==='POST'){
  if(!same)return json({error:'invalid_origin'},403);
  const body=await request.json().catch(()=>null);
  const email=String(body?.email||'').trim().toLowerCase(),password=body?.password;
  if(email.length>254||!email.includes('@')||typeof password!=='string'||password.length>512)return json({error:'invalid_credentials'},401);
  const now=Math.floor(Date.now()/1000),key=await throttleKey(request,email),state=await throttleState(env.ROOM_DB,key,now);
  if(Number(state.blocked_until)>now)return json({error:'too_many_attempts'},429,{'retry-after':String(Number(state.blocked_until)-now)});
  const manager=await env.ROOM_DB.prepare('SELECT * FROM room_managers WHERE email=? AND enabled=1').bind(email).first();
  const salt=manager?.password_salt||'00000000000000000000000000000000';
  const candidate=await derivePassword(password,salt);
  if(!manager||!safeEqual(candidate,manager.password_hash)){
   const blocked=await failedLogin(env.ROOM_DB,key,state,now);
   await audit(env,null,'login_failed');
   return json({error:blocked?'too_many_attempts':'invalid_credentials'},blocked?429:401,blocked?{'retry-after':'900'}:{});
  }
  await env.ROOM_DB.prepare('DELETE FROM room_login_throttle WHERE throttle_key=?').bind(key).run();
  const id=crypto.randomUUID(),expiry=now+3600;
  await env.ROOM_DB.prepare('INSERT INTO room_manager_sessions(id,manager_id,expires_at) VALUES(?,?,?)').bind(id,manager.id,expiry).run();
  await audit(env,manager.id,'login_success');
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
  const manager=await authenticate(request,env);
  if(id&&/^[0-9a-f-]{36}$/.test(id))await env.ROOM_DB.prepare('DELETE FROM room_manager_sessions WHERE id=?').bind(id).run();
  if(manager)await audit(env,manager.id,'logout');
  return json({ok:true},200,{'set-cookie':'wistudi_room_session=; HttpOnly; Secure; SameSite=Strict; Path=/api/room-management/; Max-Age=0'});
 }
 return json({error:'method_not_allowed'},405);
}
