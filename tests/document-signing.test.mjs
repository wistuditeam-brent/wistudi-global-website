import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import vm from 'node:vm';
import {deflateSync} from 'node:zlib';
import {harness,root} from './signing-runtime/harness.mjs';
const require=createRequire(new URL('./signing-runtime/package.json',import.meta.url));
const {PDFDocument,PDFName,PageSizes,degrees}=require('pdf-lib');
function png(red,green,blue){
 const crc=bytes=>{let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^(c&1?0xedb88320:0);}return (c^0xffffffff)>>>0;};
 const chunk=(type,data)=>{const t=Buffer.from(type),body=Buffer.concat([t,data]),length=Buffer.alloc(4),sum=Buffer.alloc(4);length.writeUInt32BE(data.length);sum.writeUInt32BE(crc(body));return Buffer.concat([length,body,sum]);};
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(3,0);ihdr.writeUInt32BE(1,4);ihdr[8]=8;ihdr[9]=6;
 return 'data:image/png;base64,'+Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(Buffer.from([0,red,green,blue,255,red,green,blue,255,red,green,blue,255]))),chunk('IEND',Buffer.alloc(0))]).toString('base64');
}
const signature=png(30,10,80);
test('private PDF signing, A4 geometry, large uploads and final export',async t=>{
 const h=await harness();t.after(()=>h.close());
 const pdf=await PDFDocument.create();pdf.addPage(PageSizes.A4).drawText('A4 portrait original text',{x:35,y:780});pdf.addPage([PageSizes.A4[1],PageSizes.A4[0]]).drawText('A4 landscape original text',{x:35,y:540});const rotated=pdf.addPage(PageSizes.A4);rotated.setRotation(degrees(90));rotated.setCropBox(20,30,550,760);
 // A real uncompressed PDF stream makes this larger than the previous 30 MB cap.
 const payload=pdf.context.register(pdf.context.stream(new Uint8Array(31*1024*1024).fill(65)));pdf.catalog.set(PDFName.of('LargeUploadTest'),payload);
 const bytes=await pdf.save({useObjectStreams:false});assert.ok(bytes.length>30e6);
 const pages=[{width:595.28,height:841.89,transform:[1,0,0,-1,0,841.89]},{width:841.89,height:595.28,transform:[1,0,0,-1,0,595.28]},{width:760,height:550,transform:[0,1,1,0,-30,-20]}];
 let d,owner,p2,p3,fields,link2,link3,session2,session3;
 await t.test('requires manager login and blocks cross-origin writes',async()=>{
  assert.equal((await h.request('signing',{as:'guest'})).status,401);
  assert.equal((await h.request('signing?action=create',{method:'POST',body:{},origin:'https://attacker.test'})).status,403);
 });
 await t.test('uploads a PDF above 30 MB without buffering it in the Worker',async()=>{
  const created=await h.json('signing?action=create',{method:'POST',body:{title:'A4 signing test',owner_name:'Admin Owner',filename:'agreement-a4.pdf',size:bytes.length,pages}});assert.equal(created.status,201,JSON.stringify(created.body));d=created.body.id;
  for(let part=0;part<Math.ceil(bytes.length/created.body.chunk_size);part++){const r=await h.json('signing-upload?document='+d+'&part='+part,{method:'PUT',body:bytes.slice(part*created.body.chunk_size,(part+1)*created.body.chunk_size)});assert.equal(r.status,200,JSON.stringify(r.body));}
  assert.equal((await h.json('signing-upload?document='+d+'&action=complete',{method:'POST',body:{}})).status,200);
  assert.equal((await h.request('signing-upload?document='+d+'&part=0',{method:'PUT',body:bytes.slice(0,created.body.chunk_size)})).status,409);
  const first=created.body.chunk_size-4,last=first+12,r=await h.request('signing-file?document='+d,{headers:{range:`bytes=${first}-${last}`}});assert.equal(r.status,206);assert.deepEqual(new Uint8Array(await r.arrayBuffer()),bytes.slice(first,last+1));
  assert.equal((await h.request('signing-file?document='+d,{as:'guest'})).status,401);
  assert.equal((await h.request('signing-file?document='+d,{headers:{range:'bytes=999999999999-'}})).status,416);
  const suffix=await h.request('signing-file?document='+d,{headers:{range:'bytes=-8'}});assert.deepEqual(new Uint8Array(await suffix.arrayBuffer()),bytes.slice(-8));
 });
 await t.test('prepares three signers and rejects stale or cross-document layouts',async()=>{
  let s=(await h.json('signing?document='+d)).body;owner=s.parties[0];p2={id:randomUUID(),name:'Client Signer',email:'client@example.test'};p3={id:randomUUID(),name:'Second Signer',email:''};
  fields=[{id:randomUUID(),party_id:owner.id,page:1,x:.1,y:.7,width:.3,height:.08},{id:randomUUID(),party_id:p2.id,page:2,x:.2,y:.6,width:.3,height:.1},{id:randomUUID(),party_id:p3.id,page:3,x:.2,y:.6,width:.3,height:.1}];
  const body={revision:s.document.revision,parties:[owner,p2,p3],fields};const saved=await h.json('signing?document='+d+'&action=layout',{method:'POST',body});assert.equal(saved.status,200,JSON.stringify(saved.body));assert.equal(saved.body.fields.length,3);
  assert.equal((await h.request('signing?document='+d+'&action=layout',{method:'POST',body})).status,409);
  const other=await h.json('signing?action=create',{method:'POST',body:{title:'Other',filename:'other.pdf',size:bytes.length,pages}});
  const cross=await h.json('signing?document='+other.body.id+'&action=layout',{method:'POST',body:{revision:0,parties:[owner],fields}});assert.equal(cross.status,400);
 });
 await t.test('saves and confirms the owner signature, preserving it and locking the layout',async()=>{
  let s=(await h.json('signing?document='+d)).body;owner=s.parties.find(p=>p.kind==='owner');
  let result=await h.json('signing?document='+d+'&action=signature',{method:'POST',body:{party_id:owner.id,revision:owner.revision,signatures:[{field_id:fields[0].id,png:signature}]}});assert.equal(result.status,200,JSON.stringify(result.body));assert.equal(result.body.parties.find(p=>p.id===owner.id).signed_at,null);
  owner=result.body.parties.find(p=>p.id===owner.id);result=await h.json('signing?document='+d+'&action=signature',{method:'POST',body:{party_id:owner.id,revision:owner.revision,signatures:[],confirm:true,consent:true}});assert.equal(result.status,200,JSON.stringify(result.body));assert.ok(result.body.parties.find(p=>p.id===owner.id).signed_at);
  assert.equal((await h.request('signing?document='+d+'&action=signature',{method:'POST',body:{party_id:owner.id,revision:owner.revision+1,signatures:[{field_id:fields[0].id,png:null}]}})).status,409);
  assert.equal((await h.request('signing?document='+d+'&action=layout',{method:'POST',body:{}})).status,409);
 });
 await t.test('uses a six-digit code, rate limits guesses, and accepts account-free access',async()=>{
  const share=await h.json('signing?document='+d+'&action=share',{method:'POST',body:{party_id:p2.id,code:'012345'}});assert.equal(share.status,200,JSON.stringify(share.body));link2=new URLSearchParams(new URL(share.body.url).hash.slice(1)).get('token');
  const gate=await h.json('signing-guest?action=access',{method:'POST',as:'guest',body:{token:link2}});assert.deepEqual(gate.body,{requires_code:true,signer_name:'Client Signer'});
  for(let i=0;i<5;i++)assert.equal((await h.request('signing-guest?action=access',{method:'POST',as:'guest',body:{token:link2,code:'999999'}})).status,403);
  assert.equal((await h.request('signing-guest?action=access',{method:'POST',as:'guest',body:{token:link2,code:'012345'}})).status,429);
  await h.db.prepare('DELETE FROM room_signing_throttle').run();
  const opened=await h.json('signing-guest?action=access',{method:'POST',as:'guest',body:{token:link2,code:'012345'}});assert.equal(opened.status,200,JSON.stringify(opened.body));session2=opened.body.session;assert.ok(opened.body.fields.find(f=>f.id===fields[0].id).has_signature);assert.ok(!('email' in opened.body.parties[0]));
  const share3=await h.json('signing?document='+d+'&action=share',{method:'POST',body:{party_id:p3.id}});assert.equal(share3.status,200);link3=new URLSearchParams(new URL(share3.body.url).hash.slice(1)).get('token');const opened3=await h.json('signing-guest?action=access',{method:'POST',as:'guest',body:{token:link3}});session3=opened3.body.session;assert.ok(session3);
  assert.equal((await h.request('signing?document='+d,{as:'guest',token:session2})).status,401);
  assert.equal((await h.request('signing-guest?action=signature',{method:'POST',as:'guest',token:session2,body:{party_id:owner.id,revision:0,signatures:[]}})).status,403);
 });
 await t.test('concurrent signers cannot erase one another or modify another signer',async()=>{
  const before=(await h.json('signing-guest',{as:'guest',token:session2})).body;
  const bad=await h.json('signing-guest?action=signature',{method:'POST',as:'guest',token:session2,body:{party_id:p2.id,revision:before.parties.find(p=>p.id===p2.id).revision,signatures:[{field_id:fields[0].id,png:signature}]}});assert.equal(bad.status,400);
  const save=async(party,field,token)=>{const current=(await h.json('signing-guest',{as:'guest',token})).body;return h.json('signing-guest?action=signature',{method:'POST',as:'guest',token,body:{party_id:party.id,revision:current.parties.find(p=>p.id===party.id).revision,signatures:[{field_id:field.id,png:signature}],confirm:true,consent:true}});};
  const results=await Promise.all([save(p2,fields[1],session2),save(p3,fields[2],session3)]);for(const r of results)assert.equal(r.status,200,JSON.stringify(r.body));
  const after=(await h.json('signing?document='+d)).body;assert.equal(after.document.status,'completed');assert.equal(after.parties.filter(p=>p.signed_at).length,3);assert.equal(after.fields.filter(f=>f.has_signature).length,3);
 });
 await t.test('exports all signatures while retaining A4 sizes, crop boxes and page rotation',async()=>{
  const data=(await h.json('signing?document='+d)).body;let output;
  const context=vm.createContext({console,Uint8Array,ArrayBuffer,DataView,TextEncoder,TextDecoder,setTimeout,clearTimeout,fetch:async path=>h.request(path.replace('/api/room-management/','')),self:{postMessage:m=>{if(m.error)throw Error(m.error);if(m.bytes)output=m.bytes;}}});
  context.importScripts=()=>vm.runInContext(vendor,context);const vendor=await readFile(root+'document-signing/vendor/pdf-lib.min.js','utf8');vm.runInContext(await readFile(root+'document-signing/export-worker.js','utf8'),context);await context.self.onmessage({data:{document:data.document,fields:data.fields,headers:{}}});assert.ok(output);
  const signed=await PDFDocument.load(output);assert.equal(signed.getPageCount(),3);assert.ok(Math.abs(signed.getPage(0).getWidth()-PageSizes.A4[0])<.01);assert.ok(Math.abs(signed.getPage(1).getWidth()-PageSizes.A4[1])<.01);assert.equal(signed.getPage(2).getRotation().angle,90);assert.equal(signed.getPage(2).getCropBox().x,20);
  for(const page of signed.getPages())assert.equal(page.node.Resources().lookup(PDFName.of('XObject')).keys().length,1);
 });
 await t.test('revoking a link invalidates active guest sessions without removing signatures',async()=>{
  assert.equal((await h.request('signing?document='+d+'&action=revoke',{method:'POST',body:{party_id:p2.id}})).status,200);
  assert.equal((await h.request('signing-guest',{as:'guest',token:session2})).status,401);
  assert.equal((await h.request('signing-guest?action=access',{method:'POST',as:'guest',body:{token:link2,code:'012345'}})).status,404);
  const s=(await h.json('signing?document='+d)).body;assert.equal(s.fields.filter(f=>f.has_signature).length,3);
  assert.equal((await h.request('signing?document='+d+'&action=cancel',{method:'POST',body:{}})).status,409);assert.equal((await h.request('signing-guest',{as:'guest',token:session3})).status,200);
 });
});


