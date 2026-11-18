// Local test fixture only. Never used by the production Pages Functions.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname,resolve} from 'node:path';
import {createRequire} from 'node:module';
import {harness,root,cookie} from './harness.mjs';
const h=await harness(),require=createRequire(import.meta.url),{PDFDocument,PageSizes}=require('pdf-lib');
const server=createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://'+req.headers.host);
 if(url.pathname==='/__fixture/login'){res.writeHead(302,{'set-cookie':cookie+'; Path=/api/room-management/; HttpOnly; SameSite=Lax','location':'/room-manager/documents/'});res.end();return;}
 if(url.pathname==='/__fixture/a4.pdf'){const pdf=await PDFDocument.create();pdf.addPage(PageSizes.A4).drawText('A4 portrait agreement',{x:40,y:780});pdf.addPage([PageSizes.A4[1],PageSizes.A4[0]]).drawText('A4 landscape agreement',{x:40,y:540});res.writeHead(200,{'content-type':'application/pdf'});res.end(Buffer.from(await pdf.save()));return;}
 if(url.pathname.startsWith('/api/')){const chunks=[];for await(const c of req)chunks.push(c);const response=await h.mf.dispatchFetch(url.href,{method:req.method,headers:req.headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;}
 const path=resolve(root,'.'+url.pathname+(url.pathname.endsWith('/')?'index.html':''));if(!path.startsWith(root))throw Error('Invalid path');const data=await readFile(path);res.writeHead(200,{'content-type':{'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml'}[extname(path)]||'application/octet-stream'});res.end(data);
 }catch(e){res.writeHead(404);res.end(e.message);}});
const port=Number(process.argv[process.argv.indexOf('--port')+1])||Number(process.env.PORT)||3000;
const host=process.argv.includes('--host')?process.argv[process.argv.indexOf('--host')+1]:'0.0.0.0';
server.listen(port,host,()=>console.log('Signing test fixture ready on '+server.address().port));
process.on('SIGTERM',async()=>{server.close();await h.close();process.exit(0);});
