import fs from 'node:fs';

const failures=[];
const wrapperPath='functions/_middleware.js';
const corePath='functions/_middleware-core.js';
const nestedEventMiddleware='functions/resources/events/building-a-communicative-esl-lesson-with-flow/_middleware.js';

const wrapper=fs.readFileSync(wrapperPath,'utf8');
const core=fs.readFileSync(corePath,'utf8');
const nested=fs.readFileSync(nestedEventMiddleware,'utf8');

if(!wrapper.includes('requestWithoutAutomaticLanguageRedirect')) failures.push('locale wrapper does not neutralize automatic browser-language redirects');
if(!wrapper.includes("target.searchParams.set('lang', locale)")) failures.push('legacy locale prefixes are not canonicalized to ?lang=');
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
    env:{ASSETS:{fetch:async()=>new Response('<!doctype html><html><head></head><body></body></html>',{headers:{'content-type':'text/html'}})}},
    next:async()=>new Response('<!doctype html><html><head></head><body></body></html>',{status:200,headers:{'content-type':'text/html'}})
  };
  return onRequest(context);
}

async function assertNoRedirect(name,url,headers={}){
  const response=await request(url,headers);
  if(response.status>=300&&response.status<400) failures.push(`${name}: unexpectedly redirected to ${response.headers.get('location')||'(missing location)'}`);
}

async function assertRedirect(name,url,expectedPath,expectedLang){
  const response=await request(url);
  if(response.status!==301){failures.push(`${name}: expected 301, received ${response.status}`);return}
  const location=response.headers.get('location')||'';
  let parsed;try{parsed=new URL(location)}catch{failures.push(`${name}: invalid redirect location ${location}`);return}
  if(parsed.pathname!==expectedPath) failures.push(`${name}: expected path ${expectedPath}, received ${parsed.pathname}`);
  if(expectedLang){
    if(parsed.searchParams.get('lang')!==expectedLang) failures.push(`${name}: expected lang=${expectedLang}, received ${parsed.search}`);
  }else if(parsed.searchParams.has('lang')) failures.push(`${name}: English canonical URL should not keep a lang parameter`);
}

await assertNoRedirect('first visit defaults to English','https://global.wistudi.com/',{'accept-language':'vi-VN,vi;q=0.9,en;q=0.8'});
await assertNoRedirect('browser cookie cannot force locale prefix','https://global.wistudi.com/',{'accept-language':'th-TH,th;q=0.9','cookie':'wistudi_locale=vi'});
await assertNoRedirect('explicit query language stays canonical','https://global.wistudi.com/?lang=vi',{'accept-language':'vi-VN,vi;q=0.9'});
await assertNoRedirect('event query language stays canonical','https://global.wistudi.com/resources/events/building-a-communicative-esl-lesson-with-flow/?lang=vi',{'accept-language':'vi-VN,vi;q=0.9'});
await assertRedirect('legacy Vietnamese homepage','https://global.wistudi.com/vi/','/','vi');
await assertRedirect('legacy Vietnamese event','https://global.wistudi.com/vi/resources/events/building-a-communicative-esl-lesson-with-flow/','/resources/events/building-a-communicative-esl-lesson-with-flow/','vi');
await assertRedirect('legacy English prefix','https://global.wistudi.com/en/','/',null);

if(failures.length){
  console.error('Locale routing QA failed:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Locale routing QA passed: English default, query-based languages, legacy redirects and single event runtime are enforced.');
