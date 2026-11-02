import { canManage } from './session.js';

let schemaReady=false;
const ROOMS=new Set(['client','distributor','investor']);
const LOCALES=new Set(['en','vi']);
const STATUSES=new Set(['draft','published','archived']);
const TYPES=new Set(['flow','xp_video']);
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const text=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
const optional=(v,max)=>v==null||typeof v==='string'&&v.length<=max;
function wistudiUrl(value){
 try{const u=new URL(String(value||''));const host=u.hostname.toLowerCase();return u.protocol==='https:'&&(host==='wistudi.com'||host.endsWith('.wistudi.com'))?u.href:null}catch{return null}
}
function imageUrl(value){
 const v=String(value||'').trim();if(!v)return '';
 if(v.startsWith('/')&&!v.startsWith('//'))return v;
 try{const u=new URL(v);return u.protocol==='https:'?u.href:null}catch{return null}
}
export async function ensureClientSections(env){
 const db=env.ROOM_DB;if(!db)return;
 if(!schemaReady){
  await db.batch([
   db.prepare(`CREATE TABLE IF NOT EXISTS room_sections (
    id TEXT PRIMARY KEY, room_id TEXT NOT NULL, locale TEXT NOT NULL CHECK(locale IN ('en','vi')),
    slug TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft','published','archived')),
    sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(room_id,locale,slug)
   )`),
   db.prepare(`CREATE TABLE IF NOT EXISTS room_section_examples (
    id TEXT PRIMARY KEY, room_id TEXT NOT NULL, section_id TEXT NOT NULL,
    locale TEXT NOT NULL CHECK(locale IN ('en','vi')), content_type TEXT NOT NULL CHECK(content_type IN ('flow','xp_video')),
    title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', topic TEXT NOT NULL DEFAULT '',
    thumbnail_url TEXT NOT NULL DEFAULT '', target_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
    sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
   )`),
   db.prepare('CREATE INDEX IF NOT EXISTS room_sections_listing ON room_sections(room_id,locale,status,sort_order)'),
   db.prepare('CREATE INDEX IF NOT EXISTS room_section_examples_listing ON room_section_examples(room_id,section_id,locale,status,sort_order)')
  ]);
  schemaReady=true;
 }
 const marker=await db.prepare("SELECT id FROM room_management_audit WHERE id='client-sections-v1' LIMIT 1").first().catch(()=>null);
 if(marker)return;
 await db.batch([
  db.prepare("INSERT OR IGNORE INTO room_sections(id,room_id,locale,slug,title,description,status,sort_order) VALUES('seed-section-en-learning-examples','client','en','learning-examples','Learning Examples','Explore real Wistudi Flows and XP Videos and open the live learning experience on the platform.','published',30)"),
  db.prepare("INSERT OR IGNORE INTO room_sections(id,room_id,locale,slug,title,description,status,sort_order) VALUES('seed-section-vi-learning-examples','client','vi','learning-examples','Ví dụ học tập','Khám phá các Flow và XP Video thực tế trên Wistudi và mở trực tiếp trải nghiệm học tập trên nền tảng.','published',30)"),
  db.prepare("INSERT OR IGNORE INTO room_management_audit(id,actor_manager_id,action,room_id,target_id) VALUES('client-sections-v1',NULL,'client_sections_seeded','client',NULL)")
 ]).catch(()=>{});
}
function validSection(body,room){
 return body&&ROOMS.has(room)&&LOCALES.has(body.locale)&&text(body.title,140)&&text(body.slug,80)&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug)&&optional(body.description,2000)&&STATUSES.has(body.status||'published');
}
function validExample(body,room){
 const thumb=imageUrl(body?.thumbnail_url);
 return body&&ROOMS.has(room)&&LOCALES.has(body.locale)&&TYPES.has(body.content_type)&&text(body.title,180)&&optional(body.description,2000)&&optional(body.topic,120)&&thumb!==null&&!!wistudiUrl(body.target_url)&&STATUSES.has(body.status||'draft')&&text(body.section_id,120);
}
export async function onRequest({request,env}){
 const url=new URL(request.url),room=url.searchParams.get('room')||'client';
 if(room!=='client'||!ROOMS.has(room))return json({ok:false,error:'invalid_room'},400);
 if(!await canManage(request,env,room))return json({ok:false,error:'forbidden'},403);
 if(request.method!=='GET'&&request.headers.get('origin')!==url.origin)return json({ok:false,error:'invalid_origin'},403);
 if(!env.ROOM_DB)return json({ok:false,error:'room_database_not_configured'},503);
 await ensureClientSections(env);
 const db=env.ROOM_DB,locale=url.searchParams.get('locale')||'en',kind=url.searchParams.get('kind')||'sections';
 if(!LOCALES.has(locale)||!['sections','examples'].includes(kind))return json({ok:false,error:'invalid_parameters'},400);
 try{
  if(request.method==='GET'){
   if(kind==='sections'){
    const r=await db.prepare(`SELECT s.*, (SELECT COUNT(*) FROM room_section_examples e WHERE e.section_id=s.id) AS item_count
      FROM room_sections s WHERE s.room_id=? AND s.locale=? ORDER BY s.sort_order,s.created_at`).bind(room,locale).all();
    return json({ok:true,items:r.results||[]});
   }
   const sectionId=url.searchParams.get('section_id');
   const sql=`SELECT e.* FROM room_section_examples e WHERE e.room_id=? AND e.locale=?${sectionId?' AND e.section_id=?':''} ORDER BY e.sort_order,e.created_at`;
   const r=await db.prepare(sql).bind(...(sectionId?[room,locale,sectionId]:[room,locale])).all();
   return json({ok:true,items:r.results||[]});
  }
  const body=await request.json().catch(()=>null);
  if(kind==='sections'){
   if(request.method==='POST'){
    if(!validSection(body,room))return json({ok:false,error:'invalid_section'},400);
    const id=crypto.randomUUID(),order=Number.isSafeInteger(body.sort_order)?body.sort_order:0;
    await db.prepare('INSERT INTO room_sections(id,room_id,locale,slug,title,description,status,sort_order) VALUES(?,?,?,?,?,?,?,?)').bind(id,room,body.locale,body.slug,body.title.trim(),body.description||'',body.status||'published',order).run();
    const item=await db.prepare('SELECT * FROM room_sections WHERE id=?').bind(id).first();return json({ok:true,item},201);
   }
   if(request.method==='PATCH'){
    if(!body?.id||!validSection(body,room))return json({ok:false,error:'invalid_section'},400);
    const order=Number.isSafeInteger(body.sort_order)?body.sort_order:0;
    await db.prepare('UPDATE room_sections SET slug=?,title=?,description=?,status=?,sort_order=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND room_id=? AND locale=?').bind(body.slug,body.title.trim(),body.description||'',body.status||'published',order,body.id,room,body.locale).run();
    const item=await db.prepare('SELECT * FROM room_sections WHERE id=? AND room_id=?').bind(body.id,room).first();if(!item)return json({ok:false,error:'not_found'},404);return json({ok:true,item});
   }
   if(request.method==='DELETE'){
    const id=url.searchParams.get('id');if(!id)return json({ok:false,error:'missing_id'},400);
    const count=await db.prepare('SELECT COUNT(*) AS n FROM room_section_examples WHERE section_id=?').bind(id).first();
    if(Number(count?.n||0)>0)return json({ok:false,error:'section_not_empty'},409);
    await db.prepare('DELETE FROM room_sections WHERE id=? AND room_id=?').bind(id,room).run();return json({ok:true,deleted:1});
   }
  }else{
   if(request.method==='POST'||request.method==='PATCH'){
    if(!validExample(body,room))return json({ok:false,error:'invalid_example'},400);
    const section=await db.prepare('SELECT id FROM room_sections WHERE id=? AND room_id=? AND locale=?').bind(body.section_id,room,body.locale).first();
    if(!section)return json({ok:false,error:'invalid_section'},400);
    const thumb=imageUrl(body.thumbnail_url)||'',target= wistudiUrl(body.target_url),order=Number.isSafeInteger(body.sort_order)?body.sort_order:0;
    if(request.method==='POST'){
     const id=crypto.randomUUID();
     await db.prepare('INSERT INTO room_section_examples(id,room_id,section_id,locale,content_type,title,description,topic,thumbnail_url,target_url,status,sort_order) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,room,body.section_id,body.locale,body.content_type,body.title.trim(),body.description||'',body.topic||'',thumb,target,body.status||'draft',order).run();
     const item=await db.prepare('SELECT * FROM room_section_examples WHERE id=?').bind(id).first();return json({ok:true,item},201);
    }
    if(!body.id)return json({ok:false,error:'missing_id'},400);
    await db.prepare('UPDATE room_section_examples SET section_id=?,content_type=?,title=?,description=?,topic=?,thumbnail_url=?,target_url=?,status=?,sort_order=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND room_id=? AND locale=?').bind(body.section_id,body.content_type,body.title.trim(),body.description||'',body.topic||'',thumb,target,body.status||'draft',order,body.id,room,body.locale).run();
    const item=await db.prepare('SELECT * FROM room_section_examples WHERE id=? AND room_id=?').bind(body.id,room).first();if(!item)return json({ok:false,error:'not_found'},404);return json({ok:true,item});
   }
   if(request.method==='DELETE'){
    const id=url.searchParams.get('id');if(!id)return json({ok:false,error:'missing_id'},400);
    await db.prepare('DELETE FROM room_section_examples WHERE id=? AND room_id=?').bind(id,room).run();return json({ok:true,deleted:1});
   }
  }
  return json({ok:false,error:'method_not_allowed'},405);
 }catch(error){
  const message=String(error?.message||error);
  if(message.includes('UNIQUE constraint failed'))return json({ok:false,error:'duplicate_section_slug'},409);
  console.error('client sections failure',message);return json({ok:false,error:'operation_failed',detail:message.slice(0,220)},500);
 }
}
