import * as pdfjs from './vendor/pdf.min.mjs';
pdfjs.GlobalWorkerOptions.workerSrc = '/document-signing/vendor/pdf.worker.min.mjs';

const $ = id => document.getElementById(id);
const admin = document.body.dataset.mode === 'manager';
const API = '/api/room-management/';
const state = {
  data: null, account: null, pdf: null, page: 1, scale: 1, renderTask: null,
  renderSerial: 0, layoutDirty: false, signatures: new Map(), positions: new Set(),
  removed: new Map(), images: new Map(), placing: null, placementImage: null,
  selected: null, activeParty: null, template: null, session: null, upload: null,
  busy: false, saving: false, uploading: false
};
const linkToken = new URLSearchParams(location.hash.slice(1)).get('token');
let strokes = [], stroke = null, shareParty = null, resizeTimer;

const node = (tag, className, text) => {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text !== undefined) n.textContent = text;
  return n;
};
const button = (text, className, action) => {
  const n = node('button', className, text);
  n.type = 'button';
  n.onclick = action;
  return n;
};
const fieldData = f => ({id:f.id, party_id:f.party_id, page:f.page, x:f.x, y:f.y, width:f.width, height:f.height});
const editable = () => admin && state.data?.document.status === 'draft';
const ownParty = () => state.data?.parties.find(p => p.id === state.data.current_party_id) || {id:null};
const ownFields = () => state.data?.fields.filter(f => f.party_id === state.data.current_party_id) || [];
const signedParty = p => !!p?.signed_at;
const dirty = () => state.layoutDirty || state.signatures.size > 0 || state.positions.size > 0 || state.removed.size > 0;
const authHeaders = () => state.session ? {authorization:'Bearer '+state.session} : {};
const sourceUrl = () => API+'signing-file?document='+state.data.document.id;
const partyName = p => p?.name || 'Party '+String.fromCharCode(65+Math.max(0,state.data.parties.filter(x=>x.kind!=='owner').findIndex(x=>x.id===p?.id)));
const sizeLabel = bytes => bytes < 1e6 ? Math.round(bytes/1000)+' KB' : bytes < 1e9 ? (bytes/1e6).toFixed(1)+' MB' : (bytes/1e9).toFixed(2)+' GB';
const currentSignatureParty = () => state.data?.parties.find(p=>p.id===(admin?state.activeParty:state.data.current_party_id));
const canEditParty = p => p && !p.signed_at && state.data.document.status!=='cancelled' && (editable() || p.id===state.data.current_party_id);
const canMoveField = f => canEditParty(state.data.parties.find(p=>p.id===f.party_id));
const hasSignature = f => state.signatures.has(f.id) ? !!state.signatures.get(f.id) : !!f.has_signature;
function status(text, error=false) {
  $('globalStatus').textContent = error ? text : '';
}
function markDirty() { state.layoutDirty = true; updateToolbar(); }
function markPosition(f) {
  if (editable()) state.layoutDirty = true;
  else state.positions.add(f.id);
  updateToolbar();
}
async function run(action) {
  try { await action(); }
  catch(e) { status(e.message, true); }
}
async function api(path, {method='GET', body, headers={}}={}) {
  const binary = body instanceof Blob;
  const response = await fetch(API+path, {
    method, credentials:'same-origin', cache:'no-store',
    headers:{...authHeaders(), ...(body!==undefined&&!binary?{'content-type':'application/json'}:{}), ...headers},
    body:body===undefined?undefined:binary?body:JSON.stringify(body)
  });
  const data = await response.json().catch(()=>({error:'The server returned an unreadable response.'}));
  if (!response.ok) throw Object.assign(new Error(data.error || 'The request failed.'), {status:response.status});
  return data;
}
function updateToolbar() {
  if (!state.data) return;
  const d=state.data.document, own=ownParty(), signed=state.data.parties.filter(signedParty).length;
  $('workTitle').textContent = d.title;
  $('workMeta').textContent = d.pages.length+' page'+(d.pages.length===1?'':'s')+' · '+sizeLabel(d.total_bytes)+' · '+signed+' of '+state.data.parties.length+' signed';
  $('saveDraft').hidden = d.status==='cancelled' || (!editable() && (!own.id || own.signed_at));
  $('saveDraft').disabled = state.saving;
  $('saveDraft').textContent = state.saving ? 'Saving…' : 'Save draft';
  if ($('saveState')) $('saveState').textContent = dirty() ? 'Unsaved changes' : 'Saved';
  if (admin) {
    const others=state.data.parties.filter(p=>p.kind!=='owner');
    $('shareDocument').hidden = d.status==='cancelled' || (!editable() && !others.some(p=>!p.signed_at));
    $('shareDocument').disabled = state.saving;
  }
  $('downloadPdf').disabled = state.busy;
}
function setSnapshot(data) {
  state.data = data;
  for (const f of data.fields) f.persisted = true;
  const own=ownParty();
  if (!state.data.parties.some(p=>p.id===state.activeParty && canEditParty(p))) {
    state.activeParty = own.id && !own.signed_at ? own.id : data.parties.find(canEditParty)?.id || null;
  }
  updateToolbar(); renderSidebar(); renderFields();
}
async function loadList() {
  $('workbench').hidden=true; $('dashboard').hidden=false;
  const archived=$('documentFilter').value==='archived';
  const {items,archived_count}=await api('signing'+(archived?'?archived=1':''));
  const host=$('documentList'); host.replaceChildren();
  $('savedDocuments').hidden=!items.length&&!archived&&!archived_count;
  if(!items.length&&archived)host.append(node('p','empty-list','No archived documents.'));
  for (const d of items) {
    const row=node('article','document-row'), details=node('div'), actions=node('div','row-actions');
    details.append(node('h3','',d.title),node('div','meta',d.filename+' · '+sizeLabel(d.total_bytes)));
    const complete=d.signers>0&&d.signed===d.signers;
    const label=!d.file_ready?'Upload incomplete':d.status==='cancelled'?'Cancelled':complete?'Completed':d.status==='draft'?'Draft':d.signed+' of '+d.signers+' signed';
    actions.append(node('span','badge'+(complete?' green':''),label),button(d.file_ready?'Open':'Resume upload','text-button',()=>run(()=>d.file_ready?openDocument(d.id):resumeUpload(d))));
    const deletable=!archived&&d.status==='draft'&&!d.signed&&!d.shared;
    const action=archived?'restore':deletable?'delete':'archive';
    const labelAction=archived?'Restore to active documents':deletable?'Delete draft':complete?'This MOU has been signed by all parties and cannot be deleted. You can only archive it.':'Signing has started. This document cannot be deleted; you can only archive it.';
    const control=button('','icon-button document-action',()=>run(async()=>{
      if(action==='delete'&&!confirm('Delete this draft?'))return;
      control.disabled=true;
      try{await api('signing?document='+d.id+'&action='+action,{method:'POST',body:{}});await loadList();}finally{control.disabled=false;}
    }));
    control.title=labelAction;control.setAttribute('aria-label',labelAction);
    const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',action==='delete'?'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7':action==='restore'?'M4 8v6h6M4 14a8 8 0 1 0 2-8':'M3 3h18v5H3zM5 8v13h14V8M9 12h6');icon.append(path);control.append(icon);actions.append(control);
    const pdfIcon=node('img','pdf-icon');pdfIcon.src='/document-signing/pdf-file.png';pdfIcon.alt='PDF';pdfIcon.width=44;pdfIcon.height=48;
    row.append(pdfIcon,details,actions); host.append(row);
  }
}
function selectPdf() { $('pdfUpload').click(); }
function resumeUpload(d) {
  state.upload={id:d.id,size:d.total_bytes,filename:d.filename};
  selectPdf();
}
async function readPdf(file) {
  const transport=new pdfjs.PDFDataRangeTransport(file.size,new Uint8Array(await file.slice(0,65536).arrayBuffer()),false,file.name);
  transport.requestDataRange=(begin,end)=>file.slice(begin,end).arrayBuffer().then(b=>transport.onDataRange(begin,new Uint8Array(b))).catch(()=>transport.abort());
  const pdf=await pdfjs.getDocument({range:transport,length:file.size,disableAutoFetch:true,disableStream:true,isEvalSupported:false}).promise;
  try {
    const pages=[];
    for(let n=1;n<=pdf.numPages;n++) {
      const page=await pdf.getPage(n), viewport=page.getViewport({scale:1});
      pages.push({width:viewport.width,height:viewport.height,transform:viewport.transform}); page.cleanup();
    }
    return pages;
  } finally { await pdf.destroy(); }
}
async function uploadPdf(file) {
  if (!file || state.uploading) return;
  state.uploading=true;
  const control=$('uploadPdfButton'); control.disabled=true;
  $('uploadProgress').hidden=false; $('uploadStatus').textContent='Opening PDF…';
  try {
    if (new TextDecoder().decode(await file.slice(0,5).arrayBuffer())!=='%PDF-') throw Error('Choose a valid PDF.');
    let upload=state.upload;
    if(upload&&(upload.size!==file.size||upload.filename!==file.name)) throw Error('Select the same PDF to resume the upload.');
    if(!upload) {
      const pages=await readPdf(file);
      upload=await api('signing?action=create',{method:'POST',body:{title:file.name.replace(/\.pdf$/i,'').slice(0,180)||'Untitled document',filename:file.name,size:file.size,pages,owner_signs:false}});
      state.upload={...upload,size:file.size,filename:file.name};
    }
    const progress=await api('signing-upload?document='+upload.id);
    if(!progress.file_ready) {
      const done=new Set(progress.parts),count=Math.ceil(file.size/progress.chunk_size);
      for(let part=0;part<count;part++) {
        if(!done.has(part)) {
          const chunk=file.slice(part*progress.chunk_size,Math.min(file.size,(part+1)*progress.chunk_size));
          let lastError,ok=false;
          for(let attempt=0;attempt<3;attempt++) {
            try { await api('signing-upload?document='+upload.id+'&part='+part,{method:'PUT',body:chunk,headers:{'content-type':'application/octet-stream'}}); ok=true; break; }
            catch(e) { lastError=e; if(e.status===401)break; if(attempt<2)await new Promise(resolve=>setTimeout(resolve,800*(attempt+1))); }
          }
          if(!ok)throw lastError;
        }
        const percent=Math.round((part+1)/count*100);
        control.textContent='Uploading PDF… '+percent+'%'; $('uploadStatus').textContent='';
        $('uploadProgress').firstElementChild.style.width=percent+'%';
      }
      await api('signing-upload?document='+upload.id+'&action=complete',{method:'POST',body:{}});
    }
    state.upload=null; await openDocument(upload.id);
  } catch(e) { $('uploadStatus').textContent=e.message; }
  finally {
    state.uploading=false; control.disabled=false; control.textContent='Upload PDF to Sign';
    $('uploadProgress').hidden=true; $('pdfUpload').value='';
  }
}
async function openDocument(documentId) {
  const data=await api('signing?document='+documentId);
  state.page=1; state.layoutDirty=false; state.signatures.clear(); state.positions.clear(); state.removed.clear();
  state.selected=null; state.template=null; state.activeParty=null; clearPlacement();
  setSnapshot(data); $('dashboard').hidden=true; $('workbench').hidden=false;
  history.replaceState(null,'','?document='+documentId);
  await loadViewer(); status('');
}
async function loadViewer() {
  if(state.renderTask){state.renderTask.cancel();state.renderTask=null;}
  if(state.pdf)await state.pdf.destroy();
  $('pageLoading').hidden=false;
  state.pdf=await pdfjs.getDocument({url:sourceUrl(),httpHeaders:authHeaders(),withCredentials:true,disableAutoFetch:true,disableStream:true,isEvalSupported:false}).promise;
  $('pageNumber').max=state.pdf.numPages;
  $('pageTotal').textContent='/ '+state.pdf.numPages;
  await renderPage();
}
async function renderPage() {
  if(!state.pdf)return;
  const serial=++state.renderSerial;
  if(state.renderTask){state.renderTask.cancel();state.renderTask=null;}
  $('pageLoading').hidden=false;
  const page=await state.pdf.getPage(state.page); if(serial!==state.renderSerial)return;
  const base=page.getViewport({scale:1}), gutter=innerWidth<=700?36:64;
  const availableWidth=Math.max(100,$('pdfScroll').clientWidth-gutter);
  const availableHeight=Math.max(180,$('pdfScroll').clientHeight-gutter);
  const selected=$('zoom').value;
  state.scale=selected==='fit-page'?Math.min(availableWidth/base.width,availableHeight/base.height):selected==='fit'?availableWidth/base.width:Number(selected);
  const viewport=page.getViewport({scale:state.scale}), canvas=$('pdfCanvas'), ratio=Math.min(devicePixelRatio||1,2);
  $('pageWrap').style.width=viewport.width+'px'; $('pageWrap').style.height=viewport.height+'px';
  canvas.width=Math.ceil(viewport.width*ratio);canvas.height=Math.ceil(viewport.height*ratio);
  canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';
  $('pageNumber').value=state.page; $('prevPage').disabled=state.page<=1; $('nextPage').disabled=state.page>=state.pdf.numPages;
  const a4=(Math.abs(base.width-595.28)<3&&Math.abs(base.height-841.89)<3)||(Math.abs(base.height-595.28)<3&&Math.abs(base.width-841.89)<3);
  $('pageSize').textContent=a4?'A4 '+(base.width>base.height?'landscape':'portrait'):Math.round(base.width/72*25.4)+' × '+Math.round(base.height/72*25.4)+' mm';
  renderFields();
  try {
    const task=page.render({canvasContext:canvas.getContext('2d'),viewport,transform:ratio!==1?[ratio,0,0,ratio,0,0]:null});
    state.renderTask=task; await task.promise;
  } catch(e) { if(e.name!=='RenderingCancelledException')throw e; }
  finally { if(serial===state.renderSerial){state.renderTask=null;$('pageLoading').hidden=true;} }
}
async function jumpTo(page) { state.page=Math.max(1,Math.min(state.pdf.numPages,Number(page)||1)); await renderPage(); $('pdfScroll').scrollTop=0; }
function changeZoom(delta) {
  const value=(Math.max(.25,Math.min(3,state.scale+delta))).toFixed(2);
  let option=[...$('zoom').options].find(o=>Number(o.value)===Number(value));
  if(!option){option=node('option','',Math.round(Number(value)*100)+'%');option.value=value;$('zoom').append(option);}
  $('zoom').value=option.value; return renderPage();
}
async function signatureImage(f,img) {
  const pending=state.signatures.get(f.id);
  if(pending){img.src=pending;return;} if(pending===null||!f.signature_url)return;
  try {
    let url=state.images.get(f.signature_url);
    if(!url){const response=await fetch(f.signature_url,{headers:authHeaders(),credentials:'same-origin',cache:'no-store'});if(!response.ok)throw Error('Signature preview unavailable.');url=URL.createObjectURL(await response.blob());state.images.set(f.signature_url,url);}
    img.src=url;
  } catch(e) { status(e.message,true); }
}
function removeField(f) {
  state.data.fields=state.data.fields.filter(x=>x.id!==f.id); state.signatures.delete(f.id); state.positions.delete(f.id);
  if(editable())state.layoutDirty=true;
  else if(f.persisted!==false)state.removed.set(f.id,f.party_id);
  if(state.selected===f.id)state.selected=null;
  renderFields();renderSidebar();updateToolbar();
}
function renderFields() {
  if(!state.data)return;
  const layer=$('fieldLayer');layer.replaceChildren();
  for(const f of state.data.fields.filter(x=>x.page===state.page)) {
    const party=state.data.parties.find(p=>p.id===f.party_id);
    if(!party)continue;
    const allowed=canMoveField(f), signed=signedParty(party);
    const box=node('div','signature-field'+(f.party_id!==state.data.current_party_id?' other':'')+(signed?' signed':'')+(state.selected===f.id?' selected':''));
    box.dataset.field=f.id;box.style.left=f.x*100+'%';box.style.top=f.y*100+'%';box.style.width=f.width*100+'%';box.style.height=f.height*100+'%';
    box.tabIndex=allowed?0:-1;box.setAttribute('role','button');box.setAttribute('aria-label',partyName(party)+' signature on page '+f.page+(signed?', signed':''));
    if(hasSignature(f)){const img=node('img');img.alt='Signature of '+partyName(party);box.append(img);signatureImage(f,img);}
    else box.textContent=partyName(party);
    if(allowed) {
      box.append(node('span','resize'));
      const remove=button('×','remove',e=>{e.stopPropagation();removeField(f);});
      remove.setAttribute('aria-label','Remove signature area'); remove.onpointerdown=e=>e.stopPropagation();box.append(remove);
    }
    box.onkeydown=e=>{if(allowed&&(e.key==='Enter'||e.key===' ')){e.preventDefault();run(()=>selectField(f));}};
    box.onpointerdown=e=>{
      if(!allowed||e.button!==0||e.target.closest('button'))return;
      e.preventDefault();state.selected=f.id;state.activeParty=f.party_id;
      const bounds=$('pageWrap').getBoundingClientRect(),start={x:e.clientX,y:e.clientY,fx:f.x,fy:f.y,fw:f.width,fh:f.height};
      const resizing=e.target.classList.contains('resize');let moved=false;box.setPointerCapture(e.pointerId);
      box.onpointermove=ev=>{
        const dx=(ev.clientX-start.x)/bounds.width,dy=(ev.clientY-start.y)/bounds.height;
        if(Math.abs(ev.clientX-start.x)+Math.abs(ev.clientY-start.y)>5)moved=true;
        if(!moved)return;
        if(resizing){const factor=Math.max(.3,Math.min(1+dx/start.fw,(1-start.fx)/start.fw,(1-start.fy)/start.fh));f.width=start.fw*factor;f.height=start.fh*factor;}
        else {f.x=Math.min(1-f.width,Math.max(0,start.fx+dx));f.y=Math.min(1-f.height,Math.max(0,start.fy+dy));}
        box.style.left=f.x*100+'%';box.style.top=f.y*100+'%';box.style.width=f.width*100+'%';box.style.height=f.height*100+'%';markPosition(f);
      };
      box.onpointerup=()=>{box.onpointermove=null;box.onpointerup=null;if(!moved)run(()=>selectField(f));else{renderFields();renderSidebar();}};
      box.onpointercancel=()=>{box.onpointermove=null;renderFields();};
    };
    layer.append(box);
  }
}
function clearPlacement() {
  state.placing=null;state.placementImage=null;
  $('pdfScroll').classList.remove('placing');$('placementPrompt').hidden=true;$('cancelPlacement').hidden=true;
}
function beginPlacement(partyId,png=null) {
  const p=state.data.parties.find(x=>x.id===partyId);if(!canEditParty(p))return;
  state.placing=partyId;state.placementImage=png;state.selected=null;
  $('pdfScroll').classList.add('placing');$('placementPrompt').textContent=png?'Click the PDF to place your signature.':'Click the PDF to place '+partyName(p)+'’s signature area.';
  $('placementPrompt').hidden=false;$('cancelPlacement').hidden=false;
  if(innerWidth<=700)$('pageWrap').scrollIntoView({behavior:'smooth',block:'center'});
}
function placeSignature(e) {
  if(!state.placing||e.target.closest('.signature-field'))return;
  const p=state.data.parties.find(x=>x.id===state.placing);if(!canEditParty(p))return;
  const rect=$('pageWrap').getBoundingClientRect(),meta=state.data.document.pages[state.page-1];
  const width=Math.min(.6,180/meta.width),height=Math.min(.3,60/meta.height);
  const f={id:crypto.randomUUID(),party_id:p.id,page:state.page,x:Math.max(0,Math.min(1-width,(e.clientX-rect.left)/rect.width-width/2)),y:Math.max(0,Math.min(1-height,(e.clientY-rect.top)/rect.height-height/2)),width,height,has_signature:false,persisted:false};
  state.data.fields.push(f); if(state.placementImage)state.signatures.set(f.id,state.placementImage);
  markPosition(f);state.selected=f.id;state.activeParty=p.id;clearPlacement();renderFields();renderSidebar();updateToolbar();
}
function inputField(labelText,value,onInput,{type='text',placeholder='',required=false}={}) {
  const label=node('label','',labelText),input=node('input');input.type=type;input.value=value||'';input.placeholder=placeholder;input.required=required;input.maxLength=type==='email'?254:180;
  input.oninput=()=>{onInput(input.value);markDirty();};label.append(input);return label;
}
function toggleOwnSigning(enabled) {
  if(!editable()||!state.data.document.can_sign_owner)return;
  const existing=state.data.parties.find(p=>p.kind==='owner');
  if(enabled&&!existing){const p={id:crypto.randomUUID(),name:state.account.email.split('@')[0],email:state.account.email,kind:'owner',revision:0};state.data.parties.unshift(p);state.data.current_party_id=p.id;state.activeParty=p.id;}
  if(!enabled&&existing){state.data.parties=state.data.parties.filter(p=>p.id!==existing.id);for(const f of state.data.fields.filter(f=>f.party_id===existing.id))state.signatures.delete(f.id);state.data.fields=state.data.fields.filter(f=>f.party_id!==existing.id);state.data.current_party_id=null;state.activeParty=null;}
  clearPlacement();state.selected=null;state.template=null;markDirty();renderSidebar();renderFields();
}
function addParty() {
  if(!editable())return;
  const p={id:crypto.randomUUID(),name:'',email:'',kind:'signer',revision:0};state.data.parties.push(p);state.activeParty=p.id;state.template=null;state.selected=null;clearPlacement();
  markDirty();renderSidebar();$('otherSigners').querySelector('input[data-party="'+p.id+'"]')?.focus();
}
function renderSidebar() {
  if(!state.data)return;
  const d=state.data.document,own=ownParty(),prepare=editable(),intro=$('sidebarIntro'),details=$('documentDetails');
  intro.replaceChildren();details.replaceChildren();$('signatureAreas').replaceChildren();$('otherSigners').replaceChildren();$('documentActivity').replaceChildren();
  intro.append(node('h2','',d.status==='completed'?'Signing complete':'Details & signatures'));
  if(d.status==='cancelled'){intro.append(node('p','notice error','Signing request cancelled.'));$('signatureTools').hidden=true;renderHistory();return;}
  const doc=node('section','side-section');doc.append(node('h3','','Document details'));
  if(prepare)doc.append(inputField('Document title',d.title,value=>{d.title=value;updateToolbar();},{required:true}));
  else doc.append(node('p','document-name',d.title));
  if(prepare&&d.can_sign_owner) {
    const role=node('fieldset','role-choice');role.append(node('legend','','My role'));
    for(const [enabled,text] of [[false,'Prepare only'],[true,'I am signing']]){
      const label=node('label'),radio=node('input');radio.type='radio';radio.name='adminRole';radio.value=String(enabled);radio.checked=enabled===!!state.data.parties.find(p=>p.kind==='owner');radio.onchange=()=>toggleOwnSigning(enabled);label.append(radio,node('span','',text));role.append(label);
    }
    doc.append(role);
  }
  details.append(doc);
  if(own.id) {
    const section=node('section','side-section');section.append(node('h3','','Your details'));
    if(prepare){section.append(inputField('Full name',own.name,value=>{own.name=value;renderFields();},{required:true}),inputField('Email address',own.email,value=>{own.email=value;},{type:'email'}));}
    else section.append(node('p','',own.name));
    details.append(section);
  }
  const candidates=state.data.parties.filter(canEditParty);
  if(!candidates.some(p=>p.id===state.activeParty))state.activeParty=candidates[0]?.id||null;
  $('signatureTools').hidden=!candidates.length;
  $('signatureParty').replaceChildren();
  $('signatureParty').hidden=!admin||candidates.length<2;
  for(const p of candidates){const option=node('option','',partyName(p));option.value=p.id;$('signatureParty').append(option);}
  $('signatureParty').value=state.activeParty||'';
  $('signaturePreview').hidden=!state.template;if(state.template)$('signaturePreview').src=state.template;
  $('useSignature').hidden=!state.template;
  $('useSignature').textContent=state.selected?'Apply signature':'Place signature';
  const selected=state.data.fields.find(f=>f.id===state.selected);
  $('removeSignature').hidden=!selected||!canMoveField(selected)||!hasSignature(selected);
  const ownList=ownFields();
  if(own.id&&!own.signed_at) {
    const sign=node('section','side-section');
    if(ownList.length){sign.append(node('h3','','Your signature areas'));const list=node('div','field-list');
      for(const f of ownList){const b=button('Page '+f.page,'field-jump'+(hasSignature(f)?' done':''),()=>run(async()=>{await jumpTo(f.page);await selectField(f);}));b.append(node('span','',hasSignature(f)?'Added':'Add signature'));list.append(b);}sign.append(list);}
    sign.append(button('Add signature area','text-button',()=>{state.selected=null;beginPlacement(own.id,state.template);renderSidebar();}));
    if(ownList.some(hasSignature)){
      const consent=node('label','consent'),check=node('input');check.type='checkbox';check.id='signingConsent';consent.append(check,node('span','','I confirm this is my signature and I agree to sign this document.'));sign.append(consent,button('Submit signature','primary full',()=>run(finishSigning)));
    }
    $('signatureAreas').append(sign);
  }
  renderParties();renderHistory();
}
function renderParties() {
  const host=$('otherSigners'),prepare=editable(),parties=state.data.parties.filter(p=>p.kind!=='owner'||!admin);
  if(!parties.length&&!prepare)return;
  const section=node('section','side-section'),title=node('div','section-title');title.append(node('h3','','Parties'));
  if(prepare)title.append(button('Add party','text-button',addParty));section.append(title);
  for(const party of parties) {
    const row=node('div','recipient'),header=node('div','recipient-heading');
    header.append(node('strong','',partyName(party)),node('span','badge'+(party.signed_at?' green':''),party.signed_at?'Signed':'Not signed'));row.append(header);
    if(prepare) {
      const label=inputField('Full name',party.name,value=>{party.name=value;renderFields();},{placeholder:'Full name',required:true});label.querySelector('input').dataset.party=party.id;row.append(label);
      const actions=node('div','recipient-actions');
      actions.append(button('Add signature area','secondary',()=>{state.activeParty=party.id;beginPlacement(party.id);renderSidebar();}),button('Remove','text-button remove-recipient',()=>{
        state.data.parties=state.data.parties.filter(p=>p.id!==party.id);for(const f of state.data.fields.filter(f=>f.party_id===party.id))state.signatures.delete(f.id);state.data.fields=state.data.fields.filter(f=>f.party_id!==party.id);markDirty();renderSidebar();renderFields();
      }));row.append(actions);
    }
    if(admin&&party.kind==='signer'&&!party.signed_at)row.append(button(party.has_link?'Manage link':'Create signing link','text-button',()=>run(()=>openShare(party.id))));
    if(party.signed_at){const time=node('time','hint',formatTime(party.signed_at));time.dateTime=utcTime(party.signed_at);row.append(time);}
    section.append(row);
  }
  host.append(section);
}
function utcTime(value) { return /Z$|[+-]\d\d:\d\d$/.test(value)?value:value.replace(' ','T')+'Z'; }
function formatTime(value) { return new Intl.DateTimeFormat(undefined,{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',timeZoneName:'short'}).format(new Date(utcTime(value))); }
function renderHistory() {
  const host=$('documentActivity'),section=node('section','side-section'),history=node('details','activity');
  history.open=state.data.document.status==='completed';history.append(node('summary','','Signing history'));
  const labels={'Document created':'Document created','Signing link created':'Signing link created','Signing link replaced':'Signing link replaced','Signing link revoked':'Link revoked','Signature confirmed':'Signed','Document cancelled':'Signing cancelled'};
  for(const e of state.data.events||[]){const row=node('div','event');row.append(node('div','',e.actor+' · '+(labels[e.action]||e.action)));const time=node('time','',formatTime(e.created_at));time.dateTime=utcTime(e.created_at);row.append(time);history.append(row);}
  if(admin&&!['cancelled','completed'].includes(state.data.document.status))history.append(button('Cancel signing request','danger',()=>run(async()=>{if(!confirm('Cancel this signing request?'))return;setSnapshot(await api('signing?document='+state.data.document.id+'&action=cancel',{method:'POST',body:{}}));})));
  section.append(history);host.append(section);
}
function validateDetails() {
  const fields=$('sidebar').querySelectorAll('input[required],input[type=email]');
  for(const input of fields)if(!input.reportValidity())throw Error('Complete the required details.');
  if(editable()&&!state.data.document.title.trim())throw Error('Enter a document title.');
}
async function saveLayout() {
  if(!state.layoutDirty)return;
  validateDetails();
  const {document:d,parties,fields}=state.data;
  const data=await api('signing?document='+d.id+'&action=layout',{method:'POST',body:{revision:d.revision,title:d.title,owner_signs:parties.some(p=>p.kind==='owner'),parties:parties.map(p=>({id:p.id,name:p.name,email:p.email||'',kind:p.kind})),fields:fields.map(fieldData)}});
  state.layoutDirty=false;state.positions.clear();state.removed.clear();setSnapshot(data);
}
async function saveDraft(confirmOwn=false) {
  if(state.saving)return;
  state.saving=true;updateToolbar();
  try {
    if(editable())await saveLayout();
    const groups=new Map();
    const group=p=>{if(!groups.has(p))groups.set(p,{signatures:[],positions:[],remove_fields:[]});return groups.get(p);};
    for(const [fieldId,png] of state.signatures){const f=state.data.fields.find(f=>f.id===fieldId);if(f)group(f.party_id).signatures.push({field_id:fieldId,png});}
    for(const fieldId of state.positions){const f=state.data.fields.find(f=>f.id===fieldId);if(f)group(f.party_id).positions.push(fieldData(f));}
    for(const [fieldId,partyId] of state.removed)group(partyId).remove_fields.push(fieldId);
    const ownId=state.data.current_party_id;if(confirmOwn)group(ownId);
    const ordered=[...groups].sort(([a],[b])=>a===ownId?1:b===ownId?-1:0);
    for(const [partyId,body] of ordered){
      const p=state.data.parties.find(p=>p.id===partyId);if(!p)continue;
      const data=await api(admin?'signing?document='+state.data.document.id+'&action=signature':'signing-guest?action=signature',{method:'POST',body:{...body,party_id:partyId,revision:p.revision,confirm:confirmOwn&&partyId===ownId,consent:confirmOwn&&partyId===ownId}});
      for(const f of body.signatures)state.signatures.delete(f.field_id);
      for(const f of body.positions)state.positions.delete(f.id);
      for(const key of body.remove_fields)state.removed.delete(key);
      setSnapshot(data);
    }
  } finally { state.saving=false;updateToolbar(); }
}
async function finishSigning() {
  if(!$('signingConsent')?.checked)throw Error('Confirm your signature before submitting.');
  if(!ownFields().length||ownFields().some(f=>!hasSignature(f)))throw Error('Add your signature before submitting.');
  await saveDraft(true);
}
function normalizeSignature(source) {
  const work=document.createElement('canvas');work.width=1200;work.height=600;
  const ctx=work.getContext('2d',{willReadFrequently:true}),sw=source.width||source.naturalWidth,sh=source.height||source.naturalHeight,scale=Math.min(1200/sw,600/sh);
  ctx.drawImage(source,0,0,sw*scale,sh*scale);
  const data=ctx.getImageData(0,0,work.width,work.height),pixels=data.data;
  let left=work.width,top=work.height,right=0,bottom=0;
  for(let y=0;y<work.height;y++)for(let x=0;x<work.width;x++){
    const at=(y*work.width+x)*4;
    if(pixels[at]>242&&pixels[at+1]>242&&pixels[at+2]>242)pixels[at+3]=0;
    if(pixels[at+3]>30){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  }
  if(left>right||top>bottom)throw Error('Draw or upload a signature.');
  ctx.putImageData(data,0,0);
  const out=document.createElement('canvas');out.width=900;out.height=300;
  const w=right-left+1,h=bottom-top+1,s=Math.min(860/w,260/h);
  out.getContext('2d').drawImage(work,left,top,w,h,(900-w*s)/2,(300-h*s)/2,w*s,h*s);
  return out.toDataURL('image/png');
}
function paintDrawing() {
  const ctx=$('drawCanvas').getContext('2d');ctx.clearRect(0,0,1200,400);ctx.strokeStyle='#20162e';ctx.lineWidth=5;ctx.lineCap='round';ctx.lineJoin='round';
  for(const points of strokes){ctx.beginPath();for(let i=0;i<points.length;i++)i?ctx.lineTo(...points[i]):ctx.moveTo(...points[i]);if(points.length===1)ctx.lineTo(points[0][0]+.1,points[0][1]+.1);ctx.stroke();}
}
function openDrawing() {
  if(!currentSignatureParty())throw Error('Add a party or select “I am signing”.');
  strokes=[];stroke=null;$('drawingError').textContent='';paintDrawing();$('signatureDialog').showModal();
}
function applyTemplate(png) {
  state.template=png;const p=currentSignatureParty();if(!p)return;
  const selected=state.data.fields.find(f=>f.id===state.selected&&f.party_id===p.id);
  if(selected&&canMoveField(selected)){state.signatures.set(selected.id,png);clearPlacement();renderFields();renderSidebar();updateToolbar();}
  else {renderSidebar();beginPlacement(p.id,png);}
}
function acceptDrawing() {
  try { const png=normalizeSignature($('drawCanvas'));$('signatureDialog').close();applyTemplate(png); }
  catch(e){$('drawingError').textContent=e.message;}
}
async function loadSignatureImage() {
  const file=$('signatureUpload').files[0];if(!file)return;
  try {
    if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Choose a PNG, JPG or WebP image.');
    const bitmap=await createImageBitmap(file),png=normalizeSignature(bitmap);bitmap.close();applyTemplate(png);$('signatureStatus').textContent='';
  }catch(e){$('signatureStatus').textContent=e.message;}
  finally{$('signatureUpload').value='';}
}
async function selectField(f) {
  if(!canMoveField(f))return;
  clearPlacement();state.selected=f.id;state.activeParty=f.party_id;
  const pending=state.signatures.get(f.id);
  if(pending)state.template=pending;
  else if(f.signature_url){const r=await fetch(f.signature_url,{headers:authHeaders(),credentials:'same-origin',cache:'no-store'});if(r.ok){const bitmap=await createImageBitmap(await r.blob());state.template=normalizeSignature(bitmap);bitmap.close();}}
  renderFields();renderSidebar();$('signatureTools').scrollIntoView({behavior:'smooth',block:'nearest'});
}
function placeTemplate() {
  const p=currentSignatureParty();if(!p||!state.template)return;
  const selected=state.data.fields.find(f=>f.id===state.selected&&f.party_id===p.id);
  if(selected){state.signatures.set(selected.id,state.template);renderFields();renderSidebar();updateToolbar();}
  else beginPlacement(p.id,state.template);
}
function newCode() { const n=new Uint32Array(1);crypto.getRandomValues(n);$('shareCode').value=String(n[0]%1000000).padStart(6,'0'); }
async function loadShareParty(partyId) {
  shareParty=state.data.parties.find(p=>p.id===partyId);
  if(!shareParty)return;
  $('shareRecipient').value=partyId;$('shareWho').textContent='';$('shareResult').hidden=true;$('shareStatus').textContent='';$('shareCode').disabled=false;$('codeSettings').hidden=false;newCode();
  $('createLink').hidden=false;$('replaceNotice').hidden=!shareParty.has_link;$('createLink').textContent=shareParty.has_link?'Replace signing link':'Create signing link';
  $('replaceNotice').textContent='Replacing this link revokes the previous link and code.';
  if(shareParty.has_link&&!shareParty.revoked_at) {
    const existing=await api('signing?document='+state.data.document.id+'&action=link&party='+partyId);
    if(typeof existing.url!=='string')throw Error('Reload to retrieve the link.');
    $('shareUrl').value=existing.url;$('sharedCode').hidden=true;$('shareResult').hidden=false;
    $('replaceNotice').textContent='Use the existing link with its original code, or replace both below.';
  }
}
async function openShare(partyId=null) {
  if(state.saving)return;
  if(editable()&&!state.data.parties.some(p=>p.kind==='signer')){addParty();return;}
  await saveDraft();
  const parties=state.data.parties.filter(p=>p.kind==='signer'&&!p.signed_at);
  if(!parties.length)return;
  $('shareRecipient').replaceChildren();for(const p of parties){const option=node('option','',p.name);option.value=p.id;$('shareRecipient').append(option);}
  await loadShareParty(partyId||parties[0].id);$('shareDialog').showModal();
}
async function createLink() {
  const control=$('createLink');control.disabled=true;$('shareStatus').textContent='';$('shareResult').hidden=true;
  try {
    const code=$('shareCode').value;if(!/^\d{6}$/.test(code))throw Error('Enter six digits.');
    const data=await api('signing?document='+state.data.document.id+'&action=share',{method:'POST',body:{party_id:shareParty.id,code,replace:!!shareParty.has_link}});
    setSnapshot(data);shareParty=state.data.parties.find(p=>p.id===shareParty.id);
    $('shareUrl').value=data.url;$('codeDisplay').textContent=code;$('sharedCode').hidden=false;$('shareResult').hidden=false;$('shareCode').disabled=true;$('codeSettings').hidden=true;control.hidden=true;$('replaceNotice').hidden=true;
  }catch(e){$('shareStatus').textContent=e.message;}
  finally{control.disabled=false;}
}
async function copyText(value,description) {
  try { await navigator.clipboard.writeText(value);$('shareStatus').style.color='#26764e';$('shareStatus').textContent=description+' copied.'; }
  catch { const input=description==='Link'?$('shareUrl'):$('shareCode');input.disabled=false;input.select();$('shareStatus').textContent='Select and copy the '+description.toLowerCase()+'.'; }
}
function saveDownload(blob,filename) {
  const url=URL.createObjectURL(blob),link=node('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
async function downloadPdf() {
  if(state.busy)return;
  if(dirty())await saveDraft();
  state.busy=true;updateToolbar();const original=$('downloadPdf').innerHTML;
  try {
    const latest=await api(admin?'signing?document='+state.data.document.id:'signing-guest');setSnapshot(latest);
    const signed=new Set(latest.parties.filter(signedParty).map(p=>p.id)),fields=latest.fields.filter(f=>signed.has(f.party_id)&&f.has_signature);
    if(!fields.length){const r=await fetch(sourceUrl(),{headers:authHeaders(),credentials:'same-origin'});if(!r.ok)throw Error('Could not download the PDF.');saveDownload(await r.blob(),latest.document.filename);return;}
    const worker=new Worker('/document-signing/export-worker.js');
    await new Promise((resolve,reject)=>{
      worker.onmessage=({data})=>{if(data.status)$('downloadPdf').textContent='Preparing PDF…';if(data.error){worker.terminate();reject(Error(data.error));}if(data.bytes){saveDownload(new Blob([data.bytes],{type:'application/pdf'}),latest.document.filename.replace(/\.pdf$/i,'')+(signed.size===latest.parties.length?'-signed.pdf':'-partially-signed.pdf'));worker.terminate();resolve();}};
      worker.onerror=()=>{worker.terminate();reject(Error('The PDF could not be prepared on this device.'));};worker.postMessage({document:latest.document,fields,headers:authHeaders()});
    });
  } finally {state.busy=false;$('downloadPdf').innerHTML=original;updateToolbar();}
}
async function guestAccess(code) {
  $('accessError').textContent='';if(!linkToken)throw Error('Open the signing link provided by the sender.');
  const data=await api('signing-guest?action=access',{method:'POST',body:{token:linkToken,code}});
  if(data.requires_code){$('accessDescription').textContent='Enter your access code.';$('accessForm').hidden=false;$('accessCode').focus();return;}
  state.session=data.session;sessionStorage.setItem('wistudi_signing_'+linkToken,data.session);await startGuest(data);
}
async function startGuest(data) {
  setSnapshot(data);$('accessScreen').hidden=true;$('workbench').hidden=false;await loadViewer();status('');
}
async function init() {
  if(admin) {
    try {
      state.account=await api('session');if(!state.account.rooms.some(r=>r.room_id==='client'))throw Error('Client Room access is required.');
      const documentId=new URLSearchParams(location.search).get('document');if(documentId)await openDocument(documentId);else await loadList();status('');
    }catch(e){if(e.status===401){location.replace('/room-manager/?next=documents');return;}status(e.message,true);}
  } else {
    try {
      const saved=linkToken&&sessionStorage.getItem('wistudi_signing_'+linkToken);
      if(saved){state.session=saved;try{await startGuest(await api('signing-guest'));return;}catch{state.session=null;sessionStorage.removeItem('wistudi_signing_'+linkToken);$('accessScreen').hidden=false;$('workbench').hidden=true;}}
      await guestAccess();
    }catch(e){$('accessDescription').textContent='Document unavailable.';$('accessError').textContent=e.message;}
  }
}
$('prevPage').onclick=()=>run(()=>jumpTo(state.page-1));$('nextPage').onclick=()=>run(()=>jumpTo(state.page+1));
$('pageNumber').onchange=()=>run(()=>jumpTo($('pageNumber').value));$('zoom').onchange=()=>run(renderPage);
$('zoomOut').onclick=()=>run(()=>changeZoom(-.15));$('zoomIn').onclick=()=>run(()=>changeZoom(.15));$('pageWrap').onclick=placeSignature;
$('saveDraft').onclick=()=>run(()=>saveDraft());$('downloadPdf').onclick=()=>run(downloadPdf);
$('drawSignature').onclick=()=>run(openDrawing);$('uploadSignature').onclick=()=>{if(!currentSignatureParty())return;$('signatureUpload').click();};
$('signatureUpload').onchange=loadSignatureImage;$('useSignature').onclick=placeTemplate;$('cancelPlacement').onclick=clearPlacement;
$('signatureParty').onchange=()=>{state.activeParty=$('signatureParty').value;state.selected=null;state.template=null;clearPlacement();renderSidebar();};
$('removeSignature').onclick=()=>{const f=state.data.fields.find(f=>f.id===state.selected);if(f){state.signatures.set(f.id,null);renderFields();renderSidebar();updateToolbar();}};
$('closeSignature').onclick=$('cancelDrawing').onclick=()=>$('signatureDialog').close();$('acceptDrawing').onclick=acceptDrawing;
$('undoStroke').onclick=()=>{strokes.pop();paintDrawing();};$('clearDrawing').onclick=()=>{strokes=[];paintDrawing();};
const draw=$('drawCanvas');
draw.onpointerdown=e=>{e.preventDefault();const rect=draw.getBoundingClientRect();stroke=[[(e.clientX-rect.left)/rect.width*1200,(e.clientY-rect.top)/rect.height*400]];strokes.push(stroke);draw.setPointerCapture(e.pointerId);paintDrawing();};
draw.onpointermove=e=>{if(!stroke)return;e.preventDefault();const rect=draw.getBoundingClientRect();stroke.push([(e.clientX-rect.left)/rect.width*1200,(e.clientY-rect.top)/rect.height*400]);paintDrawing();};
draw.onpointerup=draw.onpointercancel=()=>{stroke=null;};
if(admin) {
  $('uploadPdfButton').onclick=()=>{state.upload=null;selectPdf();};$('pdfUpload').onchange=()=>uploadPdf($('pdfUpload').files[0]);
  $('documentFilter').onchange=()=>run(loadList);
  $('backToList').onclick=()=>run(async()=>{if(dirty()&&!confirm('Leave without saving?'))return;state.layoutDirty=false;state.signatures.clear();state.positions.clear();state.removed.clear();clearPlacement();history.replaceState(null,'',location.pathname);await loadList();});
  $('shareDocument').onclick=()=>run(()=>openShare());$('closeShare').onclick=()=>$('shareDialog').close();$('shareRecipient').onchange=()=>run(()=>loadShareParty($('shareRecipient').value));
  $('generateCode').onclick=newCode;$('createLink').onclick=createLink;$('copyLink').onclick=()=>copyText($('shareUrl').value,'Link');$('copyCode').onclick=()=>copyText($('codeDisplay').textContent,'Code');
  $('signOut').onclick=()=>run(async()=>{if(dirty()&&!confirm('Sign out without saving?'))return;await api('session',{method:'DELETE'});location.replace('/room-manager/');});
} else {
  $('accessForm').onsubmit=async e=>{e.preventDefault();$('accessSubmit').disabled=true;try{await guestAccess($('accessCode').value);}catch(e){$('accessError').textContent=e.message;}finally{$('accessSubmit').disabled=false;}};
}
window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>run(renderPage),200);});
window.addEventListener('beforeunload',e=>{if(dirty()){e.preventDefault();e.returnValue='';}});
init();
