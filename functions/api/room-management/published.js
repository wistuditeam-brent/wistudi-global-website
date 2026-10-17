import { ensureClientStarter } from './starter-content.js';
export async function onRequestGet({request,env}){
 const url=new URL(request.url),room=url.searchParams.get('room')||'client',locale=url.searchParams.get('locale')||'en';
 const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'public,max-age=30'}});
 if(!['client','distributor','investor'].includes(room)||!['en','vi'].includes(locale))return json({error:'invalid_parameters'},400);
 if(!env.ROOM_DB)return json({error:'not_configured'},503);
 if(room==='client')await ensureClientStarter(env);
 const result=await env.ROOM_DB.prepare("SELECT id,category,title,description,asset_url,locale,sort_order FROM room_content WHERE room_id=? AND locale=? AND status='published' ORDER BY category,sort_order,created_at").bind(room,locale).all();
 return json({ok:true,items:result.results||[]});
}