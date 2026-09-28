const REPO='wistuditeam-brent/wistudi-global-website';
const REF='main';
const ROOT='distributor-room/gallery/images';
const ALLOWED=new Set(['wistudi-events','real-moments']);
const IMAGE_RE=/\.(?:avif|webp|jpe?g|png|gif)$/i;
function json(data,status=200,cache='public, max-age=30, s-maxage=120'){
  return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':cache}});
}
export async function onRequestGet({request}){
  const url=new URL(request.url);
  const category=String(url.searchParams.get('category')||'').trim().toLowerCase();
  if(!ALLOWED.has(category))return json({ok:false,error:'invalid_category'},400,'no-store');
  const cacheKey=new Request(url.origin+'/api/distributor-room/gallery?category='+encodeURIComponent(category));
  const cache=typeof caches!=='undefined'?caches.default:null;
  if(cache){const hit=await cache.match(cacheKey);if(hit)return hit}
  const folder=ROOT+'/'+category;
  const gh='https://api.github.com/repos/'+REPO+'/contents/'+folder+'?ref='+encodeURIComponent(REF);
  let res;
  try{
    res=await fetch(gh,{headers:{'Accept':'application/vnd.github+json','User-Agent':'Wistudi-Gallery','X-GitHub-Api-Version':'2022-11-28'}});
  }catch(_){return json({ok:false,error:'upstream_unavailable'},502,'no-store')}
  if(res.status===404){
    const out=json({ok:true,category,images:[]});
    if(cache)await cache.put(cacheKey,out.clone());
    return out;
  }
  if(!res.ok)return json({ok:false,error:'upstream_error'},502,'no-store');
  const items=await res.json();
  const images=(Array.isArray(items)?items:[])
    .filter(item=>item&&item.type==='file'&&IMAGE_RE.test(item.name||''))
    .sort((a,b)=>String(a.name).localeCompare(String(b.name),undefined,{numeric:true,sensitivity:'base'}))
    .map(item=>({name:item.name,src:'/'+folder+'/'+encodeURIComponent(item.name)}));
  const out=json({ok:true,category,images});
  if(cache)await cache.put(cacheKey,out.clone());
  return out;
}
export async function onRequest(context){if(context.request.method==='GET')return onRequestGet(context);return json({ok:false,error:'method_not_allowed'},405,'no-store')}