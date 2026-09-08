import { chromium } from 'playwright';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const eventPath = '/resources/events/building-a-communicative-esl-lesson-with-flow/';
const locales = ['en','vi','zh-cn','th','id','ms','ar'];
const expectedLang = {en:'en',vi:'vi','zh-cn':'zh-CN',th:'th',id:'id',ms:'ms',ar:'ar'};
const viewports = [
  {name:'desktop', width:1440, height:1000},
  {name:'mobile', width:390, height:844}
];

const browser = await chromium.launch({ headless: true });
const failures = [];

async function assertCanonicalEvent(locale, viewport) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  try {
    const suffix = locale === 'en' ? '' : `?lang=${locale}`;
    await page.goto(`${base}${eventPath}${suffix}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => document.documentElement.dataset.wsEventRuntime === 'ready', null, { timeout: 20000 });
    await page.waitForTimeout(350);

    const state = await page.evaluate(() => ({
      presentation: document.documentElement.dataset.wsEventPresentation,
      heroUnit: !!document.querySelector('.ws-event-hero-unit'),
      supersededUnit: !!document.querySelector('.ws-event-unit'),
      actions: !!document.querySelector('.event-hero-actions'),
      workshopFeatures: !!document.querySelector('.ws-workshop-features'),
      featureItems: document.querySelectorAll('.ws-workshop-features .workshop-item').length,
      eventHighlight: !!document.querySelector('#ws-event-highlight-section'),
      registration: !!document.querySelector('#eventRegistrationForm'),
      registrationCentered: !!document.querySelector('.ws-registration-centered'),
      registrationLeftVisible: [...document.querySelectorAll('.ws-registration-left,.registration-left,.ws-registration-left-hidden')].some(el => {
        const style=getComputedStyle(el); return style.display !== 'none' && el.getBoundingClientRect().height > 20;
      }),
      trainer: !!document.querySelector('.trainer'),
      zoomBridge: [...document.scripts].some(s => (s.src || '').includes('event-zoom-bridge.js')),
      canonicalHighlightLoaded: [...document.scripts].some(s => (s.src || '').includes('event-highlight.js')),
      competingUpgradeLoaded: [...document.scripts].some(s => (s.src || '').includes('event-upgrades-v2.js')),
      eventI18nLoaded: [...document.scripts].some(s => (s.src || '').includes('/event-i18n.js')),
      eventContentI18nLoaded: [...document.scripts].some(s => (s.src || '').includes('/event-i18n-content.js')),
      resourcePageShellLoaded: [...document.scripts].some(s => (s.src || '').includes('resources-page-shell.js')),
      locale: document.documentElement.lang,
      bodyWidth: document.body.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
      text: (document.body.innerText || '').slice(0,20000)
    }));

    const checks = {
      canonicalPresentationMarker: state.presentation === 'canonical-highlight',
      canonicalHeroUnit: state.heroUnit,
      noCompetingEventUnit: !state.supersededUnit,
      heroActions: state.actions,
      workshopFeatures: state.workshopFeatures,
      sixWorkshopFeatureRows: state.featureItems === 6,
      activitiesToCommunicationHighlight: state.eventHighlight,
      registrationForm: state.registration,
      centeredRegistration: state.registrationCentered,
      noOldSplitRegistrationPanel: !state.registrationLeftVisible,
      trainerSection: state.trainer,
      zoomBridge: state.zoomBridge,
      canonicalHighlightRuntime: state.canonicalHighlightLoaded,
      noCompetingUpgradeRuntime: !state.competingUpgradeLoaded,
      completeEventTranslationRuntime: state.eventI18nLoaded && state.eventContentI18nLoaded,
      noGenericResourceRuntimeOnEvent: !state.resourcePageShellLoaded,
      correctDocumentLanguage: state.locale.toLowerCase() === expectedLang[locale].toLowerCase(),
      noHorizontalBlowout: state.bodyWidth <= state.viewportWidth + 8
    };
    for (const [key, ok] of Object.entries(checks)) {
      if (!ok) failures.push(`[${locale}/${viewport.name}] failed canonical event assertion: ${key}`);
    }

    if (locale !== 'en') {
      const staleEnglish = [
        'Everything you need for a practical and inspiring session.',
        'Practical takeaways for your teaching.',
        'Register Free',
        'Join the live session',
        'Save your place.'
      ].filter(text => state.text.includes(text));
      if (staleEnglish.length) failures.push(`[${locale}/${viewport.name}] event translation is incomplete: ${staleEnglish.join(' | ')}`);
    }

    const frameDelay = await page.evaluate(() => new Promise(resolve => {
      const start = performance.now();
      requestAnimationFrame(() => requestAnimationFrame(() => resolve(performance.now() - start)));
    }));
    if (frameDelay > 500) failures.push(`[${locale}/${viewport.name}] page responsiveness regression: ${Math.round(frameDelay)}ms for two animation frames`);

    const timerDelay = await page.evaluate(() => new Promise(resolve => {
      const start = performance.now();
      setTimeout(() => resolve(performance.now() - start), 75);
    }));
    if (timerDelay > 400) failures.push(`[${locale}/${viewport.name}] event loop delay regression: ${Math.round(timerDelay)}ms for 75ms timer`);

    const meaningful = errors.filter(e => !/favicon|net::ERR_ABORTED|Failed to load resource.*404/i.test(e));
    for (const error of meaningful) failures.push(`[${locale}/${viewport.name}] browser error: ${error}`);
  } catch (error) {
    failures.push(`[${locale}/${viewport.name}] ${error.message}`);
  } finally {
    await page.close();
  }
}

async function assertResourcesPromo(locale) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  try {
    const suffix = locale === 'en' ? '' : `?lang=${locale}`;
    await page.goto(`${base}/resources/${suffix}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => !!document.getElementById('ws-res-event-polish'), null, { timeout: 15000 });
    await page.waitForTimeout(250);
    const state = await page.evaluate(eventPath => {
      const promo=document.querySelector('.res-event-feature');
      const card=promo?.querySelector('.res-event-card');
      const art=promo?.querySelector('.res-event-art');
      const links=[...document.querySelectorAll(`a[href*="${eventPath}"]`)];
      const img=promo?.querySelector('.res-event-art img');
      const button=promo?.querySelector('.res-event-link');
      const artRect=art?.getBoundingClientRect();
      const buttonRect=button?.getBoundingClientRect();
      const artStyle=art?getComputedStyle(art):null;
      const imgStyle=img?getComputedStyle(img):null;
      const buttonStyle=button?getComputedStyle(button):null;
      return {
        promo: !!promo,
        card: !!card,
        polishLoaded: [...document.scripts].some(s => (s.src || '').includes('resources-event-polish.js')),
        links: links.length,
        usesEventArtwork: !!img && (img.getAttribute('src')||'').includes('/resources/events/event-main-banner.png'),
        imageLoaded: !!img && img.complete && img.naturalWidth > 0,
        objectFit: imgStyle?.objectFit || '',
        artRatio: artRect?.height ? artRect.width/artRect.height : 0,
        artAspect: artStyle?.aspectRatio || '',
        buttonHeight: buttonRect?.height || 0,
        buttonBackground: buttonStyle?.backgroundImage || '',
        buttonText: button?.textContent?.replace(/\s+/g,' ').trim() || '',
        title: promo?.querySelector('h2')?.textContent?.trim() || '',
        text: promo?.innerText || '',
        locale: document.documentElement.lang,
        bodyWidth: document.body.scrollWidth,
        viewportWidth: document.documentElement.clientWidth
      };
    }, eventPath);

    const checks={
      promoPresent: state.promo && state.card,
      polishRuntimeLoaded: state.polishLoaded,
      linksToEvent: state.links >= 2,
      realEventArtwork: state.usesEventArtwork && state.imageLoaded,
      imageFitsWithoutCropping: state.objectFit === 'contain',
      sixteenByNineArtwork: state.artRatio > 1.72 && state.artRatio < 1.84,
      prominentRegisterButton: state.buttonHeight >= 50 && /gradient/i.test(state.buttonBackground),
      correctDocumentLanguage: state.locale.toLowerCase() === expectedLang[locale].toLowerCase(),
      noHorizontalBlowout: state.bodyWidth <= state.viewportWidth + 8
    };
    for(const [key,ok] of Object.entries(checks)) if(!ok) failures.push(`[resources/${locale}] failed workshop promo assertion: ${key}`);

    if(locale==='en'){
      if(!/Building a Communicative ESL Lesson with Flow/i.test(state.title)) failures.push('[resources/en] workshop section title is incorrect');
      if(!/Register Free/i.test(state.buttonText)) failures.push('[resources/en] polished Register Free button is missing');
    }else{
      const staleEnglish=['Upcoming live workshop','Building a Communicative ESL Lesson with Flow','Join Trainer Nadia for a free practical workshop','Free to join','ESL teachers','Register Free'].filter(text=>state.text.includes(text));
      if(staleEnglish.length) failures.push(`[resources/${locale}] workshop promo translation is incomplete: ${staleEnglish.join(' | ')}`);
    }
  } catch(error) {
    failures.push(`[resources/${locale}] ${error.message}`);
  } finally {
    await page.close();
  }
}

