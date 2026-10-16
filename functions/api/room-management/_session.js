const enc=new TextEncoder();
export async function managerAuthorized(request,env){
 const secret=env.ROOM_MANAGER_TOKEN;if(!secret)return false;
 const raw=(request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('wistudi_room_session='));
 if(!raw)return false;
 const parts=raw.slice('wistudi_room_session='.length).split('.');if(parts.length!==3)return false;
 const [expiry,nonce,signature]=parts;
 if(!/^\d{10,12}$/.test(expiry)||!/^[0-9a-f-]{36}$/.test(nonce)||!/^[0-9a-f]{64}$/.test(signature)||Number(expiry)<Date.now()/1000)return false;
 const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 const sig=new Uint8Array(signature.match(/../g).map(x=>parseInt(x,16)));
 return crypto.subtle.verify('HMAC',key,sig,enc.encode(expiry+'.'+nonce));
}
