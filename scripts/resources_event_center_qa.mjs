import { chromium } from 'playwright';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
const failures = [];

try {
  for (const viewport of [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'tablet', width: 820, height: 1000 },
    { name: 'mobile', width: 390, height: 844 }
  ]) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
    try {
      await page.goto(`${base}/resources/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForFunction(() => !!document.getElementById('ws-res-event-polish'), null, { timeout: 15000 });
      const state = await page.evaluate(() => {
        const card = document.querySelector('.res-event-card');
        const rect = card?.getBoundingClientRect();
        return {
          present: !!card,
          center: rect ? rect.left + rect.width / 2 : 0,
          width: rect?.width || 0,
          viewportCenter: document.documentElement.clientWidth / 2,
          viewportWidth: document.documentElement.clientWidth,
          marginLeft: card ? getComputedStyle(card).marginLeft : '',
          marginRight: card ? getComputedStyle(card).marginRight : ''
        };
      });
      if (!state.present) failures.push(`[${viewport.name}] Resources event card is missing`);
      if (Math.abs(state.center - state.viewportCenter) > 3) failures.push(`[${viewport.name}] Resources event card is not centered`);
      if (viewport.name === 'desktop' && state.width > 1128) failures.push(`[${viewport.name}] Resources event card exceeds the intended 1120px feature width`);
      if (state.width > state.viewportWidth) failures.push(`[${viewport.name}] Resources event card overflows the viewport`);
    } finally {
      await page.close();
    }
  }

  if (failures.length) {
    console.error('Resources event centering QA FAILED');
    failures.forEach(failure => console.error(` - ${failure}`));
    process.exit(1);
  }
  console.log('Resources event feature is centered and contained across desktop, tablet and mobile.');
} finally {
  await browser.close();
}
