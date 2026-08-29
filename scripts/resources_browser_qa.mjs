import { chromium } from 'playwright';
import fs from 'node:fs';

const base=process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const paths=['/','/platform/','/blocks-activities/','/organisations/','/contact/','/resources/','/resources/all/','/resources/guides/','/resources/events/','/resources/community-notes/wistudi-at-vietnam-edtech-expo-2026/'];
fs.mkdirSync('qa-artifacts',{recursive:true});
let failures=[];
const browser=await chromium.launch({headless:true});
for(const path of paths){
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const pageErrors=[]; const consoleErrors=[]; const requestFailures=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
  page.on('requestfailed',r=>requestFailures.push(`${r.url()} :: ${r.failure()?.errorText||'failed'}`));
  try{
    const res=await page.goto(base+path,{waitUntil:'domcontentloaded',timeout:12000});
    if(!res || res.status()>=400) failures.push(`${path}: HTTP ${res?.status()}`);
    await page.waitForTimeout(350);

    // Stress scrolling is deliberate: the reported regression appears after repeated navigation/scrolling.
    await page.evaluate(async()=>{
      const pause=ms=>new Promise(r=>setTimeout(r,ms));
      const step=Math.max(450,Math.floor(innerHeight*.65));
      for(let cycle=0;cycle<3;cycle++){
        for(let y=0;y<document.documentElement.scrollHeight;y+=step){scrollTo(0,y);await pause(35);}
        scrollTo(0,document.documentElement.scrollHeight);await pause(80);
        scrollTo(0,0);await pause(80);
      }
    });
    await page.waitForTimeout(500);

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
        images:[...document.images].filter(i=>i.offsetParent!==null).map(i=>({src:i.getAttribute('src'),complete:i.complete,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,clientWidth:i.clientWidth,clientHeight:i.clientHeight})),
        visibleBlocks:sections.filter(el=>{const r=el.getBoundingClientRect();const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&Number.parseFloat(s.opacity||'1')>.12&&r.height>30}).length,
        invisibleLarge,
        revealSections
      };
    });

    if(health.text<250) failures.push(`${path}: suspiciously little page text (${health.text} chars)`);
    if(health.height < health.viewport*1.05 && path!='/contact/') failures.push(`${path}: page height suggests content did not render (${health.height}px)`);
    if(health.visibleBlocks<1) failures.push(`${path}: no substantial painted content sections`);
    for(const s of health.invisibleLarge) failures.push(`${path}: large section remains visually hidden after scroll (${s.id||s.cls||s.tag}, ${Math.round(s.height)}px high, opacity ${s.opacity})`);
    if(['/','/platform/','/blocks-activities/','/organisations/'].includes(path)){
      for(const s of health.revealSections){
        if(s.height>120 && s.opacity<0.85) failures.push(`${path}: reveal section never became visible (${s.id||s.cls}, opacity ${s.opacity})`);
      }
    }
    for(const i of health.images){
      if(!i.complete || i.naturalWidth===0) failures.push(`${path}: broken image ${i.src}`);
      if(i.clientWidth>320 && i.naturalWidth>0 && i.naturalWidth < i.clientWidth*.95) failures.push(`${path}: image is being upscaled ${i.src} (${i.naturalWidth}px source vs ${i.clientWidth}px rendered)`);
    }

    const delay=await page.evaluate(()=>new Promise(resolve=>{const start=performance.now();setTimeout(()=>resolve(performance.now()-start),75)}));
    if(delay>350) failures.push(`${path}: event loop responsiveness poor (${Math.round(delay)}ms for 75ms timer)`);

    await page.screenshot({path:`qa-artifacts/${path.replace(/\W+/g,'-').replace(/^-|-$/g,'')||'home'}.png`,fullPage:true});

    if(path==='/resources/'){
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
  }catch(e){ failures.push(`${path}: ${e.message}`); }
  for(const e of pageErrors) failures.push(`${path}: pageerror ${e}`);
  for(const e of consoleErrors.filter(x=>!/favicon|Failed to load resource.*404/i.test(x))) failures.push(`${path}: console ${e}`);
  for(const e of requestFailures.filter(x=>!x.includes('favicon'))) failures.push(`${path}: request failed ${e}`);
  await page.close();
}
await browser.close();
if(failures.length){
  console.error('Browser QA FAILED');
  for(const f of failures) console.error(' - '+f);
  process.exit(1);
}
console.log('Browser QA PASSED');
