import { events, workshop, challenge, challenges, resources, contributionKinds, contextFor, challengeFor, resourcesFor } from './data.mjs';
import { STORAGE_KEY, createState, loadState, saveState, escapeHtml as e, avatar, registerDemo, askQuestion, toggleVote, voteCount, addThread, addReply, submitBuild } from './model.mjs';

const root = document.querySelector('#app');
const dialog = document.querySelector('#studio-dialog');
const page = document.body.dataset.page;
const base = '/publisher-studio/';
const requestedEvent = document.body.dataset.eventSlug || new URLSearchParams(location.search).get('event');
const selectedEvent = events.find(item => item.slug === requestedEvent || item.id === requestedEvent) || workshop;
const selectedChallenge = challengeFor(selectedEvent.id);
const selectedResources = resourcesFor(selectedEvent.id);
const eventUrl = item => `${base}events/${item.slug}/`;
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
const tabs = [ ['week', 'Room', 'calendar'], ['questions', 'Questions', 'question'], ['challenge', 'Build', 'build'], ['workbench', 'Workbench', 'chat'], ['resources', 'Kit', 'book'] ];
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
const contextOptions = () => [selectedEvent.id, selectedChallenge.id, ...selectedResources.map(item => item.id)].map(id => `<option value="${id}">${e(contextFor(id).title)}</option>`).join('');
const localTime = item => new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(new Date((item || selectedEvent).startsAt));
const selectedPhase = () => state.phaseByEvent[selectedEvent.id] || 'upcoming';

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
  const action = page === 'studio'
    ? `<a class="text-link desktop-only" href="${eventUrl(selectedEvent)}">Event details</a>${person(state.profile?.displayName || 'Demo visitor', state.profile?.avatarSeed || 'visitor')}`
    : page === 'builder'
      ? `<a class="text-link" href="${base}">Events</a>`
      : `<a class="button primary" href="${base}manage/events/">Build an event ${icon('arrow')}</a>`;
  return `<header class="studio-header"><a class="brand" href="${base}" aria-label="Publisher Studio home"><img src="/assets/images/wistudi-logo.png" alt="Wistudi" width="120" height="40"></a><span class="header-divider"></span><a class="studio-wordmark" href="${base}">Publisher Studio</a><div class="header-actions">${action}</div></header>`;
}

function phaseControl() {
  return `<label class="phase-control">Preview stage<select data-phase name="phase"><option value="upcoming" ${selectedPhase() === 'upcoming' ? 'selected' : ''}>Before workshop</option><option value="live" ${selectedPhase() === 'live' ? 'selected' : ''}>Live workshop</option><option value="post_session" ${selectedPhase() === 'post_session' ? 'selected' : ''}>After workshop</option></select></label>`;
}

function phaseContent() {
  const content = {
    upcoming: ['Before the workshop', 'Bring a lesson. Leave with a new direction.', 'Explore the kit and bring a question for the trainer.', `<a class="button primary" href="${eventUrl(selectedEvent)}">View event details ${icon('arrow')}</a>`],
    live: ['Studio Live (preview)', 'Learn together. Build as you go.', 'Keep the kit open and add questions as they come up.', `<a class="button primary" href="${eventUrl(selectedEvent)}room/#questions">Ask the Trainer ${icon('arrow')}</a><span class="muted small">The live meeting link is not connected.</span>`],
    post_session: ['Keep building', 'The workshop ends. Your idea keeps going.', 'Try the challenge, compare approaches and share what you make.', `<a class="button primary" href="${eventUrl(selectedEvent)}room/#challenge">Open build challenge ${icon('arrow')}</a><span class="muted small">Recording is not connected.</span>`],
  }[selectedPhase()];
  return `<section class="weekly-focus"><div class="eyebrow">${content[0]}</div><h2>${content[1]}</h2><p>${content[2]}</p><div class="actions">${content[3]}</div></section>`;
}

function resourceRows(limit = resources.length) {
  return selectedResources.slice(0, limit).map((item, index) => `<button type="button" class="resource-row" data-action="resource" data-id="${item.id}"><span class="resource-icon tone-${index % 3}">${icon(item.type === 'template' ? 'build' : 'book')}</span><span><span class="eyebrow">${e(item.label)}</span><strong>${e(item.title)}</strong><span class="muted small">${e(item.description)}</span></span>${icon('arrow')}</button>`).join('');
}

function eventCard(item) {
  const roomUrl = `${eventUrl(item)}room/#week`;
  const art = item.banner
    ? `<img src="${e(item.banner)}" alt="" loading="lazy">`
    : `<div class="event-art-placeholder topic-${item.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}"><span>Wistudi Publisher Studio</span><strong>${e(item.topic)}</strong></div>`;
  return `<article class="event-card" data-subject="${e(item.subject)}"><a class="event-card-art" href="${eventUrl(item)}" aria-label="View ${e(item.title)}">${art}<span class="event-status">${e(item.status === 'upcoming' ? 'Upcoming' : 'Past')}</span></a><div class="event-card-body"><div class="eyebrow">${e(item.subject)} / ${e(item.topic)} / ${e(item.level)}</div><h3><a href="${eventUrl(item)}">${e(item.title)}</a></h3><p class="muted">${e(item.summary)}</p><div class="event-card-meta"><span>${icon('calendar')}${e(localTime(item))}</span><span>${e(item.duration)} min</span></div><p class="event-output"><strong>You'll make</strong> ${e(item.output)}</p><div class="event-card-actions"><a class="button primary" href="${eventUrl(item)}">View event ${icon('arrow')}</a><button class="button secondary" type="button" data-action="share-event" data-slug="${e(item.slug)}">Share</button><a class="room-shortcut" href="${roomUrl}" title="Room preview; live access requires registration">Room preview</a></div></div></article>`;
}

