import { workshop, challenge, resources, contributionKinds, contextFor } from './data.mjs';
import { STORAGE_KEY, createState, loadState, saveState, escapeHtml as e, avatar, registerDemo, askQuestion, toggleVote, voteCount, addThread, addReply, submitBuild } from './model.mjs';

const root = document.querySelector('#app');
const dialog = document.querySelector('#studio-dialog');
const page = document.body.dataset.page;
const base = '/publisher-studio/';
const eventUrl = `${base}events/${workshop.slug}/`;
let storage;
try { storage = window.sessionStorage; } catch { /* Memory-only preview remains usable. */ }
const loaded = loadState(storage);
let state = loaded.state;
let questionFilter = 'all';
let threadFilter = 'all';
let resourceFilter = '';
let dialogTarget = null;
let dialogMode = null;
let toastTimer;
const drafts = new Map();
const tabs = [ ['week', 'This Week', 'calendar'], ['questions', 'Questions', 'question'], ['challenge', 'Challenge', 'build'], ['workbench', 'Workbench', 'chat'], ['resources', 'Resources', 'book'] ];
const paths = {
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 .5c0 2-2.5 2-2.5 4M12 17h.01"/>',
  build: '<path d="m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5"/>',
  chat: '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2V11.5A8.5 8.5 0 0 1 10.5 3h2a8.5 8.5 0 0 1 8.5 8.5Z"/>',
  book: '<path d="M12 5v16M3 3h5a4 4 0 0 1 4 2 4 4 0 0 1 4-2h5v16h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3V3Z"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>', close: '<path d="m6 6 12 12M6 18 18 6"/>',
  up: '<path d="m6 14 6-6 6 6"/>', send: '<path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13"/>',
  check: '<path d="m5 12 4 4L19 6"/>', plus: '<path d="M12 5v14M5 12h14"/>',
};
const icon = name => `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.book}</svg>`;
const activeTab = () => tabs.some(([key]) => key === location.hash.slice(1)) ? location.hash.slice(1) : 'week';
const person = (name, seed = name) => { const value = avatar(name, seed); return `<span class="avatar color-${value.color}" aria-hidden="true">${e(value.initials)}</span>`; };
const button = (label, action, extra = '', style = 'button secondary') => `<button type="button" class="${style}" data-action="${action}" ${extra}>${label}</button>`;
const tag = (label, style = '') => `<span class="tag ${style}">${e(label)}</span>`;
const contextOptions = () => [workshop.id, challenge.id, ...resources.map(item => item.id)].map(id => `<option value="${id}">${e(contextFor(id).title)}</option>`).join('');
const localTime = () => new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(new Date(workshop.startsAt));

function notify(message) {
  const toast = document.querySelector('#toast');
  clearTimeout(toastTimer); toast.textContent = message; toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 6500);
}

function persist() {
  if (!saveState(storage, state)) notify('Browser storage is unavailable. Changes last only until you reload this page.');
}

function prototypeBar() {
  return `<div class="prototype-bar"><span><strong>Development preview</strong><span class="prototype-detail"> / Sample content, this tab only</span></span>${button('Reset demo', 'reset', '', 'text-button')}</div>`;
}

function header() {
  return `<header class="studio-header"><a class="brand" href="${base}" aria-label="Publisher Studio home"><img src="/assets/images/wistudi-logo.png" alt="Wistudi" width="120" height="40"></a><span class="header-divider"></span><a class="studio-wordmark" href="${base}">Publisher Studio</a><div class="header-actions">${page === 'studio' ? `<a class="text-link desktop-only" href="${eventUrl}">Workshop details</a>${person(state.profile?.displayName || 'Demo visitor', state.profile?.avatarSeed || 'visitor')}` : `<a class="button primary" href="${base}studio/">Enter Studio ${icon('arrow')}</a>`}</div></header>`;
}

function phaseControl() {
  return `<label class="phase-control">Preview stage<select data-phase name="phase"><option value="upcoming" ${state.phase === 'upcoming' ? 'selected' : ''}>Before workshop</option><option value="live" ${state.phase === 'live' ? 'selected' : ''}>Live workshop</option><option value="post_session" ${state.phase === 'post_session' ? 'selected' : ''}>After workshop</option></select></label>`;
}

