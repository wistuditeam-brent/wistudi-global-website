import { ensureClientEcosystemDefaults,parseList } from './_ecosystem.js';
const json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'public,max-age=30'}});
export async function onRequestGet({request,env}){
 const url=new URL(request.url),room=url.searchParams.get('room')||'client',locale=url.searchParams.get('locale')||'en',kind=url.searchParams.get('kind')||'partners',slug=url.searchParams.get('slug')||'';
 if(room!=='client'||!['en','vi'].includes(locale)||!['partners','contact'].includes(kind))return json({error:'invalid_parameters'},400);if(!env.ROOM_DB)return json({error:'not_configured'},503);
 await ensureClientEcosystemDefaults(env);
 if(kind==='contact'){const x=await env.ROOM_DB.prepare('SELECT * FROM room_contact_settings WHERE room_id=? AND locale=?').bind(room,locale).first();return json({ok:true,item:x?{...x,extra_contacts:parseList(x.extra_contacts)}:null})}
 const settings=await env.ROOM_DB.prepare('SELECT title,intro FROM room_partner_settings WHERE room_id=? AND locale=?').bind(room,locale).first();
 if(slug){const x=await env.ROOM_DB.prepare("SELECT * FROM room_partners WHERE room_id=? AND locale=? AND slug=? AND status='published' LIMIT 1").bind(room,locale,slug).first();if(!x)return json({error:'not_found'},404);return json({ok:true,settings,item:{...x,tags:parseList(x.tags),capability_bullets:parseList(x.capability_bullets),gallery_urls:parseList(x.gallery_urls)}})}
 const r=await env.ROOM_DB.prepare("SELECT id,slug,title,short_description,banner_url,video_url,about_text,capability_bullets,website_url,tags,gallery_urls,sort_order FROM room_partners WHERE room_id=? AND locale=? AND status='published' ORDER BY sort_order,created_at").bind(room,locale).all();
 return json({ok:true,settings,items:(r.results||[]).map(x=>({...x,tags:parseList(x.tags),capability_bullets:parseList(x.capability_bullets),gallery_urls:parseList(x.gallery_urls)}))});
}
