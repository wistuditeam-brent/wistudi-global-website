import { ensureClientEcosystemDefaults,parseList } from './_ecosystem.js';
import { ensureVideoThumbnailSchema } from './_video-thumbnails.js';
const json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'public,max-age=120,stale-while-revalidate=3600'}});
export async function onRequestGet(context){
 const {request,env}=context;
 const url=new URL(request.url),room=url.searchParams.get('room')||'client',locale=url.searchParams.get('locale')||'en',kind=url.searchParams.get('kind')||'partners',slug=url.searchParams.get('slug')||'';
 if(room!=='client'||!['en','vi'].includes(locale)||!['partners','contact'].includes(kind))return json({error:'invalid_parameters'},400);if(!env.ROOM_DB)return json({error:'not_configured'},503);
 await ensureClientEcosystemDefaults(env);await ensureVideoThumbnailSchema(env);
 if(kind==='contact'){const x=await env.ROOM_DB.prepare('SELECT * FROM room_contact_settings WHERE room_id=? AND locale=?').bind(room,locale).first();return json({ok:true,item:x?{...x,extra_contacts:parseList(x.extra_contacts)}:null})}
 const settings=await env.ROOM_DB.prepare('SELECT title,intro FROM room_partner_settings WHERE room_id=? AND locale=?').bind(room,locale).first();
 if(slug){const x=await env.ROOM_DB.prepare("SELECT p.*,COALESCE(vt.thumbnail_url,'') AS video_thumbnail_url FROM room_partners p LEFT JOIN room_video_thumbnails vt ON vt.target_type='partner' AND vt.target_id=p.id WHERE p.room_id=? AND p.locale=? AND p.slug=? AND p.status='published' LIMIT 1").bind(room,locale,slug).first();if(!x)return json({error:'not_found'},404);return json({ok:true,settings,item:{...x,tags:parseList(x.tags),capability_bullets:parseList(x.capability_bullets),gallery_urls:parseList(x.gallery_urls)}})}
 const r=await env.ROOM_DB.prepare("SELECT p.id,p.slug,p.title,p.short_description,p.banner_url,p.video_url,p.about_text,p.capability_bullets,p.website_url,p.tags,p.gallery_urls,p.sort_order,COALESCE(vt.thumbnail_url,'') AS video_thumbnail_url FROM room_partners p LEFT JOIN room_video_thumbnails vt ON vt.target_type='partner' AND vt.target_id=p.id WHERE p.room_id=? AND p.locale=? AND p.status='published' ORDER BY p.sort_order,p.created_at").bind(room,locale).all();
 const items=(r.results||[]).map(x=>({...x,tags:parseList(x.tags),capability_bullets:parseList(x.capability_bullets),gallery_urls:parseList(x.gallery_urls)}));
 const warm=[];for(const p of items.slice(0,8)){for(const asset of [p.banner_url,p.video_thumbnail_url])if(asset&&asset.startsWith('/api/room-management/media?'))warm.push(fetch(new URL(asset,request.url).href).catch(()=>null))}if(warm.length)context.waitUntil(Promise.all(warm));
 return json({ok:true,settings,items});
}
