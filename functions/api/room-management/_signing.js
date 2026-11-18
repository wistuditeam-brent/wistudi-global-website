import { permissionFor } from './session.js';

export const CHUNK_SIZE = 16 * 1024 * 1024;
export const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store', 'x-content-type-options': 'nosniff', ...headers } });
export function fail(message, status = 400) { throw Object.assign(new Error(message), { status }); }
export function sameOrigin(request) { if (request.headers.get('origin') !== new URL(request.url).origin) fail('Please reload this page and try again.', 403); }
export function id() { return crypto.randomUUID(); }
export function secret() { const b = crypto.getRandomValues(new Uint8Array(32)); return Array.from(b, n => n.toString(16).padStart(2, '0')).join(''); }
export async function hash(value) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), n => n.toString(16).padStart(2, '0')).join(''); }
export async function codeHash(code, salt) {
 const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(code), 'PBKDF2', false, ['deriveBits']);
 return Array.from(new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256)), n => n.toString(16).padStart(2, '0')).join('');
}
const SCHEMA = [
 `CREATE TABLE IF NOT EXISTS room_signing_document_text_versions (document_id TEXT NOT NULL REFERENCES room_signing_documents(id), revision INTEGER NOT NULL, fields_json TEXT NOT NULL, changes_json TEXT NOT NULL, actor TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(document_id,revision))`,
 `CREATE TABLE IF NOT EXISTS room_signing_document_text_approvals (document_id TEXT NOT NULL REFERENCES room_signing_documents(id), revision INTEGER NOT NULL, party_id TEXT NOT NULL, actor TEXT NOT NULL, approved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(document_id,revision,party_id))`,
 `CREATE TABLE IF NOT EXISTS room_signing_text_fields (id TEXT PRIMARY KEY, document_id TEXT NOT NULL REFERENCES room_signing_documents(id), party_id TEXT NOT NULL REFERENCES room_signing_parties(id), page INTEGER NOT NULL, x REAL NOT NULL, y REAL NOT NULL, width REAL NOT NULL, height REAL NOT NULL, text_value TEXT NOT NULL DEFAULT '', font_size REAL NOT NULL DEFAULT 12)`,
 `CREATE TABLE IF NOT EXISTS room_signing_documents (id TEXT PRIMARY KEY, room_id TEXT NOT NULL DEFAULT 'client', title TEXT NOT NULL, filename TEXT NOT NULL, total_bytes INTEGER NOT NULL, chunk_size INTEGER NOT NULL, pages_json TEXT NOT NULL, created_by TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft', file_ready INTEGER NOT NULL DEFAULT 0, revision INTEGER NOT NULL DEFAULT 0, edit_token TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
 `CREATE TABLE IF NOT EXISTS room_signing_parties (id TEXT PRIMARY KEY, document_id TEXT NOT NULL REFERENCES room_signing_documents(id), name TEXT NOT NULL, email TEXT NOT NULL DEFAULT '', kind TEXT NOT NULL DEFAULT 'signer', link_hash TEXT UNIQUE, link_version INTEGER NOT NULL DEFAULT 0, code_salt TEXT, code_hash TEXT, revoked_at TEXT, signed_at TEXT, revision INTEGER NOT NULL DEFAULT 0, edit_token TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
 `CREATE TABLE IF NOT EXISTS room_signing_fields (id TEXT PRIMARY KEY, document_id TEXT NOT NULL REFERENCES room_signing_documents(id), party_id TEXT NOT NULL REFERENCES room_signing_parties(id), page INTEGER NOT NULL, x REAL NOT NULL, y REAL NOT NULL, width REAL NOT NULL, height REAL NOT NULL, signature_key TEXT)`,
 `CREATE TABLE IF NOT EXISTS room_signing_parts (document_id TEXT NOT NULL REFERENCES room_signing_documents(id), part INTEGER NOT NULL, bytes INTEGER NOT NULL, PRIMARY KEY(document_id,part))`,
 `CREATE TABLE IF NOT EXISTS room_signing_sessions (token_hash TEXT PRIMARY KEY, party_id TEXT NOT NULL REFERENCES room_signing_parties(id), link_version INTEGER NOT NULL, expires_at INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS room_signing_throttle (throttle_key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, blocked_until INTEGER NOT NULL, window_started INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS room_signing_events (id TEXT PRIMARY KEY, document_id TEXT NOT NULL REFERENCES room_signing_documents(id), party_id TEXT, actor TEXT NOT NULL, action TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
 `CREATE TABLE IF NOT EXISTS room_signing_document_states (document_id TEXT PRIMARY KEY REFERENCES room_signing_documents(id), archived_at TEXT)`,
 `CREATE INDEX IF NOT EXISTS room_signing_parties_document ON room_signing_parties(document_id)`,
 `CREATE INDEX IF NOT EXISTS room_signing_fields_document ON room_signing_fields(document_id)`,
 `CREATE INDEX IF NOT EXISTS room_signing_text_fields_party ON room_signing_text_fields(document_id,party_id)`,
 `CREATE INDEX IF NOT EXISTS room_signing_events_document ON room_signing_events(document_id,created_at)`,
 `CREATE INDEX IF NOT EXISTS room_signing_sessions_expiry ON room_signing_sessions(expires_at)`
];
let readyDb=null;
export async function schema(env) {
 if (!env.ROOM_DB || !env.ROOM_MEDIA) fail('Document storage is not configured.', 503);
 if(readyDb===env.ROOM_DB)return;
 // New tables only. The same idempotent statements are included in migrations 0009–0012.
 await env.ROOM_DB.batch(SCHEMA.map(sql => env.ROOM_DB.prepare(sql)));
 readyDb=env.ROOM_DB;
}
export async function manager(request, env) {
 const p = await permissionFor(request, env, 'client');
 if (!p) fail('Sign in to the Client Room Manager to continue.', 401);
 return p.manager;
}
export async function documentById(env, documentId) {
 const d = await env.ROOM_DB.prepare("SELECT d.*,s.archived_at FROM room_signing_documents d LEFT JOIN room_signing_document_states s ON s.document_id=d.id WHERE d.id=? AND d.room_id='client' AND d.status<>'trashed'").bind(documentId || '').first();
 if (!d) fail('Document not found.', 404);
 return d;
}
export async function guest(request, env) {
 const token = (request.headers.get('authorization') || '').replace(/^Bearer /, '');
 if (!/^[a-f0-9]{64}$/.test(token)) fail('Enter the access code to open this document.', 401);
 const p = await env.ROOM_DB.prepare(`SELECT p.* FROM room_signing_sessions s JOIN room_signing_parties p ON p.id=s.party_id WHERE s.token_hash=? AND s.expires_at>? AND s.link_version=p.link_version AND p.revoked_at IS NULL`).bind(await hash(token), Math.floor(Date.now()/1000)).first();
 if (!p) fail('This signing session has expired. Open your private link again.', 401);
 return p;
}
export async function access(request, env, documentId) {
 if ((request.headers.get('cookie') || '').includes('wistudi_room_session=')) {
  const p = await permissionFor(request, env, 'client');
  if (p) return { manager: p.manager, party: null };
 }
 const p = await guest(request, env);
 if (p.document_id !== documentId) fail('Document not found.', 404);
 return { manager: null, party: p };
}
export async function event(env, d, partyId, actor, action) { await env.ROOM_DB.prepare('INSERT INTO room_signing_events(id,document_id,party_id,actor,action) VALUES(?,?,?,?,?)').bind(id(),d,partyId,actor,action).run(); }
export async function snapshot(env, d, auth) {
 const result = await env.ROOM_DB.batch([
  env.ROOM_DB.prepare('SELECT id,name,email,kind,signed_at,revision,link_version,revoked_at,CASE WHEN link_hash IS NULL THEN 0 ELSE 1 END AS has_link,CASE WHEN code_hash IS NULL THEN 0 ELSE 1 END AS requires_code FROM room_signing_parties WHERE document_id=? ORDER BY created_at,id').bind(d.id),
  env.ROOM_DB.prepare('SELECT * FROM room_signing_fields WHERE document_id=? ORDER BY page,id').bind(d.id),
  env.ROOM_DB.prepare("SELECT party_id,actor,action,created_at FROM room_signing_events WHERE document_id=? AND action IN ('Document created','Signing link created','Signing link replaced','Signing link revoked','Signature confirmed','Document cancelled') ORDER BY created_at DESC,rowid DESC LIMIT 200").bind(d.id),
  env.ROOM_DB.prepare('SELECT * FROM room_signing_text_fields WHERE document_id=? ORDER BY page,id').bind(d.id),
  env.ROOM_DB.prepare('SELECT revision,fields_json,changes_json,actor,created_at FROM room_signing_document_text_versions WHERE document_id=? ORDER BY revision DESC').bind(d.id),
  env.ROOM_DB.prepare('SELECT revision,party_id,actor,approved_at FROM room_signing_document_text_approvals WHERE document_id=? ORDER BY approved_at,revision,party_id').bind(d.id)
 ]);
 const parties = result[0].results || [], fields = result[1].results || [];
 const signed = parties.filter(p => p.signed_at).length;
 const versions=result[4].results||[],approvals=result[5].results||[],latest=versions[0];
 const approved=versions.find(v=>parties.length&&parties.every(p=>approvals.some(a=>a.revision===v.revision&&a.party_id===p.id)));
 return {
  document: { id:d.id,title:d.title,filename:d.filename,total_bytes:d.total_bytes,pages:JSON.parse(d.pages_json),file_ready:!!d.file_ready,status:d.status==='cancelled'?'cancelled':parties.length && signed===parties.length?'completed':d.status,archived_at:d.archived_at||null,revision:d.revision,can_sign_owner:!!auth.manager&&auth.manager.id===d.created_by,created_at:d.created_at,updated_at:d.updated_at },
  parties: parties.map(p => auth.manager ? p : {id:p.id,name:p.name,kind:p.kind,signed_at:p.signed_at,revision:p.id===auth.party.id?p.revision:undefined}),
  fields: fields.map(f => { const party = parties.find(p=>p.id===f.party_id); const visible = auth.manager || f.party_id===auth.party.id || party?.signed_at; const {signature_key,...rest}=f; return {...rest,has_signature:!!signature_key&&!!visible,signature_url:signature_key&&visible?'/api/room-management/signing-file?document='+d.id+'&signature='+f.id+'&v='+party.revision:null}; }),
  text_fields: (result[3].results||[]).map(f=>({id:f.id,document_id:f.document_id,party_id:f.party_id,page:f.page,x:f.x,y:f.y,width:f.width,height:f.height,font_size:f.font_size,text:auth.manager||f.party_id===auth.party.id||parties.find(p=>p.id===f.party_id)?.signed_at?f.text_value:''})),
  document_text: {revision:latest?.revision||0,approved_revision:approved?.revision||0,fields:latest?JSON.parse(latest.fields_json):[],approvals:approvals.filter(a=>a.revision===latest?.revision&&parties.some(p=>p.id===a.party_id)),history:versions.map(v=>({revision:v.revision,actor:v.actor,created_at:v.created_at,changes:JSON.parse(v.changes_json)})),approval_history:approvals},
  approved_document_text_fields:approved?JSON.parse(approved.fields_json):[],
  current_party_id: auth.party?.id || (auth.manager?.id===d.created_by?parties.find(p=>p.kind==='owner')?.id||null:null),
  events: (result[2].results||[]).map(e=>({...e,actor:parties.find(p=>p.id===e.party_id)?.name||'Administrator'}))
 };
}
export function validatePages(pages) {
 if (!Array.isArray(pages) || !pages.length) fail('The PDF has no readable pages.');
 for (const p of pages) if (!p || ![p.width,p.height].every(n=>Number.isFinite(n)&&n>0&&n<1e8) || !Array.isArray(p.transform) || p.transform.length!==6 || !p.transform.every(Number.isFinite) || Math.abs(p.transform[0]*p.transform[3]-p.transform[1]*p.transform[2])<1e-12) fail('The PDF page dimensions are invalid.');
 return pages.map(p=>({width:p.width,height:p.height,transform:p.transform}));
}
export function validField(f, pages, partyIds) {
 return f && /^[0-9a-f-]{36}$/.test(f.id) && partyIds.has(f.party_id) && Number.isInteger(f.page) && f.page>=1 && f.page<=pages.length && [f.x,f.y,f.width,f.height].every(Number.isFinite) && f.x>=0&&f.y>=0&&f.width>0&&f.height>0&&f.x+f.width<=1.000001&&f.y+f.height<=1.000001;
}
export function validTextField(f,pages,partyIds) {
 return validField(f,pages,partyIds)&&typeof f.text==='string'&&f.text.length<=2000&&!/[\u0000-\u001f\u007f]/.test(f.text)&&Number.isFinite(f.font_size)&&f.font_size>=6&&f.font_size<=72;
}
export async function saveDocumentText(env,d,auth,body) {
 if(!auth.manager)fail('Manager access is required.',403);
 if(['cancelled','trashed'].includes(d.status)||!d.file_ready)fail('This document is not available for editing.',409);
 const latest=await env.ROOM_DB.prepare('SELECT revision,fields_json FROM room_signing_document_text_versions WHERE document_id=? ORDER BY revision DESC LIMIT 1').bind(d.id).first();
 if(body.revision!==d.revision||body.text_revision!==(latest?.revision||0))fail('The document changed. Reload before saving text.',409);
 if(!Array.isArray(body.fields)||new Set(body.fields.map(f=>f?.id)).size!==body.fields.length||!body.fields.every(f=>validTextField(f,JSON.parse(d.pages_json),new Set([null]))&&f.text.trim()))fail('Complete or remove empty text fields.');
 const fields=body.fields.map(f=>({id:f.id,party_id:null,page:f.page,x:f.x,y:f.y,width:f.width,height:f.height,text:f.text.normalize('NFC'),font_size:f.font_size})).sort((a,b)=>a.id.localeCompare(b.id));
 const before=latest?JSON.parse(latest.fields_json):[],changes=[];
 for(const previous of before){const after=fields.find(f=>f.id===previous.id);if(!after)changes.push({before:previous,after:null});else if(JSON.stringify(previous)!==JSON.stringify(after))changes.push({before:previous,after});}
 for(const after of fields)if(!before.some(f=>f.id===after.id))changes.push({before:null,after});
 if(!changes.length)return snapshot(env,d,auth);
 const owner=await env.ROOM_DB.prepare("SELECT name FROM room_signing_parties WHERE document_id=? AND kind='owner'").bind(d.id).first();
 const actor=auth.manager.id===d.created_by&&owner?owner.name:'Administrator',token=id();
 const result=await env.ROOM_DB.batch([
  env.ROOM_DB.prepare("UPDATE room_signing_documents SET revision=revision+1,edit_token=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND revision=? AND status NOT IN ('cancelled','trashed')").bind(token,d.id,d.revision),
  env.ROOM_DB.prepare('INSERT INTO room_signing_document_text_versions(document_id,revision,fields_json,changes_json,actor) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM room_signing_documents WHERE id=? AND edit_token=?)').bind(d.id,(latest?.revision||0)+1,JSON.stringify(fields),JSON.stringify(changes),actor,d.id,token)
 ]);
 if(!result[0].meta.changes)fail('The document changed. Reload before saving text.',409);
 return snapshot(env,await documentById(env,d.id),auth);
}
export async function approveDocumentText(env,d,auth,body) {
 if(['cancelled','trashed'].includes(d.status)||!d.file_ready)fail('This document is not available for approval.',409);
 const p=auth.party|| (auth.manager?.id===d.created_by?await env.ROOM_DB.prepare("SELECT * FROM room_signing_parties WHERE document_id=? AND kind='owner'").bind(d.id).first():null);
 if(!p||p.document_id!==d.id)fail('Only a signing party can approve text changes.',403);
 // Party identities remain editable in a draft. Collect approvals after they lock.
 if(d.status==='draft')fail('Share the document or submit your signature before approving text.',409);
 const latest=await env.ROOM_DB.prepare('SELECT MAX(revision) AS revision FROM room_signing_document_text_versions WHERE document_id=?').bind(d.id).first();
 if(!latest.revision||body.revision!==latest.revision)fail('The text changed. Review the latest version before approving.',409);
 const result=await env.ROOM_DB.prepare(`INSERT INTO room_signing_document_text_approvals(document_id,revision,party_id,actor) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM room_signing_documents WHERE id=? AND revision=? AND status NOT IN ('cancelled','trashed')) AND (SELECT MAX(revision) FROM room_signing_document_text_versions WHERE document_id=?)=? AND EXISTS(SELECT 1 FROM room_signing_parties WHERE id=? AND document_id=? AND (? OR (link_version=? AND revoked_at IS NULL))) ON CONFLICT(document_id,revision,party_id) DO NOTHING`).bind(d.id,body.revision,p.id,p.name,d.id,d.revision,d.id,body.revision,p.id,d.id,auth.manager?1:0,auth.party?.link_version||0).run();
 if(!result.meta.changes){const exists=await env.ROOM_DB.prepare('SELECT 1 FROM room_signing_document_text_approvals WHERE document_id=? AND revision=? AND party_id=?').bind(d.id,body.revision,p.id).first();if(!exists)fail('The document changed. Review it again before approving.',409);}
 return snapshot(env,await documentById(env,d.id),auth);
}
function pngBytes(data) {
 if (typeof data!=='string' || !data.startsWith('data:image/png;base64,') || data.length>3e6) fail('Use a PNG signature image.');
 let bytes; try { bytes=Uint8Array.from(atob(data.slice(22)),c=>c.charCodeAt(0)); } catch { fail('The signature image could not be read.'); }
 if(bytes.length<45||bytes[0]!==137||String.fromCharCode(...bytes.slice(1,8))!=='PNG\r\n\x1a\n'||String.fromCharCode(...bytes.slice(12,16))!=='IHDR')fail('The signature image is invalid.');
 const view=new DataView(bytes.buffer),w=view.getUint32(16),h=view.getUint32(20);
 if(!w||!h||w>2400||h>1200)fail('The signature image dimensions are invalid.');
 return bytes;
}
export async function saveSignature(request,env,d,auth,body) {
 if(['cancelled','trashed'].includes(d.status)||!d.file_ready)fail('This document is not available for signing.',409);
 const p=await env.ROOM_DB.prepare('SELECT * FROM room_signing_parties WHERE id=? AND document_id=?').bind(body.party_id||'',d.id).first();
 const managerOwn=!!auth.manager&&p?.kind==='owner'&&auth.manager.id===d.created_by;
 const managerPreparing=!!auth.manager&&d.status==='draft'&&!body.confirm;
 if(!p||(auth.manager?!managerOwn&&!managerPreparing:p.id!==auth.party.id||p.link_version!==auth.party.link_version||p.revoked_at))fail('You can confirm only your own signature.',403);
 if(p.signed_at)fail('Your submitted signature is locked.',409);
 if(p.revision!==body.revision)fail('Your signature changed in another window. Reload before continuing.',409);
 const original=(await env.ROOM_DB.prepare('SELECT * FROM room_signing_fields WHERE party_id=? AND document_id=?').bind(p.id,d.id).all()).results||[];
 const positions=Array.isArray(body.positions)?body.positions:[],remove=Array.isArray(body.remove_fields)?body.remove_fields:[];
 if(new Set(positions.map(f=>f.id)).size!==positions.length||new Set(remove).size!==remove.length||remove.some(key=>!original.some(f=>f.id===key)))fail('Invalid signature area.');
 const fields=original.filter(f=>!remove.includes(f.id)).map(f=>({...f}));
 for(const f of positions){
  if(!validField(f,JSON.parse(d.pages_json),new Set([p.id]))||remove.includes(f.id))fail('Invalid signature position.');
  const global=await env.ROOM_DB.prepare('SELECT document_id,party_id FROM room_signing_fields WHERE id=?').bind(f.id).first();
  if(global&&(global.document_id!==d.id||global.party_id!==p.id))fail('You can move only your own signature.',403);
  const clean={id:f.id,party_id:p.id,page:f.page,x:f.x,y:f.y,width:f.width,height:f.height};
  const existing=fields.find(x=>x.id===f.id);if(existing)Object.assign(existing,clean);else fields.push({...clean,signature_key:null});
 }
 const textChanges=body.text_fields===undefined?[]:body.text_fields,textRemove=body.remove_text_fields===undefined?[]:body.remove_text_fields;
 if(!Array.isArray(textChanges)||!Array.isArray(textRemove)||new Set(textChanges.map(f=>f?.id)).size!==textChanges.length||new Set(textRemove).size!==textRemove.length)fail('Check the text fields.');
 const originalText=(await env.ROOM_DB.prepare('SELECT * FROM room_signing_text_fields WHERE document_id=? AND party_id=?').bind(d.id,p.id).all()).results||[];
 if(textRemove.some(key=>!originalText.some(f=>f.id===key)))fail('You can remove only your own text fields.',403);
 const finalText=originalText.filter(f=>!textRemove.includes(f.id)).map(f=>({id:f.id,text:f.text_value}));
 for(const f of textChanges){
  if(!validTextField(f,JSON.parse(d.pages_json),new Set([p.id]))||textRemove.includes(f.id))fail('Check the text and its position.');
  const found=await env.ROOM_DB.prepare('SELECT document_id,party_id FROM room_signing_text_fields WHERE id=?').bind(f.id).first();
  if(found&&(found.document_id!==d.id||found.party_id!==p.id))fail('You can edit only your own text fields.',403);
  const existing=finalText.find(t=>t.id===f.id);if(existing)existing.text=f.text;else finalText.push({id:f.id,text:f.text});
 }
 if(body.confirm&&finalText.some(f=>!f.text.trim()))fail('Complete or remove your empty text fields before submitting.');
 const pending=new Map(),changes=Array.isArray(body.signatures)?body.signatures:[];
 if(auth.manager&&!managerOwn&&(changes.length||original.some(f=>f.signature_key&&(remove.includes(f.id)||positions.some(x=>x.id===f.id)))))fail('You can change only your own signature.',403);
 for(const change of changes){if(!fields.some(f=>f.id===change.field_id)||pending.has(change.field_id))fail('Invalid signature area.');pending.set(change.field_id,change.png===null?null:pngBytes(change.png));}
 if(body.confirm&&body.consent!==true)fail('Confirm that these are your signatures before finishing.');
 if(body.confirm&&(!fields.length||fields.some(f=>pending.has(f.id)?!pending.get(f.id):!f.signature_key)))fail('Add your signature before finishing.');
 const token=id(),keys=[];
 try {
  for(const [fieldId,bytes] of pending){if(bytes){const key='signing/'+d.id+'/signatures/'+id()+'.png';await env.ROOM_MEDIA.put(key,bytes,{httpMetadata:{contentType:'image/png'}});keys.push([fieldId,key]);}else keys.push([fieldId,null]);}
  const statements=[env.ROOM_DB.prepare(`UPDATE room_signing_parties SET revision=revision+1,edit_token=?,signed_at=CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE signed_at END WHERE id=? AND document_id=? AND revision=? AND signed_at IS NULL AND (? OR (link_version=? AND revoked_at IS NULL)) AND EXISTS(SELECT 1 FROM room_signing_documents WHERE id=? AND status NOT IN ('cancelled','trashed') AND revision=? AND (? OR status='draft'))`).bind(token,body.confirm?1:0,p.id,d.id,body.revision,auth.manager?1:0,auth.party?.link_version||0,d.id,d.revision,!auth.manager||managerOwn?1:0)];
  const gate='EXISTS(SELECT 1 FROM room_signing_parties WHERE id=? AND edit_token=?)';
  for(const key of remove)statements.push(env.ROOM_DB.prepare('DELETE FROM room_signing_fields WHERE id=? AND party_id=? AND '+gate).bind(key,p.id,p.id,token));
  for(const f of positions)statements.push(env.ROOM_DB.prepare(`INSERT INTO room_signing_fields(id,document_id,party_id,page,x,y,width,height) SELECT ?,?,?,?,?,?,?,? WHERE ${gate} ON CONFLICT(id) DO UPDATE SET page=excluded.page,x=excluded.x,y=excluded.y,width=excluded.width,height=excluded.height`).bind(f.id,d.id,p.id,f.page,f.x,f.y,f.width,f.height,p.id,token));
  for(const key of textRemove)statements.push(env.ROOM_DB.prepare('DELETE FROM room_signing_text_fields WHERE id=? AND party_id=? AND '+gate).bind(key,p.id,p.id,token));
  for(const f of textChanges)statements.push(env.ROOM_DB.prepare(`INSERT INTO room_signing_text_fields(id,document_id,party_id,page,x,y,width,height,text_value,font_size) SELECT ?,?,?,?,?,?,?,?,?,? WHERE ${gate} ON CONFLICT(id) DO UPDATE SET page=excluded.page,x=excluded.x,y=excluded.y,width=excluded.width,height=excluded.height,text_value=excluded.text_value,font_size=excluded.font_size`).bind(f.id,d.id,p.id,f.page,f.x,f.y,f.width,f.height,f.text.normalize('NFC'),f.font_size,p.id,token));
  for(const [fieldId,key] of keys)statements.push(env.ROOM_DB.prepare('UPDATE room_signing_fields SET signature_key=? WHERE id=? AND party_id=? AND '+gate).bind(key,fieldId,p.id,p.id,token));
  statements.push(env.ROOM_DB.prepare("UPDATE room_signing_documents SET status=CASE WHEN ? THEN 'in_progress' ELSE status END,updated_at=CURRENT_TIMESTAMP WHERE id=? AND "+gate).bind(body.confirm?1:0,d.id,p.id,token));
  statements.push(env.ROOM_DB.prepare('INSERT INTO room_signing_events(id,document_id,party_id,actor,action) SELECT ?,?,?,?,? WHERE '+gate).bind(id(),d.id,p.id,p.name,body.confirm?'Signature confirmed':managerPreparing&&!managerOwn?'Signature draft prepared':'Signature draft saved',p.id,token));
  const result=await env.ROOM_DB.batch(statements);if(!result[0].meta.changes)fail('The document changed while saving. Reload and try again.',409);
 }catch(e){await Promise.all(keys.filter(x=>x[1]).map(x=>env.ROOM_MEDIA.delete(x[1]).catch(()=>{})));throw e;}
 return snapshot(env,await documentById(env,d.id),auth);
}
export async function handleError(fn) { try{return await fn();}catch(e){if(!e.status)console.error('document signing',String(e));return json({error:e.status?e.message:'The document operation failed. Please try again.'},e.status||500);} }
