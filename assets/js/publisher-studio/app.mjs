import { events, workshop, challenge, challenges, allResources, contributionKinds, contextFor, challengeFor, resourcesFor } from './data.mjs';
import { STORAGE_KEY, createState, loadState, saveState, escapeHtml as e, avatar, registerDemo, askQuestion, toggleVote, voteCount, addThread, addReply, toggleThreadHeart, submitBuild } from './model.mjs';
import { loadRemoteEvent, sendRemoteAction } from './remote.mjs';
import { renderCalendarApp, handleCalendarClick, handleCalendarChange, handleCalendarSubmit } from './calendar.mjs';
import { initIdentity } from './identity.mjs';

const root = document.querySelector('#app');
const dialog = document.querySelector('#studio-dialog');
const base = '/publisher-studio/';
const studioRoot = base.replace(/\/$/, '');
let page;
let studioView;
let selectedEvent;
let selectedChallenge;
let selectedResources;
let tabs;
const eventUrl = item => `${base}events/${item.slug}/`;

function syncRouteState(url = new URL(location.href)) {
  const pathname = url.pathname.replace(/\/+$/, '') || '/';
  const eventRoute = pathname.match(/^\/publisher-studio\/events\/([^/]+)(\/room)?$/);
  const requestedView = url.searchParams.get('view');
  let routeEvent = '';

  if (pathname === studioRoot) page = 'home';
  else if (pathname === `${studioRoot}/studio`) page = 'studio';
  else if (pathname === `${studioRoot}/manage/events`) page = 'builder';
  else if (eventRoute) {
    page = eventRoute[2] ? 'studio' : 'event';
    try { routeEvent = decodeURIComponent(eventRoute[1]); } catch { routeEvent = eventRoute[1]; }
  } else page = document.body.dataset.page || 'home';

  studioView = ['home', 'discover', 'my-events'].includes(requestedView) ? requestedView : 'home';
  const requestedEvent = routeEvent || url.searchParams.get('event') || '';
  selectedEvent = events.find(item => item.slug === requestedEvent || item.id === requestedEvent) || workshop;
  selectedChallenge = challengeFor(selectedEvent.id);
  selectedResources = resourcesFor(selectedEvent.id);
  tabs = [ ['week', 'Room', 'Room', 'calendar'], ['questions', 'Questions', 'Ask', 'question'], ['challenge', 'Build', 'Build', 'build'], ['workbench', 'Chat', 'Chat', 'chat', 'Event chat'], ...(selectedResources.length ? [['resources', 'Resources', 'Files', 'book', 'Event resources']] : []) ];
  document.body.dataset.page = page;
  document.body.dataset.studioView = studioView;
  document.body.dataset.eventSlug = selectedEvent.slug;
}

syncRouteState();
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
let calendarSearchTimer;
let theme = 'light';
let serverIdentity = null;
let serverDrafts = [];
let sharedDraftsForUser = '';
let sharedDraftsPromise = null;
const themeKey = 'wistudi.publisher-studio.theme';
const drafts = new Map();
const localPreviewUrls = new Map();
const chatObjectUrls = new Map();
const pendingUploads = new Map();
const relatedByComposer = new Map();
const expandedThreads = new Set();
const openReplyForms = new Set();
let emojiModulePromise;
let nextChatContext = selectedEvent.id;
try { theme = localStorage.getItem(themeKey) === 'dark' ? 'dark' : 'light'; } catch { /* The light theme remains the default. */ }
const resourceTypes = { flow: 'Wistudi Flow or template', worksheet: 'Worksheet or document', video: 'Video', link: 'External link', instructions: 'Step-by-step instructions', other: 'Other resource' };
const paths = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1V10Z"/>',
  discover: '<circle cx="10.8" cy="10.8" r="7.2"/><path d="m16.2 16.2 4.3 4.3M10.8 7.5v6.6M7.5 10.8h6.6"/>',
  events: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18M8 15h.01M12 15h.01M16 15h.01"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 .5c0 2-2.5 2-2.5 4M12 17h.01"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>',
  build: '<path d="m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5"/>',
  chat: '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2V11.5A8.5 8.5 0 0 1 10.5 3h2a8.5 8.5 0 0 1 8.5 8.5Z"/>',
  book: '<path d="M12 5v16M3 3h5a4 4 0 0 1 4 2 4 4 0 0 1 4-2h5v16h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3V3Z"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>', back: '<path d="M19 12H5m6 6-6-6 6-6"/>', share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4m-6.8 7 6.8 4"/>', close: '<path d="m6 6 12 12M6 18 18 6"/>',
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
const phaseOrder = { upcoming: 0, live: 1, post_session: 2 };
const phaseLabel = { upcoming: 'Before the event', live: 'During the live event', post_session: 'After the live event' };
const resourcePhase = item => item.availableFrom || 'upcoming';
function scopedRole(role, eventId = selectedEvent.id) {
  const roles = serverIdentity?.roles || [];
  return roles.some(item =>
    (item.role === 'platform_super_admin' && item.scopeType === 'platform' && item.scopeId === 'wistudi')
    || (item.role === 'studio_admin' && item.scopeType === 'studio' && item.scopeId === 'publisher-studio')
    || (item.role === role && item.scopeType === 'event' && item.scopeId === eventId)
  );
}
function canModerateEvent(eventId = selectedEvent.id) {
  return scopedRole('event_lead', eventId) || scopedRole('event_moderator', eventId);
}
function canAnswerEvent(eventId = selectedEvent.id) {
  return canModerateEvent(eventId) || scopedRole('event_co_trainer', eventId);
}
function canBuildStudioEvents() {
  return (serverIdentity?.roles || []).some(item =>
    (item.role === 'platform_super_admin' && item.scopeType === 'platform' && item.scopeId === 'wistudi')
    || (item.role === 'studio_admin' && item.scopeType === 'studio' && item.scopeId === 'publisher-studio')
    || (item.role === 'event_builder' && item.scopeType === 'studio' && item.scopeId === 'publisher-studio')
  );
}
const resourceIsAvailable = item => (phaseOrder[selectedPhase()] ?? 0) >= (phaseOrder[resourcePhase(item)] ?? 0);

function notify(message) {
  const toast = document.querySelector('#toast');
  clearTimeout(toastTimer); toast.textContent = message; toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 6500);
}

function persist() {
  if (!saveState(storage, state)) notify('Browser storage is unavailable. Changes last only until you reload this page.');
}

function applyRemoteSnapshot(snapshot) {
  const demoQuestions = state.questions.filter(item => String(item.id).startsWith('demo-'));
  const demoThreads = state.threads.filter(item => String(item.id).startsWith('demo-'));
  const demoSubmissions = state.submissions.filter(item => String(item.id).startsWith('demo-'));
  const remoteQuestions = (snapshot.questions || []).map(item => ({ ...item, context: contextFor(item.contextId) }));
  const remoteThreads = (snapshot.threads || []).map(item => ({ ...item, context: contextFor(item.contextId) }));
  const remoteSubmissions = (snapshot.submissions || []).map(item => ({ ...item, context: contextFor(item.challengeId) }));
  state.questions = [...remoteQuestions, ...demoQuestions];
  state.threads = [...remoteThreads, ...demoThreads];
  state.submissions = [...remoteSubmissions, ...demoSubmissions];
  state.votes = remoteQuestions.filter(item => item.votedByUser).map(item => item.id);
  state.threadHearts = remoteThreads.filter(item => item.heartedByUser).map(item => item.id);
  if (snapshot.event && snapshot.event.id) {
    state.eventControls[snapshot.event.id] = {
      roomOpen: Boolean(snapshot.event.roomOpen),
      registrationOpen: Boolean(snapshot.event.registrationOpen),
      features: {
        questions: snapshot.event.features?.questions !== false,
        chat: snapshot.event.features?.chat !== false,
        build: snapshot.event.features?.build !== false,
        resources: snapshot.event.features?.resources !== false,
      },
    };
  }
  persist();
}

async function syncRemoteState({ quiet = true } = {}) {
  try {
    const snapshot = await loadRemoteEvent(selectedEvent.id, state.profile);
    applyRemoteSnapshot(snapshot);
    render(false);
    return true;
  } catch (error) {
    if (!quiet) notify(`Shared Studio data is temporarily unavailable. ${error.message}`);
    return false;
  }
}

function mirrorRemote(action, payload = {}, successMessage = '') {
  sendRemoteAction(selectedEvent.id, state.profile, action, payload)
    .then(snapshot => {
      applyRemoteSnapshot(snapshot);
      render(false);
      if (successMessage) notify(successMessage);
    })
    .catch(error => notify(`Saved in this browser, but not to shared Studio yet. ${error.message}`));
}

function prototypeBar() {
  return `<div class="prototype-bar"><span><strong>Development preview</strong><span class="prototype-detail">  / Shared drafts use the Studio database; sample content stays local</span></span>${button('Reset demo', 'reset', '', 'text-button')}</div>`;
}

function header() {
  const themeButton = '<button class="button secondary theme-toggle" type="button" data-action="theme" aria-label="Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode">' + (theme === 'dark' ? '☀' : '◐') + '<span>' + (theme === 'dark' ? 'Light' : 'Dark') + '</span></button>';
  return '<header class="studio-header"><a class="brand" href="' + base + '" aria-label="Publisher Studio home"><img src="/assets/images/wistudi-logo.png" alt="Wistudi" width="120" height="40"></a><span class="header-divider"></span><a class="studio-wordmark" href="' + base + '">Publisher Studio</a><div class="header-actions">' + themeButton + '<div data-identity-mount></div></div></header>';
}

function globalNavigation(view = studioView, mobile = false) {
  const items = [
    ['home', 'Home', `${base}?view=home`, 'home'],
    ['discover', 'Discover events', `${base}?view=discover`, 'discover'],
    ['my-events', 'My events', `${base}?view=my-events`, 'events'],
  ];
  const active = page === 'builder' ? '' : page === 'event' ? (view === 'my-events' ? 'my-events' : 'discover') : page === 'studio' ? 'my-events' : view;
  const links = items.map(([key, label, href, glyph]) => `<a href="${href}" ${active === key ? 'aria-current="page"' : ''}>${icon(glyph)}<span>${label}</span></a>`).join('');
  if (!mobile) return `<nav class="global-navigation" aria-label="Publisher Studio">${links}</nav>`;
  return `<nav class="global-mobile-navigation" aria-label="Publisher Studio">${items.map(([key, label, href, glyph]) => `<a href="${href}" ${active === key ? 'aria-current="page"' : ''}>${icon(glyph)}<span>${label === 'Discover events' ? 'Discover' : label}</span></a>`).join('')}${canBuildStudioEvents() ? `<a href="${base}manage/events/" ${page === 'builder' ? 'aria-current="page"' : ''}>${icon('plus')}<span>Create</span></a>` : ''}</nav>`;
}

function renderNav() {
  const current = page === 'event' ? 'overview' : activeTab();
  const items = [
    ['overview', 'Overview', 'Overview', 'home', `${eventUrl(selectedEvent)}`],
    ['week', 'Room', 'Room', 'calendar', `${eventUrl(selectedEvent)}room/#week`],
    ['questions', 'Questions', 'Ask', 'question', `${eventUrl(selectedEvent)}room/#questions`],
    ['challenge', 'Build', 'Build', 'build', `${eventUrl(selectedEvent)}room/#challenge`],
    ['workbench', 'Chat', 'Chat', 'chat', `${eventUrl(selectedEvent)}room/#workbench`],
    ...(selectedResources.length ? [['resources', 'Event resources', 'Resources', 'book', `${eventUrl(selectedEvent)}room/#resources`]] : []),
  ];
  return `<nav class="event-workspace-nav" aria-label="${e(selectedEvent.title)} sections">${items.map(([key, label, mobileLabel, glyph, href]) => {
    const openQuestions = key === 'questions' ? state.questions.filter(item => contextFor(item.contextId).workshopId === selectedEvent.id && !item.answer).length : 0;
    return `<a href="${href}" aria-label="${e(label)}" title="${e(label)}" ${current === key ? 'aria-current="page"' : ''}>${icon(glyph)}<span class="nav-full">${e(label)}</span><span class="nav-short" aria-hidden="true">${e(mobileLabel)}</span>${openQuestions ? `<span class="nav-count">${openQuestions}</span>` : ''}</a>`;
  }).join('')}</nav>`;
}

function appSidebar(view = studioView, eventContext = null) {
  const eventNav = eventContext ? `<section class="sidebar-event-context"><div class="sidebar-section-label">Selected event</div><a class="sidebar-event-title" href="${eventUrl(eventContext)}">${e(eventContext.title)}</a><p class="muted small">${e(eventContext.subject)} · ${e(eventContext.topic)}</p>${renderNav()}</section>` : '';
  return `<aside class="workspace-sidebar app-sidebar"><a class="sidebar-studio-name" href="${base}">Publisher Studio</a>${globalNavigation(view)}${canBuildStudioEvents() ? `<a class="sidebar-create-event ${page === 'builder' ? 'is-current' : ''}" href="${base}manage/events/">${icon('plus')}<span>Build an event</span></a>` : ''}${eventNav}<div class="sidebar-bottom"><span class="muted small">${page === 'builder' ? 'Event setup' : eventContext ? 'This event room' : 'Learning and creation'}</span><span class="muted small">${page === 'builder' ? 'Draft preview' : eventContext ? 'Room access is a preview' : 'Publisher Studio'}</span></div></aside>`;
}

function appShell({ view = studioView, eventContext = null, content = '', contextRail = '', mainClass = '', crumb = '' }) {
  const parentView = page === 'studio' ? 'my-events' : 'discover';
  const parentLabel = page === 'studio' ? 'My events' : 'Discover events';
  const eventBar = eventContext || page === 'builder' ? `<div class="room-topbar app-crumbbar"><a class="room-back" href="${base}?view=${eventContext ? parentView : 'home'}">${icon('back')}<span>${eventContext ? parentLabel : 'Home'}</span></a>${eventContext ? `<a class="room-event-link" href="${eventUrl(eventContext)}"><strong>${e(eventContext.title)}</strong><span>${e(roomTiming(eventContext))} · Room open</span></a>${button(`${icon('share')}<span>Share</span>`, 'share-event', `data-slug="${e(eventContext.slug)}"`, 'button secondary room-invite')}` : `<strong class="app-crumb-title">${e(crumb || 'Build an event')}</strong>`}</div>` : '';
  const mobileEventNavigation = eventContext ? `<div class="mobile-event-navigation">${renderNav()}</div>` : '';
  return `${prototypeBar()}${header()}${eventBar}${mobileEventNavigation}<div class="workspace app-workspace ${contextRail ? 'has-context-rail' : ''} ${eventContext ? 'has-event-context' : ''}">${appSidebar(view, eventContext)}<main id="main" class="workspace-main ${mainClass}" tabindex="-1">${content}</main>${contextRail ? `<aside class="context-rail">${contextRail}</aside>` : ''}</div>${globalNavigation(view, true)}`;
}

