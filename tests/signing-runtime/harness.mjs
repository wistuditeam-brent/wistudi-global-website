import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {Miniflare}=require('miniflare');
export const root=fileURLToPath(new URL('../../',import.meta.url));
export const managerId='00000000-0000-4000-a000-000000000001',managerSession='00000000-0000-4000-a000-000000000002';
export const cookie='wistudi_room_session='+managerSession;
export async function harness(){
 const mf=new Miniflare({modules:true,scriptPath:fileURLToPath(new URL('./worker.mjs',import.meta.url)),modulesRules:[{type:'ESModule',include:['**/*.js'],fallthrough:true}],compatibilityDate:'2026-08-01',d1Databases:{ROOM_DB:'signing-test'},r2Buckets:['ROOM_MEDIA']});
 const db=await mf.getD1Database('ROOM_DB');
 for(const filename of ['0002_room_managers.sql','0003_security.sql'])await db.exec((await readFile(root+'room-management/migrations/'+filename,'utf8')).replace(/\n/g,' '));
 await db.prepare('INSERT INTO room_managers(id,email,password_salt,password_hash) VALUES(?,?,?,?)').bind(managerId,'admin@example.test','test-salt','test-hash').run();
 await db.prepare("INSERT INTO room_manager_permissions(manager_id,room_id,role) VALUES(?,'client','admin')").bind(managerId).run();
 await db.prepare('INSERT INTO room_manager_sessions(id,manager_id,expires_at) VALUES(?,?,?)').bind(managerSession,managerId,Math.floor(Date.now()/1000)+86400).run();
 async function request(path,{method='GET',body,as='manager',token,origin='http://localhost',headers={}}={}){
  const h={...headers};if(as==='manager')h.cookie=cookie;if(token)h.authorization='Bearer '+token;if(method!=='GET'&&method!=='HEAD')h.origin=origin;
  if(body!==undefined&&!(body instanceof Uint8Array)){h['content-type']='application/json';body=JSON.stringify(body);}else if(body){h['content-type']='application/octet-stream';h['content-length']=String(body.byteLength);}
  const response=await mf.dispatchFetch('http://localhost/api/room-management/'+path,{method,headers:h,body});
  return response;
 }
 return {mf,db,request,async json(path,options){const r=await request(path,options);return {status:r.status,body:await r.json()};},close:()=>mf.dispose()};
}
