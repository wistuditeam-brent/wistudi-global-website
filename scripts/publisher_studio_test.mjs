import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { workshop, challenge, resources, contextFor } from '../assets/js/publisher-studio/data.mjs';
import { STORAGE_KEY, createState, registerDemo, askQuestion, toggleVote, voteCount, addThread, addReply, submitBuild, avatar, safeLink, escapeHtml, loadState, saveState } from '../assets/js/publisher-studio/model.mjs';

const middlewareSource = await fs.readFile(new URL('../functions/publisher-studio/_middleware.js', import.meta.url), 'utf8');
const { onRequest } = await import(`data:text/javascript;base64,${Buffer.from(middlewareSource).toString('base64')}`);

test('fixture state is independent and every discussion has a known context', () => {
  const first = createState(); const second = createState();
  first.threads[0].replies.push({ body: 'Local' });
  assert.equal(second.threads[0].replies.length, 1);
  [...first.questions, ...first.threads].forEach(item => assert.equal(contextFor(item.contextId).workshopId, workshop.id));
  assert.throws(() => contextFor('unknown'));
});

test('registration consent creates an explicit demo identity without storing email', () => {
  const state = createState();
  assert.equal(registerDemo(state, 'Demo Teacher', false), null);
  const profile = registerDemo(state, ' Demo Teacher ', true);
  assert.equal(profile.displayName, 'Demo Teacher');
  assert.equal(profile.consentToStudio, true);
  assert.ok(profile.avatarSeed);
  assert.ok(!('email' in profile));
  assert.deepEqual(avatar(profile.displayName, profile.avatarSeed), avatar(profile.displayName, profile.avatarSeed));
  assert.equal(avatar('Demo Teacher').initials, 'DT');
});

test('questions inherit context, validate content, and votes are reversible and unique', () => {
  const state = createState();
  registerDemo(state, 'Test Teacher', true);
  const question = askQuestion(state, 'Can I adapt this?', resources[0].id);
  assert.equal(question.author, 'Test Teacher');
  assert.equal(question.context.type, 'template');
  assert.equal(question.context.level, 'B1');
  toggleVote(state, question.id); assert.equal(voteCount(state, question), 1);
  toggleVote(state, question.id); assert.equal(voteCount(state, question), 0);
  assert.throws(() => toggleVote(state, 'missing'));
  assert.throws(() => askQuestion(state, '   '));
  assert.throws(() => askQuestion(state, 'x'.repeat(2001)));
  assert.throws(() => askQuestion(state, 'Valid body', 'missing'));
});

test('contributions and replies stay with their objects', () => {
  const state = createState();
  const thread = addThread(state, { title: 'A teaching idea', body: 'Try task cards', kind: 'idea', contextId: challenge.id });
  assert.equal(thread.context.type, 'challenge');
  addReply(state, thread.id, 'Can you give an example?');
  addReply(state, resources[0].id, 'Adapt for A2.');
  assert.equal(thread.replies.length, 1);
  assert.equal(state.resourceReplies[resources[0].id].length, 1);
  assert.throws(() => addReply(state, workshop.id, 'Unknown destination'));
  assert.throws(() => addThread(state, { title: 'A', body: 'B', kind: 'toString', contextId: workshop.id }));
});

test('submissions enforce safe URLs and start pending, never public', () => {
  const state = createState();
  for (const url of ['javascript:alert(1)', 'data:text/html,test', 'http://example.com', 'https://name:secret@example.com', '/relative']) assert.equal(safeLink(url), null);
  const submission = submitBuild(state, { title: 'Plan a day out', description: 'An adapted speaking task.', url: 'https://example.com/my-lesson', help: 'Feedback on the prompt' });
  assert.equal(submission.moderationStatus, 'pending');
  assert.equal(submission.context.workshopId, workshop.id);
  assert.equal(state.joined, true);
  assert.throws(() => submitBuild(state, { title: 'A', description: 'B', url: 'javascript:alert(1)' }));
});

test('rendered user text is escaped', () => {
  assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
});

test('tab storage restores valid state and recovers from corruption or unavailability', () => {
  const values = new Map();
  const storage = { setItem: (key, value) => values.set(key, value), getItem: key => values.get(key) };
  const state = createState();
  askQuestion(state, 'A saved question');
  assert.equal(saveState(storage, state), true);
  assert.deepEqual(loadState(storage).state, state);
  values.set(STORAGE_KEY, '{bad json');
  assert.ok(loadState(storage).warning);
  for (const patch of [{ questions: [null] }, { threads: [{}] }, { profile: 'invalid' }, { resourceReplies: { broken: [null] } }, { submissions: [{}] }, { votes: ['missing'] }]) {
    values.set(STORAGE_KEY, JSON.stringify({ ...createState(), ...patch }));
    assert.ok(loadState(storage).warning);
  }
  assert.equal(saveState(undefined, state), false);
  assert.deepEqual(loadState(undefined).state, createState());
});

test('preview middleware is closed by default and only explicit opt-in allows routing', async () => {
  for (const setting of [undefined, '', 'false', true]) {
    const response = await onRequest({ env: { PUBLISHER_STUDIO_PREVIEW_ENABLED: setting }, next: () => { throw new Error('Should not route'); } });
    assert.equal(response.status, 404);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
  }
  const response = await onRequest({ env: { PUBLISHER_STUDIO_PREVIEW_ENABLED: 'true' }, next: async () => new Response('Preview', { status: 200, headers: { 'content-type': 'text/html' } }) });
  assert.equal(await response.text(), 'Preview');
  assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow, noarchive');
});

test('prototype routes are noindex, isolated from live APIs and absent from sitemap', async () => {
  const pages = ['publisher-studio/index.html', 'publisher-studio/studio/index.html', 'publisher-studio/events/communicative-esl/index.html'];
  for (const path of pages) {
    const html = await fs.readFile(new URL(`../${path}`, import.meta.url), 'utf8');
    assert.match(html, /name="robots" content="noindex,nofollow"/);
    assert.match(html, /<noscript>/);
  }
  const app = await fs.readFile(new URL('../assets/js/publisher-studio/app.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(app, /fetch\(|\/api\/event-register|localStorage|Google|zoom\.us/);
  assert.doesNotMatch(await fs.readFile(new URL('../sitemap.xml', import.meta.url), 'utf8'), /publisher-studio/);
});
