import { chromium } from 'playwright';

const base=(process.env.QA_BASE_URL||'').replace(/\/$/,'');
if(!base)throw new Error('QA_BASE_URL is required');
const article='/resources/community-notes/wistudi-at-vietnam-edtech-expo-2026/';
const locales={
  vi:{hub:'Ghi chú cộng đồng',nav:'Tài nguyên',article:'Wistudi tại Vietnam EdTech Expo 2026',dir:'ltr'},
  'zh-cn':{hub:'社区札记',nav:'资源',article:'Wistudi 亮相 Vietnam EdTech Expo 2026',dir:'ltr'},
  th:{hub:'บันทึกชุมชน',nav:'ทรัพยากร',article:'Wistudi ที่ Vietnam EdTech Expo 2026',dir:'ltr'},
  id:{hub:'Catatan Komunitas',nav:'Sumber Daya',article:'Wistudi di Vietnam EdTech Expo 2026',dir:'ltr'},
  ms:{hub:'Nota Komuniti',nav:'Sumber',article:'Wistudi di Vietnam EdTech Expo 2026',dir:'ltr'},
  ar:{hub:'ملاحظات المجتمع',nav:'الموارد',article:'Wistudi في Vietnam EdTech Expo 2026',dir:'rtl'}
};
const subpaths=['/resources/','/resources/all/','/resources/guides/','/resources/events/'];
const failures=[];
const browser=await chromium.launch({headless:true});
for(const [locale,expected] of Object.entries(locales)){
  const page=await browser.newPage({viewport:{width:1365,height:850}});
  try{
    // Confirm Resources is present in the normal localized site header, not only inside Resources pages.
    let response=await page.goto(`${base}/${locale}/`,{waitUntil:'networkidle',timeout:25000});
    if(!response||response.status()>=400)failures.push(`${locale}: localized home HTTP ${response?.status()}`);
    const homeNav=await page.locator('.ws-nav-links a[data-ws-resources-link]').first();
    if(await homeNav.count()===0)failures.push(`${locale}: Resources missing from localized site header`);
    else {
      const text=(await homeNav.textContent()||'').trim();
      const href=await homeNav.getAttribute('href');
      if(!text.startsWith(expected.nav))failures.push(`${locale}: localized Resources nav label is '${text}'`);
      if(href!==`/${locale}/resources/`)failures.push(`${locale}: Resources nav href is '${href}'`);
    }

    for(const path of subpaths){
      response=await page.goto(`${base}/${locale}${path}`,{waitUntil:'networkidle',timeout:25000});
      if(!response||response.status()>=400){failures.push(`${locale}${path}: HTTP ${response?.status()}`);continue;}
      const state=await page.evaluate(()=>({lang:document.documentElement.lang,dir:document.documentElement.dir,resourceHref:document.querySelector('.ws-nav-links a[data-ws-resources-link]')?.getAttribute('href')||'',resourceText:document.querySelector('.ws-nav-links a[data-ws-resources-link]')?.textContent?.trim()||''}));
      if(state.dir!==expected.dir)failures.push(`${locale}${path}: dir=${state.dir}`);
      if(state.resourceHref!==`/${locale}/resources/`)failures.push(`${locale}${path}: header Resources href '${state.resourceHref}'`);
      if(!state.resourceText.startsWith(expected.nav))failures.push(`${locale}${path}: header Resources label '${state.resourceText}'`);
      const tabs=await page.locator('.res-tabs a').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
      if(tabs.some(h=>h&&h.startsWith('/resources/')))failures.push(`${locale}${path}: at least one Resources tab lost locale prefix`);
      if(path==='/resources/'){
        const body=(await page.locator('body').innerText()).slice(0,4000);
        if(!body.includes(expected.hub))failures.push(`${locale}: translated Community Notes label not found on hub`);
      }
    }

    response=await page.goto(`${base}/${locale}${article}`,{waitUntil:'networkidle',timeout:25000});
    if(!response||response.status()>=400)failures.push(`${locale}: localized article HTTP ${response?.status()}`);
    await page.waitForSelector('.res-article-language',{timeout:8000});
    await page.waitForFunction(l=>document.documentElement.dataset.articleLocale===l,locale,{timeout:8000});
    const articleState=await page.evaluate(()=>({
      title:document.querySelector('.res-article-head h1')?.textContent?.trim()||'',
      noticeHidden:document.querySelector('.res-article-translation-notice')?.hidden,
      noticeText:document.querySelector('.res-article-translation-notice')?.innerText?.trim()||'',
      choices:document.querySelectorAll('.res-article-language-menu [data-article-locale]').length,
      current:document.documentElement.dataset.articleLocale||'',
      resourcesHref:document.querySelector('.ws-nav-links a[data-ws-resources-link]')?.getAttribute('href')||''
    }));
    if(articleState.current!==locale)failures.push(`${locale}: article did not default to site locale`);
    if(articleState.title!==expected.article)failures.push(`${locale}: article title '${articleState.title}'`);
    if(articleState.noticeHidden||!articleState.noticeText)failures.push(`${locale}: machine-translation disclosure missing`);
    if(articleState.choices!==7)failures.push(`${locale}: article language selector has ${articleState.choices} choices`);
    if(articleState.resourcesHref!==`/${locale}/resources/`)failures.push(`${locale}: localized article Resources href '${articleState.resourcesHref}'`);
    await page.locator('[data-article-original]').click({timeout:5000});
    await page.waitForFunction(()=>document.documentElement.dataset.articleLocale==='en',{timeout:5000});
    const restored=await page.evaluate(()=>({title:document.querySelector('.res-article-head h1')?.textContent?.trim()||'',noticeHidden:document.querySelector('.res-article-translation-notice')?.hidden}));
    if(restored.title!=='Wistudi at Vietnam EdTech Expo 2026')failures.push(`${locale}: View original failed`);
    if(!restored.noticeHidden)failures.push(`${locale}: disclosure remains after View original`);
  }catch(err){failures.push(`${locale}: ${err.message}`);}
  await page.close();
}
await browser.close();
if(failures.length){console.error('Cloudflare Resources localization QA FAILED');failures.forEach(x=>console.error(' - '+x));process.exit(1);}
console.log('Cloudflare Resources localization QA PASSED for vi, zh-cn, th, id, ms and ar.');