// Backward-compatible gallery API: use the published static manifest, not GitHub at request time.
// The current EN/VI gallery pages read the same manifest directly without calling this endpoint.
const ALLOWED=new Set(['wistudi-events','real-moments','classroom-moments']);
const MANIFEST='/distributor-room/gallery/gallery-manifest.js';
const PREFIX='window.WISTUDI_GALLERY_MANIFEST=';

function json(data,status=200,cache=false){
  return new Response(JSON.stringify(data),{status,headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':cache?
      'public, max-age=60, s-maxage=300, stale-while-revalidate=3600':
      'no-store'
  }});
}

export async function onRequestGet({request,env}){
  const url=new URL(request.url);
  const category=String(url.searchParams.get('category')||'').trim().toLowerCase();
  if(!ALLOWED.has(category))return json({ok:false,error:'invalid_category'},400);
  try{
    const assetUrl=new URL(MANIFEST,request.url);
    const asset=await env.ASSETS.fetch(assetUrl.toString());
    if(!asset.ok)throw new Error('manifest_not_available');
    const script=await asset.text();
    const index=script.indexOf(PREFIX);
    if(index<0)throw new Error('manifest_invalid');
    const data=JSON.parse(script.slice(index+PREFIX.length).trim().replace(/;\s*$/,''));
    if(!Array.isArray(data[category]))throw new Error('collection_invalid');
    const images=data[category].map(item=>{
      if(typeof item==='string'){
        const src='/distributor-room/gallery/images/'+category+'/'+encodeURIComponent(item);
        return {name:item,src,thumb:src,display:src,original:src};
      }
      return {
        name:item.name,
        src:item.thumb,
        thumb:item.thumb,
        display:item.display||item.thumb,
        original:item.original||''
      };
    });
    return json({ok:true,category,images,source:'static-manifest'},200,true);
  }catch(error){
    console.error('gallery manifest unavailable',String(error));
    return json({ok:false,category,error:'gallery_unavailable',images:[]},503);
  }
}

export async function onRequest(context){
  if(context.request.method==='GET')return onRequestGet(context);
  return json({ok:false,error:'method_not_allowed'},405);
}
