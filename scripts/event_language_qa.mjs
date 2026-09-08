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
    await page.waitForTimeout(250);

    const state = await page.evaluate(() => ({
      eventUnit: !!document.querySelector('.ws-event-unit'),
      oldEventUnit: !!document.querySelector('.ws-event-hero-unit'),
      actions: !!document.querySelector('.event-hero-actions'),
      features: !!document.querySelector('.ws-workshop-features'),
      registration: !!document.querySelector('#eventRegistrationForm'),
      trainer: !!document.querySelector('.trainer'),
      zoomBridge: [...document.scripts].some(s => (s.src || '').includes('event-zoom-bridge.js')),
      legacyHighlightLoaded: [...document.scripts].some(s => (s.src || '').includes('event-highlight.js')),
      resourcePageShellLoaded: [...document.scripts].some(s => (s.src || '').includes('resources-page-shell.js')),
      locale: document.documentElement.lang,
      bodyWidth: document.body.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
      title: document.title,
      text: (document.body.innerText || '').slice(0,12000)
    }));

    const checks = {
      canonicalEventUnit: state.eventUnit,
      noSupersededEventUnit: !state.oldEventUnit,
      heroActions: state.actions,
      workshopFeatures: state.features,
      registrationForm: state.registration,
      trainerSection: state.trainer,
      zoomBridge: state.zoomBridge,
      noLegacyHighlightRuntime: !state.legacyHighlightLoaded,
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
      canonical: !!document.querySelector('.ws-event-unit') && !!document.querySelector('.ws-workshop-features'),
      oldUnit: !!document.querySelector('.ws-event-hero-unit'),
      resourceShell: [...document.scripts].some(s => (s.src || '').includes('resources-page-shell.js'))
    }));
    if (!state.canonical || state.oldUnit || state.resourceShell) failures.push(`language-menu switch to ${locale} changed the event away from the canonical runtime`);
  }
  await page.close();

  if (failures.length) {
    console.error('Event multilingual regression QA FAILED');
    for (const failure of failures) console.error(' - ' + failure);
    process.exit(1);
  }
  console.log('Event multilingual regression QA passed on desktop and mobile for:', locales.join(', '));
} finally {
  await browser.close();
}
