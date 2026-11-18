import {schema,json,fail,id,secret,hash,codeHash,sameOrigin,manager,documentById,snapshot,validatePages,validField,event,saveSignature,handleError} from './_signing.js';
import {CHUNK_SIZE} from './_signing.js';

export async function onRequest({request,env}) { return handleError(async()=>{
 const actor=await manager(request,env);await schema(env);
 const url=new URL(request.url),action=url.searchParams.get('action')||'',documentId=url.searchParams.get('document');
 if(request.method!=='GET')sameOrigin(request);
 if(request.method==='GET'&&!documentId){
  const r=await env.ROOM_DB.prepare(`SELECT d.id,d.title,d.filename,d.total_bytes,d.status,d.file_ready,d.created_at,d.updated_at,s.archived_at,(SELECT COUNT(*) FROM room_signing_parties p WHERE p.document_id=d.id) AS signers,(SELECT COUNT(*) FROM room_signing_parties p WHERE p.document_id=d.id AND p.signed_at IS NOT NULL) AS signed,(SELECT COUNT(*) FROM room_signing_parties p WHERE p.document_id=d.id AND p.link_hash IS NOT NULL) AS shared FROM room_signing_documents d LEFT JOIN room_signing_document_states s ON s.document_id=d.id WHERE d.room_id='client' AND d.status<>'trashed' AND ${url.searchParams.get('archived')==='1'?'s.archived_at IS NOT NULL':'s.archived_at IS NULL'} ORDER BY d.created_at DESC`).all();
  const archived=await env.ROOM_DB.prepare("SELECT COUNT(*) AS count FROM room_signing_document_states s JOIN room_signing_documents d ON d.id=s.document_id WHERE d.room_id='client' AND d.status<>'trashed' AND s.archived_at IS NOT NULL").first();
  return json({items:r.results||[],archived_count:archived.count});
 }
 if(request.method==='POST'&&action==='create'){
  const b=await request.json(),pages=validatePages(b.pages);
  if(typeof b.title!=='string'||!b.title.trim()||b.title.length>180||typeof b.filename!=='string'||b.filename.length>255||!Number.isSafeInteger(b.size)||b.size<=0)fail('Choose a PDF and enter a document title.');
  const docId=id(),partyId=id();
  const create=[env.ROOM_DB.prepare('INSERT INTO room_signing_documents(id,title,filename,total_bytes,chunk_size,pages_json,created_by) VALUES(?,?,?,?,?,?,?)').bind(docId,b.title.trim(),b.filename,b.size,CHUNK_SIZE,JSON.stringify(pages),actor.id)];
  if(b.owner_signs!==false)create.push(env.ROOM_DB.prepare("INSERT INTO room_signing_parties(id,document_id,name,email,kind) VALUES(?,?,?,?,'owner')").bind(partyId,docId,b.owner_name?.trim()?.slice(0,120)||actor.email,actor.email));
  await env.ROOM_DB.batch(create);
  await event(env,docId,b.owner_signs===false?null:partyId,actor.email,'Document created');return json({id:docId,chunk_size:CHUNK_SIZE},201);
 }
 const d=await documentById(env,documentId),auth={manager:actor,party:null};
 if(request.method==='GET'&&action==='link'){
  const p=await env.ROOM_DB.prepare("SELECT link_hash,code_hash FROM room_signing_parties WHERE id=? AND document_id=? AND kind='signer' AND revoked_at IS NULL").bind(url.searchParams.get('party')||'',d.id).first();
  if(!p?.link_hash)fail('No active signing link is available.',404);
  const stored=await env.ROOM_MEDIA.get('signing/'+d.id+'/links/'+p.link_hash);if(!stored)fail('The signing link is unavailable. Create a replacement.',404);
  return json({url:url.origin+'/document-signing/#token='+await stored.text(),requires_code:!!p.code_hash});
 }
 if(request.method==='GET')return json(await snapshot(env,d,auth));
 if(request.method!=='POST')fail('Method not allowed.',405);
 const b=await request.json();
 if(action==='delete'){
  const result=await env.ROOM_DB.prepare(`UPDATE room_signing_documents SET status='trashed',revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND revision=? AND status='draft' AND NOT EXISTS(SELECT 1 FROM room_signing_parties WHERE document_id=? AND (signed_at IS NOT NULL OR link_hash IS NOT NULL)) AND NOT EXISTS(SELECT 1 FROM room_signing_document_states WHERE document_id=? AND archived_at IS NOT NULL)`).bind(d.id,d.revision,d.id,d.id).run();
  if(!result.meta.changes)fail('This document cannot be deleted because signing has started. You can only archive it.',409);
  await event(env,d.id,null,actor.email,'Draft deleted');return json({ok:true});
 }
 if(action==='archive'||action==='restore'){
  await env.ROOM_DB.prepare(`INSERT INTO room_signing_document_states(document_id,archived_at) VALUES(?,CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE NULL END) ON CONFLICT(document_id) DO UPDATE SET archived_at=excluded.archived_at`).bind(d.id,action==='archive'?1:0).run();
  await event(env,d.id,null,actor.email,action==='archive'?'Document archived':'Document restored');return json({ok:true});
 }
 if(action==='layout'){
  if(d.status!=='draft')fail('Signing has started. The document and signature areas are locked.',409);
  if(b.revision!==d.revision)fail('The document changed in another window. Reload and try again.',409);
  if(b.title!==undefined&&(typeof b.title!=='string'||!b.title.trim()||b.title.length>180))fail('Enter a document title of up to 180 characters.');
  const old=(await env.ROOM_DB.prepare('SELECT * FROM room_signing_parties WHERE document_id=?').bind(d.id).all()).results||[];
  if(old.some(p=>p.signed_at))fail('A signature has already been confirmed.',409);
  if(!Array.isArray(b.parties)||!Array.isArray(b.fields))fail('Check the parties and signature areas.');
  const owner=old.find(p=>p.kind==='owner'),ids=new Set();
  const ownerSigns=b.owner_signs===undefined?!!owner:b.owner_signs===true;
  const ownerId=ownerSigns?(owner?.id||b.parties.find(p=>p.kind==='owner')?.id):null;
  for(const p of b.parties){if(!p||!/^[0-9a-f-]{36}$/.test(p.id)||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>120||typeof p.email!=='string'||p.email.length>254)fail('Enter a name for each signer.');ids.add(p.id);if(p.id!==owner?.id&&old.some(o=>o.id===p.id&&o.kind==='owner'))fail('Invalid signer.');}
  if(ownerSigns&&(!ownerId||!ids.has(ownerId)))fail('Add your signing details.');
  if(!ownerSigns&&owner&&ids.has(owner.id))fail('Remove the administrator from the signing parties when preparing only.');
  if(new Set(b.fields.map(f=>f.id)).size!==b.fields.length||!b.fields.every(f=>validField(f,JSON.parse(d.pages_json),ids)))fail('Check the signature area positions.');
  const fieldIds=b.fields.map(f=>f.id),token=id();
  // Global UUIDs cannot be moved between agreements by a crafted request.
  for(const collection of [{table:'room_signing_parties',values:[...ids]},{table:'room_signing_fields',values:fieldIds}]){
   for(const key of collection.values){const found=await env.ROOM_DB.prepare('SELECT document_id FROM '+collection.table+' WHERE id=?').bind(key).first();if(found&&found.document_id!==d.id)fail('Invalid signature area.',403);}
  }
  const q=[env.ROOM_DB.prepare("UPDATE room_signing_documents SET title=?,revision=revision+1,edit_token=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND revision=? AND status='draft' AND NOT EXISTS(SELECT 1 FROM room_signing_parties WHERE document_id=? AND signed_at IS NOT NULL)").bind(b.title?.trim()||d.title,token,d.id,b.revision,d.id)];
  const gate='EXISTS(SELECT 1 FROM room_signing_documents WHERE id=? AND edit_token=?)';
  q.push(env.ROOM_DB.prepare('DELETE FROM room_signing_fields WHERE document_id=? AND '+gate).bind(d.id,d.id,token));
  for(const [index,p] of b.parties.entries())q.push(env.ROOM_DB.prepare(`INSERT INTO room_signing_parties(id,document_id,name,email,kind,created_at) SELECT ?,?,?,?,?,? WHERE ${gate} ON CONFLICT(id) DO UPDATE SET name=excluded.name,email=excluded.email,revision=room_signing_parties.revision+1`).bind(p.id,d.id,p.name.trim(),p.email.trim(),p.id===ownerId?'owner':'signer',new Date(Date.now()+index).toISOString().replace('T',' ').replace('Z',''),d.id,token));
  const removed=old.filter(p=>!ids.has(p.id));for(const p of removed)q.push(env.ROOM_DB.prepare('DELETE FROM room_signing_parties WHERE id=? AND document_id=? AND '+gate).bind(p.id,d.id,d.id,token));
  const prior=(await env.ROOM_DB.prepare('SELECT id,party_id,page,x,y,width,height,signature_key FROM room_signing_fields WHERE document_id=?').bind(d.id).all()).results||[];
  for(const f of b.fields){const before=prior.find(x=>x.id===f.id);const key=before?.party_id===f.party_id?before.signature_key:null;q.push(env.ROOM_DB.prepare(`INSERT INTO room_signing_fields(id,document_id,party_id,page,x,y,width,height,signature_key) SELECT ?,?,?,?,?,?,?,?,? WHERE ${gate}`).bind(f.id,d.id,f.party_id,f.page,f.x,f.y,f.width,f.height,key,d.id,token));}
  const result=await env.ROOM_DB.batch(q);if(!result[0].meta.changes)fail('The document changed while saving. Reload and try again.',409);
  return json(await snapshot(env,await documentById(env,d.id),auth));
 }
 if(action==='share'){
  if(!d.file_ready||d.status==='cancelled')fail('This document is not ready to share.',409);
  const p=await env.ROOM_DB.prepare("SELECT * FROM room_signing_parties WHERE id=? AND document_id=? AND kind='signer'").bind(b.party_id||'',d.id).first();
  if(!p||p.signed_at)fail('Choose an unsigned recipient.');
  const code=b.code==null||b.code===''?null:String(b.code);if(code&&!/^\d{6}$/.test(code))fail('Use exactly six digits for the access code.');
  if(p.link_hash&&b.replace!==true)fail('A link already exists. Choose Replace link to revoke it and create another.',409);
  const token=secret(),tokenHash=await hash(token),salt=code?secret():null,edit=id();
  await env.ROOM_MEDIA.put('signing/'+d.id+'/links/'+tokenHash,token,{httpMetadata:{contentType:'text/plain'}});
  const result=await env.ROOM_DB.batch([
   env.ROOM_DB.prepare("UPDATE room_signing_documents SET status='in_progress',revision=revision+1,edit_token=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND revision=? AND status<>'cancelled'").bind(edit,d.id,d.revision),
   env.ROOM_DB.prepare(`UPDATE room_signing_parties SET link_hash=?,link_version=link_version+1,code_salt=?,code_hash=?,revoked_at=NULL WHERE id=? AND signed_at IS NULL AND EXISTS(SELECT 1 FROM room_signing_documents WHERE id=? AND edit_token=?)`).bind(tokenHash,salt,code?await codeHash(code,salt):null,p.id,d.id,edit)
  ]);if(!result[0].meta.changes||!result[1].meta.changes)fail('The document changed. Reload and try again.',409);
  await event(env,d.id,p.id,actor.email,p.link_hash?'Signing link replaced':'Signing link created');
  return json({url:url.origin+'/document-signing/#token='+token,requires_code:!!code,...await snapshot(env,await documentById(env,d.id),auth)});
 }
 if(action==='revoke'){
  const p=await env.ROOM_DB.prepare('SELECT * FROM room_signing_parties WHERE id=? AND document_id=?').bind(b.party_id||'',d.id).first();if(!p)fail('Signer not found.',404);
  await env.ROOM_DB.prepare('UPDATE room_signing_parties SET revoked_at=CURRENT_TIMESTAMP,link_version=link_version+1 WHERE id=? AND document_id=?').bind(p.id,d.id).run();await event(env,d.id,p.id,actor.email,'Signing link revoked');return json(await snapshot(env,d,auth));
 }
 if(action==='cancel'){const unsigned=await env.ROOM_DB.prepare('SELECT COUNT(*) AS count FROM room_signing_parties WHERE document_id=? AND signed_at IS NULL').bind(d.id).first();if(!unsigned.count)fail('All parties have signed. You can only archive this document.',409);await env.ROOM_DB.prepare("UPDATE room_signing_documents SET status='cancelled',revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(d.id).run();await event(env,d.id,null,actor.email,'Document cancelled');return json(await snapshot(env,await documentById(env,d.id),auth));}
 if(action==='signature')return json(await saveSignature(request,env,d,auth,b));
 fail('Unknown document action.',400);
 }); }
