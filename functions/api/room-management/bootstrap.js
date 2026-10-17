import { derivePassword,newSalt,audit } from './session.js';
const json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const FIRST_ADMIN_EMAIL='wistudi.team@gmail.com';

export async function onRequestPost({request,env}){
 try{
  if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return json({error:'invalid_origin'},403);
  if(!env.ROOM_DB)return json({error:'database_unavailable',detail:'ROOM_DB is not available on this deployment.'},503);

  const count=await env.ROOM_DB.prepare('SELECT COUNT(*) AS n FROM room_managers').first();
  if(Number(count?.n||0)>0)return json({error:'bootstrap_already_completed',detail:'An administrator account already exists. Use the normal sign-in form.'},409);

  const body=await request.json().catch(()=>null);
  const email=String(body?.email||'').trim().toLowerCase();
  const password=body?.password;

  if(email!==FIRST_ADMIN_EMAIL)return json({error:'email_not_allowed',detail:'Use the authorised first administrator email.'},403);
  if(typeof password!=='string'||password.length<8||password.length>512)return json({error:'invalid_input',detail:'Password must be at least 8 characters.'},400);

  const id=crypto.randomUUID(),salt=newSalt(),hash=await derivePassword(password,salt);
  await env.ROOM_DB.batch([
   env.ROOM_DB.prepare('INSERT INTO room_managers(id,email,password_salt,password_hash) VALUES(?,?,?,?)').bind(id,email,salt,hash),
   env.ROOM_DB.prepare("INSERT INTO room_manager_permissions(manager_id,room_id,role) VALUES(?,?,'admin')").bind(id,'client')
  ]);
  await audit(env,id,'bootstrap_manager_created','client');
  return json({ok:true,email,rooms:['client']},201);
 }catch(error){
  console.error('room bootstrap failure',error);
  return json({error:'bootstrap_failed',detail:'Account setup failed on the server. '+String(error?.message||error).slice(0,180)},500);
 }
}