async function assertHomepageEventTakeoverRemoved(){
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  try{
    await page.goto(`${base}/`,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForTimeout(700);
    const state=await page.evaluate(()=>({
      promo:!!document.querySelector('#ws-home-event-promo'),
      takeoverScript:[...document.scripts].some(s=>(s.src||'').includes('home-event-banner-v2.js'))
    }));
    if(state.promo) failures.push('[homepage] temporary event takeover banner is still visible');
    if(state.takeoverScript) failures.push('[homepage] temporary event takeover runtime is still being loaded');
  }catch(error){
    failures.push(`[homepage] ${error.message}`);
  }finally{
    await page.close();
  }
}

try {
  for (const viewport of viewports) {
    for (const locale of locales) await assertCanonicalEvent(locale, viewport);
  }

  // Exercise the real selector from English to Vietnamese and then to Chinese.
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(`${base}${eventPath}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => document.documentElement.dataset.wsEventRuntime === 'ready', null, { timeout: 20000 });
  for (const locale of ['vi','zh-cn']) {
    await page.locator('.ws-lang-toggle').first().click();
    const option = page.locator(`.ws-lang-menu [data-locale="${locale}"]`).first();
    if (!(await option.count())) {
      failures.push(`language selector is missing ${locale}`);
      continue;
    }
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
      option.click()
    ]);
    await page.waitForFunction(() => document.documentElement.dataset.wsEventRuntime === 'ready', null, { timeout: 20000 });
    const state = await page.evaluate(() => ({
      canonical: !!document.querySelector('.ws-event-hero-unit') && !!document.querySelector('.ws-workshop-features') && !!document.querySelector('#ws-event-highlight-section'),
      competingUnit: !!document.querySelector('.ws-event-unit'),
      competingRuntime: [...document.scripts].some(s => (s.src || '').includes('event-upgrades-v2.js')),
      resourceShell: [...document.scripts].some(s => (s.src || '').includes('resources-page-shell.js')),
      translated: !/Everything you need for a practical and inspiring session\./.test(document.body.innerText||'')
    }));
    if (!state.canonical || state.competingUnit || state.competingRuntime || state.resourceShell || !state.translated) failures.push(`language-menu switch to ${locale} changed the event away from the canonical translated current design`);
  }
  await page.close();

  for(const locale of locales) await assertResourcesPromo(locale);
  await assertHomepageEventTakeoverRemoved();

  if (failures.length) {
    console.error('Event and Resources regression QA FAILED');
    for (const failure of failures) console.error(' - ' + failure);
    process.exit(1);
  }
  console.log('Current event design, translations, Resources promo and homepage banner state passed regression QA.');
} finally {
  await browser.close();
}