import { ensureEcosystemSchema } from './_ecosystem.js';
import { canManage } from './session.js';
import { ensureVideoThumbnailSchema } from './_video-thumbnails.js';
const TYPES={presentation:['application/pdf'],video:['video/mp4','video/webm'],gallery:['image/jpeg','image/png','image/webp'],document:['application/pdf','image/jpeg','image/png','image/webp','text/plain']};
const LIMITS={presentation:30e6,video:90e6,gallery:12e6,document:30e6};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const publicKeyMemo=new Map();
export async function onRequest(context){
 const {request,env}=context;
 const url=new URL(request.url),room=url.searchParams.get('room')||'client';
 if(!['client','distributor','investor'].includes(room))return json({error:'invalid_room'},400);
 if(!env.ROOM_MEDIA||!env.ROOM_DB)return json({error:'storage_not_configured'},503);
 const hasManagerSession=(request.headers.get('cookie')||'').includes('wistudi_room_session=');
 const authorized=(request.method==='POST'||hasManagerSession)?await canManage(request,env,room):false;
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
 if(request.method==='GET'||request.method==='HEAD'){
  const key=url.searchParams.get('key')||'';
  if(!/^(client|distributor|investor)\/[0-9a-f-]{36}$/.test(key)||!key.startsWith(room+'/'))return json({error:'invalid_key'},400);
  const rangeHeader=request.headers.get('range');
  const cacheable=!authorized&&request.method==='GET'&&!rangeHeader;
  const edgeCache=cacheable&&typeof caches!=='undefined'?caches.default:null;
  const cacheKey=edgeCache?new Request(request.url,{method:'GET'}):null;
  if(edgeCache){const hit=await edgeCache.match(cacheKey);if(hit)return hit}
  const memoUntil=publicKeyMemo.get(key)||0;
  if(!authorized&&memoUntil<Date.now()){
   const asset='/api/room-management/media?room='+room+'&key='+encodeURIComponent(key);
   const found=await env.ROOM_DB.prepare("SELECT id FROM room_content WHERE room_id=? AND status='published' AND asset_url=? LIMIT 1").bind(room,asset).first();
   if(!found){
    await ensureEcosystemSchema(env);
    const partner=await env.ROOM_DB.prepare("SELECT id FROM room_partners WHERE room_id=? AND status='published' AND (banner_url=? OR video_url=? OR instr(gallery_urls, ?)>0) LIMIT 1").bind(room,asset,asset,asset).first();
    if(!partner){await ensureVideoThumbnailSchema(env);const thumb=await env.ROOM_DB.prepare("SELECT vt.target_id FROM room_video_thumbnails vt LEFT JOIN room_content c ON vt.target_type='content' AND c.id=vt.target_id LEFT JOIN room_partners p ON vt.target_type='partner' AND p.id=vt.target_id WHERE vt.thumbnail_url=? AND ((vt.target_type='content' AND c.room_id=? AND c.status='published') OR (vt.target_type='partner' AND p.room_id=? AND p.status='published')) LIMIT 1").bind(asset,room,room).first();if(!thumb)return json({error:'not_found'},404)}
   }
   publicKeyMemo.set(key,Date.now()+60000);
  }
  if(request.method==='HEAD'){
   const object=await env.ROOM_MEDIA.head(key);if(!object)return json({error:'not_found'},404);
   const responseHeaders={'content-type':object.httpMetadata?.contentType||'application/octet-stream','content-length':String(object.size),'accept-ranges':'bytes','cache-control':authorized?'private,no-store':'public,max-age=3600,immutable','x-content-type-options':'nosniff'};
   if(object.httpEtag)responseHeaders.etag=object.httpEtag;
   return new Response(null,{status:200,headers:responseHeaders});
  }
  let object;
  try{object=await env.ROOM_MEDIA.get(key,rangeHeader?{range:request.headers}:undefined)}
  catch{return new Response(null,{status:416,headers:{'accept-ranges':'bytes','content-range':'bytes */*'}})}
  if(!object)return json({error:'not_found'},404);
  const responseHeaders={'content-type':object.httpMetadata?.contentType||'application/octet-stream','accept-ranges':'bytes','cache-control':authorized?'private,no-store':'public,max-age=3600,stale-while-revalidate=86400','x-content-type-options':'nosniff'};
  if(object.httpEtag)responseHeaders.etag=object.httpEtag;
  let status=200;
  if(rangeHeader&&object.range&&Number.isFinite(object.range.offset)&&Number.isFinite(object.range.length)){
   const start=object.range.offset,end=start+object.range.length-1;
   responseHeaders['content-range']='bytes '+start+'-'+end+'/'+object.size;
   responseHeaders['content-length']=String(object.range.length);
   status=206;
  }else responseHeaders['content-length']=String(object.size);
  const response=new Response(object.body,{status,headers:responseHeaders});
  if(edgeCache&&status===200)context.waitUntil(edgeCache.put(cacheKey,response.clone()));
  return response;
 }
 return json({error:'method_not_allowed'},405);
}