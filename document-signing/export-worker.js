/* PDF-LIB is MIT licensed. See vendor/PDF-LIB-LICENSE.md. */
importScripts('/document-signing/vendor/pdf-lib.min.js','/document-signing/text-layout.js?v=3');
function toPdf(t,x,y){const det=t[0]*t[3]-t[1]*t[2];return [(t[3]*(x-t[4])-t[2]*(y-t[5]))/det,(-t[1]*(x-t[4])+t[0]*(y-t[5]))/det];}
self.onmessage=async({data})=>{try{
 const {headers}=data;
 let d=data.document;
 const read=async url=>{const r=await fetch(url,{headers,credentials:'same-origin',cache:'no-store'});if(!r.ok)throw Error('Your access expired. Reload the document before downloading.');return r.arrayBuffer();};
 // Read the authoritative approved text even for an older editor already open.
 let fields=[],text_fields=[],reviewPending=false;
 {
  const route=headers?.authorization||headers?.Authorization?'signing-guest':'signing?document='+d.id;
  const response=await fetch('/api/room-management/'+route,{headers,credentials:'same-origin',cache:'no-store'});
  if(!response.ok)throw Error('Your access expired. Reload the document before downloading.');
  const latest=await response.json();if(latest.document.id!==d.id)throw Error('Document access changed. Reload before downloading.');
  d=latest.document;const signed=new Set(latest.parties.filter(p=>p.signed_at).map(p=>p.id));
  fields=latest.fields.filter(f=>signed.has(f.party_id)&&f.has_signature);
  // The legally approved PDF contains only text from the last fully approved version.
  // An explicitly requested review copy displays the latest pending text but must be marked as NOT FINAL.
  reviewPending=data.review_pending===true && (latest.document_text?.revision||0)>(latest.document_text?.approved_revision||0);
  const documentText=reviewPending ? latest.document_text.fields : latest.approved_document_text_fields;
  text_fields=[...(latest.text_fields||[]).filter(f=>signed.has(f.party_id)&&f.text.trim()),...(documentText||[])];
 }
 self.postMessage({status:'Reading the original PDF…'});
 const bytes=await read('/api/room-management/signing-file?document='+d.id);
 const {PDFDocument,pushGraphicsState,popGraphicsState,concatTransformationMatrix,drawObject}=PDFLib;
 const pdf=await PDFDocument.load(bytes,{updateMetadata:false});
 for(let i=0;i<fields.length;i++){
  const f=fields[i],meta=d.pages[f.page-1],page=pdf.getPage(f.page-1);
  const image=await pdf.embedPng(await read(f.signature_url));
  const left=f.x*meta.width,top=f.y*meta.height,right=(f.x+f.width)*meta.width,bottom=(f.y+f.height)*meta.height;
  const p0=toPdf(meta.transform,left,top),p1=toPdf(meta.transform,left,bottom),p2=toPdf(meta.transform,right,bottom);
  const name=page.node.newXObject('Signature',image.ref);
  page.pushOperators(pushGraphicsState(),concatTransformationMatrix(p2[0]-p1[0],p2[1]-p1[1],p0[0]-p1[0],p0[1]-p1[1],p1[0],p1[1]),drawObject(name),popGraphicsState());
  self.postMessage({status:'Adding signature '+(i+1)+' of '+fields.length+'…'});
 }
 // The variable-font subset encoder produced malformed glyf records and invisible letters.
 // Embed the complete official static font so existing and new records render reliably.
 if(text_fields.length){
  importScripts('/document-signing/vendor/fontkit.umd.min.js');
  pdf.registerFontkit(fontkit);
  const font=await pdf.embedFont(await read('/document-signing/fonts/Inter-Regular.ttf'),{subset:false,features:{liga:false,kern:false}});
  for(const f of text_fields){
   if(!f.text?.trim())continue;
   const meta=d.pages[f.page-1],page=pdf.getPage(f.page-1),left=f.x*meta.width,top=f.y*meta.height;
   const layout=self.SigningTextLayout(f,meta,value=>font.widthOfTextAtSize(value,1));
   const origin=toPdf(meta.transform,left,top),right=toPdf(meta.transform,left+1,top),up=toPdf(meta.transform,left,top-1);
   page.pushOperators(pushGraphicsState(),concatTransformationMatrix(right[0]-origin[0],right[1]-origin[1],up[0]-origin[0],up[1]-origin[1],origin[0],origin[1]));
   page.drawText(f.text,{x:0,y:-layout.baseline,size:layout.size,font,color:PDFLib.rgb(29/255,32/255,48/255)});
   page.pushOperators(popGraphicsState());
  }
 }
 if(reviewPending){
  const marker=await pdf.embedFont(PDFLib.StandardFonts.HelveticaBold);
  for(const page of pdf.getPages()){
   const box=page.getCropBox(),label='REVIEW COPY - TEXT APPROVAL PENDING';
   const size=Math.min(11,Math.max(7,(box.width-36)/marker.widthOfTextAtSize(label,1)));
   page.drawText(label,{x:box.x+18,y:box.y+16,size,font:marker,color:PDFLib.rgb(.68,.13,.16)});
   page.drawText(label,{x:box.x+18,y:box.y+box.height-26,size,font:marker,color:PDFLib.rgb(.68,.13,.16),opacity:.8});
  }
 }
 self.postMessage({status:'Preparing your PDF…'});
 const output=await pdf.save();self.postMessage({bytes:output.buffer,review_pending:reviewPending},[output.buffer]);
}catch(e){self.postMessage({error:e.message||'The PDF could not be prepared. Please try again.'});}};
