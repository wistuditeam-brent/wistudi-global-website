import { ensureClientStarter } from './starter-content.js';
import { ensureVideoSchema,ensureClientVideoGroups } from './_video-groups.js';
import { ensureVideoThumbnailSchema } from './_video-thumbnails.js';
export async function onRequestGet({request,env}){
 const url=new URL(request.url),room=url.searchParams.get('room')||'client',locale=url.searchParams.get('locale')||'en';
 const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'public,max-age=15,stale-while-revalidate=60'}});
 if(!['client','distributor','investor'].includes(room)||!['en','vi'].includes(locale))return json({error:'invalid_parameters'},400);
 if(!env.ROOM_DB)return json({error:'not_configured'},503);
 if(room==='client')await ensureClientStarter(env);
 await ensureVideoSchema(env);if(room==='client')await ensureClientVideoGroups(env);await ensureVideoThumbnailSchema(env);
 const result=await env.ROOM_DB.prepare("SELECT c.id,c.category,c.title,c.description,c.asset_url,c.locale,c.sort_order,m.group_id AS video_group_id,COALESCE(vt.thumbnail_url,'') AS thumbnail_url FROM room_content c LEFT JOIN room_video_group_membership m ON m.content_id=c.id LEFT JOIN room_video_thumbnails vt ON vt.target_type='content' AND vt.target_id=c.id WHERE c.room_id=? AND c.locale=? AND c.status='published' AND c.asset_url<>'' ORDER BY c.category,c.sort_order,c.created_at").bind(room,locale).all();
 const groups=await env.ROOM_DB.prepare("SELECT g.id,g.title,g.description,g.sort_order FROM room_video_groups g WHERE g.room_id=? AND g.locale=? ORDER BY g.sort_order,g.created_at").bind(room,locale).all();
 return json({ok:true,items:result.results||[],video_groups:groups.results||[]});
}