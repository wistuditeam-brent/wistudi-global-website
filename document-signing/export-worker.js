/* PDF-LIB is MIT licensed. See vendor/PDF-LIB-LICENSE.md. */
importScripts('/document-signing/vendor/pdf-lib.min.js','/document-signing/text-layout.js?v=3');
function toPdf(t,x,y){const det=t[0]*t[3]-t[1]*t[2];return [(t[3]*(x-t[4])-t[2]*(y-t[5]))/det,(-t[1]*(x-t[4])+t[0]*(y-t[5]))/det];}
self.onmessage=async({data})=>{try{
 const {document:d,fields=[],headers}=data;
 let text_fields=data.text_fields;
 const read=async url=>{const r=await fetch(url,{headers,credentials:'same-origin',cache:'no-store'});if(!r.ok)throw Error('Your access expired. Reload the document before downloading.');return r.arrayBuffer();};
 // Editors already open before text support may omit text_fields in their message.
 if(text_fields===undefined){
  const route=headers?.authorization||headers?.Authorization?'signing-guest':'signing?document='+d.id;
  const response=await fetch('/api/room-management/'+route,{headers,credentials:'same-origin',cache:'no-store'});
  if(!response.ok)throw Error('Your access expired. Reload the document before downloading.');
  const latest=await response.json(),signed=new Set(latest.parties.filter(p=>p.signed_at).map(p=>p.id));
  text_fields=(latest.text_fields||[]).filter(f=>signed.has(f.party_id)&&f.text.trim());
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
 if(text_fields.length){
  importScripts('/document-signing/vendor/fontkit.umd.min.js');
  pdf.registerFontkit(fontkit);
  const font=await pdf.embedFont(await read('/document-signing/fonts/InterVariable.ttf'),{subset:true,features:{liga:false,kern:false}});
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
 self.postMessage({status:'Preparing your signed PDF…'});
 const output=await pdf.save();self.postMessage({bytes:output.buffer},[output.buffer]);
}catch(e){self.postMessage({error:e.message||'The PDF could not be prepared. Please try again.'});}};
