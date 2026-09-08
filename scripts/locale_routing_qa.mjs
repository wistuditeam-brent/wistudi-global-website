import fs from 'node:fs';

const failures=[];
const wrapperPath='functions/_middleware.js';
const corePath='functions/_middleware-core.js';
const nestedEventMiddleware='functions/resources/events/building-a-communicative-esl-lesson-with-flow/_middleware.js';

const wrapper=fs.readFileSync(wrapperPath,'utf8');
const core=fs.readFileSync(corePath,'utf8');
const nested=fs.readFileSync(nestedEventMiddleware,'utf8');

if(!wrapper.includes('requestWithoutAutomaticLanguageRedirect')) failures.push('locale wrapper does not neutralize automatic browser-language redirects');
if(!wrapper.includes('redirectLanguageQuery')) failures.push('legacy ?lang= URLs are not migrated to stable language paths');
if(!wrapper.includes("target.pathname = locale === 'en' ? clean : localePath(locale,clean)")) failures.push('language query redirects do not resolve to locale-prefixed paths');
if(/event-registration-component\.js|event-live-session-component\.js|event-i18n\.js/.test(nested)) failures.push('event route middleware still injects duplicate event runtimes');

class PassthroughHTMLRewriter{
  on(){return this}
  transform(response){return response}
}
globalThis.HTMLRewriter=PassthroughHTMLRewriter;

const coreUrl='data:text/javascript;base64,'+Buffer.from(core).toString('base64');
const wrapperModule=wrapper.replace("'./_middleware-core.js'",JSON.stringify(coreUrl));
const wrapperUrl='data:text/javascript;base64,'+Buffer.from(wrapperModule).toString('base64');
const {onRequest}=await import(wrapperUrl);

async function request(url,headers={}){
  const req=new Request(url,{headers});
  const context={
    request:req,
    env:{ASSETS:{fetch:async()=>new Response('<!doctype html><html><head><title>QA</title><meta name="description" content="QA page description long enough for middleware"><link rel="canonical" href="https://global.wistudi.com/"></head><body></body></html>',{headers:{'content-type':'text/html'}})}},
    next:async()=>new Response('<!doctype html><html><head><title>QA</title><meta name="description" content="QA page description long enough for middleware"><link rel="canonical" href="https://global.wistudi.com/"></head><body></body></html>',{status:200,headers:{'content-type':'text/html'}})
  };
  return onRequest(context);
}

async function assertNoRedirect(name,url,headers={}){
  const response=await request(url,headers);
  if(response.status>=300&&response.status<400) failures.push(`${name}: unexpectedly redirected to ${response.headers.get('location')||'(missing location)'}`);
}

async function assertRedirect(name,url,expectedPath,expectedLangParam=null){
  const response=await request(url);
  if(response.status!==301){failures.push(`${name}: expected 301, received ${response.status}`);return}
  const location=response.headers.get('location')||'';
  let parsed;try{parsed=new URL(location)}catch{failures.push(`${name}: invalid redirect location ${location}`);return}
  if(parsed.pathname!==expectedPath) failures.push(`${name}: expected path ${expectedPath}, received ${parsed.pathname}`);
  if(expectedLangParam){
    if(parsed.searchParams.get('lang')!==expectedLangParam) failures.push(`${name}: expected lang=${expectedLangParam}, received ${parsed.search}`);
  }else if(parsed.searchParams.has('lang')) failures.push(`${name}: canonical language path should not keep a lang parameter`);
}

await assertNoRedirect('first visit defaults to English','https://global.wistudi.com/',{'accept-language':'vi-VN,vi;q=0.9,en;q=0.8'});
await assertNoRedirect('browser cookie cannot force a redirect','https://global.wistudi.com/',{'accept-language':'th-TH,th;q=0.9','cookie':'wistudi_locale=vi'});
await assertRedirect('legacy query Vietnamese homepage','https://global.wistudi.com/?lang=vi','/vi/');
await assertRedirect('legacy query Vietnamese event','https://global.wistudi.com/resources/events/building-a-communicative-esl-lesson-with-flow/?lang=vi','/vi/resources/events/building-a-communicative-esl-lesson-with-flow/');
await assertNoRedirect('Vietnamese homepage is a canonical language URL','https://global.wistudi.com/vi/');
await assertNoRedirect('Vietnamese event is a canonical language URL','https://global.wistudi.com/vi/resources/events/building-a-communicative-esl-lesson-with-flow/');
await assertNoRedirect('Chinese resource hub is a canonical language URL','https://global.wistudi.com/zh-cn/resources/');
await assertRedirect('legacy English prefix','https://global.wistudi.com/en/','/');

if(failures.length){
  console.error('Locale routing QA failed:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Locale routing QA passed: English default, stable language paths, legacy query migration and single event runtime are enforced.');