function phaseControl() {
  return `<label class="phase-control">Preview stage<select data-phase name="phase"><option value="upcoming" ${selectedPhase() === 'upcoming' ? 'selected' : ''}>Before workshop</option><option value="live" ${selectedPhase() === 'live' ? 'selected' : ''}>Live workshop</option><option value="post_session" ${selectedPhase() === 'post_session' ? 'selected' : ''}>After workshop</option></select></label>`;
}

function phaseContent() {
  const content = {
    upcoming: ['Before the workshop', 'Bring a lesson. Leave with a new direction.', 'Explore the event resources and bring a question for the trainer.', `<a class="button primary" href="${eventUrl(selectedEvent)}">View event details ${icon('arrow')}</a>`],
    live: ['Studio Live (preview)', 'Learn together. Build as you go.', 'Open the event resources and add questions as they come up.', `<a class="button primary" href="${eventUrl(selectedEvent)}room/#questions">Ask the Trainer ${icon('arrow')}</a><span class="muted small">The live meeting link is not connected.</span>`],
    post_session: ['Keep building', 'The workshop ends. Your idea keeps going.', 'Try the challenge, compare approaches and share what you make.', `<a class="button primary" href="${eventUrl(selectedEvent)}room/#challenge">Open build challenge ${icon('arrow')}</a><span class="muted small">Recording is not connected.</span>`],
  }[selectedPhase()];
  return `<section class="weekly-focus"><div class="eyebrow">${content[0]}</div><h2>${content[1]}</h2><p>${content[2]}</p><div class="actions">${content[3]}</div></section>`;
}

function resourceRows({ limit = selectedResources.length, audience = 'room' } = {}) {
  const items = selectedResources.filter(item => audience !== 'public' || (resourcePhase(item) === 'upcoming' && item.publicPreview === true)).slice(0, limit);
  return items.map((item, index) => {
    const available = audience === 'public' || resourceIsAvailable(item);
    const timing = phaseLabel[resourcePhase(item)] || phaseLabel.upcoming;
    const action = audience === 'public' ? 'public-resource' : 'resource';
    return `<button type="button" class="resource-row" data-action="${action}" data-id="${item.id}" ${available ? '' : 'disabled'}><span class="resource-icon tone-${index % 3}">${icon(item.type === 'template' ? 'build' : 'book')}</span><span><span class="eyebrow">${e(item.label)} / ${e(timing)}</span><strong>${e(item.title)}</strong><span class="muted small">${available ? e(item.description) : 'This resource will be available later in the event.'}</span></span>${icon(available ? 'arrow' : 'calendar')}</button>`;
  }).join('');
}

function videoEmbedUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'youtu.be' || host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const id = host === 'youtu.be' ? url.pathname.split('/').filter(Boolean)[0] : url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).at(-1);
      return id && /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : '';
    }
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const id = url.pathname.split('/').filter(Boolean).find(part => /^\d+$/.test(part));
      return id ? `https://player.vimeo.com/video/${id}` : '';
    }
  } catch { /* Invalid links are shown as ordinary links, never embedded. */ }
  return '';
}

function videoEmbed(value, title) {
  const src = videoEmbedUrl(value);
  return src ? `<div class="embedded-video"><iframe src="${e(src)}" title="${e(title)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>` : '';
}

function readKitEditor() {
  return [...document.querySelectorAll('.kit-editor-row')].map(row => {
    const value = name => row.querySelector(`[data-kit-field="${name}"]`);
    const file = value('fileName');
    const availableFrom = value('availableFrom')?.value || 'upcoming';
    return {
      key: row.dataset.resourceKey,
      type: value('type')?.value || 'other',
      title: value('title')?.value.trim() || '',
      description: value('description')?.value.trim() || '',
      instructions: value('instructions')?.value.trim() || '',
      url: value('url')?.value.trim() || '',
      availableFrom,
      publicPreview: availableFrom === 'upcoming' && Boolean(value('publicPreview')?.checked),
      fileName: file?.value || file?.dataset.savedName || '',
    };
  });
}

function syncKitEditor() {
  const hidden = document.querySelector('#event-builder-form [name="resourcesJson"]');
  const items = readKitEditor();
  if (hidden) hidden.value = JSON.stringify(items);
  return items;
}

function kitResourceRow(item = {}) {
  const key = item.key || `resource-${Math.random().toString(36).slice(2, 10)}`;
  const availableFrom = item.availableFrom || 'upcoming';
  const publicPreview = availableFrom === 'upcoming' && Boolean(item.publicPreview);
  const types = Object.entries(resourceTypes).map(([value, label]) => `<option value="${value}" ${item.type === value ? 'selected' : ''}>${e(label)}</option>`).join('');
  const fileStatus = item.fileName ? `<p class="kit-file-note" role="status">${e(item.fileName)} / ${localPreviewUrls.has(`resource:${key}`) ? 'local preview ready' : 'reselect the file after reloading this draft'}</p>` : '';
  return `<article class="kit-editor-row" data-resource-key="${e(key)}"><div class="kit-editor-row-top"><strong>Event resource</strong>${button('Remove', 'remove-kit-resource', `data-key="${e(key)}"`, 'text-button')}</div><div class="builder-grid kit-fields"><label>Resource type<select data-kit-field="type">${types}</select></label><label>Title<input data-kit-field="title" value="${e(item.title || '')}" maxlength="100" placeholder="e.g. Speaking lesson template"></label></div><label>Short description <span class="muted">(optional)</span><input data-kit-field="description" value="${e(item.description || '')}" maxlength="220" placeholder="What this resource contains or helps participants do"></label><label>Link <span class="muted">(optional; use for a Flow, Google Drive, YouTube, Vimeo or other page)</span><input data-kit-field="url" type="url" inputmode="url" value="${e(item.url || '')}" placeholder="https://..."></label><div class="kit-file-field"><span class="field-label">Or attach a file <span class="muted">(PDF, Word, image, audio or video)</span></span>${fileDropzone({ title: 'Drop a resource file here', detail: 'PDF, Word, image, audio or video · up to 30 MB', accept: '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.mp4,.webm,audio/*', inputAttributes: 'data-kit-file aria-label="Attach a file to this event resource"' })}</div><input data-kit-field="fileName" type="hidden" value="${e(item.fileName || '')}" data-saved-name="${e(item.fileName || '')}">${fileStatus}<label>Instructions <span class="muted">(optional; one step per line)</span><textarea data-kit-field="instructions" rows="3" maxlength="1000" placeholder="1. Open the worksheet\n2. Choose one task\n3. Adapt it for your learners">${e(item.instructions || '')}</textarea></label><div class="builder-grid kit-release"><label>Available from<select data-kit-field="availableFrom"><option value="upcoming" ${availableFrom === 'upcoming' ? 'selected' : ''}>Before the event</option><option value="live" ${availableFrom === 'live' ? 'selected' : ''}>During the live event</option><option value="post_session" ${availableFrom === 'post_session' ? 'selected' : ''}>After the live event</option></select></label><label class="checkbox-row kit-public-toggle"><input type="checkbox" data-kit-field="publicPreview" ${publicPreview ? 'checked' : ''} ${availableFrom === 'upcoming' ? '' : 'disabled'}><span>Show on the public event page before registration</span></label></div></article>`;
}

function renderKitEditor(items = []) {
  const list = document.querySelector('#builder-resource-list');
  if (!list) return;
  list.innerHTML = items.length ? items.map(kitResourceRow).join('') : '<p class="muted small">No event resources added. Add this section\'s materials only when the event needs them.</p>';
  syncKitEditor();
}

function renderBuilderMediaPreview() {
  const preview = document.querySelector('#builder-media-preview');
  if (!preview) return;
  const banner = localPreviewUrls.get('bannerImage');
  const card = localPreviewUrls.get('cardImage');
  const mobileCard = localPreviewUrls.get('mobileCardImage');
  const videoFile = localPreviewUrls.get('promoVideoFile');
  const videoLink = document.querySelector('[name="promoVideoUrl"]')?.value.trim() || '';
  const parts = [];
  if (banner) parts.push(`<figure><img src="${e(banner)}" alt="${e(document.querySelector('[name="imageAlt"]')?.value || 'Event page banner preview')}"><figcaption>Event page banner</figcaption></figure>`);
  if (card) parts.push(`<figure class="card-image-preview"><img src="${e(card)}" alt="${e(document.querySelector('[name="imageAlt"]')?.value || 'Event card preview')}"><figcaption>Event listing image / desktop crop</figcaption></figure>`);
  if (mobileCard) parts.push(`<figure class="mobile-card-image-preview"><img src="${e(mobileCard)}" alt="${e(document.querySelector('[name="imageAlt"]')?.value || 'Mobile event card crop')}"><figcaption>Optional mobile card crop</figcaption></figure>`);
  if (videoFile) parts.push(`<figure class="video-preview"><video controls playsinline preload="metadata" src="${e(videoFile)}"></video><figcaption>Local video file preview</figcaption></figure>`);
  else if (videoLink) parts.push(videoEmbed(videoLink, 'Event promotion video') || `<p class="kit-file-note">Video link saved for the event preview. This URL is not from a supported embeddable provider.</p>`);
  preview.innerHTML = parts.join('');
  preview.hidden = !parts.length;
}

function fileDropzone({ title, detail, accept, inputAttributes = '', inputName = '' }) {
  return `<label class="file-dropzone" data-dropzone><input class="file-dropzone-input" type="file" ${inputName ? `name="${e(inputName)}"` : ''} accept="${e(accept)}" ${inputAttributes}><span class="file-dropzone-icon" aria-hidden="true">＋</span><span class="file-dropzone-copy"><strong>${e(title)}</strong><small>${e(detail)}</small><span class="file-dropzone-meta" data-file-name>Choose a file or drop it here</span></span><span class="file-dropzone-button">Browse</span></label>`;
}

function eventCard(item, { myEvent = false } = {}) {
  const roomUrl = `${eventUrl(item)}room/#week`;
  const cardImage = item.cardImage || item.banner;
  const art = cardImage
    ? `<picture>${item.mobileCardImage ? `<source media="(max-width: 680px)" srcset="${e(item.mobileCardImage)}">` : ''}<img src="${e(cardImage)}" alt="" loading="lazy"></picture>`
    : `<div class="event-art-placeholder topic-${item.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}"><span>Wistudi Publisher Studio</span><strong>${e(item.topic)}</strong></div>`;
  return `<article class="event-card" data-subject="${e(item.subject)}"><a class="event-card-art" href="${eventUrl(item)}" aria-label="View ${e(item.title)}">${art}<span class="event-status">${myEvent ? 'My event' : e(item.status === 'upcoming' ? 'Upcoming' : 'Past')}</span></a><div class="event-card-body"><div class="eyebrow">${e(item.subject)} / ${e(item.topic)} / ${e(item.level)}</div><h3><a href="${eventUrl(item)}">${e(item.title)}</a></h3><p class="muted">${e(item.summary)}</p><div class="event-card-meta"><span>${icon('calendar')}${e(localTime(item))}</span><span>${e(item.duration)} min</span></div><p class="event-output"><strong>You'll make</strong> ${e(item.output)}</p><div class="event-card-actions"><a class="button primary" href="${myEvent ? roomUrl : eventUrl(item)}">${myEvent ? 'Open event room' : 'View event'} ${icon('arrow')}</a><button class="button secondary share-event-compact" type="button" data-action="share-event" data-slug="${e(item.slug)}" aria-label="Share ${e(item.title)}" title="Share event">${icon('share')}<span class="sr-only">Share</span></button>${myEvent ? `<a class="room-shortcut" href="${eventUrl(item)}">Event overview</a>` : `<a class="room-shortcut" href="${roomUrl}" title="Room preview; live access requires registration">Room preview</a>`}</div></div></article>`;
}

function renderHome() {
  const upcoming = events.filter(item => item.status === 'upcoming');
  const past = events.filter(item => item.status === 'past');
  const previewEvents = (state.previewEventIds || []).map(id => events.find(item => item.id === id)).filter(Boolean);
  if (studioView === 'discover') {
    const content = `<div class="app-page-heading"><div class="eyebrow">Publisher Studio</div><h1>Discover events</h1><p class="lead">Choose a practical workshop and see what you’ll learn, make and share.</p></div><section class="event-catalog-section"><div class="section-heading"><div><h2>Upcoming events</h2><p class="muted">Every event has its own room, optional event resources and build challenge.</p></div><label class="event-filter">Subject<select id="event-filter"><option value="all">All subjects</option>${[...new Set(events.map(item => item.subject))].map(subject => `<option value="${e(subject)}">${e(subject)}</option>`).join('')}</select></label></div><div class="event-grid">${upcoming.map(eventCard).join('')}</div></section>${past.length ? `<section class="event-catalog-section past-events"><div class="section-heading"><div><div class="eyebrow">Learn from previous sessions</div><h2>Past events</h2></div></div><div class="event-grid">${past.map(eventCard).join('')}</div></section>` : ''}`;
    return appShell({ view: 'discover', content });
  }
  if (studioView === 'my-events') {
    const content = `<div class="app-page-heading"><div class="eyebrow">Your Publisher Studio</div><h1>My events</h1><p class="lead">Events connected to your Studio registration are collected here.</p></div>${previewEvents.length ? `<div class="preview-state-note">These are preview registrations stored in this browser tab. They are not real bookings.</div><section class="event-grid my-event-grid">${previewEvents.map(item => eventCard(item, { myEvent: true })).join('')}</section>` : `<section class="empty-state my-events-empty"><span class="empty-state-icon">${icon('events')}</span><h2>Your events will appear here</h2><p>Register for a Publisher Studio event to keep its room, questions and build challenge close at hand.</p><a class="button primary" href="${base}?view=discover">Discover events ${icon('arrow')}</a></section>`}`;
    return appShell({ view: 'my-events', content });
  }
  const continueEvent = previewEvents[0];
  const content = `<section class="studio-intro"><div><div class="eyebrow">A place to learn by making</div><h1>Wistudi Publisher Studio</h1><p class="lead">Practical workshops that lead to useful teaching resources. Learn something, build an idea, share it for feedback and keep improving it in Wistudi.</p><a class="button primary home-discover-link" href="${base}?view=discover">Discover events ${icon('arrow')}</a></div><div class="studio-journey"><ol class="journey" aria-label="Publisher journey"><li class="current">Discover</li><li>Learn</li><li>Build</li><li>Share</li><li>Publish</li></ol><p class="muted small">Publishing in Wistudi is an optional next step.</p></div></section>${continueEvent ? `<section class="home-continue"><div><div class="eyebrow">Pick up where you left off</div><h2>${e(continueEvent.title)}</h2><p class="muted">Your preview registration is available in this browser tab.</p></div><a class="button primary" href="${eventUrl(continueEvent)}room/#week">Open event room ${icon('arrow')}</a></section>` : `<section class="home-continue home-empty"><div><div class="eyebrow">Your learning space</div><h2>Start with an event that fits your work.</h2><p class="muted">Your events and projects will be easy to return to from My events.</p></div><a class="button secondary" href="${base}?view=my-events">View My events ${icon('arrow')}</a></section>`}<section class="event-catalog-section home-upcoming"><div class="section-heading"><div><div class="eyebrow">Next in the Studio</div><h2>Upcoming events</h2></div><a class="text-link" href="${base}?view=discover">See all events ${icon('arrow')}</a></div><div class="event-grid">${upcoming.slice(0, 3).map(eventCard).join('')}</div></section>`;
  return appShell({ view: 'home', content });
}