function phaseContent() {
  const content = {
    upcoming: ['Next Studio', 'Bring a lesson. Leave with a new direction.', 'Explore the kit and bring a question for the trainer.', `<a class="button primary" href="${eventUrl}">Preview registration ${icon('arrow')}</a>`],
    live: ['Studio Live (preview)', 'Learn together. Build as you go.', 'Keep the kit open and add questions as they come up.', `<a class="button primary" href="${base}studio/#questions">Ask the Trainer ${icon('arrow')}</a><span class="muted small">Live-session link is not connected.</span>`],
    post_session: ['Keep building', 'The workshop ends. Your idea keeps going.', 'Try the challenge, compare approaches and share what you make.', `<a class="button primary" href="${base}studio/#challenge">Open build challenge ${icon('arrow')}</a><span class="muted small">Recording is not connected.</span>`],
  }[state.phase];
  return `<section class="weekly-focus"><div class="eyebrow">${content[0]}</div><h2>${content[1]}</h2><p>${content[2]}</p><div class="actions">${content[3]}</div></section>`;
}

function resourceRows(limit = resources.length) {
  return resources.slice(0, limit).map((item, index) => `<button type="button" class="resource-row" data-action="resource" data-id="${item.id}"><span class="resource-icon tone-${index}">${icon(item.type === 'template' ? 'build' : 'book')}</span><span><span class="eyebrow">${e(item.label)}</span><strong>${e(item.title)}</strong><span class="muted small">${e(item.description)}</span></span>${icon('arrow')}</button>`).join('');
}

function renderHome() {
  return `${prototypeBar()}${header()}<main id="main" class="public-main"><div class="page-heading"><div><div class="eyebrow">English teaching / A space to create</div><h1>Wistudi Publisher Studio</h1><p class="lead">Learn, build and share interactive learning experiences. One practical workshop at a time.</p></div>${phaseControl()}</div>
    <div class="public-layout"><div><div class="section-top">${tag('Sample workshop', 'teal')}<span class="muted small">English / Speaking / B1</span></div><h2 class="workshop-title">${e(workshop.title)}</h2><p class="muted">${e(workshop.summary)}</p><p class="event-time">${icon('calendar')} ${e(localTime())} <span class="muted"> / sample date</span></p>${phaseContent()}
      <section class="section-block"><div class="section-heading"><h2>This week's Publisher Kit</h2><span class="muted small">3 sample resources</span></div>${resourceRows()}</section></div>
      <aside class="home-aside"><div class="eyebrow">At the workbench</div><h2>Something worth making.</h2><p>${e(challenge.description)}</p><a class="text-link" href="${base}studio/#challenge">Explore the challenge ${icon('arrow')}</a><hr><div class="person-line">${person(workshop.trainer)}<div><strong>${e(workshop.trainer)}</strong><span class="muted small">Host to be assigned</span></div></div><p>Bring questions about your learners, your lesson or the activity you are adapting.</p><a class="text-link" href="${base}studio/#questions">Ask the Trainer ${icon('arrow')}</a><hr><div class="eyebrow">Your publisher journey</div><ol class="journey"><li class="current">Explore</li><li>Build</li><li>Share</li><li>Publish</li></ol></aside></div>
      <section class="section-block"><div class="section-heading"><h2>Conversations with a purpose</h2><a class="text-link" href="${base}studio/#workbench">Open Workbench ${icon('arrow')}</a></div><div class="three-column">${state.threads.slice(0, 3).map(thread => `<article class="preview-card"><div class="eyebrow">${e(contributionKinds[thread.kind])}</div><h3>${e(thread.title)}</h3><p class="muted">${e(thread.body)}</p>${button('Open discussion', 'thread', `data-id="${thread.id}"`, 'text-link')}</article>`).join('')}</div></section>
    </main><footer class="public-footer"><a href="/resources/events/">Wistudi Events</a><span>Prototype only. No real bookings, accounts or published content.</span></footer>`;
}

