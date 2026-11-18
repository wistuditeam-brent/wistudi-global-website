/* PDF-LIB is MIT licensed. See vendor/PDF-LIB-LICENSE.md. */
importScripts('/document-signing/vendor/pdf-lib.min.js');
function toPdf(t,x,y){const det=t[0]*t[3]-t[1]*t[2];return [(t[3]*(x-t[4])-t[2]*(y-t[5]))/det,(-t[1]*(x-t[4])+t[0]*(y-t[5]))/det];}
self.onmessage=async({data})=>{try{
 const {document:d,fields,headers}=data;
 const read=async url=>{const r=await fetch(url,{headers,credentials:'same-origin',cache:'no-store'});if(!r.ok)throw Error('Your access expired. Reload the document before downloading.');return r.arrayBuffer();};
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
 self.postMessage({status:'Preparing your signed PDF…'});
 const output=await pdf.save();self.postMessage({bytes:output.buffer},[output.buffer]);
}catch(e){self.postMessage({error:e.message||'The PDF could not be prepared. Please try again.'});}};
