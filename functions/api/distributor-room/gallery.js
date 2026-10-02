const REPO='wistuditeam-brent/wistudi-global-website';
const REF='main';
const ROOT='distributor-room/gallery/images';
const ALLOWED=new Set(['wistudi-events','real-moments','classroom-moments']);
const IMAGE_RE=/\.(?:avif|webp|jpe?g|png|gif)$/i;
const FALLBACK={
  'classroom-moments':[],
  'wistudi-events':["DSC08107.JPG","DSC08108.JPG","DSC08110.JPG","DSC08117.JPG","DSC08125.JPG","DSC08130.JPG","DSC08134.JPG","DSC08137.JPG","DSC08140.JPG","DSC08144.JPG","DSC08146.JPG","DSC08147.JPG","DSC08151.JPG","DSC08156.JPG"],
  'real-moments':["1790319488389_1416899042706692058_1416899042706692058_87efe9dd717f76d193789bfe9b511d88.jpg","1790319488442_1416899042706692058_1416899042706692058_d3a2ebe41b5c29326b665f0f0840c774.jpg","1790319488516_1416899042706692058_1416899042706692058_cd449f66a2a44adf34b355c0ab33d120.jpg","1790319488580_1416899042706692058_1416899042706692058_8524bf64b6c54d7feadece7cae3da4c6.jpg","1790319488663_1416899042706692058_1416899042706692058_4a939770382ab954c732e4660a187217.jpg","1790319488754_1416899042706692058_1416899042706692058_405eb31426a308a3b77761f02623dc4b.jpg","1790319488836_1416899042706692058_1416899042706692058_6023ee8080860216a5b94e885f52df8d.jpg","1790319488909_1416899042706692058_1416899042706692058_5946cf206bdd2be7c140d70b697666a8.jpg","1790319488988_1416899042706692058_1416899042706692058_448f857c2c637fa277c8582aec83e2bb.jpg","1790319489153_1416899042706692058_1416899042706692058_82af2f751f2f37eef14ff01ca8579419.jpg","1790319489406_1416899042706692058_1416899042706692058_f70834fd1cca4944035325ee13f9f211.jpg","1790319489491_1416899042706692058_1416899042706692058_ef54001095daf990db9ddb511c515dfd.jpg","1790319489563_1416899042706692058_1416899042706692058_377dc4610f2d8c49a9ad685b90228ae2.jpg","1790319489630_1416899042706692058_1416899042706692058_83656d8e2b39f326dc2d1e3e02280ad6.jpg","1790319489697_1416899042706692058_1416899042706692058_0dbebb5ecf07e424f99f1d9d01d98ef3.jpg","1790319489764_1416899042706692058_1416899042706692058_721a6b88f9e06d2407f43e4607d70ba2.jpg","1790319489846_1416899042706692058_1416899042706692058_e3baa792d708b62f74c7a8ef190b3b43.jpg","1790319489926_1416899042706692058_1416899042706692058_530e207cd035ff4bb0627703d717ae64.jpg","1790319489996_1416899042706692058_1416899042706692058_e8193574a26df381010ed871e8657a81.jpg","1790319490050_1416899042706692058_1416899042706692058_b3cb3a6846f84766627da3d31da7a91a.jpg","1790319490106_1416899042706692058_1416899042706692058_e424ca897b046ab0092ec3c5cdf91ac0.jpg","1790319490165_1416899042706692058_1416899042706692058_3436e11476b03c815240da7077801567.jpg","1790319490226_1416899042706692058_1416899042706692058_1d38816e4305856bf3a475ff20ab126b.jpg"]
};
function json(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store, no-cache, must-revalidate'
  }});
}
function fallbackImages(category){
  const folder=ROOT+'/'+category;
  return (FALLBACK[category]||[]).map(name=>({name,src:'/'+folder+'/'+encodeURIComponent(name)}));
}
export async function onRequestGet({request}){
  const url=new URL(request.url);
  const category=String(url.searchParams.get('category')||'').trim().toLowerCase();
  if(!ALLOWED.has(category))return json({ok:false,error:'invalid_category'},400);
  const folder=ROOT+'/'+category;
  const gh='https://api.github.com/repos/'+REPO+'/contents/'+folder+'?ref='+encodeURIComponent(REF)+'&t='+Date.now();
  try{
    const res=await fetch(gh,{
      cache:'no-store',
      headers:{
        'Accept':'application/vnd.github+json',
        'User-Agent':'Wistudi-Gallery',
        'X-GitHub-Api-Version':'2022-11-28',
        'Cache-Control':'no-cache'
      }
    });
    if(res.ok){
      const items=await res.json();
      const images=(Array.isArray(items)?items:[])
        .filter(item=>item&&item.type==='file'&&IMAGE_RE.test(item.name||''))
        .sort((a,b)=>String(a.name).localeCompare(String(b.name),undefined,{numeric:true,sensitivity:'base'}))
        .map(item=>({name:item.name,src:'/'+folder+'/'+encodeURIComponent(item.name)}));
      if(images.length)return json({ok:true,category,images,source:'github'});
    }
  }catch(_){}
  const images=fallbackImages(category);
  return json({ok:true,category,images,source:'fallback'});
}
export async function onRequest(context){
  if(context.request.method==='GET')return onRequestGet(context);
  return json({ok:false,error:'method_not_allowed'},405);
}