function renderEvent() {
  return `${prototypeBar()}${header()}<main id="main" class="public-main"><a class="back-link" href="${base}">Publisher Studio / Sample workshop</a><div class="event-layout"><article><div class="eyebrow">English Publisher Studio</div><h1>${e(workshop.title)}</h1><p class="lead">${e(workshop.summary)}</p><div class="event-facts"><div><span class="muted small">Sample date / your timezone</span><strong>${e(localTime())}</strong></div><div><span class="muted small">Format</span><strong>60-minute online workshop</strong></div><div><span class="muted small">Host</span><strong>Wistudi Trainer / to be assigned</strong></div></div><section class="section-block"><h2>What you'll work on</h2><ul class="outcomes"><li>Give each activity a clear role in the lesson.</li><li>Move from supported practice to a meaningful conversation.</li><li>Adapt a reusable lesson outline for your own learners.</li><li>Build one activity and bring it back for feedback.</li></ul></section><section class="section-block"><h2>Your Publisher Kit</h2>${resourceRows()}</section></article>
      <aside class="registration-panel" id="registration-panel"><div class="eyebrow">Registration preview</div><h2>A place at the Studio</h2><p class="muted">Test the registration journey. Nothing is sent to Wistudi and no email is delivered.</p><form id="registration-form"><label>Display name<input name="displayName" maxlength="60" autocomplete="off" placeholder="Use a sample name" required></label><label>Email (preview only)<input name="email" type="email" autocomplete="off" placeholder="you@example.com" required></label><label class="checkbox-row"><input type="checkbox" name="studioConsent"><span>Also create my Studio profile so I can ask questions and share work.</span></label><p class="muted small">An initials avatar is created automatically. Only your sample display name is kept in this browser tab; your email is not stored.</p><p class="form-error" role="alert" hidden></p><button class="button primary full-width" type="submit">Test registration ${icon('arrow')}</button></form><a class="text-link registration-skip" href="${base}studio/">Just explore the preview</a></aside>
    </div></main>`;
}

function renderNav() {
  return `<nav class="workspace-nav" aria-label="Studio sections">${tabs.map(([key, label, glyph]) => `<a href="#${key}" ${activeTab() === key ? 'aria-current="page"' : ''}>${icon(glyph)}<span>${label}</span>${key === 'questions' ? `<span class="nav-count">${state.questions.filter(item => !item.answer).length}</span>` : ''}</a>`).join('')}</nav>`;
}

function renderStudio() {
  return `${prototypeBar()}${header()}<div class="workspace"><aside class="workspace-sidebar"><div class="studio-label">${tag('English Studio', 'teal')}<h2>Let's make<br>something useful.</h2><p class="muted small">Sample workshop 01</p></div>${renderNav()}<div class="sidebar-bottom"><a class="text-link" href="${base}">Studio home ${icon('arrow')}</a><p class="muted small">${state.profile ? `Previewing as ${e(state.profile.displayName)}` : 'Exploring as a demo visitor'}</p></div></aside><main id="main" class="workspace-main" tabindex="-1"><div id="panel">${renderPanel()}</div></main><aside class="context-rail"><div class="eyebrow">This week's context</div><h2>${e(workshop.title)}</h2><div class="tags">${tag('English')}${tag('Speaking')}${tag('B1')}</div><div class="person-line">${person(workshop.trainer)}<div><strong>${e(workshop.trainer)}</strong><span class="muted small">Sample host role</span></div></div><hr>${phaseControl()}<hr><div class="eyebrow">Publisher Kit</div>${resources.map(item => `<button class="rail-resource" data-action="resource" data-id="${item.id}">${icon('book')}<span>${e(item.title)}</span></button>`).join('')}<hr><p class="muted small">Demo contributions are visible only in this tab. They are not sent to other participants.</p></aside></div>`;
}

function panelHeading(title, description, action = '') {
  return `<div class="panel-heading"><div><div class="eyebrow">Workshop 01 / Speaking</div><h1 tabindex="-1">${title}</h1><p class="muted">${description}</p></div>${action}</div>`;
}

