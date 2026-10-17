import { authenticate,isAdmin,derivePassword,newSalt,audit } from './session.js';
const json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});
export async function onRequest({request,env}){
 if(!env.ROOM_DB)return json({error:'database_unavailable'},503);
 const actor=await authenticate(request,env);if(!actor)return json({error:'unauthorized'},401);
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'invalid_origin'},403);
 const body=request.method==='GET'?null:await request.json().catch(()=>null);
 const room=request.method==='GET'?(new URL(request.url).searchParams.get('room')||'client'):body?.room_id;
 if(!['client','distributor','investor'].includes(room)||!await isAdmin(request,env,room))return json({error:'forbidden'},403);
 if(request.method==='GET'){
  const rows=await env.ROOM_DB.prepare('SELECT m.id,m.email,m.enabled,p.role FROM room_managers m JOIN room_manager_permissions p ON p.manager_id=m.id WHERE p.room_id=? ORDER BY m.email').bind(room).all();
  return json({ok:true,items:rows.results||[]});
 }
 if(request.method==='POST'){
  const email=String(body?.email||'').trim().toLowerCase(),password=body?.password,role=body?.role==='admin'?'admin':'editor';
  if(email.length>254||!email.includes('@')||typeof password!=='string'||password.length<8||password.length>512)return json({error:'invalid_input'},400);
  const existing=await env.ROOM_DB.prepare('SELECT id FROM room_managers WHERE email=?').bind(email).first();
  if(existing)return json({error:'manager_exists'},409);
  const id=crypto.randomUUID(),salt=newSalt(),hash=await derivePassword(password,salt);
  await env.ROOM_DB.batch([env.ROOM_DB.prepare('INSERT INTO room_managers(id,email,password_salt,password_hash) VALUES(?,?,?,?)').bind(id,email,salt,hash),env.ROOM_DB.prepare('INSERT INTO room_manager_permissions(manager_id,room_id,role) VALUES(?,?,?)').bind(id,room,role)]);
  await audit(env,actor.id,'manager_created',room,id);return json({ok:true,id,email,room,role},201);
 }
 if(request.method==='PUT'){
  const email=String(body?.email||'').trim().toLowerCase(),role=body?.role==='admin'?'admin':'editor';
  const target=await env.ROOM_DB.prepare('SELECT id FROM room_managers WHERE email=? AND enabled=1').bind(email).first();if(!target)return json({error:'not_found'},404);
  await env.ROOM_DB.prepare('INSERT INTO room_manager_permissions(manager_id,room_id,role) VALUES(?,?,?) ON CONFLICT(manager_id,room_id) DO UPDATE SET role=excluded.role').bind(target.id,room,role).run();
  await audit(env,actor.id,'permission_granted',room,target.id);return json({ok:true});
 }
 return json({error:'method_not_allowed'},405);
}
