import { authenticate,derivePassword,newSalt,audit } from './session.js';
const json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});
function safeEqual(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0}
export async function onRequestPost({request,env}){
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'invalid_origin'},403);
 const manager=await authenticate(request,env);if(!manager)return json({error:'unauthorized'},401);
 const body=await request.json().catch(()=>null),current=body?.current_password,next=body?.new_password;
 if(typeof current!=='string'||typeof next!=='string'||next.length<12||next.length>512)return json({error:'invalid_input'},400);
 const row=await env.ROOM_DB.prepare('SELECT password_salt,password_hash FROM room_managers WHERE id=?').bind(manager.id).first();
 const candidate=await derivePassword(current,row.password_salt);if(!safeEqual(candidate,row.password_hash))return json({error:'invalid_credentials'},401);
 const salt=newSalt(),hash=await derivePassword(next,salt);
 await env.ROOM_DB.batch([env.ROOM_DB.prepare('UPDATE room_managers SET password_salt=?,password_hash=? WHERE id=?').bind(salt,hash,manager.id),env.ROOM_DB.prepare('DELETE FROM room_manager_sessions WHERE manager_id=?').bind(manager.id)]);
 await audit(env,manager.id,'password_changed');return json({ok:true});
}