function renderHome() {
  const upcoming = events.filter(item => item.status === 'upcoming');
  const past = events.filter(item => item.status === 'past');
  return `${prototypeBar()}${header()}<main id="main" class="public-main"><section class="studio-intro"><div><div class="eyebrow">A place to learn by making</div><h1>Wistudi Publisher Studio</h1><p class="lead">Practical workshops that lead to real teaching resources. Join an event, build something useful, share it for feedback and keep improving it in Wistudi.</p></div><div class="studio-journey"><ol class="journey" aria-label="Publisher journey"><li class="current">Discover</li><li>Learn</li><li>Build</li><li>Share</li><li>Publish</li></ol><p class="muted small">Publishing in Wistudi is an optional next step.</p></div></section>
      <section class="event-catalog-section"><div class="section-heading"><div><div class="eyebrow">Choose a workshop</div><h2>Upcoming Studio events</h2><p class="muted">Every event has its own room, Publisher Kit and build challenge.</p></div><label class="event-filter">Subject<select id="event-filter"><option value="all">All subjects</option>${[...new Set(events.map(item => item.subject))].map(subject => `<option value="${e(subject)}">${e(subject)}</option>`).join('')}</select></label></div><div class="event-grid">${upcoming.map(eventCard).join('')}</div></section>
      <section class="ecosystem-strip" aria-label="What happens after registration"><span>Event page</span><b>${icon('arrow')}</b><span>Event room</span><b>${icon('arrow')}</b><span>Build challenge</span><b>${icon('arrow')}</b><span>Wistudi Flow</span></section>
      ${past.length ? `<section class="event-catalog-section past-events"><div class="section-heading"><div><div class="eyebrow">Continue learning</div><h2>Past Studio events</h2></div></div><div class="event-grid">${past.map(eventCard).join('')}</div></section>` : ''}
    </main><footer class="public-footer"><a href="/resources/events/">All Wistudi Events</a><span>Preview fixtures only. Booking, accounts, Zoom and publishing are not connected.</span></footer>`;
}

function renderEvent() {
  const item = selectedEvent;
  const roomUrl = `${eventUrl(item)}room/#week`;
  return `${prototypeBar()}${header()}<main id="main" class="public-main"><a class="back-link" href="${base}">Publisher Studio / Events</a><div class="event-page-heading"><div><div class="eyebrow">${e(item.subject)} Publisher Studio / ${e(item.topic)}</div><h1>${e(item.title)}</h1><p class="lead">${e(item.summary)}</p></div><button class="button secondary" data-action="share-event" data-slug="${e(item.slug)}">Share event</button></div><div class="event-layout"><article><div class="event-facts"><div><span class="muted small">Your local time</span><strong>${e(localTime(item))}</strong></div><div><span class="muted small">Event timezone</span><strong>${e(item.timezone || 'Shown in your device timezone')}</strong></div><div><span class="muted small">Format</span><strong>${e(item.duration)}-minute ${e(item.format.toLowerCase())}</strong></div><div><span class="muted small">Trainer</span><strong>${e(item.trainer)}</strong></div><div><span class="muted small">For</span><strong>${e(item.audience)}</strong></div></div><section class="section-block"><h2>What you'll leave with</h2><p class="muted">${e(item.output)}</p><ol class="outcomes"><li>Join the live workshop or catch up with the event resources.</li><li>Use the Publisher Kit as a starting point.</li><li>Build or adapt a learning experience for your learners.</li><li>Share it in this event room for feedback.</li></ol></section><section class="section-block"><div class="section-heading"><div><div class="eyebrow">Publisher Kit</div><h2>Start with these resources</h2></div></div>${resourceRows()}</section><section class="event-next-step"><div class="eyebrow">After you register</div><h2>Your event room</h2><p>Questions, workshop links, the build challenge and participant work all stay attached to this event.</p><a class="button secondary" href="${roomUrl}">Preview this room ${icon('arrow')}</a></section></article>
      <aside class="registration-panel" id="registration-panel"><div class="eyebrow">Register for this event</div><h2>Reserve your place</h2><p class="muted">This preview form demonstrates the journey only. It does not create a booking or send an email.</p><form id="registration-form"><label>Display name<input name="displayName" maxlength="60" autocomplete="off" placeholder="Use a sample name" required></label><label>Email (preview only)<input name="email" type="email" autocomplete="off" placeholder="you@example.com" required></label><label class="checkbox-row"><input type="checkbox" name="studioConsent" ${state.profile ? 'checked' : ''}><span>${state.profile ? 'Use my existing Studio profile for discussions and sharing work. Uncheck to continue with event registration only.' : 'Also create a Studio profile for discussions and sharing work. This is optional.'}</span></label><p class="muted small">The checkbox does not create a real account here. A live version would verify your email and keep event booking separate from Studio membership.</p><p class="form-error" role="alert" hidden></p><button class="button primary full-width" type="submit">Preview registration ${icon('arrow')}</button></form><a class="text-link registration-skip" href="${roomUrl}">Explore the room preview</a></aside>
    </div></main>`;
}

