import * as pdfjs from './vendor/pdf.min.mjs';
pdfjs.GlobalWorkerOptions.workerSrc='/document-signing/vendor/pdf.worker.min.mjs';

const $=id=>document.getElementById(id),admin=document.body.dataset.mode==='manager';
const API='/api/room-management/',state={data:null,pdf:null,page:1,renderTask:null,renderSerial:0,layoutDirty:false,signatures:new Map(),images:new Map(),placing:null,selected:null,session:null,upload:null,busy:false};
const linkToken=new URLSearchParams(location.hash.slice(1)).get('token');
let selectedSignature=null,signatureMode='draw',uploadedSignature=null,strokes=[],stroke=null,shareParty=null;
const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const button=(text,cls,fn)=>{const n=node('button',cls,text);n.type='button';n.onclick=fn;return n;};
const status=(text,error=false)=>{const el=$('globalStatus');el.textContent=text||'';el.style.color=error?'#a83349':'';};
const signedParty=p=>!!p?.signed_at;
const editable=()=>admin&&state.data?.document.status==='draft';
const ownParty=()=>state.data?.parties.find(p=>p.id===state.data.current_party_id)||{id:null};
const ownFields=()=>state.data?.fields.filter(f=>f.party_id===state.data.current_party_id)||[];
const authHeaders=()=>state.session?{authorization:'Bearer '+state.session}:{};
const sourceUrl=()=>API+'signing-file?document='+state.data.document.id;
const sizeLabel=bytes=>bytes<1e6?Math.round(bytes/1000)+' KB':bytes<1e9?(bytes/1e6).toFixed(1)+' MB':(bytes/1e9).toFixed(2)+' GB';
const dirty=()=>state.layoutDirty||state.signatures.size>0;
function markDirty(){state.layoutDirty=true;updateToolbar();}
function updateToolbar(){
 if(!state.data)return;
 const d=state.data.document,p=ownParty(),signed=state.data.parties.filter(signedParty).length;
 $('workTitle').textContent=d.title;
 $('workMeta').textContent=d.pages.length+' page'+(d.pages.length===1?'':'s')+' · '+sizeLabel(d.total_bytes)+' · '+signed+' of '+state.data.parties.length+' signed'+(d.status==='cancelled'?' · Cancelled':'');
 if(admin){$('saveLayout').hidden=!editable();$('saveLayout').textContent=state.layoutDirty?'Save preparation •':'Save preparation';}
 $('saveDraft').hidden=!p.id||signedParty(p)||d.status==='cancelled';$('saveDraft').textContent=state.signatures.size?'Save draft •':'Save draft';
 $('downloadPdf').disabled=state.busy;
}
async function api(path,{method='GET',body,headers={}}={}){
 const response=await fetch(API+path,{method,credentials:'same-origin',cache:'no-store',headers:{...authHeaders(),...(body!==undefined&&!(body instanceof Blob)?{'content-type':'application/json'}:{}),...headers},body:body===undefined?undefined:body instanceof Blob?body:JSON.stringify(body)});
 const data=await response.json().catch(()=>({error:'The server returned an unreadable response.'}));
 if(!response.ok)throw Object.assign(new Error(data.error||'The request failed.'),{status:response.status});return data;
}
async function run(fn){try{await fn();}catch(e){status(e.message,true);}}
function setSnapshot(data){state.data=data;updateToolbar();renderSidebar();renderFields();}
async function loadList(){
 $('workbench').hidden=true;$('dashboard').hidden=false;
 const {items}=await api('signing');const host=$('documentList');host.replaceChildren();
 if(!items.length){const empty=node('div','card empty');empty.append(node('div','empty-icon','PDF'),node('h2','','Your agreements, all in one place'),node('p','','Upload a PDF to prepare signature areas and share a private signing link.'),button('Upload your first PDF','',()=>showUpload()));host.append(empty);return;}
 for(const d of items){
  const row=node('article','document-row'),details=node('div'),actions=node('div','row-actions');details.append(node('h3','',d.title),node('div','meta',d.filename+' · '+sizeLabel(d.total_bytes)+' · '+new Date(d.created_at+'Z').toLocaleDateString()));
  const complete=d.signers>0&&d.signed===d.signers,label=!d.file_ready?'Upload incomplete':d.status==='cancelled'?'Cancelled':complete?'Completed':d.status==='draft'?'Draft':d.signed+' of '+d.signers+' signed';
  actions.append(node('span','badge'+(complete?' green':d.status==='cancelled'?' grey':''),label),button(d.file_ready?'Open document':'Resume upload','secondary',()=>run(()=>d.file_ready?openDocument(d.id):resumeUpload(d))));row.append(node('div','pdf-icon','PDF'),details,actions);host.append(row);
 }
}
function showUpload(){ $('uploadCard').hidden=false;$('pdfUpload').required=true;$('documentTitle').disabled=false;$('ownerName').disabled=false;state.upload=null;$('uploadSubmit').textContent='Upload & prepare';$('uploadStatus').textContent='';$('uploadCard').scrollIntoView({behavior:'smooth'}); }
function resumeUpload(d){showUpload();state.upload={id:d.id,size:d.total_bytes,filename:d.filename};$('documentTitle').value=d.title;$('documentTitle').disabled=true;$('ownerName').disabled=true;$('uploadSubmit').textContent='Resume PDF upload';$('uploadStatus').textContent='Select the same original PDF ('+d.filename+') to resume.';}
async function readPdf(file){
 // PDF.js reads only requested slices; a large upload is never read entirely
 // into memory just to inspect page sizes.
 const transport=new pdfjs.PDFDataRangeTransport(file.size,new Uint8Array(await file.slice(0,65536).arrayBuffer()),false,file.name);
 transport.requestDataRange=(begin,end)=>{file.slice(begin,end).arrayBuffer().then(b=>transport.onDataRange(begin,new Uint8Array(b))).catch(()=>transport.abort());};
 const pdf=await pdfjs.getDocument({range:transport,length:file.size,disableAutoFetch:true,disableStream:true,isEvalSupported:false}).promise;
 try{const pages=[];for(let n=1;n<=pdf.numPages;n++){const page=await pdf.getPage(n),v=page.getViewport({scale:1});pages.push({width:v.width,height:v.height,transform:v.transform});page.cleanup();}return pages;}finally{await pdf.destroy();}
}
async function uploadPdf(event){
 event.preventDefault();const file=$('pdfUpload').files[0];if(!file)return;
 $('uploadSubmit').disabled=true;$('uploadCancel').disabled=true;$('uploadProgress').hidden=false;
 try{
  const header=new TextDecoder().decode(await file.slice(0,5).arrayBuffer());if(header!=='%PDF-')throw Error('Choose a valid PDF file.');
  let upload=state.upload;
  if(upload&&(upload.size!==file.size||upload.filename!==file.name))throw Error('Choose the same PDF filename and size to resume this upload.');
  if(!upload){$('uploadStatus').textContent='Reading PDF page sizes…';const pages=await readPdf(file);upload=await api('signing?action=create',{method:'POST',body:{title:$('documentTitle').value,owner_name:$('ownerName').value,filename:file.name,size:file.size,pages}});state.upload={...upload,size:file.size,filename:file.name};}
  const progress=await api('signing-upload?document='+upload.id),done=new Set(progress.parts),count=Math.ceil(file.size/progress.chunk_size);
  if(progress.file_ready){state.upload=null;$('uploadCard').hidden=true;await openDocument(upload.id);return;}
  for(let part=0;part<count;part++){
   if(!done.has(part)){
    const chunk=file.slice(part*progress.chunk_size,Math.min(file.size,(part+1)*progress.chunk_size));
    let error,ok=false;for(let attempt=0;attempt<3;attempt++){try{await api('signing-upload?document='+upload.id+'&part='+part,{method:'PUT',body:chunk,headers:{'content-type':'application/octet-stream'}});ok=true;break;}catch(e){error=e;if(e.status===401)break;if(attempt<2)await new Promise(resolve=>setTimeout(resolve,800*(attempt+1)));}}if(!ok)throw error;
   }
   const percent=Math.round((part+1)/count*100);$('uploadProgress').firstElementChild.style.width=percent+'%';$('uploadStatus').textContent='Uploading PDF… '+percent+'%';
  }
  await api('signing-upload?document='+upload.id+'&action=complete',{method:'POST',body:{}});state.upload=null;$('uploadCard').hidden=true;await openDocument(upload.id);status('PDF uploaded. Add your signers and place signature areas.');
 }catch(e){$('uploadStatus').textContent=e.message+(state.upload?' Select this PDF again and resume the upload.':'');status(e.message,true);}finally{$('uploadSubmit').disabled=false;$('uploadCancel').disabled=false;}
}
async function openDocument(documentId){
 const data=await api('signing?document='+documentId);state.page=1;state.layoutDirty=false;state.signatures.clear();setSnapshot(data);
 $('dashboard').hidden=true;$('workbench').hidden=false;history.replaceState(null,'','?document='+documentId);await loadViewer();status('');
}
async function loadViewer(){
 if(state.renderTask){state.renderTask.cancel();state.renderTask=null;}
 if(state.pdf)await state.pdf.destroy();
 $('pageLoading').hidden=false;
 state.pdf=await pdfjs.getDocument({url:sourceUrl(),httpHeaders:authHeaders(),withCredentials:true,disableAutoFetch:true,disableStream:true,isEvalSupported:false}).promise;
 if(state.pdf.numPages!==state.data.document.pages.length)throw Error('The PDF page information does not match the document.');
 $('pageNumber').max=state.pdf.numPages;$('pageTotal').textContent='/ '+state.pdf.numPages;await renderPage();
}
async function renderPage(){
 if(!state.pdf)return;const serial=++state.renderSerial;
 if(state.renderTask){state.renderTask.cancel();state.renderTask=null;}
 $('pageLoading').hidden=false;
 const page=await state.pdf.getPage(state.page);if(serial!==state.renderSerial)return;
 const base=page.getViewport({scale:1}),available=Math.max(160,$('pdfScroll').clientWidth-(innerWidth<650?30:60));
 const scale=$('zoom').value==='fit'?available/base.width:Number($('zoom').value),viewport=page.getViewport({scale});
 const wrap=$('pageWrap');wrap.style.width=viewport.width+'px';wrap.style.height=viewport.height+'px';
 const canvas=$('pdfCanvas'),ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.ceil(viewport.width*ratio);canvas.height=Math.ceil(viewport.height*ratio);
 canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';
 $('pageNumber').value=state.page;$('prevPage').disabled=state.page<=1;$('nextPage').disabled=state.page>=state.pdf.numPages;
 const a4=(Math.abs(base.width-595.28)<3&&Math.abs(base.height-841.89)<3)||(Math.abs(base.height-595.28)<3&&Math.abs(base.width-841.89)<3);
 $('pageSize').textContent=a4?'A4 '+(base.width>base.height?'landscape':'portrait'):Math.round(base.width/72*25.4)+' × '+Math.round(base.height/72*25.4)+' mm';
 renderFields();
 try{state.renderTask=page.render({canvasContext:canvas.getContext('2d'),viewport,transform:ratio!==1?[ratio,0,0,ratio,0,0]:null});await state.renderTask.promise;}catch(e){if(e.name!=='RenderingCancelledException')throw e;}finally{if(serial===state.renderSerial){state.renderTask=null;$('pageLoading').hidden=true;}}
}
async function jumpTo(page){state.page=Math.max(1,Math.min(state.pdf.numPages,Number(page)||1));await renderPage();$('pdfScroll').scrollTop=0;}
async function signatureImage(f,img){
 const pending=state.signatures.get(f.id);if(pending){img.src=pending;return;}if(pending===null)return;
 if(!f.signature_url)return;
 try{let url=state.images.get(f.signature_url);if(!url){const r=await fetch(f.signature_url,{headers:authHeaders(),credentials:'same-origin',cache:'no-store'});if(!r.ok)throw Error('Signature preview unavailable');url=URL.createObjectURL(await r.blob());state.images.set(f.signature_url,url);}img.src=url;}catch(e){status(e.message,true);}
}
function hasSignature(f){return state.signatures.has(f.id)?!!state.signatures.get(f.id):f.has_signature;}
function renderFields(){
 if(!state.data)return;const layer=$('fieldLayer');layer.replaceChildren();
 for(const f of state.data.fields.filter(x=>x.page===state.page)){
  const p=state.data.parties.find(p=>p.id===f.party_id),own=p.id===state.data.current_party_id,signed=signedParty(p),has=hasSignature(f);
  const box=node('div','signature-field'+(!own?' other':'')+(signed?' signed':'')+(state.selected===f.id?' selected':''));box.dataset.field=f.id;box.style.left=f.x*100+'%';box.style.top=f.y*100+'%';box.style.width=f.width*100+'%';box.style.height=f.height*100+'%';box.tabIndex=0;box.setAttribute('role','button');box.setAttribute('aria-label',p.name+' signature on page '+f.page+(signed?', signed':''));
  if(has){const img=node('img');img.alt='Signature of '+p.name;box.append(img);signatureImage(f,img);}else box.textContent=own?'Click to sign':p.name;
  if(editable()){
   box.append(node('span','resize'));
   const remove=button('×','remove',e=>{e.stopPropagation();state.data.fields=state.data.fields.filter(x=>x.id!==f.id);state.signatures.delete(f.id);markDirty();renderFields();renderSidebar();});remove.setAttribute('aria-label','Remove signature area');remove.onpointerdown=e=>e.stopPropagation();box.append(remove);
  }
  box.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(own&&!signed)run(()=>openSignature(f.id));}};
  box.onpointerdown=e=>{
   if(e.button!==0||e.target.closest('button'))return;e.preventDefault();state.selected=f.id;
   if(!editable()){if(own&&!signed&&state.data.document.status!=='cancelled')run(()=>openSignature(f.id));return;}
   const bounds=$('pageWrap').getBoundingClientRect(),start={x:e.clientX,y:e.clientY,fx:f.x,fy:f.y,fw:f.width,fh:f.height},resizing=e.target.classList.contains('resize');let moved=false;box.setPointerCapture(e.pointerId);
   box.onpointermove=ev=>{const dx=(ev.clientX-start.x)/bounds.width,dy=(ev.clientY-start.y)/bounds.height;if(Math.abs(ev.clientX-start.x)+Math.abs(ev.clientY-start.y)>5)moved=true;if(!moved)return;if(resizing){const factor=Math.max(.3,Math.min(1+dx/start.fw,(1-start.fx)/start.fw,(1-start.fy)/start.fh));f.width=start.fw*factor;f.height=start.fh*factor;}else{f.x=Math.min(1-f.width,Math.max(0,start.fx+dx));f.y=Math.min(1-f.height,Math.max(0,start.fy+dy));}box.style.left=f.x*100+'%';box.style.top=f.y*100+'%';box.style.width=f.width*100+'%';box.style.height=f.height*100+'%';markDirty();};
   const end=()=>{box.onpointermove=null;box.onpointerup=null;box.onpointercancel=null;renderFields();if(!moved&&own&&!signed)run(()=>openSignature(f.id));};box.onpointerup=end;box.onpointercancel=()=>{box.onpointermove=null;renderFields();};
  };
  layer.append(box);
 }
}
function placeSignature(event){
 if(!state.placing||!editable()||event.target.closest('.signature-field'))return;
 const bounds=$('pageWrap').getBoundingClientRect(),meta=state.data.document.pages[state.page-1],width=Math.min(.55,180/meta.width),height=60/meta.height;
 const x=Math.max(0,Math.min(1-width,(event.clientX-bounds.left)/bounds.width-width/2)),y=Math.max(0,Math.min(1-height,(event.clientY-bounds.top)/bounds.height-height/2));
 const f={id:crypto.randomUUID(),party_id:state.placing,page:state.page,x,y,width,height,has_signature:false};state.data.fields.push(f);state.placing=null;$('pdfScroll').classList.remove('placing');markDirty();renderFields();renderSidebar();status('Signature area added. Drag it to move it, or drag its corner to resize.');
}
function renderSidebar(){
 if(!state.data)return;const host=$('sidebar');host.replaceChildren();const d=state.data.document,p=ownParty(),prepare=editable();
 if(d.status==='cancelled'){host.append(node('div','notice error','This signing request has been cancelled. Existing signatures remain in the record.'));return;}
 const intro=node('section','side-section');intro.append(node('div','eyebrow',prepare?'Prepare your agreement':d.status==='completed'?'Signing complete':'Document signing'));
 intro.append(node('h2','',prepare?'Signers & signature areas':signedParty(p)?'Your signature is saved':'Your signature'));
 intro.append(node('p','',prepare?'Add each signer, then place their signature areas on the PDF. Sharing or confirming a signature locks the preparation.':signedParty(p)?'Your submitted signature is locked and preserved when other parties sign.':'Click your highlighted areas, add your signature, then finish signing.'));host.append(intro);
 const parties=node('section','side-section');parties.append(node('h3','','Signers'));
 for(const party of state.data.parties){
  const box=node('div','signer-card'+(party.id===p.id?' current':'')),top=node('div','signer-top');top.append(node('span','signer-name',party.name+(party.id===p.id?' (you)':'')),node('span','badge'+(signedParty(party)?' green':''),signedParty(party)?'Signed':'Pending'));box.append(top);
  if(prepare){
   const name=node('label','','Name'),input=node('input');input.value=party.name;input.maxLength=120;input.oninput=()=>{party.name=input.value.trim();markDirty();renderFields();};name.append(input);box.append(name);
   if(party.kind!=='owner'){const email=node('label','','Email (optional)'),em=node('input');em.type='email';em.value=party.email;em.maxLength=254;em.oninput=()=>{party.email=em.value.trim();markDirty();};email.append(em);box.append(email);}
  }
  const fields=state.data.fields.filter(f=>f.party_id===party.id);box.append(node('div','field-count',fields.length+' signature area'+(fields.length===1?'':'s')));
  const tools=node('div','signer-tools');
  if(prepare){tools.append(button('＋ Place signature','secondary small',()=>{state.placing=party.id;$('pdfScroll').classList.add('placing');status('Click the PDF where '+party.name+' should sign.');$('pageWrap').scrollIntoView({behavior:'smooth',block:'center'});}));if(party.kind!=='owner')tools.append(button('Remove','plain small',()=>{if(!confirm('Remove this signer and their signature areas?'))return;state.data.parties=state.data.parties.filter(x=>x.id!==party.id);for(const f of fields)state.signatures.delete(f.id);state.data.fields=state.data.fields.filter(f=>f.party_id!==party.id);markDirty();renderSidebar();renderFields();}));}
  if(admin&&party.kind==='signer'&&!signedParty(party)){tools.append(button(party.has_link?'Signing link':'Share for signing','secondary small',()=>run(()=>openShare(party.id))));if(party.has_link&&!party.revoked_at)tools.append(button('Revoke link','plain small',()=>run(async()=>{if(!confirm('Revoke this recipient’s link and active signing sessions?'))return;setSnapshot(await api('signing?document='+d.id+'&action=revoke',{method:'POST',body:{party_id:party.id}}));status('Signing link revoked.');})));}
  if(party.revoked_at)box.append(node('div','hint','Link revoked'));if(tools.childNodes.length)box.append(tools);parties.append(box);
 }
 if(prepare)parties.append(button('＋ Add another signer','plain full small',()=>{state.data.parties.push({id:crypto.randomUUID(),name:'New signer',email:'',kind:'signer',revision:0});markDirty();renderSidebar();}));host.append(parties);
 if(!signedParty(p)&&ownFields().length){
  const sign=node('section','side-section');sign.append(node('h3','','Your signature areas'));const list=node('div','field-list');
  for(const f of ownFields()){const b=button('Page '+f.page,'field-jump'+(hasSignature(f)?' done':''),()=>run(async()=>{await jumpTo(f.page);await openSignature(f.id);}));b.append(node('span','',hasSignature(f)?'✓ Added':'Add signature'));list.append(b);}sign.append(list);
  const consent=node('label','consent'),check=node('input');check.type='checkbox';check.id='signingConsent';consent.append(check,node('span','','I confirm that these are my signatures and I intend to sign this document.'));sign.append(consent,button('Finish signing','full',()=>run(()=>finishSigning())));host.append(sign);
 }
 if(admin){const info=node('section','side-section');info.append(node('h3','','Document activity'));for(const e of state.data.events.slice(0,10)){const n=node('div','event',e.actor+' · '+e.action);const t=node('time','',new Date(e.created_at+'Z').toLocaleString());n.append(t);info.append(n);}if(!state.data.events.length)info.append(node('p','','No activity yet.'));info.append(button('Cancel signing request','danger small',()=>run(async()=>{if(!confirm('Cancel this signing request? Recipients will no longer be able to open or sign it.'))return;setSnapshot(await api('signing?document='+d.id+'&action=cancel',{method:'POST',body:{}}));status('Signing request cancelled.');})));host.append(info);}
}
async function saveLayout(){
 if(!state.layoutDirty)return;
 const {document:d,parties,fields}=state.data;
 const data=await api('signing?document='+d.id+'&action=layout',{method:'POST',body:{revision:d.revision,parties:parties.map(p=>({id:p.id,name:p.name,email:p.email||''})),fields:fields.map(f=>({id:f.id,party_id:f.party_id,page:f.page,x:f.x,y:f.y,width:f.width,height:f.height}))}});
 state.layoutDirty=false;setSnapshot(data);
}
async function saveDraft(confirm=false){
 if(admin)await saveLayout();
 if(!state.signatures.size&&!confirm){status('Your preparation is saved.');return;}
 const p=ownParty(),path=admin?'signing?document='+state.data.document.id+'&action=signature':'signing-guest?action=signature';
 const data=await api(path,{method:'POST',body:{party_id:p.id,revision:p.revision,signatures:[...state.signatures].map(([field_id,png])=>({field_id,png})),confirm,consent:confirm}});
 state.signatures.clear();setSnapshot(data);status(confirm?'Your signature is confirmed and saved.':'Signature draft saved. You can return to finish signing.');
}
async function finishSigning(){
 if(!$('signingConsent')?.checked)throw Error('Confirm that these are your signatures before finishing.');
 if(ownFields().some(f=>!hasSignature(f)))throw Error('Add your signature to every highlighted area first.');
 if(admin&&state.data.parties.some(p=>!state.data.fields.some(f=>f.party_id===p.id)))throw Error('Place at least one signature area for every signer first.');
 const finish=[...document.querySelectorAll('.sidebar button')].find(b=>b.textContent==='Finish signing');if(finish)finish.disabled=true;try{await saveDraft(true);}finally{if(finish)finish.disabled=false;}
}
function paintDrawing(){const ctx=$('drawCanvas').getContext('2d');ctx.clearRect(0,0,1200,400);ctx.strokeStyle='#20162e';ctx.lineWidth=5;ctx.lineCap='round';ctx.lineJoin='round';for(const points of strokes){ctx.beginPath();for(let i=0;i<points.length;i++)i?ctx.lineTo(...points[i]):ctx.moveTo(...points[i]);if(points.length===1)ctx.lineTo(points[0][0]+.1,points[0][1]+.1);ctx.stroke();}}
function selectSignatureMode(mode){signatureMode=mode;$('drawPanel').hidden=mode!=='draw';$('imagePanel').hidden=mode!=='image';$('drawTab').className=mode==='draw'?'secondary':'plain';$('imageTab').className=mode==='image'?'secondary':'plain';$('signatureStatus').textContent='';}
async function openSignature(fieldId){
 const f=state.data.fields.find(f=>f.id===fieldId);if(!f||f.party_id!==ownParty().id||signedParty(ownParty()))return;
 if(admin)await saveLayout();selectedSignature=fieldId;strokes=[];stroke=null;uploadedSignature=null;$('signatureUpload').value='';$('signaturePreview').hidden=true;$('removeSignature').hidden=!hasSignature(f);selectSignatureMode('draw');paintDrawing();$('signatureDialog').showModal();
}
function normalizeSignature(source){
 const work=document.createElement('canvas');work.width=1200;work.height=600;const ctx=work.getContext('2d',{willReadFrequently:true});const sw=source.width||source.naturalWidth,sh=source.height||source.naturalHeight,scale=Math.min(1200/sw,600/sh);ctx.drawImage(source,0,0,sw*scale,sh*scale);
 const data=ctx.getImageData(0,0,work.width,work.height),pixels=data.data;let left=work.width,top=work.height,right=0,bottom=0;
 for(let y=0;y<work.height;y++)for(let x=0;x<work.width;x++){const at=(y*work.width+x)*4;if(pixels[at]>242&&pixels[at+1]>242&&pixels[at+2]>242)pixels[at+3]=0;if(pixels[at+3]>30){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}}
 if(left>right||top>bottom)throw Error('Add a signature before continuing.');ctx.putImageData(data,0,0);
 const out=document.createElement('canvas');out.width=900;out.height=300;const w=right-left+1,h=bottom-top+1,s=Math.min(860/w,260/h);out.getContext('2d').drawImage(work,left,top,w,h,(900-w*s)/2,(300-h*s)/2,w*s,h*s);return out.toDataURL('image/png');
}
async function loadSignatureImage(){
 const file=$('signatureUpload').files[0];if(!file)return;
 try{if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Choose a PNG, JPG, or WebP image.');const bitmap=await createImageBitmap(file);uploadedSignature=normalizeSignature(bitmap);bitmap.close();$('signaturePreview').src=uploadedSignature;$('signaturePreview').hidden=false;$('signatureStatus').textContent='';}catch(e){$('signatureStatus').textContent=e.message;}
}
function useSignature(){try{const png=signatureMode==='image'?uploadedSignature:normalizeSignature($('drawCanvas'));if(!png)throw Error('Choose a signature image first.');state.signatures.set(selectedSignature,png);$('signatureDialog').close();renderFields();renderSidebar();updateToolbar();status('Signature added to your draft. Save it or finish signing to confirm.');}catch(e){$('signatureStatus').textContent=e.message;}}
function newCode(){const a=new Uint32Array(1);crypto.getRandomValues(a);$('shareCode').value=String(a[0]%1000000).padStart(6,'0');}
async function openShare(partyId){
 await saveDraft();shareParty=state.data.parties.find(p=>p.id===partyId);$('shareWho').textContent='Invite '+shareParty.name+' to review and sign this PDF.';$('shareResult').hidden=true;$('shareStatus').textContent='';$('requireCode').checked=true;$('codeSettings').hidden=false;$('requireCode').disabled=false;$('shareCode').disabled=false;newCode();$('replaceNotice').hidden=!shareParty.has_link;$('createLink').textContent=shareParty.has_link?'Replace signing link':'Create signing link';$('shareDialog').showModal();
 $('replaceNotice').textContent='Creating a replacement revokes the previous link and its signing sessions.';
 if(shareParty.has_link&&!shareParty.revoked_at){const existing=await api('signing?document='+state.data.document.id+'&action=link&party='+partyId);if(typeof existing.url!=='string')throw Error('Reload this page to retrieve the signing link.');$('shareUrl').value=existing.url;$('sharedCode').hidden=true;$('shareResult').hidden=false;$('replaceNotice').textContent=(existing.requires_code?'The existing link requires the original access code. ':'')+'The code above is for a replacement link. Replacing the link revokes the existing link and its sessions.';}
}
async function createLink(){
 const btn=$('createLink');btn.disabled=true;$('shareStatus').textContent='';$('shareResult').hidden=true;
 try{const code=$('requireCode').checked?$('shareCode').value:null;if(code!==null&&!/^\d{6}$/.test(code))throw Error('Enter exactly six digits.');const data=await api('signing?document='+state.data.document.id+'&action=share',{method:'POST',body:{party_id:shareParty.id,code,replace:!!shareParty.has_link}});setSnapshot(data);shareParty=state.data.parties.find(p=>p.id===shareParty.id);$('shareUrl').value=data.url;$('codeDisplay').textContent=code||'';$('sharedCode').hidden=!code;$('shareResult').hidden=false;$('requireCode').disabled=true;$('shareCode').disabled=true;btn.hidden=true;$('replaceNotice').hidden=true;status('Signing link created. Copy the link and share the access code separately.');}catch(e){$('shareStatus').textContent=e.message;}finally{btn.disabled=false;}
}
async function copyText(value,description){try{await navigator.clipboard.writeText(value);$('shareStatus').style.color='#25724f';$('shareStatus').textContent=description+' copied.';}catch{$('shareUrl').select();$('shareStatus').textContent='Select and copy the '+description.toLowerCase()+'.';}}
async function downloadPdf(){
 if(state.busy)return;
 if(dirty())throw Error('Save your draft before downloading. The PDF includes confirmed signatures.');
 state.busy=true;updateToolbar();
 try{
  const latest=await api(admin?'signing?document='+state.data.document.id:'signing-guest');setSnapshot(latest);
  const signedIds=new Set(latest.parties.filter(signedParty).map(p=>p.id)),fields=latest.fields.filter(f=>signedIds.has(f.party_id)&&f.has_signature);
  if(!fields.length){const r=await fetch(sourceUrl(),{headers:authHeaders(),credentials:'same-origin'});if(!r.ok)throw Error('Could not download the PDF.');saveDownload(await r.blob(),latest.document.filename);return;}
  const worker=new Worker('/document-signing/export-worker.js');
  await new Promise((resolve,reject)=>{worker.onmessage=({data})=>{if(data.status)status(data.status);if(data.error){worker.terminate();reject(Error(data.error));}if(data.bytes){saveDownload(new Blob([data.bytes],{type:'application/pdf'}),latest.document.filename.replace(/\.pdf$/i,'')+(signedIds.size===latest.parties.length?'-signed.pdf':'-partially-signed.pdf'));worker.terminate();resolve();}};worker.onerror=()=>{worker.terminate();reject(Error('Your browser could not prepare this PDF. Please retry from a desktop browser.'));};worker.postMessage({document:latest.document,fields,headers:authHeaders()});});
  status('PDF downloaded with '+fields.length+' confirmed signature'+(fields.length===1?'':'s')+'.');
 }finally{state.busy=false;updateToolbar();}
}
function saveDownload(blob,filename){const url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
async function guestAccess(code){
 $('accessError').textContent='';if(!linkToken)throw Error('This page needs the private signing link provided by the sender.');
 const data=await api('signing-guest?action=access',{method:'POST',body:{token:linkToken,code}});
 if(data.requires_code){$('accessDescription').textContent='Enter the access code provided by the sender to review and sign your document.';$('accessForm').hidden=false;$('accessCode').focus();return;}
 state.session=data.session;sessionStorage.setItem('wistudi_signing_'+linkToken,data.session);await startGuest(data);
}
async function startGuest(data){setSnapshot(data);$('accessScreen').hidden=true;$('workbench').hidden=false;await loadViewer();status(signedParty(ownParty())?'Your signature has been saved. You can download the PDF below.':'Review the document and click your highlighted signature areas.');}
async function init(){
 if(admin){
  try{const account=await api('session');if(!account.rooms.some(r=>r.room_id==='client'))throw Error('Your account does not have Client Room permission.');$('ownerName').value=account.email.split('@')[0];const documentId=new URLSearchParams(location.search).get('document');if(documentId)await openDocument(documentId);else await loadList();status('');}catch(e){if(e.status===401){location.replace('/room-manager/?next=documents');return;}status(e.message,true);}
 }else{
  try{const saved=linkToken&&sessionStorage.getItem('wistudi_signing_'+linkToken);if(saved){state.session=saved;try{await startGuest(await api('signing-guest'));return;}catch{state.session=null;sessionStorage.removeItem('wistudi_signing_'+linkToken);}}await guestAccess();}catch(e){$('accessDescription').textContent='The document could not be opened.';$('accessError').textContent=e.message;}
 }
}
$('prevPage').onclick=()=>run(()=>jumpTo(state.page-1));$('nextPage').onclick=()=>run(()=>jumpTo(state.page+1));$('pageNumber').onchange=()=>run(()=>jumpTo($('pageNumber').value));$('zoom').onchange=()=>run(renderPage);$('pageWrap').onclick=placeSignature;
$('saveDraft').onclick=()=>run(()=>saveDraft());$('downloadPdf').onclick=()=>run(downloadPdf);
$('closeSignature').onclick=()=>$('signatureDialog').close();$('drawTab').onclick=()=>selectSignatureMode('draw');$('imageTab').onclick=()=>selectSignatureMode('image');$('undoStroke').onclick=()=>{strokes.pop();paintDrawing();};$('clearDrawing').onclick=()=>{strokes=[];paintDrawing();};$('signatureUpload').onchange=loadSignatureImage;$('useSignature').onclick=useSignature;
$('removeSignature').onclick=()=>{state.signatures.set(selectedSignature,null);$('signatureDialog').close();renderFields();renderSidebar();updateToolbar();};
const draw=$('drawCanvas');draw.onpointerdown=e=>{e.preventDefault();const r=draw.getBoundingClientRect();stroke=[[(e.clientX-r.left)/r.width*1200,(e.clientY-r.top)/r.height*400]];strokes.push(stroke);draw.setPointerCapture(e.pointerId);paintDrawing();};draw.onpointermove=e=>{if(!stroke)return;e.preventDefault();const r=draw.getBoundingClientRect();stroke.push([(e.clientX-r.left)/r.width*1200,(e.clientY-r.top)/r.height*400]);paintDrawing();};draw.onpointerup=draw.onpointercancel=()=>{stroke=null;};
if(admin){
 $('newDocument').onclick=showUpload;$('uploadCancel').onclick=()=>{$('uploadCard').hidden=true;};$('uploadForm').onsubmit=uploadPdf;$('pdfUpload').onchange=()=>{if(!$('documentTitle').value)$('documentTitle').value=$('pdfUpload').files[0]?.name.replace(/\.pdf$/i,'')||'';};
 $('backToList').onclick=()=>run(async()=>{if(dirty()&&!confirm('Leave this document without saving your changes?'))return;state.layoutDirty=false;state.signatures.clear();history.replaceState(null,'',location.pathname);await loadList();status('');});$('saveLayout').onclick=()=>run(()=>saveDraft());
 $('closeShare').onclick=()=>$('shareDialog').close();$('shareDialog').addEventListener('close',()=>{$('createLink').hidden=false;});$('requireCode').onchange=()=>{$('codeSettings').hidden=!$('requireCode').checked;};$('generateCode').onclick=newCode;$('createLink').onclick=createLink;$('copyLink').onclick=()=>copyText($('shareUrl').value,'Link');$('copyCode').onclick=()=>copyText($('codeDisplay').textContent,'Code');
 $('signOut').onclick=()=>run(async()=>{if(dirty()&&!confirm('Sign out without saving your changes?'))return;await api('session',{method:'DELETE'});location.replace('/room-manager/');});
}else{$('accessForm').onsubmit=async e=>{e.preventDefault();$('accessSubmit').disabled=true;try{await guestAccess($('accessCode').value);}catch(e){$('accessError').textContent=e.message;}finally{$('accessSubmit').disabled=false;}};}
let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>run(renderPage),200);});window.addEventListener('beforeunload',e=>{if(dirty()){e.preventDefault();e.returnValue='';}});
init();
