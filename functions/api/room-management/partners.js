import { canManage } from './session.js';
import { ensureEcosystemSchema,ensureClientEcosystemDefaults,parseList } from './_ecosystem.js';
import { ensureVideoThumbnailSchema,setVideoThumbnail } from './_video-thumbnails.js';
const json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const rooms=new Set(['client','distributor','investor']),locales=new Set(['en','vi']),statuses=new Set(['draft','published','archived']);
const safe=(v,n)=>typeof v==='string'&&v.length<=n,required=(v,n)=>typeof v==='string'&&v.trim().length>0&&v.length<=n;
const httpsOrLocal=v=>typeof v==='string'&&((v.startsWith('/')&&!v.startsWith('//'))||/^https:\/\/[^\s]+$/i.test(v));
function slugify(s){return String(s||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80)}
function validate(body){
 if(!body||!rooms.has(body.room_id)||!locales.has(body.locale)||!required(body.title,140)||!required(body.banner_url,2048)||!httpsOrLocal(body.banner_url)||!statuses.has(body.status||'draft'))return false;
 if(body.video_url&&!httpsOrLocal(body.video_url))return false;if(body.video_thumbnail_url&&!httpsOrLocal(body.video_thumbnail_url))return false;if(body.website_url&&!/^https:\/\/[^\s]+$/i.test(body.website_url))return false;
 if(!safe(body.short_description||'',500)||!safe(body.about_text||'',12000)||String(body.about_text||'').trim().split(/\s+/).filter(Boolean).length>500)return false;
 return Array.isArray(body.tags)&&body.tags.length<=20&&body.tags.every(x=>required(x,60))&&Array.isArray(body.capability_bullets)&&body.capability_bullets.length<=30&&body.capability_bullets.every(x=>required(x,500))&&Array.isArray(body.gallery_urls)&&body.gallery_urls.length<=30&&body.gallery_urls.every(httpsOrLocal);
}
export async function onRequest({request,env}){
 const url=new URL(request.url),room=url.searchParams.get('room')||'client',locale=url.searchParams.get('locale')||'en';
 if(!rooms.has(room)||!locales.has(locale))return json({error:'invalid_parameters'},400);if(!env.ROOM_DB)return json({error:'database_unavailable'},503);
 if(!await canManage(request,env,room))return json({error:'forbidden'},403);if(request.method!=='GET'&&request.headers.get('origin')!==url.origin)return json({error:'invalid_origin'},403);
 await ensureEcosystemSchema(env);if(room==='client')await ensureClientEcosystemDefaults(env);await ensureVideoThumbnailSchema(env);
 try{
  if(request.method==='GET'){const r=await env.ROOM_DB.prepare("SELECT p.*,COALESCE(vt.thumbnail_url,'') AS video_thumbnail_url FROM room_partners p LEFT JOIN room_video_thumbnails vt ON vt.target_type='partner' AND vt.target_id=p.id WHERE p.room_id=? AND p.locale=? ORDER BY p.sort_order,p.created_at").bind(room,locale).all();return json({ok:true,items:(r.results||[]).map(x=>({...x,tags:parseList(x.tags),capability_bullets:parseList(x.capability_bullets),gallery_urls:parseList(x.gallery_urls)}))})}
  const body=await request.json().catch(()=>null);
  if(request.method==='POST'){
   if(!validate(body)||body.room_id!==room||body.locale!==locale)return json({error:'invalid_partner'},400);
   const id=crypto.randomUUID(),slug=slugify(body.slug||body.title);if(!slug)return json({error:'invalid_slug'},400);
   await env.ROOM_DB.prepare('INSERT INTO room_partners(id,room_id,locale,slug,title,short_description,banner_url,video_url,about_text,capability_bullets,website_url,tags,gallery_urls,status,sort_order) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .bind(id,room,locale,slug,body.title.trim(),body.short_description||'',body.banner_url,body.video_url||'',body.about_text||'',JSON.stringify(body.capability_bullets),body.website_url||'',JSON.stringify(body.tags),JSON.stringify(body.gallery_urls),body.status||'draft',Number.isSafeInteger(body.sort_order)?body.sort_order:0).run();
   await setVideoThumbnail(env,'partner',id,body.video_url?(body.video_thumbnail_url||''):'');
   const saved=await env.ROOM_DB.prepare("SELECT p.*,COALESCE(vt.thumbnail_url,'') AS video_thumbnail_url FROM room_partners p LEFT JOIN room_video_thumbnails vt ON vt.target_type='partner' AND vt.target_id=p.id WHERE p.id=? AND p.room_id=? AND p.locale=?").bind(id,room,locale).first();
   return json({ok:true,id,slug,item:saved?{...saved,tags:parseList(saved.tags),capability_bullets:parseList(saved.capability_bullets),gallery_urls:parseList(saved.gallery_urls)}:null},201);
  }
  if(request.method==='PATCH'){
   if(!body||!required(body.id,100)||!validate({...body,room_id:room,locale}))return json({error:'invalid_partner'},400);
   const slug=slugify(body.slug||body.title);const existing=await env.ROOM_DB.prepare('SELECT id FROM room_partners WHERE id=? AND room_id=? AND locale=?').bind(body.id,room,locale).first();if(!existing)return json({error:'not_found'},404);
   await env.ROOM_DB.prepare('UPDATE room_partners SET slug=?,title=?,short_description=?,banner_url=?,video_url=?,about_text=?,capability_bullets=?,website_url=?,tags=?,gallery_urls=?,status=?,sort_order=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND room_id=? AND locale=?')
    .bind(slug,body.title.trim(),body.short_description||'',body.banner_url,body.video_url||'',body.about_text||'',JSON.stringify(body.capability_bullets),body.website_url||'',JSON.stringify(body.tags),JSON.stringify(body.gallery_urls),body.status||'draft',Number.isSafeInteger(body.sort_order)?body.sort_order:0,body.id,room,locale).run();
   await setVideoThumbnail(env,'partner',body.id,body.video_url?(body.video_thumbnail_url||''):'');
   const saved=await env.ROOM_DB.prepare("SELECT p.*,COALESCE(vt.thumbnail_url,'') AS video_thumbnail_url FROM room_partners p LEFT JOIN room_video_thumbnails vt ON vt.target_type='partner' AND vt.target_id=p.id WHERE p.id=? AND p.room_id=? AND p.locale=?").bind(body.id,room,locale).first();
   return json({ok:true,slug,item:saved?{...saved,tags:parseList(saved.tags),capability_bullets:parseList(saved.capability_bullets),gallery_urls:parseList(saved.gallery_urls)}:null});
  }
  if(request.method==='DELETE'){const id=url.searchParams.get('id');if(!required(id,100))return json({error:'missing_id'},400);await env.ROOM_DB.prepare("DELETE FROM room_video_thumbnails WHERE target_type='partner' AND target_id=?").bind(id).run();const r=await env.ROOM_DB.prepare('DELETE FROM room_partners WHERE id=? AND room_id=? AND locale=?').bind(id,room,locale).run();return json({ok:!!r.meta?.changes},r.meta?.changes?200:404)}
  return json({error:'method_not_allowed'},405);
 }catch(e){console.error('partner api',e);return json({error:'operation_failed',detail:String(e?.message||e).slice(0,200)},500)}
}
