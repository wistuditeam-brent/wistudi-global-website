import { chromium } from 'playwright';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const eventPath = '/resources/events/building-a-communicative-esl-lesson-with-flow/';
const locales = ['en','vi','zh-cn','th','id','ms','ar'];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

async function assertCanonicalEvent(locale) {
  const suffix = locale === 'en' ? '' : `?lang=${locale}`;
  await page.goto(`${base}${eventPath}${suffix}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(500);

  const state = await page.evaluate(() => ({
    unit: !!document.querySelector('.ws-event-unit,.ws-event-hero-unit'),
    actions: !!document.querySelector('.event-hero-actions'),
    features: !!document.querySelector('.ws-workshop-features'),
    registration: !!document.querySelector('#eventRegistrationForm'),
    trainer: !!document.querySelector('.trainer'),
    zoomBridge: [...document.scripts].some(s => (s.src || '').includes('event-zoom-bridge.js')),
    lang: document.documentElement.lang,
    bodyWidth: document.body.scrollWidth,
    viewportWidth: document.documentElement.clientWidth
  }));

  for (const [key, ok] of Object.entries({
    eventUnit: state.unit,
    heroActions: state.actions,
    workshopFeatures: state.features,
    registrationForm: state.registration,
    trainerSection: state.trainer,
    zoomBridge: state.zoomBridge,
    noHorizontalBlowout: state.bodyWidth <= state.viewportWidth + 8
  })) {
    if (!ok) throw new Error(`[${locale}] failed canonical event assertion: ${key}`);
  }

  // Detect the kind of main-thread stall caused by translation/MutationObserver loops.
  const frameDelay = await page.evaluate(() => new Promise(resolve => {
    const start = performance.now();
    requestAnimationFrame(() => requestAnimationFrame(() => resolve(performance.now() - start)));
  }));
  if (frameDelay > 1000) throw new Error(`[${locale}] page responsiveness regression: ${Math.round(frameDelay)}ms for two animation frames`);
}

try {
  for (const locale of locales) await assertCanonicalEvent(locale);

  // Exercise the real language UI, not only direct query-string rendering.
  await page.goto(`${base}${eventPath}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.locator('.ws-lang-toggle').first().click();
  const vietnamese = page.locator('.ws-lang-menu a.ws-lang-option[href*="lang=vi"], .ws-lang-menu [data-locale="vi"]').first();
  if (await vietnamese.count()) {
    await vietnamese.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
    const stillCanonical = await page.evaluate(() => !!document.querySelector('.ws-event-unit,.ws-event-hero-unit') && !!document.querySelector('.ws-workshop-features'));
    if (!stillCanonical) throw new Error('Language-menu switch changed the event to a non-canonical/older layout.');
  }

  if (errors.length) {
    const meaningful = errors.filter(e => !/favicon|net::ERR_ABORTED/i.test(e));
    if (meaningful.length) throw new Error(`Browser errors detected:\n${meaningful.join('\n')}`);
  }

  console.log('Event multilingual regression QA passed for:', locales.join(', '));
} finally {
  await browser.close();
}
