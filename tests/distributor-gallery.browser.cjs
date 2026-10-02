/* Real Chromium regression test. Run from repo root after npm installing playwright.
   GALLERY_BASE_URL defaults to a locally served checkout. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const BASE = (process.env.GALLERY_BASE_URL || 'http://127.0.0.1:8765').replace(/\/$/, '');
const EXPECTED = [14, 23, 10];
const roots = ['/distributor-room/gallery/', '/distributor-room/vi/gallery/'];

async function verify(page, root) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(BASE + root + '?category=wistudi-events', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('#categoryBar .category-btn').first().waitFor({ timeout: 15000 });
  assert.equal(await page.locator('#categoryBar .category-btn').count(), 3, root + ': missing tabs');
  for (const [index, count] of EXPECTED.entries()) {
    if (index) await page.locator('#categoryBar .category-btn').nth(index).click();
    await page.waitForFunction(expected => {
      const cards = document.querySelectorAll('#galleryGrid .gallery-card');
      return cards.length === expected && !document.querySelector('#galleryGrid').hidden
        && document.querySelector('#galleryState').hidden;
    }, count, { timeout: 12000 });
    assert.equal(await page.locator('#galleryGrid .gallery-card').count(), count);
    await page.locator('#galleryGrid .gallery-card img').first().evaluate(async img => {
      if (!img.complete) await new Promise((resolve,reject) => {
        img.addEventListener('load',resolve,{once:true});
        img.addEventListener('error',()=>reject(new Error('first thumbnail failed')),{once:true});
      });
      if (!img.naturalWidth) throw new Error('thumbnail has no decoded width: ' + img.src);
    });
    console.log(root, 'category', index, 'rendered', count, 'images');
  }

  await page.locator('#galleryGrid .gallery-card').first().click();
  await page.locator('#lightbox.open #lightboxImage').waitFor({timeout:10000});
  await page.waitForFunction(() => document.querySelector('#lightboxImage')?.naturalWidth > 0, null, { timeout:15000 });
  await page.locator('#closeLightbox').click();
  assert.equal(await page.locator('#lightbox.open').count(), 0);
  assert.deepEqual(errors, [], root + ': uncaught JavaScript exceptions');
  console.log(root, 'PASS: tabs, thumbnails, lightbox and no page errors');
}

(async () => {
  const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
  try {
    for(const root of roots) {
      const context = await browser.newContext({viewport:{width:1280,height:800}});
      const page = await context.newPage();
      await verify(page,root);
      await context.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => {console.error(error);process.exitCode=1;});