function renderCalendar() {
  return appShell({ view: 'calendar', content: renderCalendarApp(state.calendar), mainClass: 'calendar-app-main' });
}

function renderEvent() {
  const item = selectedEvent;
  const roomUrl = `${eventUrl(item)}room/#week`;
  const publicResources = selectedResources.filter(resource => resourcePhase(resource) === 'upcoming' && resource.publicPreview === true);
  const banner = item.banner ? `<div class="event-hero-media"><img src="${e(item.banner)}" alt="${e(item.bannerAlt || item.title)}"></div>` : '';
  const promo = item.promoVideoUrl ? videoEmbed(item.promoVideoUrl, `${item.title} event preview`) : '';
  const content = `<div class="event-overview-page"><div class="event-page-heading"><div><div class="eyebrow">${e(item.subject)} Publisher Studio / ${e(item.topic)}</div><h1>${e(item.title)}</h1><p class="lead">${e(item.summary)}</p></div></div>${banner}${promo}<div class="event-layout"><article><div class="event-facts"><div><span class="muted small">Your local time</span><strong>${e(localTime(item))}</strong></div><div><span class="muted small">Event timezone</span><strong>${e(item.timezone || 'Shown in your device timezone')}</strong></div><div><span class="muted small">Format</span><strong>${e(item.duration)}-minute ${e(item.format.toLowerCase())}</strong></div><div><span class="muted small">Trainer</span><strong>${e(item.trainer)}</strong></div><div><span class="muted small">For</span><strong>${e(item.audience)}</strong></div></div><section class="section-block"><h2>Learning outcomes</h2><ul class="outcomes">${(item.learningOutcomes || []).map(outcome => `<li>${e(outcome)}</li>`).join('')}</ul><div class="event-next-step"><div class="eyebrow">You'll make</div><p>${e(item.output)}</p></div></section>${publicResources.length ? `<section class="section-block"><div class="section-heading"><div><div class="eyebrow">Included with this event</div><h2>Event resources</h2><p class="muted">These materials are available before the event. More may be released in the participant room.</p></div></div>${resourceRows({ audience: 'public' })}</section>` : ''}<section class="section-block"><h2>What happens next</h2><ol class="outcomes"><li>Attend the live event or use the event resources.</li><li>Build or adapt a learning experience for your learners.</li><li>Share it in the event room for feedback.</li></ol></section><section class="event-next-step"><div class="eyebrow">After you register</div><h2>Your event room</h2><p>Questions, workshop links, the build challenge and participant work all stay attached to this event.</p><a class="button secondary" href="${roomUrl}">Preview this room ${icon('arrow')}</a></section></article>
      <aside class="registration-panel" id="registration-panel"><div class="eyebrow">Register for this event</div><h2>Reserve your place</h2><p class="muted">This preview shows the registration journey only. It does not create a booking or send an email.</p><form id="registration-form"><label>Display name<input name="displayName" maxlength="60" autocomplete="off" placeholder="Use a sample name" required></label><label>Email (preview only)<input name="email" type="email" autocomplete="off" placeholder="you@example.com" required></label><label class="checkbox-row"><input type="checkbox" name="studioConsent" ${state.profile ? 'checked' : ''}><span>${state.profile ? 'Use my Studio profile for discussions and sharing work in this event. This choice does not remove your profile if you leave it unchecked.' : 'Also create a Studio profile for discussions and sharing work. This is optional.'}</span></label><p class="muted small">The checkbox does not create a real account here. A live version would verify your email and keep event booking separate from Studio membership.</p><p class="form-error" role="alert" hidden></p><button class="button primary full-width" type="submit">Preview registration ${icon('arrow')}</button></form><a class="text-link registration-skip" href="${roomUrl}">Explore the room preview</a></aside>
    </div></div>`;
  return appShell({ view: 'discover', eventContext: item, content, mainClass: 'event-main' });
}

function openShare(slug) {
  const item = events.find(candidate => candidate.slug === slug) || selectedEvent;
  const url = `${location.origin}${eventUrl(item)}`;
  const shareText = `${item.title} — ${item.output}`;
  dialogMode = 'share'; dialogTarget = item.slug;
  modal('Share this event', `<div class="dialog-content share-content"><div class="share-preview"><div class="share-preview-art">${item.banner ? `<img src="${e(item.banner)}" alt="">` : `<span>${e(item.subject)} / ${e(item.topic)}</span>`}</div><div><div class="eyebrow">Wistudi Publisher Studio</div><h3>${e(item.title)}</h3><p class="muted">${e(item.output)}</p><span class="share-domain">${e(location.host)}</span></div></div><p class="muted">Share the public event page. Each person registers for their own place; the event room stays restricted to registered participants.</p><div class="share-actions">${button('Copy event link', 'copy-share', `data-url="${e(url)}"`, 'button primary full-width')}${button('Share from this device', 'native-share', `data-url="${e(url)}" data-title="${e(item.title)}" data-text="${e(shareText)}"`, 'button secondary full-width')}<a class="button secondary" href="https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}" target="_blank" rel="noopener noreferrer">WhatsApp</a><a class="button secondary" href="mailto:?subject=${encodeURIComponent(item.title)}&body=${encodeURIComponent(`${shareText}\n\n${url}`)}">Email</a><a class="button secondary" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}" target="_blank" rel="noopener noreferrer">LinkedIn</a><a class="button secondary" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener noreferrer">Facebook</a></div><p class="muted small">Preview only: share counts, invites and QR generation are not connected.</p></div>`);
}

function renderBuilder() {
  const content = `<div class="builder-page"><div class="builder-heading"><div><div class="eyebrow">Event Builder / Shared drafts</div><h1>Create a Studio event</h1><p class="lead">Use the same structure for every event. Each event gets a public page, a participant room and a connected build project.</p></div><span class="tag">Shared draft workspace</span></div><div class="builder-flow" aria-label="Event publishing process"><span class="current">1. Details</span><span>2. Schedule</span><span>3. Room and team</span><span>4. Review and publish</span></div><div class="builder-warning"><strong>Shared draft workspace.</strong> Event details save to the Publisher Studio database. Sign-in and Event Builder permissions are required. Uploaded files still preview only in this browser; use a secure external link for shared media previews.</div><section class="builder-saved-drafts builder-section"><div class="builder-section-heading"><span>↻</span><div><h2>Continue a shared draft</h2><p>Open a draft saved to your Publisher Studio account.</p></div><button type="button" class="button secondary" data-action="new-builder-draft">Start new draft</button></div><div id="builder-saved-drafts" aria-live="polite"><p class="muted small">Loading shared drafts…</p></div></section>
    <form id="event-builder-form" class="event-builder-form"><input type="hidden" name="eventId" value=""><div class="builder-columns"><div class="builder-fields">
      <section class="builder-section"><div class="builder-section-heading"><span>01</span><div><h2>Event details</h2><p>Tell people who this is for, what they will learn and what they will make.</p></div></div><label>Event title<input name="title" maxlength="100" placeholder="e.g. Build an interactive speaking lesson" required></label><label>Short description<textarea name="summary" rows="3" maxlength="320" placeholder="Explain the teaching problem or skill this workshop addresses." required></textarea></label><div class="builder-grid"><label>Subject<input name="subject" maxlength="40" placeholder="English" required></label><label>Topic<input name="topic" maxlength="50" placeholder="Speaking" required></label><label>Level<input name="level" maxlength="32" placeholder="B1" required></label><label>Audience<input name="audience" maxlength="100" placeholder="English teachers and tutors" required></label></div><label>Learning outcomes <span class="muted">(one outcome per line)</span><textarea name="learningOutcomes" rows="4" maxlength="800" placeholder="Adapt a speaking task into a clear lesson sequence\nDesign one purposeful learner activity\nPlan how learners will reflect on their progress" required></textarea></label><label>What will participants make?<textarea name="output" rows="2" maxlength="220" placeholder="One concrete outcome from the session" required></textarea></label></section>
      <section class="builder-section"><div class="builder-section-heading"><span>02</span><div><h2>Schedule and online session</h2><p>Dates are stored with an explicit timezone and displayed in each participant's local time.</p></div></div><div class="builder-grid"><label>Start date and time<input name="startsAt" type="datetime-local" required></label><label>Event timezone<select name="timezone"><option value="Asia/Ho_Chi_Minh">Asia / Ho Chi Minh</option><option value="UTC">UTC</option><option value="Europe/London">Europe / London</option><option value="America/New_York">America / New York</option></select></label><label>Duration<select name="duration"><option>60</option><option>75</option><option>90</option><option>120</option></select></label><label>Trainer name<input name="trainer" maxlength="60" placeholder="Assigned Wistudi trainer" required></label></div><div class="integration-card"><div><span class="eyebrow">Zoom</span><strong>Manual meeting link in this preview</strong><p>For the live system, show the participant join link only inside their registered event room.</p></div><span class="integration-state">Not connected</span><label>Test meeting link<input name="zoomUrl" type="url" placeholder="https://zoom.us/j/..." autocomplete="off"></label><button class="button secondary" type="button" disabled>Connect Zoom account</button></div></section>
      <section class="builder-section"><div class="builder-section-heading"><span>03</span><div><h2>Event artwork and promotion</h2><p>Use a wide image for the event page and separate artwork for the event listing.</p></div></div>${fileDropzone({ title: 'Event page banner image', detail: 'Wide 16:9 · JPG, PNG or WebP · up to 8 MB', accept: 'image/png,image/jpeg,image/webp', inputName: 'bannerImage', inputAttributes: 'data-media-file="bannerImage"' })}${fileDropzone({ title: 'Event listing image', detail: 'Card artwork · JPG, PNG or WebP · up to 8 MB', accept: 'image/png,image/jpeg,image/webp', inputName: 'cardImage', inputAttributes: 'data-media-file="cardImage"' })}${fileDropzone({ title: 'Optional mobile listing crop', detail: 'Portrait 2:3 crop · JPG, PNG or WebP · up to 8 MB', accept: 'image/png,image/jpeg,image/webp', inputName: 'mobileCardImage', inputAttributes: 'data-media-file="mobileCardImage"' })}<div class="upload-note">Use a 16:9 banner; it crops to 4:3 on phones. Event cards stay horizontal on mobile: a narrow image sits on the left beside the event details. The mobile image crop is portrait 2:3. If you do not supply one, the desktop card image is center-cropped. Keep important faces and text near the center. Files preview in this browser only.</div><label>Event promotion video link<input name="promoVideoUrl" type="url" placeholder="YouTube or Vimeo link" autocomplete="off"></label>${fileDropzone({ title: 'Or drop a short video here', detail: 'MP4 or WebM · up to 50 MB for this local preview', accept: 'video/mp4,video/webm', inputName: 'promoVideoFile', inputAttributes: 'data-media-file="promoVideoFile"' })}<label>Media description for screen readers<input name="imageAlt" maxlength="150" placeholder="Describe the key information in the artwork"></label><div id="builder-media-preview" class="builder-media-preview" hidden></div><div class="upload-note">YouTube and Vimeo links can be embedded when supported. Direct video files preview locally only; live upload and video delivery need managed media storage.</div></section>
      <section class="builder-section"><div class="builder-section-heading"><span>04</span><div><h2>Event resources and project</h2><p>Add only the materials this event needs. Each can be shown before registration or released in the participant room later.</p></div></div><div class="resource-editor-intro"><strong>Event resources</strong><p>Examples include a Flow, PDF or Word worksheet, a video, a Drive link or step-by-step instructions. Each item can have its own description and release time.</p></div><input type="hidden" name="resourcesJson" value="[]"><div id="builder-resource-list" class="kit-editor-list"><p class="muted small">No event resources added. Add this section's materials only when the event needs them.</p></div><button class="button secondary builder-add-resource" type="button" data-action="add-kit-resource">${icon('plus')} Add an event resource</button><div class="upload-note">Files are selectable for this preview, but are not stored or uploaded. Production attachments need approved storage and permission checks.</div><label>Discussion prompt<input name="discussionPrompt" maxlength="180" placeholder="What question should participants consider before the event?"></label><label>Build challenge title<input name="challengeTitle" maxlength="100" placeholder="The practical creation task" required></label><label>Build challenge brief<textarea name="challengeBrief" rows="3" maxlength="400" placeholder="Describe what to make, share and ask for feedback on." required></textarea></label><label>Wistudi creation link<input name="wistudiLink" type="url" placeholder="Link to a Flow or template, when available" autocomplete="off"></label></section>
      <section class="builder-section"><div class="builder-section-heading"><span>05</span><div><h2>Team and permissions</h2><p>Assign people to specific events and rooms.</p></div></div><div class="permission-preview"><div><strong>Event builder</strong><span>Creates and edits this event</span></div><div><strong>Trainer / moderator</strong><span>Hosts the session and manages this room</span></div><p>Role invitations must be email-bound, time-limited and revocable. Invitation links are shown as a future service; no permissions are granted by this prototype.</p><button class="button secondary" type="button" disabled>Invite event team</button></div></section>
    </div><aside class="builder-aside"><div class="builder-sticky"><div class="eyebrow">Event publishing checklist</div><h2>One event, one connected journey</h2><ol class="builder-checklist"><li>Public event page and share link</li><li>Registration and confirmation</li><li>Private participant room</li><li>Optional event resources</li><li>Build challenge and submission</li><li>Optional Wistudi publish step</li></ol><hr><p class="muted small">Only resources marked for public preview appear before registration. Zoom links and room-only resources stay in the participant room.</p><div class="actions builder-controls"><button type="button" class="button secondary" data-action="save-builder">Save shared draft</button><button type="button" class="button primary" data-action="preview-builder">Preview event</button><button type="button" class="button" disabled title="Publishing requires authenticated roles and a database">Publish event</button></div><p id="builder-save-status" class="muted small" role="status"></p></div></aside></div></form></div>`;
  return appShell({ view: 'home', content, mainClass: 'builder-main', crumb: 'Build an event' });
}

