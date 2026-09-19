import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const artifacts = process.env.QA_ARTIFACT_DIR || path.join(root, 'qa-artifacts/publisher-studio');
await fs.mkdir(artifacts, { recursive: true });
const types = { '.html': 'text/html', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
const server = createServer(async (request, response) => {
  try {
    let file = path.resolve(root, `.${decodeURIComponent(new URL(request.url, 'http://localhost').pathname)}`);
    if (!file.startsWith(`${root}/`)) throw new Error('Invalid path');
    if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
    response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    response.end(await fs.readFile(file));
  } catch { response.writeHead(404); response.end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
let checks = 0;
async function visible(locator) { await locator.waitFor({ state: 'visible' }); checks++; }
async function noOverflow(page) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Page overflows horizontally');
  const duplicateIds = await page.evaluate(() => { const ids = [...document.querySelectorAll('[id]')].map(el => el.id); return ids.filter((id, index) => ids.indexOf(id) !== index); });
  assert.deepEqual(duplicateIds, [], 'Duplicate DOM IDs'); checks += 2;
}

try {
  browser = await chromium.launch({ headless: true });
  for (const width of [390, 1440, 320, 768]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    page.setDefaultTimeout(7000);
    const errors = []; const writes = []; const badResponses = [];
    page.on('pageerror', error => errors.push(String(error)));
    page.on('request', request => { if (request.method() !== 'GET') writes.push(request.url()); });
    page.on('response', response => { if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`); });
    await page.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());

    await page.goto(`${base}/publisher-studio/`);
    await visible(page.getByRole('heading', { name: 'Wistudi Publisher Studio', exact: true })); await noOverflow(page);
    if ([390,1440].includes(width)) await page.screenshot({ path: path.join(artifacts, `home-${width}.png`), fullPage: true });
    await page.getByRole('link', { name: /Preview registration/ }).click();
    await page.getByLabel('Display name', { exact: true }).fill('Demo Teacher');
    await page.getByLabel('Email (preview only)', { exact: true }).fill('demo@example.com');
    await page.getByRole('checkbox').check();
    await noOverflow(page);
    if ([390,1440].includes(width)) await page.screenshot({ path: path.join(artifacts, `event-${width}.png`), fullPage: true });
    await page.getByRole('button', { name: 'Test registration' }).click();
    await visible(page.getByRole('heading', { name: 'Demo registration complete' }));
    assert.equal(await page.evaluate(() => JSON.stringify(sessionStorage).includes('demo@example.com')), false);
    await page.getByRole('link', { name: 'Enter the Studio preview' }).click();
    await visible(page.getByRole('heading', { name: 'This week in the Studio' })); await noOverflow(page);
    if ([390,1440].includes(width)) await page.screenshot({ path: path.join(artifacts, `studio-${width}.png`), fullPage: true });

    const phase = page.locator('[data-phase]:visible');
    await phase.selectOption('live'); await visible(page.getByText('Studio Live (preview)', { exact: true }));
    await phase.selectOption('post_session'); await visible(page.getByText('Recording is not connected.', { exact: true }));
    await phase.selectOption('upcoming');
    const nav = page.getByRole('navigation', { name: 'Studio sections' });
    await nav.getByRole('link', { name: /Questions/ }).click();
    await visible(page.getByRole('heading', { name: 'Ask the Trainer' }));
    await page.getByLabel('Your question').fill('<img src=x onerror=alert(1)> Can I adapt this for A2?');
    await page.locator('#question-form select').selectOption('demo-template-01');
    await page.getByRole('button', { name: 'Post demo question' }).click();
    const question = page.locator('.question-card').filter({ hasText: 'Can I adapt this for A2?' });
    await visible(question);
    assert.equal(await question.locator('img').count(), 0);
    await question.getByRole('button').click(); assert.equal(await question.getByRole('button').getAttribute('aria-pressed'), 'true');
    await question.getByRole('button').click(); assert.equal(await question.getByRole('button').getAttribute('aria-pressed'), 'false');
    await page.reload(); await visible(question);
    await page.getByRole('button', { name: 'Answered', exact: true }).click();
    assert.equal(await page.locator('.question-card').count(), 1);
    await page.getByRole('button', { name: 'All questions', exact: true }).click(); await noOverflow(page);
    if ([390,1440].includes(width)) await page.screenshot({ path: path.join(artifacts, `questions-${width}.png`), fullPage: true });
    await page.getByLabel('Your question').fill('A draft worth keeping');
    await nav.getByRole('link', { name: 'Resources' }).click();
    await page.getByLabel('Search resources').fill('not-found'); await visible(page.getByRole('heading', { name: 'No matching resources' }));
    await page.getByLabel('Search resources').fill('conversation');
    await page.getByRole('button', { name: 'Preview & discuss' }).click();
    await visible(page.getByRole('dialog'));
    await page.getByLabel('Your reply').fill('I would use this for a smaller group.');
    await page.getByRole('button', { name: 'Send demo reply' }).click();
    await visible(page.getByText('I would use this for a smaller group.', { exact: true }));
    if ([390,1440].includes(width)) await page.screenshot({ path: path.join(artifacts, `conversation-${width}.png`) });
    await page.keyboard.press('Escape');
    await nav.getByRole('link', { name: /Questions/ }).click(); assert.equal(await page.getByLabel('Your question').inputValue(), 'A draft worth keeping');

    await nav.getByRole('link', { name: 'Workbench' }).click();
    await page.getByRole('button', { name: 'Contribute', exact: true }).click();
    await page.getByLabel('Contribution type').selectOption('made_something');
    await page.getByRole('dialog').getByLabel('About', { exact: true }).selectOption('demo-challenge-01');
    await page.getByLabel('Title', { exact: true }).fill('My adapted lesson');
    await page.getByLabel('Your contribution').fill('I added partner roles.');
    await page.getByRole('button', { name: 'Post demo contribution' }).click();
    await page.getByRole('button', { name: 'My adapted lesson', exact: true }).click();
    await page.getByLabel('Your reply').fill('A follow-up idea.');
    await page.getByRole('button', { name: 'Send demo reply' }).click();
    await visible(page.getByText('A follow-up idea.', { exact: true }));
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await page.locator('#thread-filter').selectOption('made_something');
    assert.equal(await page.locator('.thread-card').count(), 1); await noOverflow(page);

    await nav.getByRole('link', { name: 'Challenge', exact: true }).click();
    await page.getByRole('button', { name: "I'll take part" }).click();
    await visible(page.getByRole('button', { name: 'Taking part (demo)' }));
    await page.getByLabel('Creation title').fill('A day in my town');
    await page.getByLabel('What did you create?').fill('A speaking lesson with choices.');
    await page.getByLabel('Link to your creation').fill('javascript:alert(1)');
    await page.getByRole('button', { name: 'Submit demo creation' }).click();
    await visible(page.getByText('Use a complete https:// link without a username or password.'));
    await page.getByLabel('Link to your creation').fill('https://example.com/my-lesson');
    await page.getByRole('button', { name: 'Submit demo creation' }).click();
    await visible(page.getByRole('heading', { name: 'A day in my town' }));
    await visible(page.getByText('Pending review (demo)', { exact: true })); await noOverflow(page);
    await page.getByRole('button', { name: 'Reset demo', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Reset demo', exact: true }).click();
    assert.equal(await page.locator('.submission-card').count(), 0);
    assert.deepEqual(errors, []); assert.deepEqual(writes, []); assert.deepEqual(badResponses, []); checks += 10;
    await context.close();
  }
  const page = await browser.newPage();
  await page.goto(`${base}/publisher-studio/studio/`);
  await page.evaluate(() => sessionStorage.setItem('wistudi.publisher-studio.prototype.v1', '{broken'));
  await page.reload(); await visible(page.getByText('Saved demo data could not be loaded. A fresh preview is ready.'));
  await page.goto(`${base}/publisher-studio/events/communicative-esl/`);
  await page.getByLabel('Display name', { exact: true }).fill('No profile');
  await page.getByLabel('Email (preview only)', { exact: true }).fill('not-stored@example.com');
  await page.getByRole('button', { name: 'Test registration' }).click();
  assert.equal(await page.evaluate(() => JSON.parse(sessionStorage.getItem('wistudi.publisher-studio.prototype.v1')).profile), null);
  await page.close();
  console.log(`Publisher Studio browser QA passed: ${checks} checks across 320, 390, 768 and 1440px. Screenshots: ${artifacts}`);
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
