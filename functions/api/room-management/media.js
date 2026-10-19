import { ensureEcosystemSchema } from './_ecosystem.js';
import { canManage } from './session.js';
const TYPES={presentation:['application/pdf'],video:['video/mp4','video/webm'],gallery:['image/jpeg','image/png','image/webp'],document:['application/pdf','image/jpeg','image/png','image/webp','text/plain']};
const LIMITS={presentation:30e6,video:90e6,gallery:12e6,document:30e6};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
export async function onRequest({request,env}){
 const url=new URL(request.url),room=url.searchParams.get('room')||'client';
 if(!['client','distributor','investor'].includes(room))return json({error:'invalid_room'},400);
 if(!env.ROOM_MEDIA||!env.ROOM_DB)return json({error:'storage_not_configured'},503);
 const authorized=await canManage(request,env,room);
 if(request.method==='POST'){
  if(!authorized)return json({error:'unauthorized'},401);
  if(request.headers.get('origin')!==url.origin)return json({error:'invalid_origin'},403);
  const type=url.searchParams.get('category'),mime=(request.headers.get('content-type')||'').split(';')[0].toLowerCase(),length=Number(request.headers.get('content-length'));
  if(!TYPES[type]||!TYPES[type].includes(mime))return json({error:'invalid_type'},415);
  if(!Number.isSafeInteger(length)||length<=0||length>LIMITS[type])return json({error:'invalid_size'},413);
  const key=room+'/'+crypto.randomUUID();
  if(type==='video'){
   if(!request.body)return json({error:'invalid_size'},413);
   await env.ROOM_MEDIA.put(key,request.body,{httpMetadata:{contentType:mime}});
   return json({ok:true,asset_url:'/api/room-management/media?room='+room+'&key='+encodeURIComponent(key)},201);
  }
  const bytes=await request.arrayBuffer();if(bytes.byteLength!==length)return json({error:'invalid_size'},413);
  const b=new Uint8Array(bytes),head=String.fromCharCode(...b.slice(0,12));
  const matches={'application/pdf':head.startsWith('%PDF'),'image/png':b[0]===137&&head.slice(1,4)==='PNG','image/jpeg':b[0]===255&&b[1]===216&&b[2]===255,'image/webp':head.startsWith('RIFF')&&head.slice(8,12)==='WEBP','text/plain':true};
  if(!matches[mime])return json({error:'invalid_file_signature'},415);
  await env.ROOM_MEDIA.put(key,bytes,{httpMetadata:{contentType:mime}});
  return json({ok:true,asset_url:'/api/room-management/media?room='+room+'&key='+encodeURIComponent(key)},201);
 }
 if(request.method==='GET'){
  const key=url.searchParams.get('key')||'';
  if(!/^(client|distributor|investor)\/[0-9a-f-]{36}$/.test(key)||!key.startsWith(room+'/'))return json({error:'invalid_key'},400);
  if(!authorized){
   const asset='/api/room-management/media?room='+room+'&key='+encodeURIComponent(key);
   const found=await env.ROOM_DB.prepare("SELECT id FROM room_content WHERE room_id=? AND status='published' AND asset_url=? LIMIT 1").bind(room,asset).first();
   if(!found){
    await ensureEcosystemSchema(env);
    const partner=await env.ROOM_DB.prepare("SELECT id FROM room_partners WHERE room_id=? AND status='published' AND (banner_url=? OR video_url=? OR instr(gallery_urls, ?)>0) LIMIT 1").bind(room,asset,asset,asset).first();
    if(!partner)return json({error:'not_found'},404);
   }
  }
  const object=await env.ROOM_MEDIA.get(key);if(!object)return json({error:'not_found'},404);
  return new Response(object.body,{headers:{'content-type':object.httpMetadata?.contentType||'application/octet-stream','cache-control':'private,no-store','x-content-type-options':'nosniff','content-security-policy':"default-src 'none'; sandbox"}});
 }
 return json({error:'method_not_allowed'},405);
}