test('preparer-only agreements, individual placement, shared history and archive protection',async t=>{
 const h=await harness();t.after(()=>h.close());
 const pdf=await PDFDocument.create();pdf.addPage(PageSizes.A4);const bytes=await pdf.save();
 const pages=[{width:595.28,height:841.89,transform:[1,0,0,-1,0,841.89]}];
 async function create(title){const r=await h.json('signing?action=create',{method:'POST',body:{title,filename:'test-only.pdf',size:bytes.length,pages,owner_signs:false}});assert.equal(r.status,201);await h.request('signing-upload?document='+r.body.id+'&part=0',{method:'PUT',body:bytes});await h.request('signing-upload?document='+r.body.id+'&action=complete',{method:'POST',body:{}});return r.body.id;}
 const d=await create('Preparer only');let data=(await h.json('signing?document='+d)).body;
 assert.equal(data.parties.length,0);assert.equal(data.current_party_id,null);
 const parties=['Party A Test','Party B Test'].map(name=>({id:randomUUID(),name,email:'',kind:'signer'}));
 let result=await h.json('signing?document='+d+'&action=layout',{method:'POST',body:{revision:0,title:'MOU Test',owner_signs:false,parties,fields:[]}});assert.equal(result.status,200,JSON.stringify(result.body));assert.equal(result.body.document.title,'MOU Test');assert.equal(result.body.current_party_id,null);
 const sessions=[];
 for(const [index,p] of parties.entries()){
  const share=await h.json('signing?document='+d+'&action=share',{method:'POST',body:{party_id:p.id,code:'23456'+index}});assert.equal(share.status,200,JSON.stringify(share.body));
  const token=new URLSearchParams(new URL(share.body.url).hash.slice(1)).get('token');const access=await h.json('signing-guest?action=access',{method:'POST',as:'guest',body:{token,code:'23456'+index}});assert.equal(access.status,200);sessions.push(access.body.session);
 }
 assert.notEqual(sessions[0],sessions[1]);
 assert.equal((await h.request('signing?document='+d+'&action=delete',{method:'POST',body:{}})).status,409);
 const fields=[];
 for(const [index,p] of parties.entries()){
  const current=(await h.json('signing-guest',{as:'guest',token:sessions[index]})).body;
  assert.equal(current.events.filter(e=>e.action==='Signing link created').length,2);assert.ok(current.events.every(e=>e.actor!=='admin@example.test'));
  const f={id:randomUUID(),party_id:p.id,page:1,x:.1+index*.4,y:.7,width:.3,height:.08};fields.push(f);
  let saved=await h.json('signing-guest?action=signature',{method:'POST',as:'guest',token:sessions[index],body:{party_id:p.id,revision:current.parties.find(x=>x.id===p.id).revision,positions:[f],signatures:[{field_id:f.id,png:signature}]}});assert.equal(saved.status,200,JSON.stringify(saved.body));
  f.y=.75;
  saved=await h.json('signing-guest?action=signature',{method:'POST',as:'guest',token:sessions[index],body:{party_id:p.id,revision:saved.body.parties.find(x=>x.id===p.id).revision,positions:[f],confirm:true,consent:true}});assert.equal(saved.status,200,JSON.stringify(saved.body));assert.equal(saved.body.fields.find(x=>x.id===f.id).y,.75);
  assert.equal((await h.request('signing-guest?action=signature',{method:'POST',as:'guest',token:sessions[index],body:{party_id:p.id,revision:saved.body.parties.find(x=>x.id===p.id).revision,positions:[{...f,y:.1}]}})).status,409);
 }
 data=(await h.json('signing?document='+d)).body;assert.equal(data.document.status,'completed');assert.equal(data.events.filter(e=>e.action==='Signature confirmed'&&e.created_at).length,2);assert.equal(data.fields.filter(f=>f.has_signature).length,2);
 assert.equal((await h.request('signing?document='+d+'&action=delete',{method:'POST',body:{}})).status,409);
 assert.equal((await h.request('signing?document='+d+'&action=archive',{method:'POST',body:{}})).status,200);
 assert.ok(!(await h.json('signing')).body.items.some(x=>x.id===d));assert.ok((await h.json('signing?archived=1')).body.items.some(x=>x.id===d));
 const guest=(await h.json('signing-guest',{as:'guest',token:sessions[0]})).body;assert.equal(guest.document.status,'completed');assert.equal(guest.fields.filter(f=>f.has_signature).length,2);assert.equal(guest.events.filter(e=>e.action==='Signature confirmed').length,2);
 assert.equal((await h.request('signing?document='+d+'&action=restore',{method:'POST',body:{}})).status,200);assert.ok((await h.json('signing')).body.items.some(x=>x.id===d));
 const draft=await create('Disposable draft');assert.equal((await h.request('signing?document='+draft+'&action=delete',{method:'POST',body:{}})).status,200);assert.equal((await h.request('signing?document='+draft)).status,404);assert.equal((await h.request('signing-file?document='+draft)).status,404);assert.ok(!(await h.json('signing')).body.items.some(x=>x.id===draft));
});
