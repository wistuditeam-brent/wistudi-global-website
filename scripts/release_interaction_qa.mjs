import { chromium } from 'playwright';

const base=process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const failures=[];
const browser=await chromium.launch({headless:true});

async function testGuide(viewport,name){
  const page=await browser.newPage({viewport});
  await page.addInitScript(()=>{
    try{localStorage.removeItem('wistudiGuideRole');sessionStorage.clear();}catch(_){ }
  });
  await page.goto(base+'/',{waitUntil:'load',timeout:15000});
  const button=page.locator('.ws-g2-btn');
  try{await button.waitFor({state:'visible',timeout:8000});}catch(_){failures.push(`${name}: guide avatar did not appear`);await page.close();return;}

  // The legacy implementation auto-opened at 850ms. Wait well beyond that and
  // assert that neither desktop bubble nor mobile sheet is open.
  await page.waitForTimeout(2400);
  const before=await page.evaluate(()=>({
    desktop:document.querySelector('.ws-g2')?.classList.contains('open')||false,
    mobile:document.body.classList.contains('ws-g2-mo')
  }));
  if(before.desktop||before.mobile)failures.push(`${name}: guide opened without a user click`);

  await button.click();
  await page.waitForTimeout(120);
  const after=await page.evaluate(()=>({
    desktop:document.querySelector('.ws-g2')?.classList.contains('open')||false,
    mobile:document.body.classList.contains('ws-g2-mo')
  }));
  const opened=name==='mobile'?after.mobile:after.desktop;
  if(!opened)failures.push(`${name}: guide did not open after clicking the avatar`);
  await page.close();
}

await testGuide({width:1440,height:900},'desktop');
await testGuide({width:390,height:844},'mobile');

// Verify the article table of contents remains sticky while the article body scrolls.
{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const article='/resources/community-notes/wistudi-at-vietnam-edtech-expo-2026/';
  await page.goto(base+article,{waitUntil:'load',timeout:15000});
  const aside=page.locator('.res-article-aside');
  try{await aside.waitFor({state:'visible',timeout:5000});}catch(_){failures.push('article: In this note navigation is not visible on desktop');}
  if(await aside.count()){
    await page.locator('#conversations').scrollIntoViewIfNeeded();
    await page.waitForTimeout(120);
    const first=await aside.boundingBox();
    await page.evaluate(()=>window.scrollBy(0,650));
    await page.waitForTimeout(120);
    const second=await aside.boundingBox();
    const position=await aside.evaluate(el=>getComputedStyle(el).position);
    if(position!=='sticky')failures.push(`article: In this note computed position is ${position}, expected sticky`);
    if(!first||!second)failures.push('article: could not measure sticky navigation');
    else{
      if(first.y<75||first.y>135)failures.push(`article: sticky navigation sits at ${Math.round(first.y)}px instead of near the header`);
      if(Math.abs(second.y-first.y)>4)failures.push(`article: In this note moved ${Math.round(second.y-first.y)}px during scroll instead of remaining sticky`);
    }
    const stage=aside.locator('a[href="#stage"]');
    if(await stage.count()){
      await stage.click();
      await page.waitForTimeout(120);
      if(!page.url().endsWith('#stage'))failures.push('article: In this note anchor did not navigate to On stage');
    }
  }
  await page.close();
}

await browser.close();
if(failures.length){
  console.error('Release interaction QA FAILED');
  failures.forEach(f=>console.error(' - '+f));
  process.exit(1);
}
console.log('Release interaction QA PASSED: guide is click-only on desktop/mobile and article navigation is sticky.');
