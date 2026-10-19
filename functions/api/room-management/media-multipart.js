import { canManage } from './session.js';
const json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const ROOMS=new Set(['client','distributor','investor']);
const VIDEO_TYPES=new Set(['video/mp4','video/webm']);
const MAX_VIDEO_BYTES=500*1000*1000*1000;
const MIN_PART_SIZE=16*1024*1024;
const MAX_PART_SIZE=64*1024*1024;
const MIB=1024*1024;
function partSizeFor(size){const required=Math.ceil(size/9000),rounded=Math.ceil(required/MIB)*MIB;return Math.min(MAX_PART_SIZE,Math.max(MIN_PART_SIZE,rounded))}
const keyOk=(key,room)=>new RegExp('^'+room+'\\/[0-9a-f-]{36}$').test(key||'');
export async function onRequest({request,env}){
 const url=new URL(request.url),room=url.searchParams.get('room')||'client',action=url.searchParams.get('action')||'';
 if(!ROOMS.has(room))return json({error:'invalid_room'},400);
 if(!env.ROOM_MEDIA||!env.ROOM_DB)return json({error:'storage_not_configured'},503);
 if(!await canManage(request,env,room))return json({error:'forbidden'},403);
 if(request.headers.get('origin')!==url.origin)return json({error:'invalid_origin'},403);
 try{
  if(action==='init'&&request.method==='POST'){
   const body=await request.json().catch(()=>null),mime=String(body?.mime||'').toLowerCase(),size=Number(body?.size);
   if(!VIDEO_TYPES.has(mime))return json({error:'invalid_type'},415);
   if(!Number.isFinite(size)||size<=0||size>MAX_VIDEO_BYTES)return json({error:'invalid_size',max_bytes:MAX_VIDEO_BYTES},413);
   const key=room+'/'+crypto.randomUUID(),partSize=partSizeFor(size);
   const upload=await env.ROOM_MEDIA.createMultipartUpload(key,{httpMetadata:{contentType:mime}});
   return json({ok:true,key,upload_id:upload.uploadId,part_size:partSize,max_bytes:MAX_VIDEO_BYTES});
  }
  if(action==='part'&&request.method==='POST'){
   const key=url.searchParams.get('key'),uploadId=url.searchParams.get('upload_id')||'',partNumber=Number(url.searchParams.get('part_number')),length=Number(request.headers.get('content-length'));
   if(!keyOk(key,room)||!uploadId||uploadId.length>1000||!Number.isInteger(partNumber)||partNumber<1||partNumber>10000)return json({error:'invalid_part'},400);
   if(Number.isFinite(length)&&length>0&&length>MAX_PART_SIZE)return json({error:'invalid_part_size'},413);
   const upload=env.ROOM_MEDIA.resumeMultipartUpload(key,uploadId);
   const part=await upload.uploadPart(partNumber,request.body);
   return json({ok:true,partNumber:part.partNumber,etag:part.etag});
  }
  if(action==='complete'&&request.method==='POST'){
   const body=await request.json().catch(()=>null),key=body?.key,uploadId=body?.upload_id,parts=body?.parts;
   if(!keyOk(key,room)||typeof uploadId!=='string'||!Array.isArray(parts)||!parts.length||parts.length>10000)return json({error:'invalid_complete'},400);
   const clean=parts.map(p=>({partNumber:Number(p.partNumber),etag:String(p.etag||'')})).filter(p=>Number.isInteger(p.partNumber)&&p.partNumber>0&&p.partNumber<=10000&&p.etag);
   if(clean.length!==parts.length)return json({error:'invalid_parts'},400);
   const upload=env.ROOM_MEDIA.resumeMultipartUpload(key,uploadId);await upload.complete(clean);
   return json({ok:true,asset_url:'/api/room-management/media?room='+room+'&key='+encodeURIComponent(key)});
  }
  if(action==='abort'&&request.method==='POST'){
   const body=await request.json().catch(()=>null),key=body?.key,uploadId=body?.upload_id;
   if(!keyOk(key,room)||typeof uploadId!=='string')return json({error:'invalid_abort'},400);
   await env.ROOM_MEDIA.resumeMultipartUpload(key,uploadId).abort();return json({ok:true});
  }
  return json({error:'method_not_allowed'},405);
 }catch(e){console.error('multipart upload error',e);return json({error:'upload_failed',detail:String(e?.message||e).slice(0,200)},500)}
}
