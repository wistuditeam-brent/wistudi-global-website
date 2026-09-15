const ZIP_URL = "https://cdn.creativeclaw.co/u/00b01161/zips/8db3ac2d-b13b-46a6-8182-8812f2f08087.zip";
const PDF_FILENAME = "Building-a-Complete-Communicative-ESL-Lesson-with-Flow.pdf";

function u16(b,o){return b[o]|(b[o+1]<<8)}
function u32(b,o){return (b[o]|(b[o+1]<<8)|(b[o+2]<<16)|(b[o+3]<<24))>>>0}

async function getPdf(){
  const r=await fetch(ZIP_URL,{cf:{cacheEverything:true,cacheTtl:86400}});
  if(!r.ok) throw new Error("Worksheet source unavailable");
  const b=new Uint8Array(await r.arrayBuffer());
  if(u32(b,0)!==0x04034b50) throw new Error("Invalid worksheet package");
  const flags=u16(b,6),method=u16(b,8),size=u32(b,18),nameLen=u16(b,26),extraLen=u16(b,28);
  if(flags&0x08) throw new Error("Unsupported worksheet package");
  const start=30+nameLen+extraLen;
  const packed=b.slice(start,start+size);
  if(method===0) return packed;
  if(method===8){
    const ds=new DecompressionStream("deflate-raw");
    return new Uint8Array(await new Response(new Blob([packed]).stream().pipeThrough(ds)).arrayBuffer());
  }
  throw new Error("Unsupported worksheet compression");
}

export async function onRequestGet({request}){
  try{
    const url=new URL(request.url);
    const pdf=await getPdf();
    const download=url.searchParams.get("download")==="1";
    return new Response(pdf,{
      headers:{
        "Content-Type":"application/pdf",
        "Content-Disposition":(download?"attachment":"inline")+"; filename=\""+PDF_FILENAME+"\"",
        "Cache-Control":"public, max-age=86400, s-maxage=604800",
        "X-Content-Type-Options":"nosniff"
      }
    });
  }catch(e){
    return new Response("The worksheet is temporarily unavailable.",{status:502,headers:{"Content-Type":"text/plain; charset=utf-8"}});
  }
}
