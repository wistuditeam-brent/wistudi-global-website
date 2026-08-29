import { chromium } from 'playwright';
import fs from 'node:fs';

const base=process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const paths=['/','/platform/','/blocks-activities/','/organisations/','/contact/','/resources/','/resources/all/','/resources/guides/','/resources/events/','/resources/community-notes/wistudi-at-vietnam-edtech-expo-2026/'];
const viewports=[
  {name:'desktop',width:1440,height:900},
  {name:'mobile',width:390,height:844}
];
fs.mkdirSync('qa-artifacts',{recursive:true});
let failures=[];
const browser=await chromium.launch({headless:true});

for(const viewport of viewports){
  for(const path of paths){
    const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height}});
    const pageErrors=[]; const consoleErrors=[]; const requestFailures=[]; const badImageResponses=[];
    page.on('pageerror',e=>pageErrors.push(String(e)));
    page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
    page.on('requestfailed',r=>requestFailures.push(`${r.url()} :: ${r.failure()?.errorText||'failed'}`));
    page.on('response',r=>{if(r.request().resourceType()==='image' && r.status()>=400) badImageResponses.push(`${r.status()} ${r.url()}`)});
    const label=`${path} [${viewport.name}]`;
    try{
      const res=await page.goto(base+path,{waitUntil:'domcontentloaded',timeout:12000});
      if(!res || res.status()>=400) failures.push(`${label}: HTTP ${res?.status()}`);
      await page.waitForTimeout(350);

      await page.evaluate(async()=>{
        const pause=ms=>new Promise(r=>setTimeout(r,ms));
        const step=Math.max(350,Math.floor(innerHeight*.6));
        for(let cycle=0;cycle<2;cycle++){
          for(let y=0;y<document.documentElement.scrollHeight;y+=step){scrollTo(0,y);await pause(45);}
          scrollTo(0,document.documentElement.scrollHeight);await pause(100);
          scrollTo(0,0);await pause(100);
        }
      });
      await page.waitForTimeout(450);

      // Give every image that the browser knows about a chance to decode before measuring it.
      await page.evaluate(async()=>{
        await Promise.all([...document.images].map(async img=>{
          if(!img.complete){
            await new Promise(resolve=>{
              const done=()=>resolve();
              img.addEventListener('load',done,{once:true});
              img.addEventListener('error',done,{once:true});
              setTimeout(done,2500);
            });
          }
          try{await img.decode?.();}catch(_){ }
        }));
      });

      const health=await page.evaluate(()=>{
        const sections=[...document.querySelectorAll('main > section, main article, main .section')];
        const invisibleLarge=sections.map((el,index)=>{
          const r=el.getBoundingClientRect();
          const s=getComputedStyle(el);
          const opacity=Number.parseFloat(s.opacity||'1');
          const hidden=s.display==='none'||s.visibility==='hidden'||opacity<0.12;
          return {index,tag:el.tagName,cls:el.className||'',id:el.id||'',height:r.height,opacity,hidden};
        }).filter(x=>x.height>140&&x.hidden);
        const revealSections=[...document.querySelectorAll('.ws-scroll-section')].map(el=>({
          id:el.id||'',cls:el.className||'',opacity:Number.parseFloat(getComputedStyle(el).opacity||'1'),height:el.getBoundingClientRect().height
        }));
        return {
          text:(document.body.innerText||'').trim().length,
          height:document.documentElement.scrollHeight,
          viewport:innerHeight,
          images:[...document.images].filter(i=>i.offsetParent!==null).map(i=>{
            const s=getComputedStyle(i);
            return {
              src:i.getAttribute('src'),currentSrc:i.currentSrc,originalSrc:i.dataset.wsOriginalSrc||'',
              complete:i.complete,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,
              clientWidth:i.clientWidth,clientHeight:i.clientHeight,
              fallback:i.dataset.wsFallback==='1'||i.classList.contains('res-image-fallback'),
              objectFit:s.objectFit||'',alt:i.alt||''
            };
          }),
          visibleBlocks:sections.filter(el=>{const r=el.getBoundingClientRect();const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&Number.parseFloat(s.opacity||'1')>.12&&r.height>30}).length,
          invisibleLarge,
          revealSections
        };
      });

      if(health.text<250) failures.push(`${label}: suspiciously little page text (${health.text} chars)`);
      if(health.height < health.viewport*1.05 && path!='/contact/') failures.push(`${label}: page height suggests content did not render (${health.height}px)`);
      if(health.visibleBlocks<1) failures.push(`${label}: no substantial painted content sections`);
      for(const s of health.invisibleLarge) failures.push(`${label}: large section remains visually hidden after scroll (${s.id||s.cls||s.tag}, ${Math.round(s.height)}px high, opacity ${s.opacity})`);
      if(['/','/platform/','/blocks-activities/','/organisations/'].includes(path)){
        for(const s of health.revealSections){
          if(s.height>120 && s.opacity<0.85) failures.push(`${label}: reveal section never became visible (${s.id||s.cls}, opacity ${s.opacity})`);
        }
      }

      for(const i of health.images){
        if(i.fallback) failures.push(`${label}: image fallback was triggered for ${i.originalSrc||i.src||i.alt}`);
        if(!i.complete || i.naturalWidth===0 || i.naturalHeight===0) failures.push(`${label}: broken image ${i.src||i.currentSrc}`);
        const isEditorial=(i.currentSrc||i.src||'').includes('/assets/images/resources/') && !(i.currentSrc||i.src||'').includes('media-fallback.svg');
        if(isEditorial && i.clientWidth>=500 && i.naturalWidth>0){
          const ratio=i.naturalWidth/i.clientWidth;
          if(ratio<1.25) failures.push(`${label}: editorial image lacks source resolution ${i.currentSrc||i.src} (${i.naturalWidth}px source vs ${i.clientWidth}px rendered; ${ratio.toFixed(2)}x, minimum 1.25x)`);
        }
        if(isEditorial && i.clientHeight>=300 && i.naturalHeight>0){
          const ratio=i.naturalHeight/i.clientHeight;
          if(ratio<1.1 && i.objectFit!=='cover') failures.push(`${label}: editorial image height is being stretched ${i.currentSrc||i.src} (${i.naturalHeight}px source vs ${i.clientHeight}px rendered)`);
        }
      }
      for(const bad of badImageResponses) failures.push(`${label}: image HTTP failure ${bad}`);

      const delay=await page.evaluate(()=>new Promise(resolve=>{const start=performance.now();setTimeout(()=>resolve(performance.now()-start),75)}));
      if(delay>350) failures.push(`${label}: event loop responsiveness poor (${Math.round(delay)}ms for 75ms timer)`);

      const shot=(path.replace(/\W+/g,'-').replace(/^-|-$/g,'')||'home');
      await page.screenshot({path:`qa-artifacts/${shot}-${viewport.name}.png`,fullPage:true});

      if(path==='/resources/' && viewport.name==='desktop'){
        const article=page.locator('a[href="/resources/community-notes/wistudi-at-vietnam-edtech-expo-2026/"]').first();
        if(await article.count()){
          await article.click({timeout:5000});
          if(!page.url().includes('/resources/community-notes/wistudi-at-vietnam-edtech-expo-2026/')) failures.push('/resources/: article card did not navigate');
          await page.goBack({waitUntil:'domcontentloaded'});
        } else failures.push('/resources/: featured article link missing');
        const browse=page.locator('a[href="/resources/all/"]').filter({hasText:'Browse all notes'}).first();
        if(await browse.count()){
          await browse.click({timeout:5000});
          if(!page.url().includes('/resources/all/')) failures.push('/resources/: Browse all notes did not navigate');
        } else failures.push('/resources/: Browse all notes link missing');
      }
    }catch(e){ failures.push(`${label}: ${e.message}`); }
    for(const e of pageErrors) failures.push(`${label}: pageerror ${e}`);
    for(const e of consoleErrors.filter(x=>!/favicon|Failed to load resource.*404/i.test(x))) failures.push(`${label}: console ${e}`);
    for(const e of requestFailures.filter(x=>!x.includes('favicon'))) failures.push(`${label}: request failed ${e}`);
    await page.close();
  }
}
await browser.close();
if(failures.length){
  console.error('Browser QA FAILED');
  for(const f of failures) console.error(' - '+f);
  process.exit(1);
}
console.log('Browser QA PASSED');