function questionCard(question) {
  return `<article class="question-card"><div class="question-body"><div class="person-line">${person(question.author)}<div><strong>${e(question.author)}</strong><span class="muted small">${e(contextFor(question.contextId).title)}</span></div>${question.answer ? tag('Answered', 'teal') : tag('Open')}</div><p>${e(question.body)}</p>${question.answer ? `<div class="trainer-answer"><span class="eyebrow">Trainer answer / sample</span><p>${e(question.answer)}</p></div>` : ''}<button type="button" class="vote-button" data-action="vote" data-id="${question.id}" aria-pressed="${state.votes.includes(question.id)}" aria-label="I want this answered too: ${e(question.body)}">${icon('up')}<strong>${voteCount(state, question)}</strong><span>I want this answered too</span></button></div></article>`;
}

function renderPanel() {
  switch (activeTab()) {
    case 'questions': {
      const questions = state.questions.filter(item => questionFilter === 'all' || (questionFilter === 'answered' ? item.answer : !item.answer)).sort((a, b) => voteCount(state, b) - voteCount(state, a));
      return `${panelHeading('Ask the Trainer', 'Questions about this workshop and the things you are building.')}<div class="filter-row" role="group" aria-label="Filter questions">${[['all', 'All questions'], ['open', 'Open'], ['answered', 'Answered']].map(([key, label]) => `<button data-action="question-filter" data-value="${key}" aria-pressed="${questionFilter === key}">${label}</button>`).join('')}</div><div class="question-list">${questions.map(questionCard).join('') || '<div class="empty-state"><h2>No questions here yet</h2><p>Ask about the workshop or a resource below.</p></div>'}</div><form id="question-form" class="composer"><label class="compact-label">About<select name="contextId">${contextOptions()}</select></label><label class="sr-only" for="question-body">Your question</label><div class="composer-row"><textarea id="question-body" name="body" rows="2" maxlength="2000" placeholder="What would you like to ask?" required></textarea><button class="icon-button primary" title="Post demo question" aria-label="Post demo question" type="submit">${icon('send')}</button></div><p class="form-error" role="alert" hidden></p><span class="muted small">Demo question / visible only to you</span></form>`;
    }
    case 'challenge':
      return `${panelHeading('The build challenge', 'A small, useful step from learning to creating.')}<section class="challenge-brief"><span class="challenge-number">01</span><div>${tag('Weekly build', 'teal')}<h2>${e(challenge.title)}</h2><p>${e(challenge.description)}</p><ul class="outcomes"><li>Choose a topic that matters to your learners.</li><li>Give them a reason to exchange information.</li><li>Include one reflection prompt.</li></ul>${button(state.joined ? `${icon('check')} Taking part (demo)` : `${icon('plus')} I'll take part`, 'join-challenge', `aria-pressed="${state.joined}"`, 'button primary')}</div></section><section class="section-block"><h2>Share your version</h2><p class="muted">A link is enough for this prototype. Screenshot uploads come later.</p><form id="submission-form" class="stack-form"><label>Creation title<input name="title" maxlength="120" placeholder="Give your activity a name" required></label><label>What did you create?<textarea name="description" maxlength="2000" rows="3" required></textarea></label><label>Link to your creation<input type="url" name="url" placeholder="https://..." required></label><label>What would you like help with? <span class="muted">(optional)</span><textarea name="help" maxlength="1000" rows="2"></textarea></label><p class="form-error" role="alert" hidden></p><div class="actions"><button class="button primary" type="submit">Submit demo creation ${icon('arrow')}</button><span class="muted small">Local preview, not published</span></div></form></section><section class="section-block"><h2>Your demo submissions</h2>${state.submissions.length ? state.submissions.map(item => `<article class="submission-card">${tag('Pending review (demo)')}<h3>${e(item.title)}</h3><p>${e(item.description)}</p>${item.help ? `<p class="muted">Feedback requested: ${e(item.help)}</p>` : ''}<a class="text-link" href="${e(item.url)}" target="_blank" rel="noopener noreferrer nofollow">Open submitted link ${icon('arrow')}</a></article>`).join('') : '<div class="empty-state"><p>Your first creation will appear here. Nothing is added to a public showcase.</p></div>'}</section>`;
    case 'workbench': {
      const threads = state.threads.filter(item => threadFilter === 'all' || item.kind === threadFilter);
      return `${panelHeading('Community Workbench', 'Ideas, help and work in progress, with the context attached.', button(`${icon('plus')} Contribute`, 'new-thread', '', 'button primary'))}<label class="filter-select">Show<select id="thread-filter"><option value="all">All contributions</option>${Object.entries(contributionKinds).map(([key, label]) => `<option value="${key}" ${threadFilter === key ? 'selected' : ''}>${label}</option>`).join('')}</select></label><div class="thread-list">${threads.map(thread => `<article class="thread-card"><div class="person-line">${person(thread.author)}<div><strong>${e(thread.author)}</strong><span class="muted small">${e(contributionKinds[thread.kind])}</span></div></div><button class="thread-title" data-action="thread" data-id="${thread.id}">${e(thread.title)}</button><p>${e(thread.body)}</p><div class="thread-footer"><span class="context-label">${icon('book')}${e(contextFor(thread.contextId).title)}</span>${button(`${icon('chat')} ${thread.replies.length} replies`, 'thread', `data-id="${thread.id}"`, 'text-link')}</div></article>`).join('') || `<div class="empty-state"><h2>No contributions yet</h2><p>Bring an idea or something you are working on.</p>${button('Start a contribution', 'new-thread')}</div>`}</div>`;
    }
    case 'resources':
      return `${panelHeading('Your Publisher Kit', 'The lesson outline, task brief and planning guide for this workshop.')}<label class="search-label">Search resources<input type="search" id="resource-search" placeholder="Search the kit" value="${e(resourceFilter)}"></label><div id="resource-results">${filteredResources()}</div><p class="notice">These are sample teaching materials, not live Wistudi templates. Remix and workspace saving are not connected yet.</p>`;
    default:
      return `${panelHeading('This week in the Studio', e(workshop.title))}<div class="mobile-phase">${phaseControl()}</div>${phaseContent()}<section class="section-block"><div class="section-heading"><h2>Start with the kit</h2><a class="text-link" href="#resources">View all ${icon('arrow')}</a></div>${resourceRows(2)}</section><section class="section-block"><div class="section-heading"><h2>A question to think about</h2><span class="tag">Discuss</span></div><div class="discussion-prompt"><h3>What makes a speaking activity genuinely communicative?</h3><p class="muted">Think of a task your learners already know. Where could you add a real choice?</p>${button('Join the template discussion', 'resource', 'data-id="demo-template-01"', 'text-link')}</div></section><section class="section-block"><div class="section-heading"><h2>Build something this week</h2>${tag('Build', 'teal')}</div><h3>${e(challenge.title)}</h3><p class="muted">${e(challenge.description)}</p><a class="button secondary" href="#challenge">See the challenge ${icon('arrow')}</a></section>`;
  }
}

