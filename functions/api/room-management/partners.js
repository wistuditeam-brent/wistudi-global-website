import { canManage } from './session.js';
import { ensureEcosystemSchema,ensureClientEcosystemDefaults,parseList } from './_ecosystem.js';
const json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const rooms=new Set(['client','distributor','investor']),locales=new Set(['en','vi']),statuses=new Set(['draft','published','archived']);
const safe=(v,n)=>typeof v==='string'&&v.length<=n,required=(v,n)=>typeof v==='string'&&v.trim().length>0&&v.length<=n;
const httpsOrLocal=v=>typeof v==='string'&&((v.startsWith('/')&&!v.startsWith('//'))||/^https:\/\/[^\s]+$/i.test(v));
function slugify(s){return String(s||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80)}
function validate(body){
 if(!body||!rooms.has(body.room_id)||!locales.has(body.locale)||!required(body.title,140)||!required(body.banner_url,2048)||!httpsOrLocal(body.banner_url)||!statuses.has(body.status||'draft'))return false;
 if(body.video_url&&!httpsOrLocal(body.video_url))return false;if(body.website_url&&!/^https:\/\/[^\s]+$/i.test(body.website_url))return false;
 if(!safe(body.short_description||'',500)||!safe(body.about_text||'',12000)||String(body.about_text||'').trim().split(/\\s+/).filter(Boolean).length>500)return false;
 return Array.isArray(body.tags)&&body.tags.length<=20&&body.tags.every(x=>required(x,60))&&Array.isArray(body.capability_bullets)&&body.capability_bullets.length<=30&&body.capability_bullets.every(x=>required(x,500))&&Array.isArray(body.gallery_urls)&&body.gallery_urls.length<=30&&body.gallery_urls.every(httpsOrLocal);
}
export async function onRequest({request,env}){
 const url=new URL(request.url),room=url.searchParams.get('room')||'client',locale=url.searchParams.get('locale')||'en';
 if(!rooms.has(room)||!locales.has(locale))return json({error:'invalid_parameters'},400);if(!env.ROOM_DB)return json({error:'database_unavailable'},503);
 if(!await canManage(request,env,room))return json({error:'forbidden'},403);if(request.method!=='GET'&&request.headers.get('origin')!==url.origin)return json({error:'invalid_origin'},403);
 await ensureEcosystemSchema(env);if(room==='client')await ensureClientEcosystemDefaults(env);
 try{
  if(request.method==='GET'){const r=await env.ROOM_DB.prepare('SELECT * FROM room_partners WHERE room_id=? AND locale=? ORDER BY sort_order,created_at').bind(room,locale).all();return json({ok:true,items:(r.results||[]).map(x=>({...x,tags:parseList(x.tags),capability_bullets:parseList(x.capability_bullets),gallery_urls:parseList(x.gallery_urls)}))})}
  const body=await request.json().catch(()=>null);
  if(request.method==='POST'){
   if(!validate(body)||body.room_id!==room||body.locale!==locale)return json({error:'invalid_partner'},400);
   const id=crypto.randomUUID(),slug=slugify(body.slug||body.title);if(!slug)return json({error:'invalid_slug'},400);
   await env.ROOM_DB.prepare('INSERT INTO room_partners(id,room_id,locale,slug,title,short_description,banner_url,video_url,about_text,capability_bullets,website_url,tags,gallery_urls,status,sort_order) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .bind(id,room,locale,slug,body.title.trim(),body.short_description||'',body.banner_url,body.video_url||'',body.about_text||'',JSON.stringify(body.capability_bullets),body.website_url||'',JSON.stringify(body.tags),JSON.stringify(body.gallery_urls),body.status||'draft',Number.isSafeInteger(body.sort_order)?body.sort_order:0).run();
   return json({ok:true,id,slug},201);
  }
  if(request.method==='PATCH'){
   if(!body||!required(body.id,100)||!validate({...body,room_id:room,locale}))return json({error:'invalid_partner'},400);
   const slug=slugify(body.slug||body.title);const r=await env.ROOM_DB.prepare('UPDATE room_partners SET slug=?,title=?,short_description=?,banner_url=?,video_url=?,about_text=?,capability_bullets=?,website_url=?,tags=?,gallery_urls=?,status=?,sort_order=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND room_id=? AND locale=?')
    .bind(slug,body.title.trim(),body.short_description||'',body.banner_url,body.video_url||'',body.about_text||'',JSON.stringify(body.capability_bullets),body.website_url||'',JSON.stringify(body.tags),JSON.stringify(body.gallery_urls),body.status||'draft',Number.isSafeInteger(body.sort_order)?body.sort_order:0,body.id,room,locale).run();
   return json({ok:!!r.meta?.changes,slug},r.meta?.changes?200:404);
  }
  if(request.method==='DELETE'){const id=url.searchParams.get('id');if(!required(id,100))return json({error:'missing_id'},400);const r=await env.ROOM_DB.prepare('DELETE FROM room_partners WHERE id=? AND room_id=? AND locale=?').bind(id,room,locale).run();return json({ok:!!r.meta?.changes},r.meta?.changes?200:404)}
  return json({error:'method_not_allowed'},405);
 }catch(e){console.error('partner api',e);return json({error:'operation_failed',detail:String(e?.message||e).slice(0,200)},500)}
}