function roomTiming(item) {
  const start = new Date(item.startsAt);
  const end = new Date(start.getTime() + item.duration * 60000);
  if (Date.now() < start) return `Starts ${new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(start)}`;
  if (Date.now() <= end) return 'Live now';
  return 'Event ended';
}

function roomDirectory(className = 'room-directory') {
  return `<section class="${className}" aria-label="Event rooms"><div class="room-directory-heading"><strong>Event rooms</strong><span>${events.length}</span></div>${events.map(item => {
    const count = state.threads.filter(thread => contextFor(thread.contextId).workshopId === item.id).length + state.questions.filter(question => contextFor(question.contextId).workshopId === item.id).length;
    const current = item.id === selectedEvent.id;
    return `<a class="room-directory-item ${current ? 'is-current' : ''}" href="${eventUrl(item)}room/#workbench" ${current ? 'aria-current="page"' : ''}><span class="room-live-dot" aria-hidden="true"></span><span class="room-directory-copy"><strong>${e(item.topic)}</strong><small>${e(roomTiming(item))} · room open</small></span><span class="room-activity-count" aria-label="${count} discussions">${count}</span></a>`;
  }).join('')}<p>Rooms stay open after an event until its owner or Wistudi closes them.</p></section>`;
}

function messageLinkPreview(body) {
  const match = body.match(/https:\/\/[^\s<>"']+/i);
  if (!match) return { bodyHtml: e(body), preview: '' };
  const raw = match[0].replace(/[),.!?;:]+$/g, '');
  const url = safeHttpsUrl(raw);
  if (!url) return { bodyHtml: e(body), preview: '' };
  const cleanBody = body.replace(raw, '').trim();
  const host = new URL(url).hostname.replace(/^www\./, '');
  const isFlow = host === 'wistudi.tgndigital.vn' && new URL(url).pathname.startsWith('/share/flow/');
  const video = videoEmbed(url, 'Shared video');
  const flowImage = 'https://wistudi.tgndigital.vn/images/og-share.jpg';
  const flowDescription = 'Wistudi is a modular, interactive platform for creating, delivering, and sharing engaging experiences across learning, training, events, and communities.';
  const preview = video || `<a class="chat-link-preview ${isFlow ? 'wistudi-flow-preview' : ''}" href="${e(url)}" target="_blank" rel="noopener noreferrer"><span class="chat-preview-art">${isFlow ? `<img src="${flowImage}" alt="">` : icon('arrow')}</span><span class="chat-preview-copy"><strong>${isFlow ? 'Wistudi Flow' : e(host)}</strong><span>${isFlow ? flowDescription : e(url)}</span><small>${isFlow ? 'Wistudi share page preview · Flow-specific title is not exposed' : `${e(host)} · Open link`} ${icon('arrow')}</small></span></a>`;
  const safeBody = e(cleanBody).replaceAll(e(`@${selectedEvent.trainer}`), `<span class="trainer-mention">${e(`@${selectedEvent.trainer}`)}</span>`);
  return { bodyHtml: cleanBody ? safeBody : '', preview };
}

function renderAttachments(item) {
  const attachments = item?.attachments || [];
  if (!attachments.length) return '';
  return `<div class="chat-attachments">${attachments.map(file => {
    const src = chatObjectUrls.get(file.id);
    if (src && file.type.startsWith('image/')) return `<a href="${e(src)}" target="_blank" rel="noopener noreferrer"><img src="${e(src)}" alt="${e(file.name)}"></a>`;
    if (src && file.type.startsWith('video/')) return `<video controls playsinline preload="metadata" src="${e(src)}"></video>`;
    if (src && file.type.startsWith('audio/')) return `<audio controls preload="metadata" src="${e(src)}">${e(file.name)}</audio>`;
    if (src && file.type === 'application/pdf') return `<a class="chat-file-card" href="${e(src)}" target="_blank" rel="noopener noreferrer">${icon('book')}<span><strong>${e(file.name)}</strong><small>PDF · open preview</small></span>${icon('arrow')}</a>`;
    if (src) return `<a class="chat-file-card" href="${e(src)}" download="${e(file.name)}">${icon('book')}<span><strong>${e(file.name)}</strong><small>${Math.ceil(file.size / 1024)} KB · local file preview</small></span>${icon('arrow')}</a>`;
    return `<div class="chat-file-card">${icon('book')}<span><strong>${e(file.name)}</strong><small>${src ? `${Math.ceil(file.size / 1024)} KB · local preview` : 'Local file is not stored in this preview'}</small></span></div>`;
  }).join('')}</div>`;
}

function relatedItemInfo(item) {
  if (item.type === 'context') {
    const context = contextFor(item.id);
    const owner = events.find(event => event.id === context.workshopId);
    return { title: context.title, owner, href: `${eventUrl(owner)}room/?context=${encodeURIComponent(item.id)}#workbench` };
  }
  if (item.type === 'thread') {
    const target = state.threads.find(thread => thread.id === item.id);
    if (!target) return null;
    const ownerId = contextFor(target.contextId).workshopId;
    const owner = events.find(event => event.id === ownerId);
    return { title: `Discussion: ${target.title || target.body.slice(0, 70)}`, owner, href: `${eventUrl(owner)}room/?thread=${encodeURIComponent(target.id)}#workbench` };
  }
  if (item.type === 'question') {
    const target = state.questions.find(question => question.id === item.id);
    if (!target) return null;
    const ownerId = contextFor(target.contextId).workshopId;
    const owner = events.find(event => event.id === ownerId);
    return { title: `Question: ${target.body.slice(0, 70)}`, owner, href: `${eventUrl(owner)}room/?question=${encodeURIComponent(target.id)}#questions` };
  }
  if (item.type === 'submission') {
    const target = state.submissions.find(submission => submission.id === item.id);
    if (!target) return null;
    const ownerId = challengeFor(target.challengeId).workshopId;
    const owner = events.find(event => event.id === ownerId);
    return { title: `Creation: ${target.title}`, owner, href: `${eventUrl(owner)}room/?submission=${encodeURIComponent(target.id)}#challenge` };
  }
  return null;
}

function relatedContextLinks(thread) {
  const refs = [...(thread.relatedContextIds || []).map(id => ({ type: 'context', id })), ...(thread.relatedItems || [])];
  const items = refs.map(relatedItemInfo).filter(Boolean);
  if (!items.length) return '';
  return `<div class="related-context-links"><span>Related</span>${items.map(item => `<a href="${e(item.href)}">${e(item.title)}${item.owner.id !== selectedEvent.id ? ' · another room' : ''}</a>`).join('')}</div>`;
}

function chatMessage(item, { rootMessage = false } = {}) {
  const rendered = messageLinkPreview(item.body);
  return `<article class="chat-message ${rootMessage ? 'chat-message-root' : ''}"><div class="person-line">${person(item.author)}<div><strong>${e(item.author)}</strong><span class="muted small">${rootMessage ? e(contributionKinds[item.kind] || 'Message') : 'Reply'}</span></div>${rootMessage ? tag('Contextual', 'teal') : ''}</div>${rootMessage && item.title ? `<h2 class="chat-message-title">${e(item.title)}</h2>` : ''}${rendered.bodyHtml ? `<p class="chat-message-body">${rendered.bodyHtml}</p>` : ''}${rendered.preview}${renderAttachments(item)}</article>`;
}

function chatComposer(formId, { replyTo = '', contextId = selectedEvent.id } = {}) {
  const replyThread = replyTo ? state.threads.find(thread => thread.id === replyTo) : null;
  const related = (relatedByComposer.get(formId) || []).map(item => `<span>${e(relatedItemInfo(item)?.title || item.id)}<button type="button" data-action="remove-related" data-form="${e(formId)}" data-related-type="${e(item.type)}" data-id="${e(item.id)}" aria-label="Remove related topic">×</button></span>`).join('');
  const files = (pendingUploads.get(formId) || []).map((file, index) => `<span>${e(file.name)}<button type="button" data-action="remove-upload" data-form="${e(formId)}" data-index="${index}" aria-label="Remove ${e(file.name)}">×</button></span>`).join('');
  return `<form id="${e(formId)}" class="chat-composer composer ${replyTo ? 'chat-reply-composer' : ''}" data-chat-form="${replyTo ? 'reply' : 'new'}" ${replyTo ? `data-reply-to="${e(replyTo)}"` : ''} data-dropzone><label class="sr-only" for="${e(formId)}-body">${replyTo ? 'Write a reply' : 'Write a message'}</label><div class="chat-composer-context"><span>${replyTo ? `Replying in ${e(replyThread?.title || 'this conversation')}` : 'Post to this event room'}</span>${!replyTo ? `<label class="chat-kind-select"><span class="sr-only">Message type</span><select name="kind">${Object.entries(contributionKinds).map(([key, label]) => `<option value="${key}">${e(label)}</option>`).join('')}</select></label><label class="chat-kind-select"><span class="sr-only">Message context</span><select name="contextId">${contextOptions().replace(`value="${contextId}"`, `value="${contextId}" selected`)}</select></label>` : ''}<button class="icon-button chat-emoji-button" type="button" data-action="emoji" data-form="${e(formId)}" aria-label="Choose emoji" title="Choose emoji">☺</button><label class="icon-button chat-file-button" title="Attach files">＋<span class="sr-only">Attach files</span><input type="file" data-chat-files="${e(formId)}" accept="image/*,video/mp4,video/webm,application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,audio/*" multiple></label></div><div class="chat-drop-hint">Drop a file here, or use ＋ to attach documents, images and videos</div><div class="chat-pending-files" data-pending-files="${e(formId)}" ${files ? '' : 'hidden'}>${files}</div><div class="chat-related-suggestion" data-related-suggestion="${e(formId)}" hidden></div><div class="chat-mention-suggestion" data-mention-suggestion="${e(formId)}" hidden></div><div class="chat-related-chips" data-related-chips="${e(formId)}">${related}</div><div class="chat-emoji-picker" data-emoji-picker="${e(formId)}" hidden></div><div class="composer-row"><textarea id="${e(formId)}-body" name="body" rows="2" maxlength="2000" required placeholder="${replyTo ? 'Write a reply… use @ to tag the trainer' : 'Share an idea, ask for help or post what you made…'}"></textarea><button class="icon-button primary" type="submit" title="Send message" aria-label="Send message">${icon('send')}</button></div><p class="form-error" role="alert" hidden></p><span class="muted small">${serverIdentity?.id ? 'Messages are shared with participants in this event room.' : 'Sign in and join the Studio to share messages with this event room.'}</span></form>`;
}

function threadCard(thread) {
  const expanded = expandedThreads.has(thread.id);
  const replies = thread.replies || [];
  const visibleReplies = expanded ? replies : replies.slice(0, 2);
  const isLiked = state.threadHearts.includes(thread.id);
  const heartCount = (thread.hearts || 0) + Number(isLiked);
  const realThread = !String(thread.id).startsWith('demo-');
  const moderation = realThread && canModerateEvent()
    ? '<button class="text-button moderation-action" data-action="moderate-thread" data-id="' + e(thread.id) + '">Hide conversation</button>'
    : '';
  const replyMarkup = replies.length
    ? '<div class="chat-replies" aria-label="Replies to ' + e(thread.title) + '">' +
      visibleReplies.map(reply => chatMessage(reply) +
        (realThread && canModerateEvent() ? '<button class="text-button moderation-action" data-action="moderate-reply" data-id="' + e(reply.id) + '">Hide reply</button>' : '')
      ).join('') +
      (replies.length > 2 ? '<button class="read-replies" data-action="read-replies" data-id="' + e(thread.id) + '">' +
        (expanded ? 'Show fewer replies' : 'Read ' + (replies.length - 2) + ' more ' + (replies.length - 2 === 1 ? 'reply' : 'replies')) + '</button>' : '') +
      '</div>'
    : '';
  return '<article class="thread-card" id="thread-' + e(thread.id) + '" data-thread-id="' + e(thread.id) + '">' +
    chatMessage(thread, { rootMessage: true }) + relatedContextLinks(thread) +
    '<div class="thread-footer"><button class="heart-button ' + (isLiked ? 'is-liked' : '') +
    '" data-action="heart" data-id="' + e(thread.id) + '" aria-pressed="' + isLiked + '" aria-label="' +
    (isLiked ? 'Remove heart' : 'Heart') + ' this message, ' + heartCount + ' hearts">' + icon('heart') +
    '<span>' + heartCount + '</span></button><button class="text-link" data-action="reply-compose" data-id="' +
    e(thread.id) + '">' + icon('chat') + ' ' + replies.length + ' ' + (replies.length === 1 ? 'reply' : 'replies') +
    '</button><button class="text-link" data-action="share-thread" data-id="' + e(thread.id) +
    '" aria-label="Share this event with someone">' + icon('share') + ' Share</button>' + moderation + '</div>' +
    replyMarkup + (openReplyForms.has(thread.id) ? chatComposer('reply-' + thread.id, { replyTo: thread.id }) : '') + '</article>';
}

function renderRelatedContextSuggestion(form, body) {
  const holder = form.querySelector('[data-related-suggestion]');
  if (!holder || form.dataset.chatForm !== 'new') return;
  const stop = new Set(['about', 'after', 'again', 'also', 'and', 'are', 'can', 'could', 'for', 'from', 'have', 'help', 'into', 'just', 'like', 'make', 'need', 'our', 'that', 'the', 'this', 'with', 'would', 'your']);
  const words = new Set((body.toLowerCase().match(/[a-z]{3,}/g) || []).filter(word => !stop.has(word)));
  const contexts = [...events, ...challenges, ...allResources].map(item => ({ type: 'context', id: item.id, title: contextFor(item.id).title, topic: contextFor(item.id).topic, workshopId: contextFor(item.id).workshopId, search: contextFor(item.id).title }));
  const discussions = state.threads.map(item => ({ type: 'thread', id: item.id, title: item.title || item.body.slice(0, 70), topic: contextFor(item.contextId).topic, workshopId: contextFor(item.contextId).workshopId, search: `${item.title} ${item.body}` }));
  const questions = state.questions.map(item => ({ type: 'question', id: item.id, title: item.body.slice(0, 70), topic: contextFor(item.contextId).topic, workshopId: contextFor(item.contextId).workshopId, search: item.body }));
  const submissions = state.submissions.map(item => ({ type: 'submission', id: item.id, title: item.title, topic: contextFor(item.challengeId).topic, workshopId: contextFor(item.challengeId).workshopId, search: `${item.title} ${item.description}` }));
  const selectedContext = form.elements.namedItem('contextId')?.value;
  const existingLinks = relatedByComposer.get(form.id) || [];
  const ranked = [...contexts, ...discussions, ...questions, ...submissions].filter(item => !(item.type === 'context' && item.id === selectedContext) && !existingLinks.some(link => link.type === item.type && link.id === item.id)).map(item => {
    const itemWords = new Set(item.search.toLowerCase().match(/[a-z]{3,}/g) || []);
    return { item, score: [...words].filter(word => itemWords.has(word) || (item.topic || '').toLowerCase().includes(word)).length };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);
  const match = ranked[0];
  if (!match || words.size < 2) { holder.hidden = true; holder.innerHTML = ''; return; }
  const owner = events.find(event => event.id === match.item.workshopId);
  const elsewhere = owner.id !== selectedEvent.id;
  const title = match.item.type === 'context' ? match.item.title : `${match.item.type === 'thread' ? 'a discussion' : match.item.type === 'question' ? 'a question' : 'a creation'}: ${match.item.title}`;
  holder.innerHTML = `<span>${elsewhere ? `This may connect to ${title} in <strong>${e(owner.title)}</strong>.` : `This may connect to ${title}.`}</span><button type="button" data-action="add-related" data-form="${e(form.id)}" data-related-type="${e(match.item.type)}" data-id="${e(match.item.id)}">Add link</button>`;
  holder.hidden = false;
}

function renderChatMentions(form, body) {
  const holder = form.querySelector('[data-mention-suggestion]');
  if (!holder) return;
  if (!/(^|\s)@[\w-]*$/.test(body)) { holder.hidden = true; holder.innerHTML = ''; return; }
  holder.innerHTML = `<button type="button" data-action="mention-trainer" data-form="${e(form.id)}">Tag ${e(selectedEvent.trainer)} · assigned trainer for this event</button>`;
  holder.hidden = false;
}

function renderPendingUploads(formId) {
  const holder = document.querySelector(`[data-pending-files="${CSS.escape(formId)}"]`);
  const files = pendingUploads.get(formId) || [];
  if (!holder) return;
  holder.hidden = !files.length;
  holder.innerHTML = files.map((file, index) => `<span>${e(file.name)}<button type="button" data-action="remove-upload" data-form="${e(formId)}" data-index="${index}" aria-label="Remove ${e(file.name)}">×</button></span>`).join('');
}

function addPendingUploads(formId, files) {
  const accepted = [];
  for (const file of files) {
    const allowed = file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/') || file.type === 'application/pdf' || /\.(docx?|pptx?|xlsx?)$/i.test(file.name);
    if (!allowed || file.size > 30 * 1024 * 1024) { notify(`${file.name} was skipped. Attach a document, image, audio or video file under 30 MB.`); continue; }
    accepted.push(file);
  }
  const existing = pendingUploads.get(formId) || [];
  pendingUploads.set(formId, [...existing, ...accepted].slice(0, 8));
  renderPendingUploads(formId);
}

function storeChatAttachments(formId) {
  const files = pendingUploads.get(formId) || [];
  const attachments = files.map(file => {
    const attachmentId = crypto.randomUUID();
    chatObjectUrls.set(attachmentId, URL.createObjectURL(file));
    return { id: attachmentId, name: file.name, type: file.type || 'application/octet-stream', size: file.size };
  });
  pendingUploads.delete(formId);
  return attachments;
}

async function toggleEmojiPicker(formId) {
  const holder = document.querySelector(`[data-emoji-picker="${CSS.escape(formId)}"]`);
  if (!holder) return;
  if (!holder.hidden) { holder.hidden = true; return; }
  holder.hidden = false;
  try {
    emojiModulePromise ||= import('https://cdn.jsdelivr.net/npm/emoji-picker-element@1.29.1/index.js');
    await emojiModulePromise;
    if (!holder.querySelector('emoji-picker')) holder.innerHTML = '<emoji-picker locale="en" aria-label="Choose an emoji"></emoji-picker>';
    const picker = holder.querySelector('emoji-picker');
    if (picker.dataset.studioListener !== 'true') {
      picker.dataset.studioListener = 'true';
      picker.addEventListener('emoji-click', event => {
        const field = document.querySelector(`#${CSS.escape(formId)}-body`);
        if (!field) return;
        field.setRangeText(event.detail.unicode, field.selectionStart, field.selectionEnd, 'end');
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.focus();
        holder.hidden = true;
      });
    }
  } catch {
    holder.innerHTML = `<div class="emoji-fallback" aria-label="Quick emoji">${['😀', '🎉', '❤️', '👏', '💡', '🙌', '🤔', '✅', '✨', '👀'].map(value => `<button type="button" data-action="insert-emoji" data-form="${e(formId)}" data-emoji="${value}" aria-label="Insert ${value}">${value}</button>`).join('')}</div><p>Emoji picker could not load. Use these quick reactions.</p>`;
  }
}

function setTheme(value) {
  theme = value;
  document.body.dataset.studioTheme = value;
  try { localStorage.setItem(themeKey, value); } catch { /* Theme still applies for this visit. */ }
  const toggle = document.querySelector('[data-action="theme"]');
  if (toggle) {
    toggle.innerHTML = `${theme === 'dark' ? '☀' : '◐'}<span>${theme === 'dark' ? 'Light' : 'Dark'}</span>`;
    toggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
  }
}

function renderStudio() {
  const contextRail = `<div class="eyebrow">Event context</div><div class="tags">${tag(selectedEvent.subject)}${tag(selectedEvent.topic)}${tag(selectedEvent.level)}</div><div class="person-line">${person(selectedEvent.trainer)}<div><strong>${e(selectedEvent.trainer)}</strong><span class="muted small">Assigned trainer</span></div></div><hr>${phaseControl()}<hr><p class="muted small">Shared posts sync after verified sign-in. Sample items remain local; file uploads and external link previews are not connected yet.</p>`;
  return appShell({ view: 'my-events', eventContext: selectedEvent, content: `<div id="panel">${renderPanel()}</div>`, contextRail, mainClass: 'room-main' });
}

function panelHeading(title, description, action = '') {
  return `<div class="panel-heading"><div><div class="eyebrow">${e(selectedEvent.title)} / ${e(selectedEvent.topic)}</div><h1 tabindex="-1">${title}</h1><p class="muted">${description}</p></div>${action}</div>`;
}

function questionCard(question) {
  const realQuestion = !String(question.id).startsWith('demo-');
  const answerForm = realQuestion && canAnswerEvent() && !question.answer
    ? '<form class="trainer-answer-form" data-studio-action="question.answer" data-id="' + e(question.id) + '"><label>Trainer answer<textarea name="answer" rows="2" maxlength="2000" required></textarea></label><button class="button secondary" type="submit">Post answer</button></form>'
    : '';
  const moderation = realQuestion && canModerateEvent()
    ? '<button type="button" class="text-button moderation-action" data-action="moderate-question" data-id="' + e(question.id) + '">Hide question</button>'
    : '';
  return '<article class="question-card" id="question-' + e(question.id) + '"><div class="question-body"><div class="person-line">' +
    person(question.author) + '<div><strong>' + e(question.author) + '</strong><span class="muted small">' +
    e(contextFor(question.contextId).title) + '</span></div>' + (question.answer ? tag('Answered', 'teal') : tag('Open')) +
    '</div><p>' + e(question.body) + '</p>' +
    (question.answer ? '<div class="trainer-answer"><span class="eyebrow">Trainer answer</span><p>' + e(question.answer) + '</p></div>' : '') +
    '<button type="button" class="vote-button" data-action="vote" data-id="' + e(question.id) + '" aria-pressed="' +
    state.votes.includes(question.id) + '" aria-label="I want this answered too: ' + e(question.body) + '">' +
    icon('up') + '<strong>' + voteCount(state, question) + '</strong><span>I want this answered too</span></button>' +
    answerForm + moderation + '</div></article>';
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
      return `${panelHeading('The build challenge', 'A small, useful step from learning to creating.')}<section class="challenge-brief"><span class="challenge-number">01</span><div>${tag('Build', 'teal')}<h2>${e(selectedChallenge.title)}</h2><p>${e(selectedChallenge.description)}</p><p class="muted">${e(selectedEvent.output)}</p>${button(joined ? `${icon('check')} Taking part (demo)` : `${icon('plus')} I'll take part`, 'join-challenge', `aria-pressed="${joined}"`, 'button primary')}</div></section><section class="section-block"><h2>Share your version</h2><p class="muted">For this preview, submit a Wistudi Flow or other secure HTTPS link. File uploads, link metadata previews and public publishing are not connected.</p><form id="submission-form" class="stack-form"><label>Creation title<input name="title" maxlength="120" placeholder="Give your activity a name" required></label><label>What did you create?<textarea name="description" maxlength="2000" rows="3" required></textarea></label><label>Wistudi content or creation link<input type="text" inputmode="url" name="url" placeholder="https://..." required></label><label>What would you like help with? <span class="muted">(optional)</span><textarea name="help" maxlength="1000" rows="2"></textarea></label><p class="form-error" role="alert" hidden></p><div class="actions"><button class="button primary" type="submit">Submit demo creation ${icon('arrow')}</button><span class="muted small">Saved in this browser only</span></div></form></section><section class="section-block"><h2>Your work in this room</h2>${submissions.length ? submissions.map(item => `<article class="submission-card" id="submission-${e(item.id)}">${tag(item.moderationStatus === 'approved' ? 'Approved' : item.moderationStatus === 'rejected' ? 'Needs changes' : 'Pending review')}<h3>${e(item.title)}</h3><p>${e(item.description)}</p>${item.help ? `<p class="muted">Feedback requested: ${e(item.help)}</p>` : ''}<a class="text-link" href="${e(item.url)}" target="_blank" rel="noopener noreferrer nofollow">Open submitted link ${icon('arrow')}</a>${canModerateEvent() && !String(item.id).startsWith('demo-') && item.moderationStatus === 'pending' ? `<div class="identity-inline-actions"><button class="button secondary" data-action="review-submission" data-id="${e(item.id)}" data-status="approved">Approve</button><button class="button secondary" data-action="review-submission" data-id="${e(item.id)}" data-status="rejected">Request changes</button></div>` : ''}</article>`).join('') : '<div class="empty-state"><p>Share a work-in-progress for feedback. Public showcase approval is a separate step.</p></div>'}</section>`;
    case 'workbench': {
      const threads = state.threads.filter(item => contextFor(item.contextId).workshopId === selectedEvent.id).filter(item => threadFilter === 'all' || item.kind === threadFilter);
      const roomControls = state.eventControls[selectedEvent.id] || { roomOpen: true, features: { chat: true } };
      return `${panelHeading('Event chat', 'Talk about the work in this room. Every conversation stays connected to its event, challenge or resource.')}<div class="chat-room-status"><span><i></i> ${roomControls.roomOpen ? 'Room open' : 'Room closed · read-only'}</span><span>${threads.length} conversations</span><span>After the event, the room stays available until its owner closes it.</span></div><label class="filter-select">Show<select id="thread-filter"><option value="all">All conversations</option>${Object.entries(contributionKinds).map(([key, label]) => `<option value="${key}" ${threadFilter === key ? 'selected' : ''}>${e(label)}</option>`).join('')}</select></label><div class="thread-list chat-timeline">${threads.map(threadCard).join('') || '<div class="empty-state"><h2>Start the conversation</h2><p>Share a teaching idea, ask for help or show what you are making.</p></div>'}</div>${roomControls.roomOpen && roomControls.features?.chat !== false ? chatComposer('thread-form') : '<div class="notice">The event team has made this room read-only or turned chat off.</div>'}`;
    }
    case 'resources':
      return `${panelHeading('Event resources', 'Files, links and instructions selected for this event. Availability follows the event schedule.')}<label class="search-label">Search event resources<input type="search" id="resource-search" placeholder="Search event resources" value="${e(resourceFilter)}"></label><div id="resource-results">${filteredResources()}</div><p class="notice">These are sample resources. File uploads, link previews and Wistudi remixing are not connected yet.</p>`;
    default: {
      const hasSubmission = state.submissions.some(item => item.challengeId === selectedChallenge.id);
      const hasJoined = state.joinedChallenges.includes(selectedChallenge.id);
      const step = hasSubmission ? 4 : (hasJoined || selectedPhase() === 'post_session') ? 3 : 2;
      const labels = ['Discover', 'Learn', 'Build', 'Share', 'Publish'];
      const journey = labels.map((label, index) => `<li class="${index + 1 < step ? 'complete' : index + 1 === step ? 'current' : ''}">${label}</li>`).join('');
      return `${panelHeading('Event room', 'Your event details, resources and next steps stay connected here.')}<div class="room-progress"><div class="room-progress-top"><strong>Your publisher journey</strong><span>Step ${step} of 5</span></div><ol class="journey" aria-label="Discover, learn, build, share, publish">${journey}</ol><p class="muted small">Your progress is a guide, not a score. Publishing in Wistudi is optional.</p></div><div class="mobile-phase">${phaseControl()}</div>${phaseContent()}${selectedResources.length ? `<section class="section-block"><div class="section-heading"><h2>Event resources</h2><a class="text-link" href="#resources">View all ${icon('arrow')}</a></div>${resourceRows({ limit: 2 })}</section>` : ''}<section class="section-block"><div class="section-heading"><h2>This event's build challenge</h2>${tag('Build', 'teal')}</div><h3>${e(selectedChallenge.title)}</h3><p class="muted">${e(selectedChallenge.description)}</p><a class="button secondary" href="#challenge">Open challenge ${icon('arrow')}</a></section><section class="section-block"><h2>Share this event</h2><p class="muted">Invite a colleague to register. Room access is given after registration.</p>${button('Share event link', 'share-event', `data-slug="${e(selectedEvent.slug)}"`)}</section>`;
    }
  }
}

function filteredResources() {
  const query = resourceFilter.toLowerCase().trim();
  const items = selectedResources.filter(item => `${item.title} ${item.label} ${resourceIsAvailable(item) ? item.description : ''}`.toLowerCase().includes(query));
  return items.length ? items.map(item => {
    const context = contextFor(item.id);
    const available = resourceIsAvailable(item);
    const timing = phaseLabel[resourcePhase(item)] || phaseLabel.upcoming;
    return `<article class="resource-card ${available ? '' : 'resource-locked'}"><div class="eyebrow">${e(item.label)} / ${e(timing)}</div><h2>${e(item.title)}</h2>${available ? `<p class="muted">${e(item.description)}</p><div class="tags">${tag(context.subject)}${tag(context.topic)}${tag(context.level)}${tag('Sample')}</div><div class="actions">${button('Preview & discuss', 'resource', `data-id="${item.id}"`)}<button class="button secondary" disabled title="Wistudi account connection is planned for a later phase">Remix in Wistudi</button></div>` : `<p class="muted">This resource will appear here ${e(timing.toLowerCase())}.</p><button class="button secondary" disabled>Available ${e(timing.toLowerCase())}</button>`}</article>`;
  }).join('') : '<div class="empty-state"><h2>No event resources</h2><p>The event creator has not added resources for this workshop.</p></div>';
}

const BUILDER_DRAFT_KEY = `${STORAGE_KEY}.event-builder-draft`;

function saveBuilderDraft(form = document.querySelector('#event-builder-form')) {
  if (!form) return false;
  syncKitEditor();
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
    let resources = [];
    try { resources = JSON.parse(values.resourcesJson || '[]'); } catch { /* Ignore damaged resource draft data. */ }
    renderKitEditor(Array.isArray(resources) ? resources : []);
    renderBuilderMediaPreview();
    if (Object.keys(values).length) {
      const status = document.querySelector('#builder-save-status');
      if (status) status.textContent = 'A browser recovery copy is available. Save it as a shared draft to sync it.';
    }
  } catch { /* A damaged preview draft should not prevent the builder opening. */ }
}

function safeHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : '';
  } catch { return ''; }
}

function resourcePreview(resource) {
  const assetUrl = localPreviewUrls.get(`resource:${resource.key}`);
  const externalUrl = safeHttpsUrl(resource.url);
  const extension = resource.fileName?.split('.').pop()?.toLowerCase() || '';
  const media = [];
  if (assetUrl && ['mp4', 'webm'].includes(extension)) media.push(`<video class="resource-preview-video" controls playsinline preload="metadata" src="${e(assetUrl)}"></video>`);
  else if (assetUrl && ['png', 'jpg', 'jpeg', 'webp'].includes(extension)) media.push(`<img class="resource-preview-image" src="${e(assetUrl)}" alt="${e(resource.description || resource.title)}">`);
  else if (assetUrl) media.push(`<a class="resource-link-preview" href="${e(assetUrl)}" target="_blank" rel="noopener noreferrer">Open attached file ${e(resource.title)} ${icon('arrow')}</a>`);
  else if (resource.fileName) media.push(`<p class="muted small">${e(resource.fileName)} was selected in the draft. Reselect it to preview the attachment.</p>`);
  if (externalUrl) {
    const hostname = new URL(externalUrl).hostname;
    media.push(videoEmbed(externalUrl, resource.title) || `<div class="external-resource-preview"><span class="eyebrow">Linked resource / ${e(hostname)}</span><a class="resource-link-preview" href="${e(externalUrl)}" target="_blank" rel="noopener noreferrer">Open ${e(resource.title)} in a new tab ${icon('arrow')}</a></div>`);
  }
  const steps = resource.instructions.split(/\r?\n/).map(step => step.trim()).filter(Boolean);
  return `<article class="event-resource-preview"><div class="eyebrow">${e(resourceTypes[resource.type] || resourceTypes.other)} / ${e(phaseLabel[resource.availableFrom] || phaseLabel.upcoming)}</div><h3>${e(resource.title || 'Untitled resource')}</h3>${resource.description ? `<p class="muted">${e(resource.description)}</p>` : ''}${media.join('')}${steps.length ? `<h4>Instructions</h4><ol>${steps.map(step => `<li>${e(step)}</li>`).join('')}</ol>` : ''}</article>`;
}

