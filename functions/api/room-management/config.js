import { canManage } from './session.js';
import { ensureClientEcosystemDefaults,ensureEcosystemSchema,parseList } from './_ecosystem.js';
const json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const rooms=new Set(['client','distributor','investor']),locales=new Set(['en','vi']);
const required=(v,n)=>typeof v==='string'&&v.trim().length>0&&v.length<=n,safe=(v,n)=>typeof(v??'')==='string'&&String(v??'').length<=n;
const urlOk=v=>{if(!v)return true;try{return new URL(v).protocol==='https:'}catch{return false}};
export async function onRequest({request,env}){
 const url=new URL(request.url),room=url.searchParams.get('room')||'client',locale=url.searchParams.get('locale')||'en',section=url.searchParams.get('section')||'partner';
 if(!rooms.has(room)||!locales.has(locale)||!['partner','contact'].includes(section))return json({error:'invalid_parameters'},400);if(!env.ROOM_DB)return json({error:'database_unavailable'},503);
 if(!await canManage(request,env,room))return json({error:'forbidden'},403);if(request.method!=='GET'&&request.headers.get('origin')!==url.origin)return json({error:'invalid_origin'},403);
 await ensureEcosystemSchema(env);if(room==='client')await ensureClientEcosystemDefaults(env);
 if(request.method==='GET'){
  if(section==='partner'){const x=await env.ROOM_DB.prepare('SELECT title,intro FROM room_partner_settings WHERE room_id=? AND locale=?').bind(room,locale).first();return json({ok:true,item:x||{title:'Partner Ecosystem',intro:''}})}
  const x=await env.ROOM_DB.prepare('SELECT * FROM room_contact_settings WHERE room_id=? AND locale=?').bind(room,locale).first();return json({ok:true,item:x?{...x,extra_contacts:parseList(x.extra_contacts)}:{extra_contacts:[]}});
 }
 if(request.method!=='POST')return json({error:'method_not_allowed'},405);
 const b=await request.json().catch(()=>null);
 if(section==='partner'){
  if(!b||!required(b.title,140)||!safe(b.intro,4000))return json({error:'invalid_config'},400);
  await env.ROOM_DB.prepare(`INSERT INTO room_partner_settings(room_id,locale,title,intro) VALUES(?,?,?,?)
   ON CONFLICT(room_id,locale) DO UPDATE SET title=excluded.title,intro=excluded.intro,updated_at=CURRENT_TIMESTAMP`).bind(room,locale,b.title.trim(),b.intro||'').run();const saved=await env.ROOM_DB.prepare('SELECT title,intro FROM room_partner_settings WHERE room_id=? AND locale=?').bind(room,locale).first();return json({ok:true,item:saved});
 }
 if(!b||!required(b.title,140)||!safe(b.intro,4000)||!safe(b.business_address,1200)||!safe(b.primary_email,254)||!safe(b.secondary_email,254)||!safe(b.primary_phone,120)||!urlOk(b.facebook_url)||!urlOk(b.linkedin_url)||!urlOk(b.website_url)||!Array.isArray(b.extra_contacts)||b.extra_contacts.length>30)return json({error:'invalid_config'},400);
 const contacts=b.extra_contacts.filter(x=>x&&typeof x==='object').map(x=>({name:String(x.name||'').slice(0,140),role:String(x.role||'').slice(0,140),region:String(x.region||'').slice(0,140),email:String(x.email||'').slice(0,254),phone:String(x.phone||'').slice(0,120),link:urlOk(String(x.link||''))?String(x.link||'').slice(0,2048):''}));
 await env.ROOM_DB.prepare(`INSERT INTO room_contact_settings(room_id,locale,title,intro,business_address,primary_email,secondary_email,primary_phone,facebook_url,linkedin_url,website_url,extra_contacts)
 VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(room_id,locale) DO UPDATE SET title=excluded.title,intro=excluded.intro,business_address=excluded.business_address,primary_email=excluded.primary_email,secondary_email=excluded.secondary_email,primary_phone=excluded.primary_phone,facebook_url=excluded.facebook_url,linkedin_url=excluded.linkedin_url,website_url=excluded.website_url,extra_contacts=excluded.extra_contacts,updated_at=CURRENT_TIMESTAMP`)
  .bind(room,locale,b.title.trim(),b.intro||'',b.business_address||'',b.primary_email||'',b.secondary_email||'',b.primary_phone||'',b.facebook_url||'',b.linkedin_url||'',b.website_url||'',JSON.stringify(contacts)).run();const saved=await env.ROOM_DB.prepare('SELECT * FROM room_contact_settings WHERE room_id=? AND locale=?').bind(room,locale).first();return json({ok:true,item:saved?{...saved,extra_contacts:parseList(saved.extra_contacts)}:null});
}
