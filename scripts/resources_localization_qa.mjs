import { chromium } from 'playwright';
import fs from 'node:fs';

const base=process.env.QA_BASE_URL||'http://127.0.0.1:4173';
const article='/resources/community-notes/wistudi-at-vietnam-edtech-expo-2026/';
const locales=['vi','zh-cn','th','id','ms','ar'];
const failures=[];

const middleware=fs.readFileSync('functions/_middleware.js','utf8');
const i18n=fs.readFileSync('assets/js/i18n.js','utf8');
const globalResources=fs.readFileSync('assets/js/resources-global.js','utf8');
const pageShell=fs.readFileSync('assets/js/resources-page-shell.js','utf8');
if(!middleware.includes("path.startsWith('/resources/')"))failures.push('Cloudflare middleware does not recognize localized Resources paths');
if(!i18n.includes('-resources.json'))failures.push('i18n runtime does not load Resources-specific dictionaries');
if(!i18n.includes("normalized.startsWith('/resources/')"))failures.push('i18n internal link localizer does not recognize Resources routes');
if(globalResources.includes('if(supported.has(first))return'))failures.push('Resources global runtime still disables itself on localized routes');
if(!pageShell.includes('article-language.js'))failures.push('Article language runtime is not loaded by the Resources page shell');
for(const locale of locales){
  if(!fs.existsSync(`assets/i18n/${locale}-resources.json`))failures.push(`Missing Resources UI dictionary: ${locale}`);
  if(!fs.existsSync(`assets/data/article-translations/wistudi-at-vietnam-edtech-expo-2026.${locale}.json`))failures.push(`Missing article translation: ${locale}`);
}

const browser=await chromium.launch({headless:true});
for(const locale of locales){
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  try{
    const response=await page.goto(`${base}${article}?articleLang=${locale}`,{waitUntil:'domcontentloaded',timeout:12000});
    if(!response||response.status()>=400)failures.push(`${locale}: article HTTP ${response?.status()}`);
    await page.waitForSelector('.res-article-language',{timeout:5000});
    await page.waitForFunction(l=>document.documentElement.dataset.articleLocale===l,locale,{timeout:5000});
    const expected=JSON.parse(fs.readFileSync(`assets/data/article-translations/wistudi-at-vietnam-edtech-expo-2026.${locale}.json`,'utf8'));
    const state=await page.evaluate(()=>({
      title:document.querySelector('.res-article-head h1')?.textContent?.trim()||'',
      noticeHidden:document.querySelector('.res-article-translation-notice')?.hidden,
      noticeText:document.querySelector('.res-article-translation-notice')?.innerText||'',
      current:document.documentElement.dataset.articleLocale||''
    }));
    if(state.current!==locale)failures.push(`${locale}: article locale did not apply`);
    if(state.title!==expected.title)failures.push(`${locale}: translated article title mismatch`);
    if(state.noticeHidden)failures.push(`${locale}: automatic-translation notice is hidden`);
    if(!state.noticeText.trim())failures.push(`${locale}: automatic-translation notice is empty`);
    await page.locator('[data-article-original]').click({timeout:3000});
    await page.waitForFunction(()=>document.documentElement.dataset.articleLocale==='en',{timeout:3000});
    const originalState=await page.evaluate(()=>({title:document.querySelector('.res-article-head h1')?.textContent?.trim()||'',hidden:document.querySelector('.res-article-translation-notice')?.hidden}));
    if(originalState.title!=='Wistudi at Vietnam EdTech Expo 2026')failures.push(`${locale}: View original did not restore English article`);
    if(!originalState.hidden)failures.push(`${locale}: translation notice stayed visible after restoring original`);
  }catch(err){failures.push(`${locale}: ${err.message}`);}
  await page.close();
}
await browser.close();

if(failures.length){
  console.error('Resources localization QA FAILED');
  failures.forEach(f=>console.error(' - '+f));
  process.exit(1);
}
console.log('Resources localization QA PASSED');