function openShare(slug) {
  const item = events.find(candidate => candidate.slug === slug) || selectedEvent;
  const url = `${location.origin}${eventUrl(item)}`;
  const shareText = `${item.title} — ${item.output}`;
  dialogMode = 'share'; dialogTarget = item.slug;
  modal('Share this event', `<div class="dialog-content share-content"><div class="share-preview"><div class="share-preview-art">${item.banner ? `<img src="${e(item.banner)}" alt="">` : `<span>${e(item.subject)} / ${e(item.topic)}</span>`}</div><div><div class="eyebrow">Wistudi Publisher Studio</div><h3>${e(item.title)}</h3><p class="muted">${e(item.output)}</p><span class="share-domain">${e(location.host)}</span></div></div><p class="muted">Share the public event page. Each person registers for their own place; the event room stays restricted to registered participants.</p><div class="share-actions">${button('Copy event link', 'copy-share', `data-url="${e(url)}"`, 'button primary full-width')}${button('Share from this device', 'native-share', `data-url="${e(url)}" data-title="${e(item.title)}" data-text="${e(shareText)}"`, 'button secondary full-width')}<a class="button secondary" href="https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}" target="_blank" rel="noopener noreferrer">WhatsApp</a><a class="button secondary" href="mailto:?subject=${encodeURIComponent(item.title)}&body=${encodeURIComponent(`${shareText}\n\n${url}`)}">Email</a><a class="button secondary" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}" target="_blank" rel="noopener noreferrer">LinkedIn</a><a class="button secondary" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener noreferrer">Facebook</a></div><p class="muted small">Preview only: share counts, invites and QR generation are not connected.</p></div>`);
}

function renderBuilder() {
  return `${prototypeBar()}${header()}<main id="main" class="public-main builder-main"><a class="back-link" href="${base}">Publisher Studio / Events</a><div class="builder-heading"><div><div class="eyebrow">Event Builder / Preview</div><h1>Create a Studio event</h1><p class="lead">Use the same structure for every event. Each event gets a public page, a participant room and a connected build project.</p></div><span class="tag">Draft only</span></div><div class="builder-flow" aria-label="Event publishing process"><span class="current">1. Details</span><span>2. Schedule</span><span>3. Room and team</span><span>4. Review and publish</span></div><div class="builder-warning"><strong>This builder is a prototype.</strong> Drafts stay in this browser tab. Do not enter real attendee details, private Zoom links or confidential material.</div>
    <form id="event-builder-form" class="event-builder-form"><div class="builder-columns"><div class="builder-fields">
      <section class="builder-section"><div class="builder-section-heading"><span>01</span><div><h2>Event details</h2><p>Tell people who this is for and what they will leave with.</p></div></div><label>Event title<input name="title" maxlength="100" placeholder="e.g. Build an interactive speaking lesson" required></label><label>Short description<textarea name="summary" rows="3" maxlength="320" placeholder="Explain the teaching problem or skill this workshop addresses." required></textarea></label><div class="builder-grid"><label>Subject<input name="subject" maxlength="40" placeholder="English" required></label><label>Topic<input name="topic" maxlength="50" placeholder="Speaking" required></label><label>Level<input name="level" maxlength="32" placeholder="B1" required></label><label>Audience<input name="audience" maxlength="100" placeholder="English teachers and tutors" required></label></div><label>What will participants make?<textarea name="output" rows="2" maxlength="220" placeholder="One concrete outcome from the session" required></textarea></label></section>
      <section class="builder-section"><div class="builder-section-heading"><span>02</span><div><h2>Schedule and online session</h2><p>Dates are stored with an explicit timezone and displayed in each participant's local time.</p></div></div><div class="builder-grid"><label>Start date and time<input name="startsAt" type="datetime-local" required></label><label>Event timezone<select name="timezone"><option value="Asia/Ho_Chi_Minh">Asia / Ho Chi Minh</option><option value="UTC">UTC</option><option value="Europe/London">Europe / London</option><option value="America/New_York">America / New York</option></select></label><label>Duration<select name="duration"><option>60</option><option>75</option><option>90</option><option>120</option></select></label><label>Trainer name<input name="trainer" maxlength="60" placeholder="Assigned Wistudi trainer" required></label></div><div class="integration-card"><div><span class="eyebrow">Zoom</span><strong>Manual meeting link in this preview</strong><p>For the live system, show the participant join link only inside their registered event room.</p></div><span class="integration-state">Not connected</span><label>Test meeting link<input name="zoomUrl" type="url" placeholder="https://zoom.us/j/..." autocomplete="off"></label><button class="button secondary" type="button" disabled>Connect Zoom account</button></div></section>
      <section class="builder-section"><div class="builder-section-heading"><span>03</span><div><h2>Event media</h2><p>Use real workshop or teaching material, with accessible descriptions.</p></div></div><label>Thumbnail image<input name="thumbnail" type="file" accept="image/png,image/jpeg,image/webp" data-thumbnail></label><label>Image description<input name="imageAlt" maxlength="150" placeholder="Describe the event artwork" ></label><label>Optional video preview link<input name="videoUrl" type="url" placeholder="YouTube or Vimeo URL" autocomplete="off"></label><div class="upload-note">Image preview works locally in this browser. Files are not uploaded. Direct video upload needs approved media storage and processing.</div><div id="builder-media-preview" class="builder-media-preview" hidden></div></section>
      <section class="builder-section"><div class="builder-section-heading"><span>04</span><div><h2>Room, Publisher Kit and project</h2><p>This is where the event leads into ongoing creation.</p></div></div><label>Featured Flow or template<input name="templateTitle" maxlength="100" placeholder="Template participants will explore"></label><label>Worksheet or resource<input name="worksheetTitle" maxlength="100" placeholder="A related printable or teaching resource"></label><label>Discussion prompt<input name="discussionPrompt" maxlength="180" placeholder="What question should participants consider before the event?"></label><label>Build challenge title<input name="challengeTitle" maxlength="100" placeholder="The practical creation task" required></label><label>Build challenge brief<textarea name="challengeBrief" rows="3" maxlength="400" placeholder="Describe what to make, share and ask for feedback on." required></textarea></label><label>Wistudi creation link<input name="wistudiLink" type="url" placeholder="Link to a Flow or template, when available" autocomplete="off"></label></section>
      <section class="builder-section"><div class="builder-section-heading"><span>05</span><div><h2>Team and permissions</h2><p>Assign people to specific events and rooms.</p></div></div><div class="permission-preview"><div><strong>Event builder</strong><span>Creates and edits this event</span></div><div><strong>Trainer / moderator</strong><span>Hosts the session and manages this room</span></div><p>Role invitations must be email-bound, time-limited and revocable. Invitation links are shown as a future service; no permissions are granted by this prototype.</p><button class="button secondary" type="button" disabled>Invite event team</button></div></section>
    </div><aside class="builder-aside"><div class="builder-sticky"><div class="eyebrow">Publishing checklist</div><h2>One event, one connected journey</h2><ol class="builder-checklist"><li>Public event page and share link</li><li>Registration and confirmation</li><li>Private participant room</li><li>Publisher Kit and discussion</li><li>Build challenge and submission</li><li>Optional Wistudi publish step</li></ol><hr><p class="muted small">The public event page uses its own share metadata. The Zoom join link and participant work stay private to the room.</p><div class="actions builder-controls"><button type="button" class="button secondary" data-action="save-builder">Save draft in this tab</button><button type="button" class="button primary" data-action="preview-builder">Preview event</button><button type="button" class="button" disabled title="Publishing requires authenticated roles and a database">Publish event</button></div><p id="builder-save-status" class="muted small" role="status"></p></div></aside></div></form></main><footer class="public-footer"><a href="${base}">Publisher Studio events</a><span>Team invites, Zoom connection, direct uploads and publishing require live services.</span></footer>`;
}