function renderSharedDraftList(message = '') {
  const container = document.querySelector('#builder-saved-drafts');
  if (!container) return;
  if (message) {
    container.innerHTML = '<p class="muted small">' + e(message) + '</p>';
    return;
  }
  if (!serverDrafts.length) {
    container.innerHTML = '<p class="muted small">No shared drafts yet. Complete the event details below and save your first one.</p>';
    return;
  }
  container.innerHTML = '<div class="builder-draft-list">' + serverDrafts.map(item => {
    let schedule = 'Schedule not set';
    let updated = 'Recently';
    try {
      schedule = new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium', timeStyle: 'short', timeZone: item.timezone || 'UTC',
      }).format(new Date(item.startsAt));
    } catch { /* Keep the neutral schedule label if a timezone is unavailable. */ }
    try { updated = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(item.updatedAt)); }
    catch { /* Keep a neutral update label. */ }
    return '<article class="builder-draft-row"><div class="builder-draft-copy"><strong>' + e(item.title) +
      '</strong><span>' + e(item.subject) + ' / ' + e(item.topic) + ' · ' + e(schedule) +
      '</span><small>Draft · updated ' + e(updated) +
      '</small></div>' + button('Resume draft', 'load-builder-draft', 'data-id="' + e(item.id) + '"', 'button secondary') + '</article>';
  }).join('') + '</div>';
}

