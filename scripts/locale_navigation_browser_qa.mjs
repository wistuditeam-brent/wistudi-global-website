import { chromium } from 'playwright';

const base=process.env.QA_BASE_URL||'http://127.0.0.1:4173';
const eventPath='/resources/events/building-a-communicative-esl-lesson-with-flow/';
const locales=['en','vi','zh-cn','th','id','ms','ar'];
const expectedLang={en:'en',vi:'vi','zh-cn':'zh-CN',th:'th',id:'id',ms:'ms',ar:'ar'};
const failures=[];
const browser=await chromium.launch({headless:true});

async function waitForShell(page,locale,isEvent=false){
  if(isEvent) await page.waitForFunction(()=>document.documentElement.dataset.wsEventRuntime==='ready',null,{timeout:20000});
  await page.waitForFunction(expected=>{
    const link=document.querySelector('.ws-nav-links [data-ws-resources-link="true"],.ws-nav-links a.ws-resource-nav-link');
    return !!link&&document.documentElement.lang.toLowerCase()===expected.toLowerCase();
  },expectedLang[locale],{timeout:15000});
  await page.waitForTimeout(120);
}

async function assertNavigation(locale,path,isEvent=false){
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text())});
  try{
    const suffix=locale==='en'?'':`${path.includes('?')?'&':'?'}lang=${locale}`;
    await page.goto(`${base}${path}${suffix}`,{waitUntil:'domcontentloaded',timeout:30000});
    await waitForShell(page,locale,isEvent);
    const state=await page.evaluate(()=>{
      const desktop=[...document.querySelectorAll('.ws-nav-links [data-ws-resources-link="true"],.ws-nav-links a.ws-resource-nav-link')];
      const mobile=[...document.querySelectorAll('.ws-mobile-inner [data-ws-resources-link="true"],.ws-mobile-inner a.ws-resource-nav-link')];
      const href=desktop[0]?.href||'';
      const u=href?new URL(href):null;
      return{
        desktopCount:desktop.length,
        mobileCount:mobile.length,
        resourcePath:u?.pathname||'',
        resourceLang:u?.searchParams.get('lang')||'',
        resourceText:desktop[0]?.textContent?.replace(/\s+/g,' ').trim()||'',
        htmlLang:document.documentElement.lang,
        runtimeScripts:[...document.scripts].map(s=>s.src||'').filter(Boolean),
        facts:!!document.querySelector('.event-facts-strip'),
        registration:!!document.querySelector('#eventRegistrationForm'),
        bodyWidth:document.body.scrollWidth,
        viewportWidth:document.documentElement.clientWidth
      };
    });
    if(state.desktopCount!==1) failures.push(`[${locale}${path}] expected exactly one desktop Resources link, found ${state.desktopCount}`);
    if(state.mobileCount!==1) failures.push(`[${locale}${path}] expected exactly one mobile Resources link, found ${state.mobileCount}`);
    if(state.resourcePath!=='/resources/') failures.push(`[${locale}${path}] Resources href path is ${state.resourcePath}`);
    if(locale==='en'&&state.resourceLang) failures.push(`[${locale}${path}] English Resources link should not carry lang=${state.resourceLang}`);
    if(locale!=='en'&&state.resourceLang!==locale) failures.push(`[${locale}${path}] Resources link lost locale; href lang=${state.resourceLang||'(none)'}`);
    if(state.bodyWidth>state.viewportWidth+8) failures.push(`[${locale}${path}] horizontal overflow ${state.bodyWidth}/${state.viewportWidth}`);

    if(isEvent){
      const counts={
        media:state.runtimeScripts.filter(src=>src.includes('event-media-component.js')).length,
        facts:state.runtimeScripts.filter(src=>src.includes('event-facts-component.js')).length,
        live:state.runtimeScripts.filter(src=>src.includes('event-live-session-component.js')).length,
        registration:state.runtimeScripts.filter(src=>src.includes('event-registration-component.js')).length,
        bridge:state.runtimeScripts.filter(src=>src.includes('event-registration-live-bridge.js')).length,
        i18n:state.runtimeScripts.filter(src=>src.includes('/event-i18n.js')).length,
        i18nContent:state.runtimeScripts.filter(src=>src.includes('/event-i18n-content.js')).length
      };
      for(const [name,count] of Object.entries(counts)) if(count!==1) failures.push(`[${locale}/event] expected one ${name} runtime, found ${count}`);
      if(!state.facts) failures.push(`[${locale}/event] event facts component did not render`);
      if(!state.registration) failures.push(`[${locale}/event] registration form did not render`);
      const delay=await page.evaluate(()=>new Promise(resolve=>{const start=performance.now();setTimeout(()=>resolve(performance.now()-start),75)}));
      if(delay>400) failures.push(`[${locale}/event] event loop is blocked: ${Math.round(delay)}ms for 75ms timer`);
    }

    for(const error of errors.filter(e=>!/favicon|Failed to load resource.*404|net::ERR_ABORTED/i.test(e))) failures.push(`[${locale}${path}] browser error: ${error}`);
  }catch(error){
    failures.push(`[${locale}${path}] ${error.message}`);
  }finally{await page.close()}
}

try{
  for(const locale of locales){
    await assertNavigation(locale,'/',false);
    await assertNavigation(locale,eventPath,true);
  }
}finally{await browser.close()}

if(failures.length){
  console.error('Locale/navigation browser QA failed:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Locale/navigation browser QA passed for all seven languages on the homepage and event page.');