function renderNav() {
  return `<nav class="workspace-nav" aria-label="Studio sections">${tabs.map(([key, label, glyph]) => `<a href="#${key}" ${activeTab() === key ? 'aria-current="page"' : ''}>${icon(glyph)}<span>${label}</span>${key === 'questions' ? `<span class="nav-count">${state.questions.filter(item => contextFor(item.contextId).workshopId === selectedEvent.id && !item.answer).length}</span>` : ''}</a>`).join('')}</nav>`;
}

function renderStudio() {
  return `${prototypeBar()}${header()}<div class="room-topbar"><a href="${base}">All events</a><span>/</span><strong>${e(selectedEvent.title)}</strong><button class="button secondary" data-action="share-event" data-slug="${e(selectedEvent.slug)}">Invite someone</button></div><div class="workspace"><aside class="workspace-sidebar"><div class="studio-label">${tag(`${selectedEvent.subject} Studio`, 'teal')}<h2>Keep working<br>on your project.</h2><p class="muted small">This event room</p></div>${renderNav()}<div class="sidebar-bottom"><a class="text-link" href="${base}">Browse events ${icon('arrow')}</a><p class="muted small">${state.profile ? `Previewing as ${e(state.profile.displayName)}` : 'Room access is a preview'}</p></div></aside><main id="main" class="workspace-main" tabindex="-1"><div id="panel">${renderPanel()}</div></main><aside class="context-rail"><div class="eyebrow">This event</div><h2>${e(selectedEvent.title)}</h2><div class="tags">${tag(selectedEvent.subject)}${tag(selectedEvent.topic)}${tag(selectedEvent.level)}</div><div class="person-line">${person(selectedEvent.trainer)}<div><strong>${e(selectedEvent.trainer)}</strong><span class="muted small">Assigned trainer</span></div></div><hr>${phaseControl()}<hr><div class="eyebrow">Publisher Kit</div>${selectedResources.map(item => `<button class="rail-resource" data-action="resource" data-id="${item.id}">${icon('book')}<span>${e(item.title)}</span></button>`).join('')}<hr><p class="muted small">Prototype conversations are stored only in this browser tab. They are not shared with other participants.</p></aside></div>`;
}