function filteredResources() {
  const items = resources.filter(item => `${item.title} ${item.description} ${item.label}`.toLowerCase().includes(resourceFilter.toLowerCase().trim()));
  return items.length ? items.map(item => `<article class="resource-card"><div class="eyebrow">${e(item.label)}</div><h2>${e(item.title)}</h2><p class="muted">${e(item.description)}</p><div class="tags">${tag('English')}${tag('B1')}${tag('Sample')}</div><div class="actions">${button('Preview & discuss', 'resource', `data-id="${item.id}"`)}<button class="button secondary" disabled title="Wistudi account connection is planned for a later phase">Remix in Wistudi</button></div></article>`).join('') : '<div class="empty-state"><h2>No matching resources</h2><p>Try a different title or resource type.</p></div>';
}

function restoreDrafts(container = document) {
  container.querySelectorAll('form[id]').forEach(form => {
    const draft = drafts.get(form.id);
    if (!draft) return;
    for (const [key, value] of Object.entries(draft)) {
      const field = form.elements.namedItem(key);
      if (field && field.type !== 'email') field.type === 'checkbox' ? field.checked = value : field.value = value;
    }
  });
}

function render(focus = false) {
  root.innerHTML = page === 'studio' ? renderStudio() : page === 'event' ? renderEvent() : renderHome();
  restoreDrafts();
  if (focus) document.querySelector('.panel-heading h1')?.focus({ preventScroll: true });
}

