import { canManage } from './session.js';
import { ensureClientStarter } from './starter-content.js';
// Stage 3: fail-closed metadata API. No upload or public mutation access.
// Configure ROOM_DB (D1) and ROOM_MANAGER_TOKEN (secret) before deployment.
const ROOMS=new Set(['client','distributor','investor']);
const CATEGORIES=new Set(['presentation','video','gallery','document']);
const STATUSES=new Set(['draft','published','archived']);
const LOCALES=new Set(['en','vi']);
const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const valid=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
function authorized(request,env){
 const token=env.ROOM_MANAGER_TOKEN;
 const supplied=request.headers.get('authorization')||'';
 if(!valid(token,512)||!supplied.startsWith('Bearer '))return false;
 const candidate=supplied.slice(7);
 if(candidate.length!==token.length)return false;
 let diff=0;for(let i=0;i<token.length;i++)diff|=token.charCodeAt(i)^candidate.charCodeAt(i);
 return diff===0;
}
function db(env){return env.ROOM_DB&&typeof env.ROOM_DB.prepare==='function'?env.ROOM_DB:null}
function room(url){return url.searchParams.get('room')||'client'}
function validate(body){
 if(!body||!ROOMS.has(body.room_id)||!CATEGORIES.has(body.category)||!valid(body.title,180)||!valid(body.asset_url,2048)||!LOCALES.has(body.locale||'en')||!STATUSES.has(body.status||'draft'))return false;
 // Only local managed assets or HTTPS; reject protocol-relative and unsafe schemes.
 if(!(body.asset_url.startsWith('/')&&!body.asset_url.startsWith('//'))&&!/^https:\/\/[^\s]+$/i.test(body.asset_url))return false;
 return !body.description||typeof body.description==='string'&&body.description.length<=2000;
}
export async function onRequest({request,env}){
 const requestedRoom=new URL(request.url).searchParams.get('room')||'client';
 if(!await canManage(request,env,requestedRoom))return respond({ok:false,error:'forbidden'},403);
 if(request.method!=='GET' && request.headers.get('origin')!==new URL(request.url).origin)return respond({ok:false,error:'invalid_origin'},403);
 const store=db(env);if(!store)return respond({ok:false,error:'room_database_not_configured'},503);
 if(requestedRoom==='client')await ensureClientStarter(env);
 const url=new URL(request.url),r=room(url);
 if(!ROOMS.has(r))return respond({ok:false,error:'invalid_room'},400);
 try{
  if(request.method==='GET'){
   const category=url.searchParams.get('category');
   if(category&&!CATEGORIES.has(category))return respond({ok:false,error:'invalid_category'},400);
   const sql='SELECT * FROM room_content WHERE room_id = ?'+(category?' AND category = ?':'')+' ORDER BY category,sort_order,created_at';
   const result=await store.prepare(sql).bind(...(category?[r,category]:[r])).all();
   return respond({ok:true,items:result.results||[]});
  }
  if(request.method==='POST'){
   const body=await request.json().catch(()=>null);
   if(!validate(body)||body.room_id!==r)return respond({ok:false,error:'invalid_content'},400);
   const id=crypto.randomUUID(),description=body.description||'',locale=body.locale||'en',status=body.status||'draft',order=Number.isSafeInteger(body.sort_order)?body.sort_order:0;
   await store.prepare('INSERT INTO room_content (id,room_id,category,title,description,asset_url,locale,status,sort_order) VALUES (?,?,?,?,?,?,?,?,?)').bind(id,r,body.category,body.title.trim(),description,body.asset_url,locale,status,order).run();
   return respond({ok:true,id},201);
  }
  if(request.method==='PATCH'){
   const body=await request.json().catch(()=>null);
   if(!body||!valid(body.id,100)||!validate({...body,room_id:r}))return respond({ok:false,error:'invalid_content'},400);
   const result=await store.prepare('UPDATE room_content SET category=?,title=?,description=?,asset_url=?,locale=?,status=?,sort_order=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND room_id=?').bind(body.category,body.title.trim(),body.description||'',body.asset_url,body.locale||'en',body.status||'draft',Number.isSafeInteger(body.sort_order)?body.sort_order:0,body.id,r).run();
   return respond({ok:!!result.meta?.changes,updated:result.meta?.changes||0},result.meta?.changes?200:404);
  }
  if(request.method==='DELETE'){
   const id=url.searchParams.get('id');
   if(!valid(id,100))return respond({ok:false,error:'missing_id'},400);
   const result=await store.prepare('DELETE FROM room_content WHERE id=? AND room_id=?').bind(id,r).run();
   return respond({ok:!!result.meta?.changes,deleted:result.meta?.changes||0},result.meta?.changes?200:404);
  }
  return respond({ok:false,error:'method_not_allowed'},405);
 }catch(error){console.error('room cms failure',String(error));return respond({ok:false,error:'operation_failed',detail:String(error?.message||error).slice(0,220)},500)}
}