function panelHeading(title, description, action = '') {
  return `<div class="panel-heading"><div><div class="eyebrow">${e(selectedEvent.title)} / ${e(selectedEvent.topic)}</div><h1 tabindex="-1">${title}</h1><p class="muted">${description}</p></div>${action}</div>`;
}

function questionCard(question) {
  return `<article class="question-card"><div class="question-body"><div class="person-line">${person(question.author)}<div><strong>${e(question.author)}</strong><span class="muted small">${e(contextFor(question.contextId).title)}</span></div>${question.answer ? tag('Answered', 'teal') : tag('Open')}</div><p>${e(question.body)}</p>${question.answer ? `<div class="trainer-answer"><span class="eyebrow">Trainer answer / sample</span><p>${e(question.answer)}</p></div>` : ''}<button type="button" class="vote-button" data-action="vote" data-id="${question.id}" aria-pressed="${state.votes.includes(question.id)}" aria-label="I want this answered too: ${e(question.body)}">${icon('up')}<strong>${voteCount(state, question)}</strong><span>I want this answered too</span></button></div></article>`;
}

function renderPanel() {
  switch (activeTab()) {
    case 'questions': {
      const questions = state.questions.filter(item => contextFor(item.contextId).workshopId === selectedEvent.id).filter(item => questionFilter === 'all' || (questionFilter === 'answered' ? item.answer : !item.answer)).sort((a, b) => voteCount(state, b) - voteCount(state, a));
      return `${panelHeading('Ask the Trainer', 'Questions about this workshop and the things you are building.')}<div class="filter-row" role="group" aria-label="Filter questions">${[['all', 'All questions'], ['open', 'Open'], ['answered', 'Answered']].map(([key, label]) => `<button data-action="question-filter" data-value="${key}" aria-pressed="${questionFilter === key}">${label}</button>`).join('')}</div><div class="question-list">${questions.map(questionCard).join('') || '<div class="empty-state"><h2>No questions here yet</h2><p>Ask about the workshop or a resource below.</p></div>'}</div><form id="question-form" class="composer"><label class="compact-label">About<select name="contextId">${contextOptions()}</select></label><label class="sr-only" for="question-body">Your question</label><div class="composer-row"><textarea id="question-body" name="body" rows="2" maxlength="2000" placeholder="What would you like to ask?" required></textarea><button class="icon-button primary" title="Post demo question" aria-label="Post demo question" type="submit">${icon('send')}</button></div><p class="form-error" role="alert" hidden></p><span class="muted small">Demo question / visible only to you</span></form>`;
    }
    case 'challenge':
      const submissions = state.submissions.filter(item => item.challengeId === selectedChallenge.id);
      const joined = state.joinedChallenges.includes(selectedChallenge.id);
      return `${panelHeading('The build challenge', 'A small, useful step from learning to creating.')}<section class="challenge-brief"><span class="challenge-number">01</span><div>${tag('Build', 'teal')}<h2>${e(selectedChallenge.title)}</h2><p>${e(selectedChallenge.description)}</p><p class="muted">${e(selectedEvent.output)}</p>${button(joined ? `${icon('check')} Taking part (demo)` : `${icon('plus')} I'll take part`, 'join-challenge', `aria-pressed="${joined}"`, 'button primary')}</div></section><section class="section-block"><h2>Share your version</h2><p class="muted">For this preview, submit a Wistudi Flow or other secure HTTPS link. File uploads, link metadata previews and public publishing are not connected.</p><form id="submission-form" class="stack-form"><label>Creation title<input name="title" maxlength="120" placeholder="Give your activity a name" required></label><label>What did you create?<textarea name="description" maxlength="2000" rows="3" required></textarea></label><label>Wistudi content or creation link<input type="text" inputmode="url" name="url" placeholder="https://..." required></label><label>What would you like help with? <span class="muted">(optional)</span><textarea name="help" maxlength="1000" rows="2"></textarea></label><p class="form-error" role="alert" hidden></p><div class="actions"><button class="button primary" type="submit">Submit demo creation ${icon('arrow')}</button><span class="muted small">Saved in this browser only</span></div></form></section><section class="section-block"><h2>Your work in this room</h2>${submissions.length ? submissions.map(item => `<article class="submission-card">${tag('Pending review (demo)')}<h3>${e(item.title)}</h3><p>${e(item.description)}</p>${item.help ? `<p class="muted">Feedback requested: ${e(item.help)}</p>` : ''}<a class="text-link" href="${e(item.url)}" target="_blank" rel="noopener noreferrer nofollow">Open submitted link ${icon('arrow')}</a></article>`).join('') : '<div class="empty-state"><p>Share a work-in-progress for feedback. Public showcase approval is a separate step.</p></div>'}</section>`;
    case 'workbench': {
      const threads = state.threads.filter(item => contextFor(item.contextId).workshopId === selectedEvent.id).filter(item => threadFilter === 'all' || item.kind === threadFilter);
      return `${panelHeading('Community Workbench', 'Ideas, help and work in progress, with the context attached.', button(`${icon('plus')} Contribute`, 'new-thread', '', 'button primary'))}<label class="filter-select">Show<select id="thread-filter"><option value="all">All contributions</option>${Object.entries(contributionKinds).map(([key, label]) => `<option value="${key}" ${threadFilter === key ? 'selected' : ''}>${label}</option>`).join('')}</select></label><div class="thread-list">${threads.map(thread => `<article class="thread-card"><div class="person-line">${person(thread.author)}<div><strong>${e(thread.author)}</strong><span class="muted small">${e(contributionKinds[thread.kind])}</span></div></div><button class="thread-title" data-action="thread" data-id="${thread.id}">${e(thread.title)}</button><p>${e(thread.body)}</p><div class="thread-footer"><span class="context-label">${icon('book')}${e(contextFor(thread.contextId).title)}</span>${button(`${icon('chat')} ${thread.replies.length} replies`, 'thread', `data-id="${thread.id}"`, 'text-link')}</div></article>`).join('') || `<div class="empty-state"><h2>No contributions yet</h2><p>Bring an idea or something you are working on.</p>${button('Start a contribution', 'new-thread')}</div>`}</div>`;
    }
    case 'resources':
      return `${panelHeading('Your Publisher Kit', 'The lesson outline, task brief and planning guide for this workshop.')}<label class="search-label">Search resources<input type="search" id="resource-search" placeholder="Search the kit" value="${e(resourceFilter)}"></label><div id="resource-results">${filteredResources()}</div><p class="notice">These are sample teaching materials, not live Wistudi templates. Remix and workspace saving are not connected yet.</p>`;
    default: {
      const hasSubmission = state.submissions.some(item => item.challengeId === selectedChallenge.id);
      const hasJoined = state.joinedChallenges.includes(selectedChallenge.id);
      const step = hasSubmission ? 4 : (hasJoined || selectedPhase() === 'post_session') ? 3 : 2;
      const labels = ['Discover', 'Learn', 'Build', 'Share', 'Publish'];
      const journey = labels.map((label, index) => `<li class="${index + 1 < step ? 'complete' : index + 1 === step ? 'current' : ''}">${label}</li>`).join('');
      return `${panelHeading('Event room', e(selectedEvent.title))}<div class="room-progress"><div class="room-progress-top"><strong>Your publisher journey</strong><span>Step ${step} of 5</span></div><ol class="journey" aria-label="Discover, learn, build, share, publish">${journey}</ol><p class="muted small">Your progress is a guide, not a score. Publishing in Wistudi is optional.</p></div><div class="mobile-phase">${phaseControl()}</div>${phaseContent()}<section class="section-block"><div class="section-heading"><h2>Start with the Publisher Kit</h2><a class="text-link" href="#resources">View all ${icon('arrow')}</a></div>${resourceRows(2)}</section><section class="section-block"><div class="section-heading"><h2>This event's build challenge</h2>${tag('Build', 'teal')}</div><h3>${e(selectedChallenge.title)}</h3><p class="muted">${e(selectedChallenge.description)}</p><a class="button secondary" href="#challenge">Open challenge ${icon('arrow')}</a></section><section class="section-block"><h2>Share this event</h2><p class="muted">Invite a colleague to register. Room access is given after registration.</p>${button('Share event link', 'share-event', `data-slug="${e(selectedEvent.slug)}"`)}</section>`;
    }
  }
}