function modal(title, body, kind = '') {
  dialog.className = kind;
  dialog.innerHTML = `<div class="dialog-header"><h2 id="dialog-title">${e(title)}</h2><button class="icon-button" data-action="close" title="Close" aria-label="Close">${icon('close')}</button></div>${body}`;
  restoreDrafts(dialog);
  if (!dialog.open) dialog.showModal();
}

function openResource(id) {
  const resource = resources.find(item => item.id === id);
  if (!resource) return;
  dialogTarget = id; dialogMode = 'resource';
  const replies = state.resourceReplies[id] || [];
  modal(resource.title, `<div class="dialog-content"><div class="tags">${tag(resource.label, 'teal')}${tag('Sample resource')}${tag('English / B1')}</div><p class="muted">${e(resource.description)}</p><div class="resource-outline">${resource.sections.map(([title, body], index) => `<section><span class="outline-number">0${index + 1}</span><div><h3>${e(title)}</h3><p>${e(body)}</p></div></section>`).join('')}</div><div class="section-heading"><h3>Discuss this ${e(resource.type)}</h3><span class="muted small">${replies.length} replies</span></div><div class="messages">${replies.map(message).join('') || '<p class="muted">How would you adapt this for your learners?</p>'}</div></div>${replyForm()}`, 'conversation-dialog');
}

function message(reply) {
  return `<div class="message">${person(reply.author)}<div><strong>${e(reply.author)}</strong><p>${e(reply.body)}</p></div></div>`;
}

function replyForm() {
  return `<form id="reply-${dialogTarget}" class="reply-form composer" data-form="reply"><label class="sr-only" for="reply-body">Your reply</label><div class="composer-row"><textarea id="reply-body" name="body" rows="2" maxlength="2000" required placeholder="Add to this conversation..."></textarea><button class="icon-button primary" type="submit" title="Send demo reply" aria-label="Send demo reply">${icon('send')}</button></div><p class="form-error" role="alert" hidden></p><span class="muted small">Demo reply / this tab only</span></form>`;
}

function openThread(id) {
  const thread = state.threads.find(item => item.id === id);
  if (!thread) return;
  dialogTarget = id; dialogMode = 'thread';
  modal(thread.title, `<div class="dialog-context">${icon('book')}${e(contextFor(thread.contextId).title)}</div><div class="dialog-content"><div class="messages">${message(thread)}${thread.replies.map(message).join('')}</div></div>${replyForm()}`, 'conversation-dialog');
}

function newThread() {
  dialogMode = 'new-thread';
  modal('Bring something to the workbench', `<form id="thread-form" class="dialog-content stack-form"><label>Contribution type<select name="kind">${Object.entries(contributionKinds).map(([key, label]) => `<option value="${key}">${label}</option>`).join('')}</select></label><label>About<select name="contextId">${contextOptions()}</select></label><label>Title<input name="title" maxlength="120" required></label><label>Your contribution<textarea name="body" rows="5" maxlength="2000" required></textarea></label><p class="form-error" role="alert" hidden></p><button class="button primary" type="submit">Post demo contribution ${icon('arrow')}</button><p class="muted small">Visible only in this browser tab.</p></form>`);
}

