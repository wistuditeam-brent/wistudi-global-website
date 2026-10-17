import { derivePassword,newSalt,audit } from './session.js';
const json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});
function safeEqual(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0}
export async function onRequestPost({request,env}){
 if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return json({error:'invalid_origin'},403);
 if(!env.ROOM_DB||!env.ROOM_BOOTSTRAP_TOKEN)return json({error:'bootstrap_not_configured'},503);
 const auth=request.headers.get('authorization')||'',token=auth.startsWith('Bearer ')?auth.slice(7):'';
 if(!safeEqual(token,env.ROOM_BOOTSTRAP_TOKEN))return json({error:'unauthorized'},401);
 const count=await env.ROOM_DB.prepare('SELECT COUNT(*) AS n FROM room_managers').first();
 if(Number(count?.n||0)>0)return json({error:'bootstrap_already_completed'},409);
 const body=await request.json().catch(()=>null),email=String(body?.email||'').trim().toLowerCase(),password=body?.password;
 const rooms=Array.isArray(body?.rooms)&&body.rooms.length?body.rooms:['client'];
 if(email.length>254||!email.includes('@')||typeof password!=='string'||password.length<12||password.length>512||rooms.some(r=>!['client','distributor','investor'].includes(r)))return json({error:'invalid_input'},400);
 const id=crypto.randomUUID(),salt=newSalt(),hash=await derivePassword(password,salt);
 const statements=[env.ROOM_DB.prepare('INSERT INTO room_managers(id,email,password_salt,password_hash) VALUES(?,?,?,?)').bind(id,email,salt,hash),...rooms.map(room=>env.ROOM_DB.prepare("INSERT INTO room_manager_permissions(manager_id,room_id,role) VALUES(?,?,'admin')").bind(id,room))];
 await env.ROOM_DB.batch(statements);await audit(env,id,'bootstrap_manager_created',rooms.join(','));
 return json({ok:true,email,rooms},201);
}