function filteredResources() {
  const items = selectedResources.filter(item => `${item.title} ${item.description} ${item.label}`.toLowerCase().includes(resourceFilter.toLowerCase().trim()));
  return items.length ? items.map(item => { const context = contextFor(item.id); return `<article class="resource-card"><div class="eyebrow">${e(item.label)}</div><h2>${e(item.title)}</h2><p class="muted">${e(item.description)}</p><div class="tags">${tag(context.subject)}${tag(context.topic)}${tag(context.level)}${tag('Sample')}</div><div class="actions">${button('Preview & discuss', 'resource', `data-id="${item.id}"`)}<button class="button secondary" disabled title="Wistudi account connection is planned for a later phase">Remix in Wistudi</button></div></article>`; }).join('') : '<div class="empty-state"><h2>No matching resources</h2><p>Try a different title or resource type.</p></div>';
}

const BUILDER_DRAFT_KEY = `${STORAGE_KEY}.event-builder-draft`;

function saveBuilderDraft(form = document.querySelector('#event-builder-form')) {
  if (!form) return false;
  const values = Object.fromEntries([...new FormData(form)].filter(([, value]) => typeof value === 'string'));
  try { storage?.setItem(BUILDER_DRAFT_KEY, JSON.stringify(values)); return Boolean(storage); }
  catch { return false; }
}

function restoreBuilderDraft() {
  const form = document.querySelector('#event-builder-form');
  if (!form) return;
  try {
    const values = JSON.parse(storage?.getItem(BUILDER_DRAFT_KEY) || '{}');
    for (const [name, value] of Object.entries(values)) {
      const field = form.elements.namedItem(name);
      if (field && field.type !== 'file' && typeof value === 'string') field.value = value;
    }
    if (Object.keys(values).length) {
      const status = document.querySelector('#builder-save-status');
      if (status) status.textContent = 'A local draft is saved in this browser tab.';
    }
  } catch { /* A damaged preview draft should not prevent the builder opening. */ }
}