document.addEventListener('click', event => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const { action, id, value } = target.dataset;
  if (action === 'resource') openResource(id);
  if (action === 'thread') openThread(id);
  if (action === 'new-thread') newThread();
  if (action === 'close') dialog.close();
  if (action === 'vote') {
    toggleVote(state, id); persist(); render();
    document.querySelector(`[data-action="vote"][data-id="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });
  }
  if (action === 'question-filter') {
    questionFilter = value; render();
    document.querySelector(`[data-action="question-filter"][data-value="${value}"]`)?.focus({ preventScroll: true });
  }
  if (action === 'join-challenge') {
    state.joined = !state.joined; persist(); render();
    document.querySelector('[data-action="join-challenge"]')?.focus({ preventScroll: true });
    notify(state.joined ? 'You are taking part in the demo challenge.' : 'Demo participation removed. Your drafts are kept.');
  }
  if (action === 'reset') modal('Reset this demo?', `<div class="dialog-content"><p>Your sample profile, questions, votes, replies and submissions in this tab will be removed. No live Wistudi data is affected.</p><div class="actions">${button('Keep exploring', 'close')}${button('Reset demo', 'confirm-reset', '', 'button primary')}</div></div>`);
  if (action === 'confirm-reset') {
    state = createState(); drafts.clear(); questionFilter = 'all'; threadFilter = 'all'; resourceFilter = '';
    try { storage?.removeItem(STORAGE_KEY); } catch { /* In-memory reset still succeeds. */ }
    dialog.close(); persist(); render(); notify('Demo reset. You are back to the sample content.');
  }
});

document.addEventListener('change', event => {
  if (event.target.hasAttribute('data-phase')) { state.phase = event.target.value; persist(); render(); [...document.querySelectorAll('[data-phase]')].find(select => select.getClientRects().length)?.focus({ preventScroll: true }); }
  if (event.target.id === 'thread-filter') { threadFilter = event.target.value; render(); document.querySelector('#thread-filter')?.focus({ preventScroll: true }); }
});

document.addEventListener('input', event => {
  if (event.target.id === 'resource-search') { resourceFilter = event.target.value; document.querySelector('#resource-results').innerHTML = filteredResources(); }
  const form = event.target.closest('form[id]');
  if (form && event.target.name && event.target.type !== 'email') {
    const draft = drafts.get(form.id) || {};
    draft[event.target.name] = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    drafts.set(form.id, draft);
  }
});

document.addEventListener('submit', event => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  try {
    if (form.id === 'registration-form') {
      registerDemo(state, data.displayName, data.studioConsent === 'on'); persist(); drafts.delete(form.id);
      document.querySelector('#registration-panel').innerHTML = `<div class="registration-success">${icon('check')}<h2 tabindex="-1">Demo registration complete</h2><p>No booking was made and no confirmation email was sent.</p>${state.profile ? `<div class="person-line">${person(state.profile.displayName, state.profile.avatarSeed)}<strong>${e(state.profile.displayName)}</strong></div><p>Your demo Studio profile is ready in this tab.</p>` : '<p>You did not opt into a Studio profile. You can still explore the preview.</p>'}<a class="button primary" href="${base}studio/">Enter the Studio preview ${icon('arrow')}</a></div>`;
      document.querySelector('.registration-success h2').focus();
    } else if (form.id === 'question-form') {
      askQuestion(state, data.body, data.contextId); questionFilter = 'all'; drafts.delete(form.id); persist(); render();
      document.querySelector('#question-body').focus({ preventScroll: true }); notify('Demo question added. It has not been sent to a trainer.');
    } else if (form.id === 'submission-form') {
      submitBuild(state, data); drafts.delete(form.id); persist(); render(); notify('Demo creation saved locally with pending-review status.');
      document.querySelector('.submission-card').scrollIntoView({ block: 'center', behavior: 'instant' });
    } else if (form.id === 'thread-form') {
      addThread(state, data); threadFilter = 'all'; drafts.delete(form.id); persist(); dialog.close(); render(); notify('Demo contribution added to the workbench.');
    } else if (form.dataset.form === 'reply') {
      addReply(state, dialogTarget, data.body); drafts.delete(form.id); persist();
      dialogMode === 'thread' ? openThread(dialogTarget) : openResource(dialogTarget);
      dialog.querySelector('.dialog-content').scrollTop = dialog.querySelector('.dialog-content').scrollHeight;
      dialog.querySelector('textarea').focus({ preventScroll: true });
    }
  } catch (error) {
    const output = form.querySelector('.form-error');
    if (output) { output.textContent = error.message; output.hidden = false; }
    else notify(error.message);
  }
});

dialog.addEventListener('close', () => {
  // Update counts after a conversation without destroying the active reply form.
  if (dialogMode === 'thread' && page === 'studio') {
    const target = dialogTarget;
    render();
    document.querySelector(`[data-action="thread"][data-id="${CSS.escape(target)}"]`)?.focus({ preventScroll: true });
  }
  dialogMode = null;
});
window.addEventListener('hashchange', () => { if (page === 'studio') { render(true); window.scrollTo(0, 0); } });
render();
if (loaded.warning) notify(loaded.warning);