async function loadSharedEventDrafts(force = false) {
  const userId = serverIdentity?.id;
  if (!userId || page !== 'builder' || !canBuildStudioEvents()) return;
  if (!force && sharedDraftsForUser === userId) return sharedDraftsPromise;
  sharedDraftsForUser = userId;
  renderSharedDraftList('Loading shared drafts…');
  sharedDraftsPromise = (async () => {
    try {
      const response = await fetch('/api/publisher-studio/events', {
        method: 'GET', credentials: 'same-origin', headers: { Accept: 'application/json' },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not load shared drafts.');
      serverDrafts = Array.isArray(payload.events) ? payload.events : [];
      renderSharedDraftList();
    } catch (error) {
      sharedDraftsForUser = '';
      renderSharedDraftList(error.message || 'Shared drafts are temporarily unavailable.');
    } finally {
      sharedDraftsPromise = null;
    }
  })();
  return sharedDraftsPromise;
}

function populateSharedDraft(item) {
  const form = document.querySelector('#event-builder-form');
  if (!form) return;
  for (const key of ['bannerImage', 'cardImage', 'mobileCardImage', 'promoVideoFile']) {
    const previous = localPreviewUrls.get(key);
    if (previous) URL.revokeObjectURL(previous);
    localPreviewUrls.delete(key);
  }
  for (const [key, url] of [...localPreviewUrls]) {
    if (key.startsWith('resource:')) { URL.revokeObjectURL(url); localPreviewUrls.delete(key); }
  }
  form.querySelectorAll('[data-media-file]').forEach(input => { input.value = ''; });
  const values = {
    eventId: item.id,
    title: item.title,
    summary: item.summary,
    subject: item.subject,
    topic: item.topic,
    level: item.level,
    audience: item.audience,
    learningOutcomes: (item.learningOutcomes || []).join('\n'),
    output: item.output,
    startsAt: item.startsAtLocal,
    timezone: item.timezone,
    duration: String(item.duration),
    trainer: item.trainer,
    zoomUrl: item.zoomUrl,
    promoVideoUrl: item.promoVideoUrl,
    imageAlt: item.imageAlt,
    discussionPrompt: item.discussionPrompt,
    challengeTitle: item.challengeTitle,
    challengeBrief: item.challengeBrief,
    wistudiLink: item.wistudiLink,
  };
  for (const [name, value] of Object.entries(values)) {
    const field = form.elements.namedItem(name);
    if (field && field.type !== 'file' && typeof value === 'string') field.value = value;
  }
  renderKitEditor((item.resources || []).map(resource => ({ ...resource, key: resource.key })));
  renderBuilderMediaPreview();
  saveBuilderDraft(form);
  const status = document.querySelector('#builder-save-status');
  if (status) status.textContent = 'Shared draft loaded. Re-select any files you need to preview; uploaded files are not stored yet.';
  form.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

async function saveSharedEventDraft(form) {
  if (!serverIdentity?.id || !canBuildStudioEvents()) {
    throw new Error('Sign in with an Event Builder, Studio Admin or Wistudi Super Admin account.');
  }
  syncKitEditor();
  const values = Object.fromEntries([...new FormData(form)].filter(([, value]) => typeof value === 'string'));
  const payload = {
    ...values,
    duration: Number(values.duration),
    learningOutcomes: String(values.learningOutcomes || '').split(/\r?\n/).map(item => item.trim()).filter(Boolean),
    resources: readKitEditor(),
  };
  saveBuilderDraft(form);
  const response = await fetch('/api/publisher-studio/events', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  let result = {};
  try { result = await response.json(); } catch { /* Report the HTTP status below. */ }
  if (!response.ok) throw new Error(result.error || 'Shared event draft could not be saved.');
  const saved = result.event;
  if (!saved?.id) throw new Error('The server did not return the saved event draft.');
  const idField = form.elements.namedItem('eventId');
  if (idField) idField.value = saved.id;
  serverDrafts = Array.isArray(result.events) ? result.events : [saved];
  sharedDraftsForUser = serverIdentity.id;
  renderSharedDraftList();
  renderKitEditor((saved.resources || []).map(resource => ({ ...resource, key: resource.key })));
  return saved;
}

function previewBuilder() {
  const form = document.querySelector('#event-builder-form');
  if (!form) return;
  syncKitEditor();
  const data = Object.fromEntries([...new FormData(form)].filter(([, value]) => typeof value === 'string'));
  const resources = readKitEditor().filter(item => item.title.trim());
  const publicResources = resources.filter(item => item.availableFrom === 'upcoming' && item.publicPreview);
  const roomResources = resources.filter(item => item.availableFrom !== 'upcoming' || !item.publicPreview);
  const title = data.title?.trim() || 'Your event title';
  const output = data.output?.trim() || 'Add the outcome participants will create.';
  const outcomes = (data.learningOutcomes || '').split(/\r?\n/).map(item => item.trim()).filter(Boolean);
  const banner = localPreviewUrls.get('bannerImage');
  const card = localPreviewUrls.get('cardImage');
  const mobileCard = localPreviewUrls.get('mobileCardImage');
  const promoFile = localPreviewUrls.get('promoVideoFile');
  const promoLink = safeHttpsUrl(data.promoVideoUrl || '');
  const promo = promoFile ? `<video class="preview-promo-video" controls playsinline preload="metadata" src="${e(promoFile)}"></video>` : promoLink ? videoEmbed(promoLink, `${title} event promotion video`) || `<a class="resource-link-preview" href="${e(promoLink)}" target="_blank" rel="noopener noreferrer">Open event video link ${icon('arrow')}</a>` : '';
  const publicBlock = publicResources.length ? `<section class="event-preview-section"><div class="eyebrow">Available before the event</div><h3>Event resources</h3>${publicResources.map(resourcePreview).join('')}</section>` : '';
  const roomBlock = roomResources.length ? `<section class="event-preview-section"><div class="eyebrow">Participant room</div><h3>Resources available to registered participants</h3>${roomResources.map(resourcePreview).join('')}</section>` : '';
  dialogMode = 'builder-preview';
  modal('Event page and mobile card preview', `<div class="dialog-content"><div class="event-preview-layout"><div class="event-preview-card"><div class="eyebrow">${e(data.subject || 'Subject')} Publisher Studio / ${e(data.topic || 'Topic')}</div><h2>${e(title)}</h2><p class="muted">${e(data.summary || 'Your event description will appear here.')}</p>${banner ? `<img class="preview-banner" src="${e(banner)}" alt="${e(data.imageAlt || 'Event banner preview')}">` : ''}${promo ? `<div class="preview-promo">${promo}</div>` : ''}<div class="event-facts"><div><span class="muted small">Time</span><strong>${e(data.startsAt || 'Add a date and time')} / ${e(data.timezone || 'Choose a timezone')}</strong></div><div><span class="muted small">Trainer</span><strong>${e(data.trainer || 'Assign a trainer')}</strong></div></div><section class="event-preview-section"><div class="eyebrow">Learning outcomes</div>${outcomes.length ? `<ul>${outcomes.map(outcome => `<li>${e(outcome)}</li>`).join('')}</ul>` : '<p class="muted">Add learning outcomes to show what participants will be able to do.</p>'}<div class="event-next-step"><div class="eyebrow">You'll make</div><p>${e(output)}</p></div></section>${publicBlock}<div class="event-next-step"><div class="eyebrow">Event room</div><strong>${e(data.challengeTitle || 'Add a build challenge')}</strong><p>${e(data.challengeBrief || 'The challenge appears here with resources and discussion.')}</p></div><p class="notice">Local preview only. It has not been published or shared.</p></div><aside class="event-mobile-preview"><div class="eyebrow">Event listing card / mobile layout</div><div class="mobile-event-card">${mobileCard ? `<img src="${e(mobileCard)}" alt="${e(data.imageAlt || 'Mobile event card crop')}">` : card ? `<img src="${e(card)}" alt="${e(data.imageAlt || 'Event card preview')}">` : '<div class="event-art-placeholder"><span>Wistudi Publisher Studio</span><strong>Event card</strong></div>'}<div class="mobile-event-card-body"><span class="eyebrow">${e(data.subject || 'Subject')} / ${e(data.topic || 'Topic')}</span><h3>${e(title)}</h3><p>${e(data.startsAt || 'Date and time shown here')}</p><p class="mobile-event-output"><strong>You'll make</strong> ${e(output)}</p><div class="mobile-card-actions"><span>View event</span><span>Share</span></div></div></div><p class="muted small">The mobile event card stays horizontal. Its left-side image uses a narrow portrait crop. Add a separate mobile image if center-cropping cuts off important content.</p></aside></div>${roomBlock}</div>`);
}

function previewLocalFile(field, key, kinds, maxBytes, message) {
  const file = field.files?.[0];
  const previous = localPreviewUrls.get(key);
  if (previous) URL.revokeObjectURL(previous);
  localPreviewUrls.delete(key);
  if (!file) { renderBuilderMediaPreview(); return; }
  if (!kinds.includes(file.type) || file.size > maxBytes) {
    field.value = ''; notify(message); renderBuilderMediaPreview(); return;
  }
  localPreviewUrls.set(key, URL.createObjectURL(file));
  renderBuilderMediaPreview();
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

function renderBuilderDenied() {
  return appShell({
    view: 'home',
    crumb: 'Event builder',
    content: '<section class="access-required"><div class="eyebrow">Event builder</div><h1>Event builder access is assigned by Wistudi</h1><p class="lead">Sign in with the email address assigned as a Wistudi Super Admin, Studio Admin or Event Builder. Event creation access is scoped to those roles.</p><p class="notice">Shared event drafts save to the Publisher Studio database. Uploaded media, public event publishing, registration and team invitations still need their later integrations.</p></section>',
  });
}

function render(focus = false) {
  root.innerHTML = page === 'studio' ? renderStudio() : page === 'event' ? renderEvent() : page === 'builder' ? (canBuildStudioEvents() ? renderBuilder() : renderBuilderDenied()) : studioView === 'calendar' ? renderCalendar() : renderHome();
  document.title = page === 'event'
    ? `${selectedEvent.title} | Wistudi Publisher Studio`
    : page === 'builder'
      ? 'Build an event | Wistudi Publisher Studio'
      : page === 'studio'
        ? `${selectedEvent.title} · ${tabs.find(([key]) => key === activeTab())?.[1] || 'Room'} | Wistudi Publisher Studio`
        : `${studioView === 'discover' ? 'Discover events' : studioView === 'my-events' ? 'My events' : studioView === 'calendar' ? 'Calendar' : 'Home'} | Wistudi Publisher Studio`;
  document.body.dataset.studioTheme = theme;
  document.body.dataset.studioView = studioView;
  restoreDrafts();
  if (page === 'builder') { restoreBuilderDraft(); if (canBuildStudioEvents()) loadSharedEventDrafts(); }
  if (page === 'studio') {
    const params = new URLSearchParams(location.search);
    const contextId = params.get('context');
    const selector = document.querySelector('#thread-form [name="contextId"]');
    if (contextId && selector && [...selector.options].some(option => option.value === contextId)) {
      selector.value = contextId;
      history.replaceState(history.state, '', `${location.pathname}${location.hash}`);
    }
    const target = params.get('thread') || params.get('question') || params.get('submission');
    const targetType = params.has('thread') ? 'thread' : params.has('question') ? 'question' : 'submission';
    if (target) {
      const element = document.getElementById(`${targetType}-${target}`);
      if (element) {
        setTimeout(() => element.scrollIntoView({ block: 'center', behavior: 'smooth' }), 80);
        history.replaceState(history.state, '', `${location.pathname}${location.hash}`);
      }
    }
  }
  if (focus) document.querySelector('.panel-heading h1, #main h1')?.focus({ preventScroll: true });
}

function modal(title, body, kind = '') {
  dialog.className = kind;
  dialog.innerHTML = `<div class="dialog-header"><h2 id="dialog-title">${e(title)}</h2><button class="icon-button" data-action="close" title="Close" aria-label="Close">${icon('close')}</button></div>${body}`;
  restoreDrafts(dialog);
  if (!dialog.open) dialog.showModal();
}

function openResource(id) {
  const resource = selectedResources.find(item => item.id === id);
  if (!resource || !resourceIsAvailable(resource)) return;
  const context = contextFor(id);
  dialogMode = 'resource';
  modal(resource.title, `<div class="dialog-content"><div class="tags">${tag(resource.label, 'teal')}${tag(context.subject)}${tag(context.topic)}${tag(context.level)}${tag('Sample resource')}</div><p class="muted">${e(resource.description)}</p><div class="resource-outline">${resource.sections.map(([title, body], index) => `<section><span class="outline-number">0${index + 1}</span><div><h3>${e(title)}</h3><p>${e(body)}</p></div></section>`).join('')}</div>${button(`Discuss this ${e(resource.type)} in event chat`, 'discuss-resource', `data-context-id="${e(id)}"`, 'button primary')}</div>`);
}

function openPublicResource(id) {
  const resource = selectedResources.find(item => item.id === id);
  if (!resource || resourcePhase(resource) !== 'upcoming' || resource.publicPreview !== true) return;
  const externalUrl = safeHttpsUrl(resource.url || '');
  const externalPreview = externalUrl ? videoEmbed(externalUrl, resource.title) || `<a class="resource-link-preview" href="${e(externalUrl)}" target="_blank" rel="noopener noreferrer">Open ${e(resource.title)} in a new tab ${icon('arrow')}</a>` : '';
  const sections = Array.isArray(resource.sections) ? resource.sections : [];
  modal(resource.title, `<div class="dialog-content"><div class="tags">${tag(resource.label, 'teal')}${tag('Available before the event')}</div><p class="muted">${e(resource.description)}</p>${externalPreview}${sections.length ? `<div class="resource-outline">${sections.map(([title, body], index) => `<section><span class="outline-number">0${index + 1}</span><div><h3>${e(title)}</h3><p>${e(body)}</p></div></section>`).join('')}</div>` : ''}<p class="notice">You can discuss and adapt this resource in the participant room after registering.</p></div>`);
}

document.addEventListener('click', async event => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const { action, id, value } = target.dataset;
  const calendarResult = handleCalendarClick(target, state.calendar);
  if (calendarResult) {
    if (action === 'calendar-close-panel') {
      drafts.delete('calendar-event-form');
      drafts.delete('calendar-availability-form');
    }
    persist();
    render();
    if (calendarResult.message) notify(calendarResult.message);
    return;
  }
  if (action === 'moderate-question') mirrorRemote('question.hide', { questionId: id }, 'Question hidden from this event room.');
  if (action === 'moderate-thread') mirrorRemote('thread.hide', { threadId: id }, 'Conversation hidden from this event room.');
  if (action === 'moderate-reply') mirrorRemote('reply.hide', { replyId: id }, 'Reply hidden from this event room.');
  if (action === 'review-submission') mirrorRemote('submission.review', { submissionId: id, status: target.dataset.status, note: '' }, target.dataset.status === 'approved' ? 'Creation approved for this event.' : 'Changes requested for this creation.');
  if (action === 'resource') openResource(id);
  if (action === 'public-resource') openPublicResource(id);
  if (action === 'new-thread') document.querySelector('#thread-form-body')?.focus({ preventScroll: false });
  if (action === 'theme') setTheme(theme === 'dark' ? 'light' : 'dark');
  if (action === 'emoji') toggleEmojiPicker(target.dataset.form);
  if (action === 'add-related') {
    const composerId = target.dataset.form;
    const ids = relatedByComposer.get(composerId) || [];
    const item = { type: target.dataset.relatedType, id: target.dataset.id };
    if (!ids.some(link => link.type === item.type && link.id === item.id)) relatedByComposer.set(composerId, [...ids, item]);
    const details = relatedItemInfo(item);
    const chips = document.querySelector(`[data-related-chips="${CSS.escape(composerId)}"]`);
    if (chips) chips.innerHTML = (relatedByComposer.get(composerId) || []).map(link => `<span>${e(relatedItemInfo(link)?.title || link.id)}<button type="button" data-action="remove-related" data-form="${e(composerId)}" data-related-type="${e(link.type)}" data-id="${e(link.id)}" aria-label="Remove related topic">×</button></span>`).join('');
    const holder = target.closest('[data-related-suggestion]'); if (holder) holder.hidden = true;
    notify(details?.owner.id === selectedEvent.id ? 'Related item linked to this message.' : 'Related room item linked. Its content remains access-controlled.');
  }
  if (action === 'remove-related') {
    const composerId = target.dataset.form;
    relatedByComposer.set(composerId, (relatedByComposer.get(composerId) || []).filter(link => link.type !== target.dataset.relatedType || link.id !== target.dataset.id));
    const form = document.getElementById(composerId);
    const chips = form?.querySelector('[data-related-chips]');
    if (chips) chips.innerHTML = (relatedByComposer.get(composerId) || []).map(link => `<span>${e(relatedItemInfo(link)?.title || link.id)}<button type="button" data-action="remove-related" data-form="${e(composerId)}" data-related-type="${e(link.type)}" data-id="${e(link.id)}" aria-label="Remove related topic">×</button></span>`).join('');
  }
  if (action === 'mention-trainer') {
    const composerId = target.dataset.form;
    const field = document.querySelector(`#${CSS.escape(composerId)}-body`);
    if (field) { field.value = field.value.replace(/(^|\s)@[\w-]*$/, `$1@${selectedEvent.trainer} `); field.dispatchEvent(new Event('input', { bubbles: true })); field.focus(); }
    target.closest('[data-mention-suggestion]').hidden = true;
  }
  if (action === 'insert-emoji') {
    const composerId = target.dataset.form;
    const field = document.querySelector(`#${CSS.escape(composerId)}-body`);
    if (field) { field.setRangeText(target.dataset.emoji, field.selectionStart, field.selectionEnd, 'end'); field.dispatchEvent(new Event('input', { bubbles: true })); field.focus(); }
  }
  if (action === 'remove-upload') {
    const composerId = target.dataset.form;
    const files = pendingUploads.get(composerId) || [];
    files.splice(Number(target.dataset.index), 1); pendingUploads.set(composerId, files); renderPendingUploads(composerId);
  }
  if (action === 'reply-compose') {
    openReplyForms.has(id) ? openReplyForms.delete(id) : openReplyForms.add(id);
    render();
    document.querySelector(`#reply-${CSS.escape(id)}-body`)?.focus({ preventScroll: false });
  }
  if (action === 'read-replies') {
    expandedThreads.has(id) ? expandedThreads.delete(id) : expandedThreads.add(id);
    render();
    document.querySelector(`[data-action="read-replies"][data-id="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });
  }
  if (action === 'heart') {
    toggleThreadHeart(state, id); persist(); render();
    if (!String(id).startsWith('demo-')) mirrorRemote('thread.heart', { threadId: id });
    document.querySelector(`[data-action="heart"][data-id="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });
  }
  if (action === 'share-thread') {
    const url = `${location.origin}${eventUrl(selectedEvent)}`;
    const share = { title: selectedEvent.title, text: `Join this Publisher Studio event to view the room and its conversations.`, url };
    if (navigator.share) navigator.share(share).catch(error => { if (error.name !== 'AbortError') notify('Share the public event page to invite someone. Private room messages stay gated.'); });
    else if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(() => notify('Public event link copied. Room messages stay behind registration.')).catch(() => notify('Use the event link at the top of this room to invite someone.'));
    else notify('Share the public event link at the top of this room.');
  }
  if (action === 'discuss-resource') {
    nextChatContext = target.dataset.contextId;
    dialog.close();
    if (location.hash !== '#workbench') location.hash = '#workbench';
    else render();
    setTimeout(() => { const select = document.querySelector('#thread-form [name="contextId"]'); if (select) select.value = nextChatContext; document.querySelector('#thread-form-body')?.focus(); }, 220);
  }
  if (action === 'close') dialog.close();
  if (action === 'share-event') openShare(target.dataset.slug);
  if (action === 'add-kit-resource') {
    const next = [...readKitEditor(), { key: `resource-${Math.random().toString(36).slice(2, 10)}`, type: 'flow', availableFrom: 'upcoming', publicPreview: false }];
    renderKitEditor(next);
    document.querySelector('.kit-editor-row:last-child [data-kit-field="title"]')?.focus({ preventScroll: true });
  }
  if (action === 'remove-kit-resource') {
    const key = target.dataset.key;
    const localUrl = localPreviewUrls.get(`resource:${key}`);
    if (localUrl) URL.revokeObjectURL(localUrl);
    localPreviewUrls.delete(`resource:${key}`);
    renderKitEditor(readKitEditor().filter(item => item.key !== key));
    const status = document.querySelector('#builder-save-status');
    if (status) status.textContent = 'Resource removed from this draft.';
    document.querySelector('[data-action="add-kit-resource"]')?.focus({ preventScroll: true });
  }
  if (action === 'save-builder') {
    const form = document.querySelector('#event-builder-form');
    if (!form || !form.reportValidity()) return;
    const status = document.querySelector('#builder-save-status');
    const label = target.textContent;
    target.disabled = true; target.textContent = 'Saving…';
    try {
      await saveSharedEventDraft(form);
      if (status) status.textContent = 'Shared draft saved. Uploaded media files remain local previews.';
      notify('Shared event draft saved.');
    } catch (error) {
      if (status) status.textContent = 'Shared save failed. ' + error.message + ' Your browser recovery copy was kept.';
      notify('Shared draft was not saved. ' + error.message);
    } finally { target.disabled = false; target.textContent = label; }
  }
  if (action === 'load-builder-draft') {
    const item = serverDrafts.find(draft => draft.id === id);
    if (item) { populateSharedDraft(item); notify('Shared event draft opened.'); }
  }
  if (action === 'new-builder-draft') {
    const form = document.querySelector('#event-builder-form');
    if (form) {
      form.reset();
      for (const url of localPreviewUrls.values()) URL.revokeObjectURL(url);
      localPreviewUrls.clear();
      form.querySelectorAll('[data-media-file]').forEach(input => {
        input.value = '';
        const name = input.closest('[data-dropzone]')?.querySelector('[data-file-name]');
        if (name) name.textContent = 'Choose a file or drop it here';
      });
      renderKitEditor([]);
      renderBuilderMediaPreview();
      try { storage?.removeItem(BUILDER_DRAFT_KEY); } catch { /* A fresh shared draft can still be started. */ }
      const status = document.querySelector('#builder-save-status');
      if (status) status.textContent = 'New event draft. Save it to create a shared draft.';
      form.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
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
    if (!String(id).startsWith('demo-')) mirrorRemote('question.vote', { questionId: id });
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
    for (const url of localPreviewUrls.values()) URL.revokeObjectURL(url);
    localPreviewUrls.clear();
    for (const url of chatObjectUrls.values()) URL.revokeObjectURL(url);
    chatObjectUrls.clear(); pendingUploads.clear(); relatedByComposer.clear(); expandedThreads.clear(); openReplyForms.clear();
    try { storage?.removeItem(STORAGE_KEY); storage?.removeItem(BUILDER_DRAFT_KEY); } catch { /* In-memory reset still succeeds. */ }
    dialog.close(); persist(); render(); notify('Demo reset. You are back to the sample content.');
  }
});

document.addEventListener('change', event => {
  if (handleCalendarChange(event.target, state.calendar)) {
    persist();
    if (event.target.matches('[data-calendar-setting="filter-search"]')) {
      clearTimeout(calendarSearchTimer);
      calendarSearchTimer = setTimeout(() => render(), 180);
    } else render();
    return;
  }
  if (event.target.matches('[data-chat-files]')) {
    addPendingUploads(event.target.dataset.chatFiles, [...event.target.files]);
    event.target.value = '';
  }
  if (event.target.matches('.file-dropzone-input')) {
    const name = event.target.files?.[0]?.name || 'Choose a file or drop it here';
    const output = event.target.closest('[data-dropzone]')?.querySelector('[data-file-name]');
    if (output) output.textContent = name;
  }
  if (event.target.hasAttribute('data-phase')) { state.phaseByEvent[selectedEvent.id] = event.target.value; persist(); render(); [...document.querySelectorAll('[data-phase]')].find(select => select.getClientRects().length)?.focus({ preventScroll: true }); }
  if (event.target.id === 'thread-filter') { threadFilter = event.target.value; render(); document.querySelector('#thread-filter')?.focus({ preventScroll: true }); }
  if (event.target.id === 'event-filter') document.querySelectorAll('.event-card').forEach(card => { card.hidden = event.target.value !== 'all' && card.dataset.subject !== event.target.value; });
  if (event.target.matches('[data-media-file]')) {
    const key = event.target.dataset.mediaFile;
    if (key === 'promoVideoFile') previewLocalFile(event.target, key, ['video/mp4', 'video/webm', 'video/quicktime'], 50 * 1024 * 1024, 'Choose an MP4 or WebM video under 50 MB for this local preview.');
    else previewLocalFile(event.target, key, ['image/jpeg', 'image/png', 'image/webp'], 8 * 1024 * 1024, 'Choose a JPG, PNG or WebP image under 8 MB.');
  }
  if (event.target.matches('[data-kit-file]')) {
    const row = event.target.closest('.kit-editor-row');
    const key = row?.dataset.resourceKey;
    const file = event.target.files?.[0];
    if (key && file) {
      const allowedExtensions = /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|png|jpe?g|webp|mp4|webm|mp3|wav|m4a|ogg)$/i;
      if (file.size > 30 * 1024 * 1024 || !allowedExtensions.test(file.name)) {
        event.target.value = ''; notify('Choose a supported document, image, audio or video file under 30 MB.');
      } else {
        const resourceKey = `resource:${key}`;
        const previous = localPreviewUrls.get(resourceKey);
        if (previous) URL.revokeObjectURL(previous);
        localPreviewUrls.set(resourceKey, URL.createObjectURL(file));
        const hidden = row.querySelector('[data-kit-field="fileName"]');
        if (hidden) hidden.value = file.name;
        const note = row.querySelector('.kit-file-note');
        if (note) note.textContent = `${file.name} / local preview ready`;
        else event.target.insertAdjacentHTML('afterend', `<p class="kit-file-note" role="status">${e(file.name)} / local preview ready</p>`);
        syncKitEditor();
      }
    }
  }
  if (event.target.matches('[data-kit-field="availableFrom"]')) {
    const checkbox = event.target.closest('.kit-editor-row')?.querySelector('[data-kit-field="publicPreview"]');
    if (checkbox) { checkbox.disabled = event.target.value !== 'upcoming'; if (checkbox.disabled) checkbox.checked = false; }
    syncKitEditor();
  }
  if (event.target.closest('.kit-editor-row') && event.target.matches('[data-kit-field="publicPreview"]')) syncKitEditor();
});

document.addEventListener('input', event => {
  if (event.target.id === 'resource-search') { resourceFilter = event.target.value; document.querySelector('#resource-results').innerHTML = filteredResources(); }
  if (event.target.closest('.kit-editor-row') && event.target.hasAttribute('data-kit-field')) syncKitEditor();
  if (event.target.name === 'promoVideoUrl' || event.target.name === 'imageAlt') renderBuilderMediaPreview();
  const chatForm = event.target.closest('[data-chat-form]');
  if (chatForm && event.target.name === 'body') {
    renderRelatedContextSuggestion(chatForm, event.target.value);
    renderChatMentions(chatForm, event.target.value);
  }
  if (chatForm && event.target.name === 'contextId') nextChatContext = event.target.value;
  const form = event.target.closest('form[id]');
  if (form && event.target.name && !['email', 'file'].includes(event.target.type)) {
    const draft = drafts.get(form.id) || {};
    draft[event.target.name] = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    drafts.set(form.id, draft);
  }
});

document.addEventListener('dragover', event => {
  const zone = event.target.closest('[data-dropzone]');
  if (!zone) return;
  event.preventDefault();
  zone.classList.add('is-dragging');
});

document.addEventListener('dragleave', event => {
  const zone = event.target.closest('[data-dropzone]');
  if (zone && !zone.contains(event.relatedTarget)) zone.classList.remove('is-dragging');
});

document.addEventListener('drop', event => {
  const zone = event.target.closest('[data-dropzone]');
  if (!zone) return;
  event.preventDefault();
  zone.classList.remove('is-dragging');
  const form = zone.closest('[data-chat-form]');
  if (form) { addPendingUploads(form.id, [...(event.dataTransfer?.files || [])]); return; }
  const input = zone.querySelector('input[type="file"]');
  const file = event.dataTransfer?.files?.[0];
  if (!input || !file) return;
  try {
    const transfer = new DataTransfer(); transfer.items.add(file); input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  } catch { notify('This browser cannot attach dropped files here. Use Browse to choose the file.'); }
});

document.addEventListener('submit', async event => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  const calendarResult = handleCalendarSubmit(form, state.calendar);
  if (calendarResult) {
    event.preventDefault();
    if (calendarResult.error) { notify(calendarResult.error); return; }
    drafts.delete(form.id); persist(); render(); notify(calendarResult.message);
    return;
  }
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  try {
    if (form.dataset.studioAction === 'question.answer') {
      mirrorRemote('question.answer', { questionId: form.dataset.id, answer: data.answer });
      notify('Trainer answer submitted.');
    } else if (form.id === 'registration-form') {
      const optedIntoStudio = data.studioConsent === 'on';
      registerDemo(state, data.displayName, optedIntoStudio, selectedEvent.id); persist(); drafts.delete(form.id);
      if (optedIntoStudio && state.profile && window.StudioIdentity) window.StudioIdentity.openJoin({ displayName: data.displayName, email: data.email });
      document.querySelector('#registration-panel').innerHTML = `<div class="registration-success">${icon('check')}<h2 tabindex="-1">Preview registration complete</h2><p>This is a local preview only. No booking was made and no confirmation email was sent.</p>${optedIntoStudio && state.profile ? `<div class="person-line">${person(state.profile.displayName, state.profile.avatarSeed)}<strong>${e(state.profile.displayName)}</strong></div><p>Your sample Studio profile is available in this browser tab.</p>` : '<p>You did not opt into a Studio profile. The preview event is listed in My events for this browser tab only.</p>'}<a class="button primary" href="${eventUrl(selectedEvent)}room/">Enter this event room ${icon('arrow')}</a><a class="text-link" href="${base}?view=my-events">View My events ${icon('arrow')}</a></div>`;
      document.querySelector('.registration-success h2').focus();
    } else if (form.id === 'question-form') {
      askQuestion(state, data.body, data.contextId); questionFilter = 'all'; drafts.delete(form.id); persist(); render();
      mirrorRemote('question.create', { text: data.body, contextId: data.contextId });
      document.querySelector('#question-body').focus({ preventScroll: true }); notify('Question submitted. Shared Studio sync is running.');
    } else if (form.id === 'submission-form') {
      submitBuild(state, data, selectedChallenge.id); drafts.delete(form.id); persist(); render();
      mirrorRemote('submission.create', { challengeId: selectedChallenge.id, title: data.title, description: data.description, url: data.url, help: data.help });
      notify('Creation saved. Shared Studio sync is running.');
      document.querySelector('.submission-card').scrollIntoView({ block: 'center', behavior: 'instant' });
    } else if (form.dataset.chatForm === 'new') {
      const attachments = storeChatAttachments(form.id);
      const relatedItems = relatedByComposer.get(form.id) || [];
      const thread = addThread(state, { ...data, attachments, relatedItems });
      mirrorRemote('thread.create', { title: data.title, text: data.body, kind: data.kind, contextId: data.contextId, attachments, relatedItems, relatedContextIds: thread.relatedContextIds });
      nextChatContext = thread.contextId; relatedByComposer.delete(form.id); threadFilter = 'all'; drafts.delete(form.id); persist(); render();
      document.querySelector(`#thread-${CSS.escape(thread.id)}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      document.querySelector('#thread-form-body')?.focus({ preventScroll: true });
      notify('Conversation submitted. Shared Studio sync is running.');
    } else if (form.dataset.chatForm === 'reply') {
      const attachments = storeChatAttachments(form.id);
      const targetId = form.dataset.replyTo;
      const reply = addReply(state, targetId, data.body, attachments);
      if (!String(targetId).startsWith('demo-')) mirrorRemote('thread.reply', { threadId: targetId, text: data.body, attachments });
      openReplyForms.delete(targetId); expandedThreads.add(targetId); drafts.delete(form.id); persist(); render();
      document.querySelector(`#thread-${CSS.escape(targetId)} .chat-replies`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      notify('Reply submitted. Shared Studio sync is running.');
    } else if (form.id === 'event-builder-form') {
      await saveSharedEventDraft(form);
      const status = document.querySelector('#builder-save-status');
      if (status) status.textContent = 'Shared draft saved. Uploaded media files remain local previews.';
      notify('Shared event draft saved.');
    }
  } catch (error) {
    const output = form.querySelector('.form-error');
    if (output) { output.textContent = error.message; output.hidden = false; }
    else notify(error.message);
  }
});

dialog.addEventListener('close', () => { dialogMode = null; dialogTarget = null; });
function isStudioRoute(url) {
  const pathname = url.pathname.replace(/\/+$/, '') || '/';
  return pathname === studioRoot
    || pathname === `${studioRoot}/studio`
    || pathname === `${studioRoot}/manage/events`
    || /^\/publisher-studio\/events\/[^/]+(?:\/room)?$/.test(pathname);
}

function updateStudioRoute({ focus = true, restoreScroll = false } = {}) {
  const previousEventId = selectedEvent.id;
  const url = new URL(location.href);
  const hasDeepTarget = ['thread', 'question', 'submission'].some(key => url.searchParams.has(key));
  syncRouteState(url);
  if (previousEventId !== selectedEvent.id) {
    questionFilter = 'all';
    threadFilter = 'all';
    resourceFilter = '';
    nextChatContext = selectedEvent.id;
  }
  if (dialog.open) dialog.close();
  render(focus);
  if (restoreScroll && !hasDeepTarget) {
    const savedScrollY = history.state?.publisherStudioScrollY;
    requestAnimationFrame(() => window.scrollTo(0, Number.isFinite(savedScrollY) ? savedScrollY : 0));
  }
  renderedHref = location.href;
}

function navigateWithinStudio(url) {
  if (url.href === location.href) return;
  history.replaceState({ ...(history.state || {}), publisherStudioScrollY: window.scrollY }, '', location.href);
  history.pushState({ publisherStudioScrollY: 0 }, '', `${url.pathname}${url.search}${url.hash}`);
  updateStudioRoute();
  const hasDeepTarget = ['thread', 'question', 'submission'].some(key => url.searchParams.has(key));
  if (!hasDeepTarget) window.scrollTo(0, 0);
}

let renderedHref = location.href;
document.addEventListener('click', event => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
  if (!anchor || (anchor.target && anchor.target !== '_self') || anchor.hasAttribute('download') || anchor.rel.split(/\s+/).includes('external')) return;
  let url;
  try { url = new URL(anchor.href, location.href); } catch { return; }
  if (url.origin !== location.origin || !isStudioRoute(url)) return;
  if (url.pathname === location.pathname && url.search === location.search && url.hash === '#main') return;
  event.preventDefault();
  navigateWithinStudio(url);
});

window.addEventListener('popstate', () => {
  if (isStudioRoute(new URL(location.href))) updateStudioRoute({ restoreScroll: true });
});

window.addEventListener('hashchange', () => {
  if (renderedHref === location.href) return;
  if (!isStudioRoute(new URL(location.href))) { renderedHref = location.href; return; }
  syncRouteState();
  if (page !== 'studio' || !tabs.some(([key]) => key === location.hash.slice(1))) { renderedHref = location.href; return; }
  if (dialog.open) dialog.close();
  render(true);
  window.scrollTo(0, 0);
  renderedHref = location.href;
});
render();
renderedHref = location.href;
initIdentity({ onIdentity: function(user) {
  serverIdentity = user;
  state.profile = user ? { id: user.id, displayName: user.displayName, avatarSeed: user.id, consentToStudio: Boolean(user.studioMember) } : null;
  persist();
  render(false);
  syncRemoteState();
} });
syncRemoteState();
if (loaded.warning) notify(loaded.warning);
