import { canManage } from './session.js';
import { ensureVideoSchema,ensureClientVideoGroups } from './_video-groups.js';
const json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const rooms=new Set(['client','distributor','investor']),locales=new Set(['en','vi']);
const valid=(v,n)=>typeof v==='string'&&v.trim().length>0&&v.length<=n;
export async function onRequest({request,env}){
 const url=new URL(request.url),room=url.searchParams.get('room')||'client',locale=url.searchParams.get('locale')||'en';
 if(!rooms.has(room)||!locales.has(locale))return json({error:'invalid_parameters'},400);
 if(!env.ROOM_DB)return json({error:'database_unavailable'},503);
 if(!await canManage(request,env,room))return json({error:'forbidden'},403);
 if(request.method!=='GET'&&request.headers.get('origin')!==url.origin)return json({error:'invalid_origin'},403);
 await ensureVideoSchema(env);if(room==='client')await ensureClientVideoGroups(env);
 try{
  if(request.method==='GET'){
   const r=await env.ROOM_DB.prepare(`SELECT g.id,g.room_id,g.locale,g.title,g.description,g.sort_order,COUNT(m.content_id) AS item_count
    FROM room_video_groups g LEFT JOIN room_video_group_membership m ON m.group_id=g.id
    WHERE g.room_id=? AND g.locale=? GROUP BY g.id ORDER BY g.sort_order,g.created_at`).bind(room,locale).all();
   return json({ok:true,items:r.results||[]});
  }
  const body=await request.json().catch(()=>null);
  if(request.method==='POST'){
   if(!body||body.room_id!==room||body.locale!==locale||!valid(body.title,120)||typeof(body.description||'')!=='string'||(body.description||'').length>2000)return json({error:'invalid_group'},400);
   const id=crypto.randomUUID(),order=Number.isSafeInteger(body.sort_order)?body.sort_order:0;
   await env.ROOM_DB.prepare('INSERT INTO room_video_groups(id,room_id,locale,title,description,sort_order) VALUES(?,?,?,?,?,?)').bind(id,room,locale,body.title.trim(),body.description||'',order).run();
   return json({ok:true,id},201);
  }
  if(request.method==='PATCH'){
   if(!body||!valid(body.id,100)||!valid(body.title,120)||typeof(body.description||'')!=='string'||(body.description||'').length>2000)return json({error:'invalid_group'},400);
   const order=Number.isSafeInteger(body.sort_order)?body.sort_order:0;
   const r=await env.ROOM_DB.prepare('UPDATE room_video_groups SET title=?,description=?,sort_order=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND room_id=? AND locale=?').bind(body.title.trim(),body.description||'',order,body.id,room,locale).run();
   return json({ok:!!r.meta?.changes},r.meta?.changes?200:404);
  }
  if(request.method==='DELETE'){
   const id=url.searchParams.get('id');if(!valid(id,100))return json({error:'missing_id'},400);
   await env.ROOM_DB.batch([
    env.ROOM_DB.prepare('DELETE FROM room_video_group_membership WHERE group_id=?').bind(id),
    env.ROOM_DB.prepare('DELETE FROM room_video_groups WHERE id=? AND room_id=? AND locale=?').bind(id,room,locale)
   ]);
   return json({ok:true});
  }
  return json({error:'method_not_allowed'},405);
 }catch(e){console.error('video group error',e);return json({error:'operation_failed',detail:String(e?.message||e).slice(0,200)},500)}
}
