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
    await page.waitForTimeout(250);
    await page.evaluate(async()=>{
      const step=Math.max(500,Math.floor(innerHeight*.7));
      for(let y=0;y<document.body.scrollHeight;y+=step){scrollTo(0,y);await new Promise(r=>setTimeout(r,25));}
      scrollTo(0,0);
    });
    await page.waitForTimeout(250);
    const health=await page.evaluate(()=>({
      text:(document.body.innerText||'').trim().length,
      height:document.body.scrollHeight,
      viewport:innerHeight,
      images:[...document.images].filter(i=>i.offsetParent!==null).map(i=>({src:i.getAttribute('src'),complete:i.complete,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,clientWidth:i.clientWidth,clientHeight:i.clientHeight})),
      visibleBlocks:[...document.querySelectorAll('main, main section, section')].filter(el=>{const r=el.getBoundingClientRect();const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&r.height>30}).length
    }));
    if(health.text<250) failures.push(`${path}: suspiciously little visible text (${health.text} chars)`);
    if(health.height < health.viewport*1.05 && path!='/contact/') failures.push(`${path}: page height suggests content did not render (${health.height}px)`);
    if(health.visibleBlocks<1) failures.push(`${path}: no substantial visible content sections`);
    for(const i of health.images){
      if(!i.complete || i.naturalWidth===0) failures.push(`${path}: broken image ${i.src}`);
      if(i.clientWidth>320 && i.naturalWidth>0 && i.naturalWidth < i.clientWidth*.95) failures.push(`${path}: image is being upscaled ${i.src} (${i.naturalWidth}px source vs ${i.clientWidth}px rendered)`);
    }
    const delay=await page.evaluate(()=>new Promise(resolve=>{const start=performance.now();setTimeout(()=>resolve(performance.now()-start),75)}));
    if(delay>750) failures.push(`${path}: event loop responsiveness poor (${Math.round(delay)}ms for 75ms timer)`);
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
