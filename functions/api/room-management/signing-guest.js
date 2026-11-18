import {schema,json,fail,secret,hash,codeHash,sameOrigin,guest,documentById,snapshot,saveSignature,approveDocumentText,event,handleError} from './_signing.js';
export async function onRequest({request,env}) {return handleError(async()=>{
 await schema(env);const url=new URL(request.url),action=url.searchParams.get('action')||'';
 if(request.method!=='GET')sameOrigin(request);
 if(request.method==='POST'&&action==='access'){
  const b=await request.json();if(typeof b.token!=='string'||!/^[a-f0-9]{64}$/.test(b.token))fail('This signing link is invalid.',404);
  const linkHash=await hash(b.token),p=await env.ROOM_DB.prepare('SELECT * FROM room_signing_parties WHERE link_hash=? AND revoked_at IS NULL').bind(linkHash).first();if(!p)fail('This signing link is no longer available.',404);
  const d=await documentById(env,p.document_id);if(d.status==='cancelled')fail('This signing request was cancelled.',410);
  if(!d.file_ready)fail('This document is not ready yet.',409);
  if(p.code_hash){
   if(b.code==null||b.code==='')return json({requires_code:true,signer_name:p.name});
   const now=Math.floor(Date.now()/1000),ip=await hash(linkHash+'|'+(request.headers.get('cf-connecting-ip')||'unknown'));
   const keys=[ip,linkHash],rows=await env.ROOM_DB.batch(keys.map(k=>env.ROOM_DB.prepare('SELECT * FROM room_signing_throttle WHERE throttle_key=?').bind(k)));
   const states=rows.map(r=>r.results?.[0]);const blocked=Math.max(...states.map(r=>Number(r?.blocked_until)||0));
   if(blocked>now)return json({error:'Too many incorrect codes. Please try again in 15 minutes.'},429,{'retry-after':String(blocked-now)});
   const matches=/^\d{6}$/.test(String(b.code))&&await codeHash(String(b.code),p.code_salt)===p.code_hash;
   if(!matches){
    await env.ROOM_DB.batch(keys.map((key,i)=>env.ROOM_DB.prepare(`INSERT INTO room_signing_throttle(throttle_key,attempts,blocked_until,window_started) VALUES(?,1,0,?) ON CONFLICT(throttle_key) DO UPDATE SET attempts=CASE WHEN window_started<? THEN 1 ELSE attempts+1 END,blocked_until=CASE WHEN window_started<? THEN 0 WHEN attempts+1>=? THEN ? ELSE blocked_until END,window_started=CASE WHEN window_started<? THEN ? ELSE window_started END`).bind(key,now,now-900,now-900,i?20:5,now+900,now-900,now)));fail('That access code is incorrect.',403);
   }
   await env.ROOM_DB.batch(keys.map(k=>env.ROOM_DB.prepare('DELETE FROM room_signing_throttle WHERE throttle_key=?').bind(k)));
  }
  const token=secret();await env.ROOM_DB.prepare('INSERT INTO room_signing_sessions(token_hash,party_id,link_version,expires_at) VALUES(?,?,?,?)').bind(await hash(token),p.id,p.link_version,Math.floor(Date.now()/1000)+43200).run();
  await env.ROOM_DB.prepare('DELETE FROM room_signing_sessions WHERE expires_at<?').bind(Math.floor(Date.now()/1000)).run();
  await event(env,d.id,p.id,p.name,'Signing document opened');return json({session:token,...await snapshot(env,d,{party:p,manager:null})});
 }
 const p=await guest(request,env),d=await documentById(env,p.document_id);if(d.status==='cancelled')fail('This signing request was cancelled.',410);
 const auth={manager:null,party:p};if(request.method==='GET')return json(await snapshot(env,d,auth));
 if(request.method==='POST'&&action==='approve-text')return json(await approveDocumentText(env,d,auth,await request.json()));
 if(request.method==='POST'&&action==='signature')return json(await saveSignature(request,env,d,auth,await request.json()));
 fail('Method not allowed.',405);
 });}
