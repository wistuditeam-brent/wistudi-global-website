import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

// Text extraction can succeed even when an embedded glyph is malformed and invisible.
// Render with Poppler and require visible ink in every non-space character's cell.
export async function assertRenderedText(bytes,pages,fields,font,fontLayout){
 const directory=await mkdtemp(join(tmpdir(),'wistudi-pdf-render-'));
 try{
  const path=join(directory,'export.pdf');await writeFile(path,new Uint8Array(bytes));
  for(const pageNumber of new Set(fields.map(f=>f.page))){
   const rendered=spawnSync('pdftoppm',['-f',String(pageNumber),'-l',String(pageNumber),'-singlefile','-cropbox','-r','216',path],{maxBuffer:64*1024*1024});
   assert.ifError(rendered.error);assert.equal(rendered.status,0,rendered.stderr?.toString());
   const ppm=rendered.stdout;let at=0;
   function token(){while(ppm[at]<=32)at++;while(ppm[at]===35){while(ppm[at]!==10)at++;while(ppm[at]<=32)at++;}const start=at;while(ppm[at]>32)at++;return ppm.subarray(start,at).toString();}
   assert.equal(token(),'P6');const width=Number(token()),height=Number(token());assert.equal(token(),'255');if(ppm[at]===13)at++;assert.equal(ppm[at++],10);
   const pixels=ppm.subarray(at),meta=pages[pageNumber-1],sx=width/meta.width,sy=height/meta.height;assert.equal(pixels.length,width*height*3);
   const measure=value=>font.layout(value,{liga:false,kern:false}).glyphs.reduce((sum,g)=>sum+g.advanceWidth/font.unitsPerEm,0);
   for(const field of fields.filter(f=>f.page===pageNumber&&f.text.trim())){
    const layout=fontLayout(field,meta,measure),glyphs=font.layout(field.text,{liga:false,kern:false}).glyphs,characters=Array.from(field.text);let left=field.x*meta.width;
    for(const [index,glyph] of glyphs.entries()){
     const advance=glyph.advanceWidth/font.unitsPerEm*layout.size,character=characters[index]||String.fromCodePoint(...(glyph.codePoints||[32]));
     if(character.trim()){
      const x0=Math.max(0,Math.ceil((left+advance*.05)*sx)),x1=Math.min(width,Math.floor((left+advance*.95)*sx));
      const y0=Math.max(0,Math.floor(field.y*meta.height*sy)),y1=Math.min(height,Math.ceil((field.y+field.height)*meta.height*sy));let ink=0;
      for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*width+x)*3;if(pixels[i]<180&&pixels[i+1]<180&&pixels[i+2]<180)ink++;}
      assert.ok(ink>=4,`Invisible or malformed character ${JSON.stringify(character)} in ${JSON.stringify(field.text)} on page ${pageNumber} (${ink} dark pixels)`);
     }
     left+=advance;
    }
   }
  }
 }finally{await rm(directory,{recursive:true,force:true});}
}
