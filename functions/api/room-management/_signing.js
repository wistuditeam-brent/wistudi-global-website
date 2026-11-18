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
 `CREATE TABLE IF NOT EXISTS room_signing_documents (id TEXT PRIMARY KEY, room_id TEXT NOT NULL DEFAULT 'client', title TEXT NOT NULL, filename TEXT NOT NULL, total_bytes INTEGER NOT NULL, chunk_size INTEGER NOT NULL, pages_json TEXT NOT NULL, created_by TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft', file_ready INTEGER NOT NULL DEFAULT 0, revision INTEGER NOT NULL DEFAULT 0, edit_token TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
 `CREATE TABLE IF NOT EXISTS room_signing_parties (id TEXT PRIMARY KEY, document_id TEXT NOT NULL REFERENCES room_signing_documents(id), name TEXT NOT NULL, email TEXT NOT NULL DEFAULT '', kind TEXT NOT NULL DEFAULT 'signer', link_hash TEXT UNIQUE, link_version INTEGER NOT NULL DEFAULT 0, code_salt TEXT, code_hash TEXT, revoked_at TEXT, signed_at TEXT, revision INTEGER NOT NULL DEFAULT 0, edit_token TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
 `CREATE TABLE IF NOT EXISTS room_signing_fields (id TEXT PRIMARY KEY, document_id TEXT NOT NULL REFERENCES room_signing_documents(id), party_id TEXT NOT NULL REFERENCES room_signing_parties(id), page INTEGER NOT NULL, x REAL NOT NULL, y REAL NOT NULL, width REAL NOT NULL, height REAL NOT NULL, signature_key TEXT)`,
 `CREATE TABLE IF NOT EXISTS room_signing_parts (document_id TEXT NOT NULL REFERENCES room_signing_documents(id), part INTEGER NOT NULL, bytes INTEGER NOT NULL, PRIMARY KEY(document_id,part))`,
 `CREATE TABLE IF NOT EXISTS room_signing_sessions (token_hash TEXT PRIMARY KEY, party_id TEXT NOT NULL REFERENCES room_signing_parties(id), link_version INTEGER NOT NULL, expires_at INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS room_signing_throttle (throttle_key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, blocked_until INTEGER NOT NULL, window_started INTEGER NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS room_signing_events (id TEXT PRIMARY KEY, document_id TEXT NOT NULL REFERENCES room_signing_documents(id), party_id TEXT, actor TEXT NOT NULL, action TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
 `CREATE INDEX IF NOT EXISTS room_signing_parties_document ON room_signing_parties(document_id)`,
 `CREATE INDEX IF NOT EXISTS room_signing_fields_document ON room_signing_fields(document_id)`,
 `CREATE INDEX IF NOT EXISTS room_signing_events_document ON room_signing_events(document_id,created_at)`,
 `CREATE INDEX IF NOT EXISTS room_signing_sessions_expiry ON room_signing_sessions(expires_at)`
];
let readyDb=null;
export async function schema(env) {
 if (!env.ROOM_DB || !env.ROOM_MEDIA) fail('Document storage is not configured.', 503);
 if(readyDb===env.ROOM_DB)return;
 // New tables only. The same idempotent statements are included in migration 0009.
 await env.ROOM_DB.batch(SCHEMA.map(sql => env.ROOM_DB.prepare(sql)));
 readyDb=env.ROOM_DB;
}
export async function manager(request, env) {
 const p = await permissionFor(request, env, 'client');
 if (!p) fail('Sign in to the Client Room Manager to continue.', 401);
 return p.manager;
}
export async function documentById(env, documentId) {
 const d = await env.ROOM_DB.prepare("SELECT * FROM room_signing_documents WHERE id=? AND room_id='client'").bind(documentId || '').first();
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
  env.ROOM_DB.prepare('SELECT actor,action,created_at FROM room_signing_events WHERE document_id=? ORDER BY created_at DESC,rowid DESC LIMIT 100').bind(d.id)
 ]);
 const parties = result[0].results || [], fields = result[1].results || [];
 const signed = parties.filter(p => p.signed_at).length;
 return {
  document: { id:d.id,title:d.title,filename:d.filename,total_bytes:d.total_bytes,pages:JSON.parse(d.pages_json),file_ready:!!d.file_ready,status:d.status==='cancelled'?'cancelled':parties.length && signed===parties.length?'completed':d.status,revision:d.revision,created_at:d.created_at,updated_at:d.updated_at },
  parties: parties.map(p => auth.manager ? p : {id:p.id,name:p.name,kind:p.kind,signed_at:p.signed_at,revision:p.id===auth.party.id?p.revision:undefined}),
  fields: fields.map(f => { const party = parties.find(p=>p.id===f.party_id); const visible = auth.manager || f.party_id===auth.party.id || party?.signed_at; const {signature_key,...rest}=f; return {...rest,has_signature:!!signature_key&&!!visible,signature_url:signature_key&&visible?'/api/room-management/signing-file?document='+d.id+'&signature='+f.id+'&v='+party.revision:null}; }),
  current_party_id: auth.party?.id || (auth.manager?.id===d.created_by?parties.find(p=>p.kind==='owner')?.id:null),
  events: auth.manager ? result[2].results || [] : []
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
function pngBytes(data) {
 if (typeof data!=='string' || !data.startsWith('data:image/png;base64,') || data.length>3e6) fail('Use a PNG signature image.');
 let bytes; try { bytes=Uint8Array.from(atob(data.slice(22)),c=>c.charCodeAt(0)); } catch { fail('The signature image could not be read.'); }
 if(bytes.length<45||bytes[0]!==137||String.fromCharCode(...bytes.slice(1,8))!=='PNG\r\n\x1a\n'||String.fromCharCode(...bytes.slice(12,16))!=='IHDR')fail('The signature image is invalid.');
 const view=new DataView(bytes.buffer),w=view.getUint32(16),h=view.getUint32(20);
 if(!w||!h||w>2400||h>1200)fail('The signature image dimensions are invalid.');
 return bytes;
}
export async function saveSignature(request,env,d,auth,body) {
 if(d.status==='cancelled'||!d.file_ready)fail('This document is not available for signing.',409);
 const p=await env.ROOM_DB.prepare('SELECT * FROM room_signing_parties WHERE id=? AND document_id=?').bind(body.party_id||'',d.id).first();
 if(!p || (auth.manager ? p.kind!=='owner'||auth.manager.id!==d.created_by : p.id!==auth.party.id||p.link_version!==auth.party.link_version||p.revoked_at))fail('You can sign only your own signature areas.',403);
 if(p.signed_at)fail('Your submitted signature is locked.',409);
 if(p.revision!==body.revision)fail('Your signature changed in another window. Reload before continuing.',409);
 const fields=(await env.ROOM_DB.prepare('SELECT * FROM room_signing_fields WHERE party_id=? AND document_id=?').bind(p.id,d.id).all()).results||[];
 if(!fields.length)fail('Add at least one signature area for this signer.');
 const changes=Array.isArray(body.signatures)?body.signatures:[];
 const pending=new Map();
 for(const s of changes){if(!fields.some(f=>f.id===s.field_id)||pending.has(s.field_id))fail('Invalid signature area.');pending.set(s.field_id,s.png===null?null:pngBytes(s.png));}
 if(body.confirm && body.consent!==true)fail('Confirm that these are your signatures before finishing.');
 if(body.confirm && fields.some(f=>pending.has(f.id)?!pending.get(f.id):!f.signature_key))fail('Complete every signature area before finishing.');
 const token=id(),keys=[];
 try {
  for(const [fieldId,bytes] of pending){if(bytes){const key='signing/'+d.id+'/signatures/'+id()+'.png';await env.ROOM_MEDIA.put(key,bytes,{httpMetadata:{contentType:'image/png'}});keys.push([fieldId,key]);}else keys.push([fieldId,null]);}
  const statements=[env.ROOM_DB.prepare(`UPDATE room_signing_parties SET revision=revision+1,edit_token=?,signed_at=CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE signed_at END WHERE id=? AND document_id=? AND revision=? AND signed_at IS NULL AND (? OR (link_version=? AND revoked_at IS NULL)) AND EXISTS(SELECT 1 FROM room_signing_documents WHERE id=? AND status<>'cancelled' AND revision=?)`).bind(token,body.confirm?1:0,p.id,d.id,body.revision,auth.manager?1:0,auth.party?.link_version||0,d.id,d.revision)];
  for(const [fieldId,key] of keys)statements.push(env.ROOM_DB.prepare('UPDATE room_signing_fields SET signature_key=? WHERE id=? AND party_id=? AND EXISTS(SELECT 1 FROM room_signing_parties WHERE id=? AND edit_token=?)').bind(key,fieldId,p.id,p.id,token));
  statements.push(env.ROOM_DB.prepare("UPDATE room_signing_documents SET status=CASE WHEN ? THEN 'in_progress' ELSE status END,updated_at=CURRENT_TIMESTAMP WHERE id=? AND EXISTS(SELECT 1 FROM room_signing_parties WHERE id=? AND edit_token=?)").bind(body.confirm?1:0,d.id,p.id,token));
  statements.push(env.ROOM_DB.prepare('INSERT INTO room_signing_events(id,document_id,party_id,actor,action) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM room_signing_parties WHERE id=? AND edit_token=?)').bind(id(),d.id,p.id,p.name,body.confirm?'Signature confirmed':'Signature draft saved',p.id,token));
  const result=await env.ROOM_DB.batch(statements);if(!result[0].meta.changes)fail('The document changed while saving. Reload and try again.',409);
 } catch(e) { await Promise.all(keys.filter(x=>x[1]).map(x=>env.ROOM_MEDIA.delete(x[1]).catch(()=>{})));throw e; }
 return snapshot(env,await documentById(env,d.id),auth);
}
export async function handleError(fn) { try{return await fn();}catch(e){if(!e.status)console.error('document signing',String(e));return json({error:e.status?e.message:'The document operation failed. Please try again.'},e.status||500);} }