function previewBuilder() {
  const form = document.querySelector('#event-builder-form');
  if (!form) return;
  const data = Object.fromEntries([...new FormData(form)].filter(([, value]) => typeof value === 'string'));
  const title = data.title?.trim() || 'Your event title';
  const output = data.output?.trim() || 'Add the outcome participants will create.';
  dialogMode = 'builder-preview';
  modal('Event page preview', `<div class="dialog-content"><div class="event-preview-card"><div class="eyebrow">${e(data.subject || 'Subject')} Publisher Studio / ${e(data.topic || 'Topic')}</div><h2>${e(title)}</h2><p class="muted">${e(data.summary || 'Your event description will appear here.')}</p><div class="event-facts"><div><span class="muted small">Time</span><strong>${e(data.startsAt || 'Add a date and time')} / ${e(data.timezone || 'Choose a timezone')}</strong></div><div><span class="muted small">Trainer</span><strong>${e(data.trainer || 'Assign a trainer')}</strong></div></div><div class="event-next-step"><div class="eyebrow">You'll make</div><p>${e(output)}</p></div><div class="event-next-step"><div class="eyebrow">Event room</div><strong>${e(data.challengeTitle || 'Add a build challenge')}</strong><p>${e(data.challengeBrief || 'The challenge appears here with the Publisher Kit and discussion.')}</p></div><p class="notice">This is a local layout preview. It has not been published or shared.</p></div></div>`);
}

let thumbnailPreviewUrl = '';
function previewThumbnail(field) {
  const file = field.files?.[0];
  const preview = document.querySelector('#builder-media-preview');
  if (!preview) return;
  if (thumbnailPreviewUrl) URL.revokeObjectURL(thumbnailPreviewUrl);
  if (!file) { preview.hidden = true; preview.replaceChildren(); thumbnailPreviewUrl = ''; return; }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
    field.value = ''; notify('Choose a JPG, PNG or WebP image under 8 MB.'); return;
  }
  thumbnailPreviewUrl = URL.createObjectURL(file);
  preview.innerHTML = `<img src="${thumbnailPreviewUrl}" alt="${e(document.querySelector('[name="imageAlt"]')?.value || 'Selected event thumbnail preview')}"><span>${e(file.name)} / local preview only</span>`;
  preview.hidden = false;
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
  root.innerHTML = page === 'studio' ? renderStudio() : page === 'event' ? renderEvent() : page === 'builder' ? renderBuilder() : renderHome();
  restoreDrafts();
  if (page === 'builder') restoreBuilderDraft();
  if (focus) document.querySelector('.panel-heading h1')?.focus({ preventScroll: true });
}

function modal(title, body, kind = '') {
  dialog.className = kind;
  dialog.innerHTML = `<div class="dialog-header"><h2 id="dialog-title">${e(title)}</h2><button class="icon-button" data-action="close" title="Close" aria-label="Close">${icon('close')}</button></div>${body}`;
  restoreDrafts(dialog);
  if (!dialog.open) dialog.showModal();
}

