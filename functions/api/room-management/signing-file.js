import {schema,fail,documentById,access,handleError} from './_signing.js';
export function parseRange(value,size){
 if(!value)return {start:0,end:size-1,partial:false};
 const m=/^bytes=(\d*)-(\d*)$/.exec(value);if(!m||(!m[1]&&!m[2]))return null;
 let start=m[1]?Number(m[1]):Math.max(0,size-Number(m[2])),end=m[1]?(m[2]?Number(m[2]):size-1):size-1;
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=size||start<0||end<start)return null;
 return {start,end:Math.min(end,size-1),partial:true};
}
export async function onRequest({request,env}){return handleError(async()=>{
 if(!['GET','HEAD'].includes(request.method))fail('Method not allowed.',405);
 await schema(env);const url=new URL(request.url),d=await documentById(env,url.searchParams.get('document')),auth=await access(request,env,d.id);
 if(!d.file_ready||(!auth.manager&&d.status==='cancelled'))fail('Document not available.',404);
 const signature=url.searchParams.get('signature');
 const headers={'cache-control':'private, no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
 if(signature){
  const f=await env.ROOM_DB.prepare('SELECT f.signature_key,f.party_id,p.signed_at FROM room_signing_fields f JOIN room_signing_parties p ON p.id=f.party_id WHERE f.id=? AND f.document_id=?').bind(signature,d.id).first();
  if(!f?.signature_key||(!auth.manager&&f.party_id!==auth.party.id&&!f.signed_at))fail('Signature not found.',404);
  const object=await env.ROOM_MEDIA.get(f.signature_key);if(!object)fail('Signature not found.',404);return new Response(request.method==='HEAD'?null:object.body,{headers:{...headers,'content-type':'image/png','content-length':String(object.size)}});
 }
 const range=parseRange(request.headers.get('range'),d.total_bytes);
 if(!range)return new Response(null,{status:416,headers:{...headers,'content-range':'bytes */'+d.total_bytes}});
 const length=range.end-range.start+1;
 Object.assign(headers,{'content-type':'application/pdf','content-length':String(length),'accept-ranges':'bytes','content-disposition':"inline; filename*=UTF-8''"+encodeURIComponent(d.filename)});
 if(range.partial)headers['content-range']='bytes '+range.start+'-'+range.end+'/'+d.total_bytes;
 if(request.method==='HEAD')return new Response(null,{status:range.partial?206:200,headers});
 let position=range.start,reader=null;
 const stream=new ReadableStream({
  async pull(controller){try{
   while(position<=range.end){
    if(!reader){const part=Math.floor(position/d.chunk_size),offset=position%d.chunk_size,bytes=Math.min(d.chunk_size-offset,range.end-position+1);const object=await env.ROOM_MEDIA.get('signing/'+d.id+'/original/'+part,{range:{offset,length:bytes}});if(!object)throw Error('Missing PDF part');reader=object.body.getReader();}
    const {value,done}=await reader.read();if(done){reader=null;continue;}position+=value.byteLength;controller.enqueue(value);return;
   }
   controller.close();
  }catch(e){controller.error(e);}},
  async cancel(reason){await reader?.cancel(reason);}
 });
 return new Response(stream,{status:range.partial?206:200,headers});
 });}
