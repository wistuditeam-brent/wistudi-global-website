import { chromium } from 'playwright';

const base=process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const failures=[];
const browser=await chromium.launch({headless:true});

async function testFirstVisit(viewport,label){
  const context=await browser.newContext({viewport});
  const page=await context.newPage();
  await page.addInitScript(()=>{
    try{
      localStorage.removeItem('wistudiGuideRole');
      localStorage.removeItem('wistudiVisitorName');
      sessionStorage.clear();
    }catch(_){ }
  });
  await page.goto(base+'/',{waitUntil:'load',timeout:15000});
  const button=page.locator('.ws-g2-btn');
  try{await button.waitFor({state:'visible',timeout:8000});}catch(_){failures.push(`${label}: avatar missing`);await context.close();return;}
  await page.waitForTimeout(2400);

  const auto=await page.evaluate(()=>({desktop:document.querySelector('.ws-g2')?.classList.contains('open')||false,mobile:document.body.classList.contains('ws-g2-mo')}));
  if(auto.desktop||auto.mobile)failures.push(`${label}: guide auto-opened`);

  await button.click({force:true,timeout:5000}).catch(e=>failures.push(`${label}: avatar click failed (${e.message})`));
  await page.waitForTimeout(180);
  const state=await page.evaluate(()=>({desktop:document.querySelector('.ws-g2')?.classList.contains('open')||false,mobile:document.body.classList.contains('ws-g2-mo')}));
  if(!(label==='mobile'?state.mobile:state.desktop))failures.push(`${label}: guide did not open`);

  const surface=label==='mobile'?page.locator('.ws-g2-sheet'):page.locator('.ws-g2-b');
  const title=surface.locator('.ws-g2-on-title');
  try{await title.waitFor({state:'visible',timeout:2500});}catch(_){failures.push(`${label}: onboarding missing`);}
  if(await title.count()){
    const text=(await title.textContent())||'';
    if(!text.includes('What should I call you?'))failures.push(`${label}: wrong first onboarding step`);
  }

  const input=surface.locator('[data-on-name]');
  if(await input.count()){
    if(label==='mobile'){
      const autoFocused=await input.evaluate(el=>document.activeElement===el);
      if(autoFocused)failures.push('mobile: name field auto-focused and opened keyboard before user intent');

      await input.focus();
      await page.waitForTimeout(30);
      await page.setViewportSize({width:viewport.width,height:520});
      await page.waitForTimeout(280);
      const keyboardState=await page.evaluate(()=>{
        const sheet=document.querySelector('.ws-g2-sheet');
        const r=sheet?.getBoundingClientRect();
        const vv=window.visualViewport;
        return {
          aware:sheet?.classList.contains('ws-g2-keyboard-aware')||false,
          top:r?.top??-1,
          bottom:r?.bottom??99999,
          visibleTop:vv?.offsetTop??0,
          visibleBottom:(vv?.offsetTop||0)+(vv?.height||innerHeight),
          open:document.body.classList.contains('ws-g2-mo')
        };
      });
      if(!keyboardState.open)failures.push('mobile: guide closed when keyboard viewport opened');
      if(!keyboardState.aware)failures.push('mobile: onboarding did not enter keyboard-aware positioning');
      if(keyboardState.top<keyboardState.visibleTop-2)failures.push(`mobile: onboarding rose above visible viewport (${keyboardState.top}px)`);
      if(keyboardState.bottom>keyboardState.visibleBottom+2)failures.push(`mobile: onboarding remained behind keyboard (${keyboardState.bottom}px > ${keyboardState.visibleBottom}px)`);

      await input.fill('Brent');
      await input.press('Enter');
      await page.waitForTimeout(180);
      const afterEnter=await page.evaluate(()=>({
        open:document.body.classList.contains('ws-g2-mo'),
        aware:document.querySelector('.ws-g2-sheet')?.classList.contains('ws-g2-keyboard-aware')||false,
        title:document.querySelector('.ws-g2-sheet .ws-g2-on-title')?.textContent||''
      }));
      if(!afterEnter.open)failures.push('mobile: guide closed after pressing Enter/Done');
      if(!afterEnter.title.includes('Nice to meet you, Brent.'))failures.push('mobile: Enter/Done did not advance to role-selection step');
      if(afterEnter.aware)failures.push('mobile: keyboard-aware positioning remained active after advancing');

      await page.setViewportSize(viewport);
      await page.waitForTimeout(220);
      const settled=await page.evaluate(()=>({
        open:document.body.classList.contains('ws-g2-mo'),
        title:document.querySelector('.ws-g2-sheet .ws-g2-on-title')?.textContent||''
      }));
      if(!settled.open)failures.push('mobile: guide closed while keyboard viewport settled back');
      if(!settled.title.includes('Nice to meet you, Brent.'))failures.push('mobile: role-selection step was lost after keyboard closed');
    }else{
      await input.fill('Brent');
      await surface.locator('[data-on-next]').click({force:true});
      await page.waitForTimeout(100);
    }
  }else failures.push(`${label}: name input missing`);

  const publisher=surface.locator('[data-on-role="publisher"]');
  try{await publisher.waitFor({state:'visible',timeout:2000});}catch(_){failures.push(`${label}: role choices missing`);}
  if(await publisher.count()){
    await publisher.click({force:true});
    await page.waitForTimeout(180);
  }

  const personalised=await page.evaluate(()=>({
    desktop:document.querySelector('.ws-g2')?.classList.contains('open')||false,
    mobile:document.body.classList.contains('ws-g2-mo'),
    visitorName:localStorage.getItem('wistudiVisitorName'),
    role:localStorage.getItem('wistudiGuideRole')
  }));
  if(!(label==='mobile'?personalised.mobile:personalised.desktop))failures.push(`${label}: guide collapsed after personalisation`);
  if(personalised.visitorName!=='Brent')failures.push(`${label}: name not stored`);
  if(personalised.role!=='publisher')failures.push(`${label}: Publisher not stored`);
  try{await surface.locator('.ws-g2-copy').waitFor({state:'visible',timeout:2000});}catch(_){failures.push(`${label}: normal guide content not restored`);}

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
    if(!(label==='mobile'?switched.mobile:switched.desktop))failures.push(`${label}: guide collapsed on role switch`);
    if(switched.role!=='trainer')failures.push(`${label}: Trainer not stored`);
    if(!switched.avatar.includes('guide-trainer.svg'))failures.push(`${label}: avatar did not update to Trainer`);
  }else failures.push(`${label}: native role switcher missing`);

  const close=surface.locator('[data-x]');
  if(await close.count())await close.click({force:true});
  await page.waitForTimeout(100);
  const closed=await page.evaluate(()=>({desktop:document.querySelector('.ws-g2')?.classList.contains('open')||false,mobile:document.body.classList.contains('ws-g2-mo'),y:scrollY}));
  if(closed.desktop||closed.mobile)failures.push(`${label}: guide did not close`);
  await page.evaluate(()=>window.scrollBy(0,700));
  await page.waitForTimeout(180);
  const y2=await page.evaluate(()=>scrollY);
  if(y2<=closed.y)failures.push(`${label}: page stuck after guide close`);

  await context.close();
}

