import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {extname} from 'node:path';
import assert from 'node:assert/strict';
import {harness,root,cookie} from './harness.mjs';
const require=createRequire(import.meta.url),{PDFDocument,PageSizes}=require('pdf-lib');
const runtimeRequire=createRequire(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/package.json');
const {chromium}=runtimeRequire('playwright');
const h=await harness(),browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']}),errors=[];
const origin='https://signing.test';
const context=await browser.newContext({viewport:{width:1440,height:1050},acceptDownloads:true});
async function wire(ctx){
 await ctx.route(origin+'/**',async route=>{try{
  const req=route.request(),url=new URL(req.url());
  if(url.pathname.startsWith('/api/')){const response=await h.mf.dispatchFetch(req.url(),{method:req.method(),headers:req.headers(),body:['GET','HEAD'].includes(req.method())?undefined:req.postDataBuffer()});return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:Buffer.from(await response.arrayBuffer())});}
  const path=root+url.pathname.replace(/^\//,'')+(url.pathname.endsWith('/')?'index.html':'');const body=await readFile(path);const type={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.txt':'text/plain'}[extname(path)]||'application/octet-stream';return route.fulfill({status:200,contentType:type,body});
 }catch(e){console.error('Route failure',e.message);await route.fulfill({status:404,body:'Not found'});}});
 ctx.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
}
try{
 await wire(context);await context.addCookies([{name:'wistudi_room_session',value:cookie.split('=')[1],url:origin+'/api/room-management/'}]);
 const page=await context.newPage();await page.goto(origin+'/room-manager/documents/');
 await page.getByRole('button',{name:'Upload PDF to Sign',exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:/upload/i}).count(),1);
 const pdf=await PDFDocument.create();pdf.addPage(PageSizes.A4).drawText('UI TEST ONLY - NOT A CONTRACT',{x:40,y:780});pdf.addPage([PageSizes.A4[1],PageSizes.A4[0]]).drawText('A4 landscape UI test',{x:40,y:540});
 await page.locator('#pdfUpload').setInputFiles({name:'a4-browser-qa.pdf',mimeType:'application/pdf',buffer:Buffer.from(await pdf.save())});
 await page.locator('#workbench').waitFor({state:'visible',timeout:30000});await page.locator('#pageLoading').waitFor({state:'hidden'});
 assert.match(await page.locator('#pageSize').textContent(),/A4 portrait/);
 await page.getByRole('radio',{name:'I am signing',exact:true}).check();await page.getByLabel('Full name',{exact:true}).fill('Manager UI Test');
 for(const [i,value] of ['Manager UI Test','Director','18/11/2026'].entries()){
  await page.getByRole('button',{name:'Add text',exact:true}).click();const box=await page.locator('#pageWrap').boundingBox();await page.mouse.click(box.x+box.width*.25,box.y+box.height*(.45+i*.05));await page.locator('.pdf-text-input').last().fill(value);
 }
 await page.getByRole('button',{name:'Add party',exact:true}).click();await page.getByLabel('Full name',{exact:true}).nth(1).fill('Recipient UI Test');
 await page.getByLabel('Party',{exact:true}).selectOption({label:'Manager UI Test'});
 await page.getByRole('button',{name:'Draw signature',exact:true}).click();const canvas=await page.locator('#drawCanvas').boundingBox();
 await page.mouse.move(canvas.x+canvas.width*.2,canvas.y+canvas.height*.6);await page.mouse.down();for(let i=0;i<20;i++)await page.mouse.move(canvas.x+canvas.width*(.2+i*.025),canvas.y+canvas.height*(.5+Math.sin(i*.8)*.18));await page.mouse.up();
 await page.locator('#signatureDialog').getByRole('button',{name:'Use signature',exact:true}).click();let bounds=await page.locator('#pageWrap').boundingBox();await page.mouse.click(bounds.x+bounds.width*.25,bounds.y+bounds.height*.72);
 const ownField=page.locator('.signature-field').first();const fieldBounds=await ownField.boundingBox();await page.mouse.move(fieldBounds.x+fieldBounds.width/2,fieldBounds.y+fieldBounds.height/2);await page.mouse.down();await page.mouse.move(fieldBounds.x+fieldBounds.width/2+30,fieldBounds.y+fieldBounds.height/2+15,{steps:5});await page.mouse.up();
 await page.getByRole('button',{name:'Save draft',exact:true}).click();await page.getByText('Saved',{exact:true}).waitFor();
 await page.locator('#signingConsent').check();await page.getByRole('button',{name:'Submit signature',exact:true}).click();await page.locator('.signature-field.signed').waitFor();
 await page.getByRole('button',{name:'Share for signing',exact:true}).click();await page.locator('#shareCode').fill('012345');await page.locator('#shareDialog').getByRole('button',{name:'Create signing link',exact:true}).click();await page.locator('#shareResult').waitFor({state:'visible'});const link=await page.locator('#shareUrl').inputValue();await page.locator('#closeShare').click();
 const guestContext=await browser.newContext({viewport:{width:1366,height:1000},acceptDownloads:true});await wire(guestContext);const guestPage=await guestContext.newPage();await guestPage.goto(link);await guestPage.locator('#accessForm').waitFor({state:'visible'});await guestPage.locator('#accessCode').fill('111111');await guestPage.getByRole('button',{name:'Open document',exact:true}).click();await guestPage.getByText('That access code is incorrect.').waitFor();await guestPage.locator('#accessCode').fill('012345');await guestPage.getByRole('button',{name:'Open document',exact:true}).click();await guestPage.locator('#workbench').waitFor({state:'visible'});await guestPage.locator('#pageLoading').waitFor({state:'hidden'});assert.equal(await guestPage.locator('.signature-field.signed').count(),1);
 await guestPage.getByRole('button',{name:'Next page',exact:true}).click();await guestPage.getByText('A4 landscape',{exact:true}).waitFor();
 await guestPage.getByRole('button',{name:'Add text',exact:true}).click();bounds=await guestPage.locator('#pageWrap').boundingBox();await guestPage.mouse.click(bounds.x+bounds.width*.3,bounds.y+bounds.height*.6);await guestPage.locator('.pdf-text-input').fill('Recipient UI Test');
 const field=await h.db.prepare('SELECT signature_key FROM room_signing_fields WHERE signature_key IS NOT NULL LIMIT 1').first();const bucket=await h.mf.getR2Bucket('ROOM_MEDIA'),image=await bucket.get(field.signature_key);await guestPage.locator('#signatureUpload').setInputFiles({name:'signature.png',mimeType:'image/png',buffer:Buffer.from(await image.arrayBuffer())});await guestPage.locator('#signaturePreview').waitFor({state:'visible'});
 bounds=await guestPage.locator('#pageWrap').boundingBox();await guestPage.mouse.click(bounds.x+bounds.width*.3,bounds.y+bounds.height*.73);await guestPage.getByRole('button',{name:'Save draft',exact:true}).click();await guestPage.reload();await guestPage.locator('#workbench').waitFor({state:'visible'});await guestPage.getByRole('button',{name:/Page 2 Added/}).click();await guestPage.locator('#signingConsent').check();await guestPage.getByRole('button',{name:'Submit signature',exact:true}).click();await guestPage.getByRole('heading',{name:'Signing complete',exact:true}).waitFor();assert.match(await guestPage.locator('#documentActivity').textContent(),/Signed/);assert.equal(await guestPage.locator('.pdf-text-input').count(),0);
 const downloadPromise=page.waitForEvent('download');await page.locator('#downloadPdf').click();const download=await downloadPromise;const finalPdf=await PDFDocument.load(await readFile(await download.path()));assert.equal(finalPdf.getPageCount(),2);assert.ok(Math.abs(finalPdf.getPage(0).getWidth()-595.28)<1);assert.ok(Math.abs(finalPdf.getPage(1).getWidth()-841.89)<1);assert.equal(download.suggestedFilename(),'a4-browser-qa-signed.pdf');
 await mkdir(root+'tests/signing-runtime/evidence',{recursive:true});await page.screenshot({path:root+'tests/signing-runtime/evidence/manager-desktop.png',fullPage:true});await guestPage.setViewportSize({width:390,height:844});await guestPage.waitForTimeout(300);assert.equal(await guestPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await guestPage.screenshot({path:root+'tests/signing-runtime/evidence/recipient-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS: direct upload, handwritten modal, draggable placement, separate party link, account-free code, transparent image, shared history, A4 export and mobile layout.');
}finally{await browser.close();await h.close();}
