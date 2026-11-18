import {schema,json,fail,sameOrigin,manager,documentById,handleError} from './_signing.js';
export async function onRequest({request,env}) {return handleError(async()=>{
 await manager(request,env);await schema(env);const url=new URL(request.url),d=await documentById(env,url.searchParams.get('document'));
 if(request.method==='GET'){const r=await env.ROOM_DB.prepare('SELECT part FROM room_signing_parts WHERE document_id=? ORDER BY part').bind(d.id).all();return json({parts:(r.results||[]).map(x=>x.part),chunk_size:d.chunk_size,file_ready:!!d.file_ready});}
 sameOrigin(request);if(d.status!=='draft'||d.file_ready)fail('This PDF is already saved and cannot be replaced.',409);
 const count=Math.ceil(d.total_bytes/d.chunk_size),action=url.searchParams.get('action');
 if(request.method==='PUT'){
  const part=Number(url.searchParams.get('part'));if(!Number.isInteger(part)||part<0||part>=count)fail('Invalid upload part.');
  const expected=Math.min(d.chunk_size,d.total_bytes-part*d.chunk_size),length=Number(request.headers.get('content-length'));
  if(length!==expected)fail('The upload part has the wrong size.');
  const key='signing/'+d.id+'/original/'+part;
  // Each small object streams directly to R2. Neither PDF size nor page count
  // is capped by the application, and no complete PDF is buffered in a Worker.
  await env.ROOM_MEDIA.put(key,request.body,{onlyIf:{etagDoesNotMatch:'*'},httpMetadata:{contentType:'application/octet-stream'}});
  const stored=await env.ROOM_MEDIA.head(key);if(stored?.size!==expected){await env.ROOM_MEDIA.delete(key);fail('The upload was interrupted. Retry this part.');}
  await env.ROOM_DB.prepare('INSERT INTO room_signing_parts(document_id,part,bytes) VALUES(?,?,?) ON CONFLICT(document_id,part) DO UPDATE SET bytes=excluded.bytes').bind(d.id,part,expected).run();return json({part});
 }
 if(request.method==='POST'&&action==='complete'){
  const r=await env.ROOM_DB.prepare('SELECT COUNT(*) AS count,COALESCE(SUM(bytes),0) AS bytes FROM room_signing_parts WHERE document_id=?').bind(d.id).first();
  if(r.count!==count||r.bytes!==d.total_bytes)fail('The PDF upload is incomplete. Resume the upload first.',409);
  const first=await env.ROOM_MEDIA.get('signing/'+d.id+'/original/0',{range:{offset:0,length:8}}),bytes=first?new Uint8Array(await first.arrayBuffer()):[];
  if(String.fromCharCode(...bytes.slice(0,5))!=='%PDF-')fail('This file is not a PDF.');
  await env.ROOM_DB.prepare("UPDATE room_signing_documents SET file_ready=1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND file_ready=0 AND status='draft'").bind(d.id).run();return json({ok:true});
 }
 fail('Method not allowed.',405);
 });}