async function testReturningVisit(viewport,label){
  const context=await browser.newContext({viewport});
  const page=await context.newPage();
  await page.addInitScript(()=>{
    try{
      localStorage.setItem('wistudiVisitorName','Brent');
      localStorage.setItem('wistudiGuideRole','trainer');
      sessionStorage.clear();
    }catch(_){ }
  });
  await page.goto(base+'/',{waitUntil:'load',timeout:15000});
  const button=page.locator('.ws-g2-btn');
  try{await button.waitFor({state:'visible',timeout:8000});}catch(_){failures.push(`${label} return: avatar missing`);await context.close();return;}
  await button.click({force:true,timeout:5000}).catch(e=>failures.push(`${label} return: avatar click failed (${e.message})`));
  await page.waitForTimeout(220);
  const surface=label==='mobile'?page.locator('.ws-g2-sheet'):page.locator('.ws-g2-b');
  if(await surface.locator('.ws-g2-onboard').count())failures.push(`${label} return: onboarding repeated`);
  const welcome=surface.locator('.ws-g2-welcome');
  try{await welcome.waitFor({state:'visible',timeout:1600});}catch(_){failures.push(`${label} return: welcome missing`);}
  if(await welcome.count()){
    const text=(await welcome.textContent())||'';
    if(!text.includes('Welcome back, Brent.'))failures.push(`${label} return: welcome copy/name wrong`);
  }
  const state=await page.evaluate(()=>({desktop:document.querySelector('.ws-g2')?.classList.contains('open')||false,mobile:document.body.classList.contains('ws-g2-mo'),role:localStorage.getItem('wistudiGuideRole')}));
  if(!(label==='mobile'?state.mobile:state.desktop))failures.push(`${label} return: guide did not remain open`);
  if(state.role!=='trainer')failures.push(`${label} return: stored role lost`);
  await context.close();
}

await testFirstVisit({width:1440,height:900},'desktop');
await testFirstVisit({width:390,height:844},'mobile');
await testReturningVisit({width:1440,height:900},'desktop');
await testReturningVisit({width:390,height:844},'mobile');

await browser.close();
if(failures.length){
  console.error('Guide mobile-safe QA FAILED');
  failures.forEach(f=>console.error(' - '+f));
  process.exit(1);
}
console.log('Guide mobile-safe QA PASSED: desktop/mobile first-open personalisation, keyboard-aware positioning, Enter/Done handoff, role switching, close/scroll responsiveness, and returning visits all passed.');
