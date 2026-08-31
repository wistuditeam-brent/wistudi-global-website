import { chromium } from 'playwright';

const base=process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const failures=[];
const browser=await chromium.launch({headless:true});

async function testGuide(viewport,name){
  const page=await browser.newPage({viewport});
  await page.addInitScript(()=>{
    try{
      if(sessionStorage.getItem('__qaGuideSeeded')!=='1'){
        localStorage.removeItem('wistudiGuideRole');
        localStorage.removeItem('wistudiVisitorName');
        sessionStorage.clear();
        sessionStorage.setItem('__qaGuideSeeded','1');
      }
    }catch(_){ }
  });
  await page.goto(base+'/',{waitUntil:'load',timeout:15000});
  const button=page.locator('.ws-g2-btn');
  try{await button.waitFor({state:'visible',timeout:8000});}catch(_){failures.push(`${name}: guide avatar did not appear`);await page.close();return;}

  await page.waitForTimeout(2400);
  const before=await page.evaluate(()=>({
    desktop:document.querySelector('.ws-g2')?.classList.contains('open')||false,
    mobile:document.body.classList.contains('ws-g2-mo')
  }));
  if(before.desktop||before.mobile)failures.push(`${name}: guide opened without a user click`);

  try{await button.click({force:true,timeout:5000});}catch(e){failures.push(`${name}: could not click guide avatar (${e.message})`);}
  await page.waitForTimeout(180);

  const after=await page.evaluate(()=>({
    desktop:document.querySelector('.ws-g2')?.classList.contains('open')||false,
    mobile:document.body.classList.contains('ws-g2-mo')
  }));
  const opened=name==='mobile'?after.mobile:after.desktop;
  if(!opened)failures.push(`${name}: guide did not open after clicking the avatar`);

  const surface=name==='mobile'?page.locator('.ws-g2-sheet'):page.locator('.ws-g2-b');
  const title=surface.locator('.ws-g2-on-title');
  try{await title.waitFor({state:'visible',timeout:2500});}catch(_){failures.push(`${name}: first-open personalisation did not appear`);}
  if(await title.count()){
    const text=(await title.textContent())||'';
    if(!text.includes('What should I call you?'))failures.push(`${name}: unexpected onboarding step 1 copy`);
  }

  const input=surface.locator('[data-on-name]');
  if(await input.count()){
    await input.fill('Brent');
    await surface.locator('[data-on-next]').click({force:true});
    await page.waitForTimeout(80);
  }else failures.push(`${name}: name input missing`);

  const publisher=surface.locator('[data-on-role="publisher"]');
  try{await publisher.waitFor({state:'visible',timeout:2000});}catch(_){failures.push(`${name}: onboarding role choices did not appear`);}
  if(await publisher.count()){
    await publisher.click({force:true});
    await page.waitForTimeout(180);
  }

  const afterOnboard=await page.evaluate(()=>({
    desktop:document.querySelector('.ws-g2')?.classList.contains('open')||false,
    mobile:document.body.classList.contains('ws-g2-mo'),
    name:localStorage.getItem('wistudiVisitorName'),
    role:localStorage.getItem('wistudiGuideRole')
  }));
  const stayedOpen=name==='mobile'?afterOnboard.mobile:afterOnboard.desktop;
  if(!stayedOpen)failures.push(`${name}: guide collapsed after finishing personalisation`);
  if(afterOnboard.name!=='Brent')failures.push(`${name}: visitor name was not stored`);
  if(afterOnboard.role!=='publisher')failures.push(`${name}: publisher perspective was not stored`);

  const normalCopy=surface.locator('.ws-g2-copy');
  try{await normalCopy.waitFor({state:'visible',timeout:2000});}catch(_){failures.push(`${name}: normal guide content did not return after onboarding`);}

  // Regression: switching perspective while open must update in place, not collapse.
  const trainer=surface.locator('.ws-g2-role[data-r="trainer"]');
  if(await trainer.count()){
    await trainer.click({force:true});
    await page.waitForTimeout(160);
    const switched=await page.evaluate(()=>({
      desktop:document.querySelector('.ws-g2')?.classList.contains('open')||false,
      mobile:document.body.classList.contains('ws-g2-mo'),
      role:localStorage.getItem('wistudiGuideRole'),
      avatar:document.querySelector('.ws-g2-ring img')?.getAttribute('src')||''
    }));
    const stillOpen=name==='mobile'?switched.mobile:switched.desktop;
    if(!stillOpen)failures.push(`${name}: guide collapsed when switching to Trainer`);
    if(switched.role!=='trainer')failures.push(`${name}: Trainer role did not persist after switch`);
    if(!switched.avatar.includes('guide-trainer.svg'))failures.push(`${name}: avatar did not change in place to Trainer`);
  }else failures.push(`${name}: normal role switcher missing after onboarding`);

  // Close through the guide's native close handler, then verify mobile/desktop page remains responsive.
  const close=surface.locator('[data-x]');
  if(await close.count())await close.click({force:true});
  await page.waitForTimeout(100);
  const closed=await page.evaluate(()=>({
    desktop:document.querySelector('.ws-g2')?.classList.contains('open')||false,
    mobile:document.body.classList.contains('ws-g2-mo'),
    y:scrollY
  }));
  if(closed.desktop||closed.mobile)failures.push(`${name}: guide did not close cleanly`);
  await page.evaluate(()=>window.scrollBy(0,700));
  await page.waitForTimeout(180);
  const y2=await page.evaluate(()=>scrollY);
  if(y2<=closed.y)failures.push(`${name}: page did not remain scroll-responsive after closing guide`);

  // Returning visitor: stored name should skip onboarding and allow a normal guide open.
  await page.evaluate(()=>sessionStorage.removeItem('wistudiGuideWelcomedV2'));
  await page.reload({waitUntil:'load',timeout:15000});
  const returnButton=page.locator('.ws-g2-btn');
  try{await returnButton.waitFor({state:'visible',timeout:8000});await returnButton.click({force:true});}catch(_){failures.push(`${name}: returning visitor could not reopen guide`);}
  await page.waitForTimeout(180);
  const returnSurface=name==='mobile'?page.locator('.ws-g2-sheet'):page.locator('.ws-g2-b');
  if(await returnSurface.locator('.ws-g2-onboard').count())failures.push(`${name}: returning visitor was incorrectly shown onboarding again`);
  const welcome=returnSurface.locator('.ws-g2-welcome');
  try{await welcome.waitFor({state:'visible',timeout:1500});}catch(_){failures.push(`${name}: returning visitor greeting did not appear`);}
  if(await welcome.count()){
    const text=(await welcome.textContent())||'';
    if(!text.includes('Welcome back, Brent.'))failures.push(`${name}: returning visitor greeting used unexpected name/copy`);
  }

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
      await stage.click({force:true});
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
console.log('Release interaction QA PASSED: personalised guide works on desktop/mobile, role switching stays open, mobile remains responsive, and article navigation is sticky.');
