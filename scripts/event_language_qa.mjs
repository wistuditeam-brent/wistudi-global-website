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
    await page.waitForTimeout(300);

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
      resourcePageShellLoaded: [...document.scripts].some(s => (s.src || '').includes('resources-page-shell.js')),
      locale: document.documentElement.lang,
      bodyWidth: document.body.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
      text: (document.body.innerText || '').slice(0,16000)
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
      noGenericResourceRuntimeOnEvent: !state.resourcePageShellLoaded,
      correctDocumentLanguage: state.locale.toLowerCase() === expectedLang[locale].toLowerCase(),
      noHorizontalBlowout: state.bodyWidth <= state.viewportWidth + 8
    };
    for (const [key, ok] of Object.entries(checks)) {
      if (!ok) failures.push(`[${locale}/${viewport.name}] failed canonical event assertion: ${key}`);
    }

    if (locale !== 'en' && /Everything you need for a practical and inspiring session\./.test(state.text)) {
      failures.push(`[${locale}/${viewport.name}] event-specific content remained English after translation`);
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

async function assertResourcesPromo() {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  try {
    await page.goto(`${base}/resources/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(300);
    const state = await page.evaluate(eventPath => {
      const promo=document.querySelector('.res-event-feature');
      const links=[...document.querySelectorAll(`a[href^="${eventPath}"]`)];
      const img=promo?.querySelector('img');
      return {
        promo: !!promo,
        links: links.length,
        usesEventArtwork: !!img && (img.getAttribute('src')||'').includes('/resources/events/event-main-banner.png'),
        imageLoaded: !!img && img.complete && img.naturalWidth > 0,
        title: promo?.querySelector('h2')?.textContent?.trim() || ''
      };
    }, eventPath);
    if(!state.promo) failures.push('[resources] featured live workshop section is missing');
    if(state.links < 2) failures.push('[resources] workshop section does not provide the expected links to the event page');
    if(!state.usesEventArtwork || !state.imageLoaded) failures.push('[resources] workshop section is not using the real event artwork correctly');
    if(!/Building a Communicative ESL Lesson with Flow/i.test(state.title)) failures.push('[resources] workshop section title is incorrect');
  } catch(error) {
    failures.push(`[resources] ${error.message}`);
  } finally {
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
      resourceShell: [...document.scripts].some(s => (s.src || '').includes('resources-page-shell.js'))
    }));
    if (!state.canonical || state.competingUnit || state.competingRuntime || state.resourceShell) failures.push(`language-menu switch to ${locale} changed the event away from the canonical current design`);
  }
  await page.close();

  await assertResourcesPromo();

  if (failures.length) {
    console.error('Event and Resources regression QA FAILED');
    for (const failure of failures) console.error(' - ' + failure);
    process.exit(1);
  }
  console.log('Canonical event design passed on desktop/mobile in all supported languages and the Resources workshop promo is present.');
} finally {
  await browser.close();
}
