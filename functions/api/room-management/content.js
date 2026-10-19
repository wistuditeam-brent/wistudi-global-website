import { canManage } from './session.js';
import { ensureClientStarter } from './starter-content.js';
import { ensureVideoSchema,ensureClientVideoGroups,validVideoGroup } from './_video-groups.js';
import { ensureContentTranslationSchema,ensureClientContentTranslationLinks,translationForContent,ensureTranslationLink } from './_content-translations.js';
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
 if(!body||!ROOMS.has(body.room_id)||!CATEGORIES.has(body.category)||!valid(body.title,180)||!LOCALES.has(body.locale||'en')||!STATUSES.has(body.status||'draft'))return false;
 const asset=typeof body.asset_url==='string'?body.asset_url.trim():'';
 if(asset.length>2048)return false;
 if(asset&&!(asset.startsWith('/')&&!asset.startsWith('//'))&&!/^https:\/\/[^\s]+$/i.test(asset))return false;
 if((body.status||'draft')==='published'&&!asset)return false;
 return !body.description||typeof body.description==='string'&&body.description.length<=2000;
}
export async function onRequest({request,env}){
 const requestedRoom=new URL(request.url).searchParams.get('room')||'client';
 if(!await canManage(request,env,requestedRoom))return respond({ok:false,error:'forbidden'},403);
 if(request.method!=='GET' && request.headers.get('origin')!==new URL(request.url).origin)return respond({ok:false,error:'invalid_origin'},403);
 const store=db(env);if(!store)return respond({ok:false,error:'room_database_not_configured'},503);
 if(requestedRoom==='client')await ensureClientStarter(env);
 await ensureVideoSchema(env);if(requestedRoom==='client')await ensureClientVideoGroups(env);
 await ensureContentTranslationSchema(env);if(requestedRoom==='client')await ensureClientContentTranslationLinks(env);
 const url=new URL(request.url),r=room(url);
 if(!ROOMS.has(r))return respond({ok:false,error:'invalid_room'},400);
 try{
  if(request.method==='GET'){
   const category=url.searchParams.get('category');
   if(category&&!CATEGORIES.has(category))return respond({ok:false,error:'invalid_category'},400);
   const sql='SELECT c.*,m.group_id AS video_group_id,t.group_id AS translation_group_id FROM room_content c LEFT JOIN room_video_group_membership m ON m.content_id=c.id LEFT JOIN room_content_translation_links t ON t.content_id=c.id WHERE c.room_id = ?'+(category?' AND c.category = ?':'')+' ORDER BY c.category,c.sort_order,c.created_at';
   const result=await store.prepare(sql).bind(...(category?[r,category]:[r])).all();
   return respond({ok:true,items:result.results||[]});
  }
  if(request.method==='POST'){
   const body=await request.json().catch(()=>null);
   if(!validate(body)||body.room_id!==r)return respond({ok:false,error:'invalid_content'},400);
   const id=crypto.randomUUID(),description=body.description||'',locale=body.locale||'en',status=body.status||'draft',order=Number.isSafeInteger(body.sort_order)?body.sort_order:0;
   const videoGroupId=body.category==='video'&&typeof body.video_group_id==='string'&&body.video_group_id?body.video_group_id:null;
   if(videoGroupId&&!await validVideoGroup(env,videoGroupId,r,locale))return respond({ok:false,error:'invalid_video_group'},400);
   const requestedTranslation=typeof body.translation_group_id==='string'&&body.translation_group_id.trim()?body.translation_group_id.trim():null;
   if(requestedTranslation&&requestedTranslation.length>100)return respond({ok:false,error:'invalid_translation_group'},400);
   if(requestedTranslation){
    const occupied=await store.prepare('SELECT content_id FROM room_content_translation_links WHERE group_id=? AND locale=?').bind(requestedTranslation,locale).first();
    if(occupied)return respond({ok:false,error:'translation_locale_exists',existing_id:occupied.content_id},409);
   }
   await store.prepare('INSERT INTO room_content (id,room_id,category,title,description,asset_url,locale,status,sort_order) VALUES (?,?,?,?,?,?,?,?,?)').bind(id,r,body.category,body.title.trim(),description,body.asset_url,locale,status,order).run();
   const link=await ensureTranslationLink(env,id,locale,requestedTranslation);
   if(videoGroupId)await store.prepare('INSERT OR REPLACE INTO room_video_group_membership(content_id,group_id) VALUES(?,?)').bind(id,videoGroupId).run();
   const saved=await store.prepare('SELECT c.*,m.group_id AS video_group_id,t.group_id AS translation_group_id FROM room_content c LEFT JOIN room_video_group_membership m ON m.content_id=c.id LEFT JOIN room_content_translation_links t ON t.content_id=c.id WHERE c.id=? AND c.room_id=?').bind(id,r).first();
   return respond({ok:true,id,translation_group_id:link.group_id,item:saved},201);
  }
  if(request.method==='PATCH'){
   const body=await request.json().catch(()=>null);
   if(!body||!valid(body.id,100)||!validate({...body,room_id:r}))return respond({ok:false,error:'invalid_content'},400);
   const locale=body.locale||'en',videoGroupId=body.category==='video'&&typeof body.video_group_id==='string'&&body.video_group_id?body.video_group_id:null;
   if(videoGroupId&&!await validVideoGroup(env,videoGroupId,r,locale))return respond({ok:false,error:'invalid_video_group'},400);
   const current=await store.prepare('SELECT id,locale FROM room_content WHERE id=? AND room_id=?').bind(body.id,r).first();
   if(!current)return respond({ok:false,error:'not_found'},404);
   let link=await translationForContent(env,body.id);
   if(!link)link=await ensureTranslationLink(env,body.id,current.locale,typeof body.translation_group_id==='string'?body.translation_group_id:null);
   if(link.locale!==locale)return respond({ok:false,error:'locale_mismatch'},400);
   const order=Number.isSafeInteger(body.sort_order)?body.sort_order:0,status=body.status||'draft';
   await store.batch([
    store.prepare('UPDATE room_content SET category=?,asset_url=?,status=?,sort_order=?,updated_at=CURRENT_TIMESTAMP WHERE id IN (SELECT content_id FROM room_content_translation_links WHERE group_id=?)').bind(body.category,body.asset_url,status,order,link.group_id),
    store.prepare('UPDATE room_content SET title=?,description=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND room_id=?').bind(body.title.trim(),body.description||'',body.id,r),
    store.prepare('DELETE FROM room_video_group_membership WHERE content_id=?').bind(body.id)
   ]);
   if(videoGroupId)await store.prepare('INSERT OR REPLACE INTO room_video_group_membership(content_id,group_id) VALUES(?,?)').bind(body.id,videoGroupId).run();
   const saved=await store.prepare('SELECT c.*,m.group_id AS video_group_id,t.group_id AS translation_group_id FROM room_content c LEFT JOIN room_video_group_membership m ON m.content_id=c.id LEFT JOIN room_content_translation_links t ON t.content_id=c.id WHERE c.id=? AND c.room_id=?').bind(body.id,r).first();
   return respond({ok:true,updated:1,translation_group_id:link.group_id,item:saved});
  }
  if(request.method==='DELETE'){
   const id=url.searchParams.get('id');
   if(!valid(id,100))return respond({ok:false,error:'missing_id'},400);
   const existing=await store.prepare('SELECT id FROM room_content WHERE id=? AND room_id=?').bind(id,r).first();
   if(!existing)return respond({ok:false,error:'not_found'},404);
   if(r==='client'&&id.startsWith('seed-')){
    await store.prepare(`CREATE TABLE IF NOT EXISTS room_content_tombstones (
     room_id TEXT NOT NULL,
     content_id TEXT NOT NULL,
     deleted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
     PRIMARY KEY(room_id,content_id)
    )`).run();
    await store.prepare('INSERT OR REPLACE INTO room_content_tombstones(room_id,content_id,deleted_at) VALUES(?,?,CURRENT_TIMESTAMP)').bind(r,id).run();
   }
   await store.batch([
    store.prepare('DELETE FROM room_video_group_membership WHERE content_id=?').bind(id),
    store.prepare('DELETE FROM room_content_translation_links WHERE content_id=?').bind(id),
    store.prepare('DELETE FROM room_content WHERE id=? AND room_id=?').bind(id,r)
   ]);
   const remaining=await store.prepare('SELECT id FROM room_content WHERE id=? AND room_id=?').bind(id,r).first();
   return remaining?respond({ok:false,error:'delete_not_persisted'},500):respond({ok:true,deleted:1});
  }
  return respond({ok:false,error:'method_not_allowed'},405);
 }catch(error){console.error('room cms failure',String(error));return respond({ok:false,error:'operation_failed',detail:String(error?.message||error).slice(0,220)},500)}
}