function openResource(id) {
  const resource = selectedResources.find(item => item.id === id);
  if (!resource) return;
  const context = contextFor(id);
  dialogTarget = id; dialogMode = 'resource';
  const replies = state.resourceReplies[id] || [];
  modal(resource.title, `<div class="dialog-content"><div class="tags">${tag(resource.label, 'teal')}${tag(context.subject)}${tag(context.topic)}${tag(context.level)}${tag('Sample resource')}</div><p class="muted">${e(resource.description)}</p><div class="resource-outline">${resource.sections.map(([title, body], index) => `<section><span class="outline-number">0${index + 1}</span><div><h3>${e(title)}</h3><p>${e(body)}</p></div></section>`).join('')}</div><div class="section-heading"><h3>Discuss this ${e(resource.type)}</h3><span class="muted small">${replies.length} replies</span></div><div class="messages">${replies.map(message).join('') || '<p class="muted">How would you adapt this for your learners?</p>'}</div></div>${replyForm()}`, 'conversation-dialog');
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
  if (action === 'share-event') openShare(target.dataset.slug);
  if (action === 'save-builder') {
    const saved = saveBuilderDraft();
    const status = document.querySelector('#builder-save-status');
    if (status) status.textContent = saved ? 'Draft saved in this browser tab.' : 'Could not save this draft in browser storage.';
    notify(saved ? 'Event draft saved in this browser tab.' : 'Browser storage is unavailable; this draft was not saved.');
  }
  if (action === 'copy-share') {
    const url = target.dataset.url;
    const copy = navigator.clipboard?.writeText ? navigator.clipboard.writeText(url) : Promise.reject(new Error('Clipboard unavailable'));
    copy.then(() => notify('Event link copied.')).catch(() => {
      const field = document.createElement('textarea'); field.value = url; field.setAttribute('readonly', ''); field.style.position = 'fixed'; field.style.opacity = '0';
      document.body.append(field); field.select(); const copied = document.execCommand('copy'); field.remove();
      notify(copied ? 'Event link copied.' : 'Copy the event link from the preview card.');
    });
  }
  if (action === 'native-share') {
    const share = { title: target.dataset.title, text: target.dataset.text, url: target.dataset.url };
    if (navigator.share) navigator.share(share).catch(error => { if (error.name !== 'AbortError') notify('Use one of the share options below.'); });
    else notify('Your browser does not offer native sharing. Choose a share option below.');
  }
  if (action === 'preview-builder') previewBuilder();
  if (action === 'vote') {
    toggleVote(state, id); persist(); render();
    document.querySelector(`[data-action="vote"][data-id="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });
  }
  if (action === 'question-filter') {
    questionFilter = value; render();
    document.querySelector(`[data-action="question-filter"][data-value="${value}"]`)?.focus({ preventScroll: true });
  }
  if (action === 'join-challenge') {
    const joined = state.joinedChallenges.includes(selectedChallenge.id);
    state.joinedChallenges = joined ? state.joinedChallenges.filter(id => id !== selectedChallenge.id) : [...state.joinedChallenges, selectedChallenge.id]; persist(); render();
    document.querySelector('[data-action="join-challenge"]')?.focus({ preventScroll: true });
    notify(!joined ? 'You are taking part in this demo challenge.' : 'Demo participation removed. Your drafts are kept.');
  }
  if (action === 'reset') modal('Reset this demo?', `<div class="dialog-content"><p>Your sample profile, questions, votes, replies, submissions and event-builder draft in this tab will be removed. No live Wistudi data is affected.</p><div class="actions">${button('Keep exploring', 'close')}${button('Reset demo', 'confirm-reset', '', 'button primary')}</div></div>`);
  if (action === 'confirm-reset') {
    state = createState(); drafts.clear(); questionFilter = 'all'; threadFilter = 'all'; resourceFilter = '';
    try { storage?.removeItem(STORAGE_KEY); storage?.removeItem(BUILDER_DRAFT_KEY); } catch { /* In-memory reset still succeeds. */ }
    dialog.close(); persist(); render(); notify('Demo reset. You are back to the sample content.');
  }
});

document.addEventListener('change', event => {
  if (event.target.hasAttribute('data-phase')) { state.phaseByEvent[selectedEvent.id] = event.target.value; persist(); render(); [...document.querySelectorAll('[data-phase]')].find(select => select.getClientRects().length)?.focus({ preventScroll: true }); }
  if (event.target.id === 'thread-filter') { threadFilter = event.target.value; render(); document.querySelector('#thread-filter')?.focus({ preventScroll: true }); }
  if (event.target.id === 'event-filter') document.querySelectorAll('.event-card').forEach(card => { card.hidden = event.target.value !== 'all' && card.dataset.subject !== event.target.value; });
  if (event.target.matches('[data-thumbnail]')) previewThumbnail(event.target);
});

document.addEventListener('input', event => {
  if (event.target.id === 'resource-search') { resourceFilter = event.target.value; document.querySelector('#resource-results').innerHTML = filteredResources(); }
  const form = event.target.closest('form[id]');
  if (form && event.target.name && !['email', 'file'].includes(event.target.type)) {
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
      document.querySelector('#registration-panel').innerHTML = `<div class="registration-success">${icon('check')}<h2 tabindex="-1">Preview registration complete</h2><p>No booking was made and no confirmation email was sent.</p>${state.profile ? `<div class="person-line">${person(state.profile.displayName, state.profile.avatarSeed)}<strong>${e(state.profile.displayName)}</strong></div><p>Your sample Studio profile is active in this tab only.</p>` : '<p>You did not opt into a Studio profile. The event preview remains open to explore.</p>'}<a class="button primary" href="${eventUrl(selectedEvent)}room/">Enter this event room ${icon('arrow')}</a></div>`;
      document.querySelector('.registration-success h2').focus();
    } else if (form.id === 'question-form') {
      askQuestion(state, data.body, data.contextId); questionFilter = 'all'; drafts.delete(form.id); persist(); render();
      document.querySelector('#question-body').focus({ preventScroll: true }); notify('Demo question added. It has not been sent to a trainer.');
    } else if (form.id === 'submission-form') {
      submitBuild(state, data, selectedChallenge.id); drafts.delete(form.id); persist(); render(); notify('Demo creation saved locally with pending-review status.');
      document.querySelector('.submission-card').scrollIntoView({ block: 'center', behavior: 'instant' });
    } else if (form.id === 'thread-form') {
      addThread(state, data); threadFilter = 'all'; drafts.delete(form.id); persist(); dialog.close(); render(); notify('Demo contribution added to the workbench.');
    } else if (form.dataset.form === 'reply') {
      addReply(state, dialogTarget, data.body); drafts.delete(form.id); persist();
      dialogMode === 'thread' ? openThread(dialogTarget) : openResource(dialogTarget);
      dialog.querySelector('.dialog-content').scrollTop = dialog.querySelector('.dialog-content').scrollHeight;
      dialog.querySelector('textarea').focus({ preventScroll: true });
    } else if (form.id === 'event-builder-form') {
      const saved = saveBuilderDraft(form);
      const status = document.querySelector('#builder-save-status');
      if (status) status.textContent = saved ? 'Draft saved in this browser tab.' : 'Could not save this draft in browser storage.';
      notify(saved ? 'Event draft saved in this browser tab.' : 'Browser storage is unavailable; this draft was not saved.');
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
