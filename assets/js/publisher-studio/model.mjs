import { events, challenges, workshop, challenge, initialQuestions, initialThreads, contextFor, contributionKinds, calendarSeedEvents, calendarAvailabilityRules, calendarAvailabilityExceptions } from './data.mjs';
import { ROLE_LABELS, canInviteRole, canInviteStudioAdmin, canInvitePlatformSuperAdmin } from './roles.mjs';

export const STORAGE_KEY = 'wistudi.publisher-studio.prototype.v1';
export const VERSION = 8;
const copy = value => JSON.parse(JSON.stringify(value));
const id = () => globalThis.crypto.randomUUID();

function calendarDefaults() {
  let timezone = 'UTC';
  try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { /* UTC is a safe display fallback. */ }
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const fields = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return {
    events: copy(calendarSeedEvents),
    availabilityRules: copy(calendarAvailabilityRules),
    availabilityExceptions: copy(calendarAvailabilityExceptions),
    section: 'calendar', view: 'month', role: 'admin', timezone,
    selectedDate: `${fields.year}-${fields.month}-${fields.day}`,
    filters: { hostId: 'all', type: 'all', status: 'all', search: '' },
    selectedEventId: '', panel: '', editingEventId: '', audit: [],
  };
}

function initialRoleAssignments() {
  return [
    { id: 'demo-assignment-super', displayName: 'Wistudi Governance', email: 'governance@example.test', role: 'platform_super_admin', scopeType: 'platform', scopeId: 'wistudi', status: 'active' },
    { id: 'demo-assignment-admin', displayName: 'Studio Operations', email: 'operations@example.test', role: 'studio_admin', scopeType: 'studio', scopeId: 'publisher-studio', status: 'active' },
    { id: 'demo-assignment-lead-01', displayName: 'Nadia Nguyen', email: 'nadia@example.test', role: 'event_lead', scopeType: 'event', scopeId: events[0].id, status: 'active' },
    { id: 'demo-assignment-moderator-01', displayName: 'Linh Dao', email: 'linh@example.test', role: 'event_moderator', scopeType: 'event', scopeId: events[0].id, status: 'active' },
    { id: 'demo-assignment-cotrainer-01', displayName: 'Minh Tran', email: 'minh@example.test', role: 'event_co_trainer', scopeType: 'event', scopeId: events[0].id, status: 'active' },
    { id: 'demo-assignment-lead-02', displayName: 'An Pham', email: 'an@example.test', role: 'event_lead', scopeType: 'event', scopeId: events[1].id, status: 'active' },
    { id: 'demo-assignment-builder', displayName: 'Khoa Le', email: 'khoa@example.test', role: 'event_builder', scopeType: 'event', scopeId: events[2].id, status: 'active' },
  ];
}

function addRoleAudit(state, action, target, scopeId) {
  state.roleAudit ||= [];
  state.roleAudit.unshift({ id: id(), action, target, scopeId, actorRole: state.demoRole || 'visitor', at: new Date().toISOString() });
  state.roleAudit = state.roleAudit.slice(0, 100);
}

export function createState() {
  return { version: VERSION, phaseByEvent: {}, profile: null, previewEventIds: [], joinedChallenges: [],
    demoRole: 'studio_admin', demoEventId: events[0].id, participantPreview: false,
    roleAssignments: initialRoleAssignments(), roleInvitations: [], roleAudit: [], hiddenContentIds: [], eventControls: {},
    calendar: calendarDefaults(),
    questions: copy(initialQuestions), threads: copy(initialThreads).map(thread => ({ ...thread, attachments: [], relatedContextIds: [], relatedItems: [], hearts: thread.id === 'demo-thread-01' ? 3 : 1 })),
    threadHearts: [], votes: [], submissions: [], resourceReplies: {} };
}

export function setDemoRole(state, role, eventId) {
  if (!Object.hasOwn(ROLE_LABELS, role)) throw new Error('Choose a valid preview role.');
  state.demoRole = role;
  if (events.some(item => item.id === eventId)) state.demoEventId = eventId;
  state.participantPreview = false;
}

export function createRoleInvitation(state, { email, role, scopeType = 'event', scopeId = '' }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error('Enter a valid email address.');
  if (!Object.hasOwn(ROLE_LABELS, role) || ['visitor', 'participant'].includes(role)) throw new Error('Choose a staff role.');

  const allowed = scopeType === 'platform'
    ? role === 'platform_super_admin' && canInvitePlatformSuperAdmin(state)
    : scopeType === 'studio'
      ? role === 'studio_admin' && canInviteStudioAdmin(state)
      : canInviteRole(state, role, scopeId);
  if (!allowed) throw new Error('Your current role cannot invite that role at this scope.');

  const now = new Date();
  const invitation = {
    id: id(), email: normalizedEmail, role, scopeType, scopeId,
    invitedByRole: state.demoRole || 'visitor', status: 'pending',
    createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + 7 * 86400000).toISOString(),
  };
  state.roleInvitations.unshift(invitation);
  addRoleAudit(state, 'invitation created', normalizedEmail, scopeId || scopeType);
  return invitation;
}

export function acceptDemoRoleInvitation(state, invitationId) {
  const invitation = state.roleInvitations.find(item => item.id === invitationId);
  if (!invitation || invitation.status !== 'pending') throw new Error('This invitation is no longer pending.');
  if (Date.parse(invitation.expiresAt) <= Date.now()) {
    invitation.status = 'expired';
    throw new Error('This invitation has expired.');
  }
  const displayName = invitation.email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\p{L}/gu, letter => letter.toUpperCase());
  state.roleAssignments.push({
    id: id(), displayName, email: invitation.email, role: invitation.role,
    scopeType: invitation.scopeType, scopeId: invitation.scopeId, status: 'active',
    invitedByRole: invitation.invitedByRole, acceptedAt: new Date().toISOString(),
  });
  invitation.status = 'accepted';
  invitation.acceptedAt = new Date().toISOString();
  addRoleAudit(state, 'invitation accepted (demo)', invitation.email, invitation.scopeId || invitation.scopeType);
  return invitation;
}

export function revokeDemoInvitation(state, invitationId) {
  const invitation = state.roleInvitations.find(item => item.id === invitationId);
  if (!invitation || invitation.status !== 'pending') throw new Error('Only pending invitations can be revoked.');
  invitation.status = 'revoked';
  invitation.revokedAt = new Date().toISOString();
  addRoleAudit(state, 'invitation revoked', invitation.email, invitation.scopeId || invitation.scopeType);
  return invitation;
}

export function revokeDemoAssignment(state, assignmentId) {
  const assignment = state.roleAssignments.find(item => item.id === assignmentId);
  if (!assignment || assignment.status !== 'active') throw new Error('This role assignment is no longer active.');
  assignment.status = 'revoked';
  assignment.revokedAt = new Date().toISOString();
  addRoleAudit(state, 'role revoked', assignment.displayName, assignment.scopeId);
  return assignment;
}

export function setRoomFeature(state, eventId, feature, enabled) {
  if (!events.some(item => item.id === eventId) || !['questions', 'chat', 'build', 'resources'].includes(feature)) throw new Error('Choose a valid event setting.');
  const current = state.eventControls[eventId] || { roomOpen: true, features: { questions: true, chat: true, build: true, resources: true } };
  current.features ||= { questions: true, chat: true, build: true, resources: true };
  current.features[feature] = Boolean(enabled);
  state.eventControls[eventId] = current;
}

export function setRoomOpen(state, eventId, open) {
  if (!events.some(item => item.id === eventId)) throw new Error('Choose a valid event.');
  const current = state.eventControls[eventId] || { roomOpen: true, features: { questions: true, chat: true, build: true, resources: true } };
  current.roomOpen = Boolean(open);
  state.eventControls[eventId] = current;
  addRoleAudit(state, open ? 'room reopened' : 'room closed', eventId, eventId);
}

export function setContentHidden(state, contentId, hidden) {
  if (hidden && !state.hiddenContentIds.includes(contentId)) state.hiddenContentIds.push(contentId);
  if (!hidden) state.hiddenContentIds = state.hiddenContentIds.filter(item => item !== contentId);
}

export function answerDemoQuestion(state, questionId, answer) {
  const question = state.questions.find(item => item.id === questionId);
  if (!question || question.answer) throw new Error('This question is not awaiting an answer.');
  question.answer = textValue(answer, 2000);
  question.answeredBy = state.profile?.displayName || 'Demo trainer';
  addRoleAudit(state, 'question answered', questionId, contextFor(question.contextId).workshopId);
  return question;
}

export function textValue(value, max = 2000) {
  const text = String(value ?? '').trim();
  if (!text || text.length > max) throw new Error(`Please enter between 1 and ${max} characters.`);
  return text;
}

export function safeLink(value) {
  try {
    const url = new URL(String(value).trim());
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return url.href;
  } catch { return null; }
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

export function avatar(name, seed = name) {
  const hash = [...String(seed)].reduce((value, char) => ((value * 31) + char.codePointAt(0)) >>> 0, 0);
  return { initials: String(name).trim().split(/\s+/u).slice(0, 2).map(word => [...word][0] || '').join('').toUpperCase(), color: hash % 5 };
}

export function registerDemo(state, name, consent, eventId) {
  if (events.some(item => item.id === eventId) && !state.previewEventIds.includes(eventId)) state.previewEventIds.push(eventId);
  if (!consent) return null;
  const displayName = textValue(name, 60);
  if (state.profile) state.profile.displayName = displayName;
  else state.profile = { id: id(), displayName, avatarSeed: id(), consentToStudio: true };
  return state.profile;
}

const author = state => state.profile?.displayName || 'You (demo)';

export function askQuestion(state, body, contextId = workshop.id) {
  const context = contextFor(contextId);
  const question = { id: id(), author: author(state), body: textValue(body), contextId: context.id, context,
    votes: 0, answer: null, createdAt: new Date().toISOString() };
  state.questions.unshift(question);
  return question;
}

export function toggleVote(state, questionId) {
  if (!state.questions.some(question => question.id === questionId)) throw new Error('Question not found.');
  state.votes = state.votes.includes(questionId) ? state.votes.filter(value => value !== questionId) : [...state.votes, questionId];
}

export const voteCount = (state, question) => question.votes + Number(state.votes.includes(question.id));

export function addThread(state, { title, body, kind, contextId, attachments = [], relatedContextIds = [], relatedItems = [] }) {
  if (!Object.hasOwn(contributionKinds, kind)) throw new Error('Choose a contribution type.');
  const context = contextFor(contextId);
  const messageBody = textValue(body);
  const thread = { id: id(), author: author(state), title: String(title || '').trim().slice(0, 120), body: messageBody, kind,
    contextId, context, replies: [], attachments: copy(attachments), relatedContextIds: [...new Set(relatedContextIds)].filter(value => value !== contextId && contextFor(value)),
    relatedItems: relatedItems.filter(item => item && ['thread', 'question', 'submission'].includes(item.type) && typeof item.id === 'string'), hearts: 0 };
  state.threads.unshift(thread);
  return thread;
}

export function addReply(state, targetId, body, attachments = []) {
  const reply = { id: id(), author: author(state), body: textValue(body), attachments: copy(attachments) };
  const thread = state.threads.find(item => item.id === targetId);
  if (thread) thread.replies.push(reply);
  else {
    const context = contextFor(targetId);
    if (!['template', 'worksheet', 'guide'].includes(context.type)) throw new Error('This context does not accept resource replies.');
    (state.resourceReplies[targetId] ||= []).push(reply);
  }
  return reply;
}

export function toggleThreadHeart(state, threadId) {
  if (!state.threads.some(thread => thread.id === threadId)) throw new Error('Conversation not found.');
  state.threadHearts = state.threadHearts.includes(threadId)
    ? state.threadHearts.filter(id => id !== threadId)
    : [...state.threadHearts, threadId];
}

export function submitBuild(state, { title, description, url, help }, challengeId = challenge.id) {
  const link = safeLink(url);
  if (!link) throw new Error('Use a complete https:// link without a username or password.');
  const selectedChallenge = challenges.find(item => item.id === challengeId);
  if (!selectedChallenge) throw new Error('Choose a valid Studio challenge.');
  const submission = { id: id(), author: author(state), challengeId: selectedChallenge.id, context: contextFor(selectedChallenge.id),
    title: textValue(title, 120), description: textValue(description), url: link,
    help: String(help || '').trim().slice(0, 1000), moderationStatus: 'pending', createdAt: new Date().toISOString() };
  state.submissions.unshift(submission);
  if (!state.joinedChallenges.includes(selectedChallenge.id)) state.joinedChallenges.push(selectedChallenge.id);
  return submission;
}

// Rehydrate only structurally valid demo state; browser storage is not authentication.
export function loadState(storage) {
  try {
    let value = JSON.parse(storage?.getItem(STORAGE_KEY) || 'null');
    if (!value) return { state: createState(), warning: '' };
    if ([5, 6, 7].includes(value.version)) {
      const fresh = createState();
      value = { ...fresh, ...value, calendar: { ...fresh.calendar, ...(value.calendar || {}), filters: { ...fresh.calendar.filters, ...(value.calendar?.filters || {}) } }, version: VERSION };
    }
    const string = item => typeof item === 'string';
    const context = item => { try { contextFor(item); return true; } catch { return false; } };
    const reply = item => item && string(item.id) && string(item.author) && string(item.body);
    const calendar = value.calendar;
    const calendarEvent = item => item && string(item.id) && string(item.title) && string(item.type) && string(item.startsAt)
      && Number.isFinite(Date.parse(item.startsAt)) && Number.isInteger(item.duration) && item.duration >= 5 && item.duration <= 1440
      && string(item.timezone) && string(item.hostId) && string(item.hostName) && string(item.group)
      && ['confirmed', 'pending', 'held', 'cancelled', 'completed'].includes(item.status)
      && ['public', 'private', 'internal'].includes(item.visibility) && ['calendar', 'publisher-studio'].includes(item.source)
      && string(item.studioEventId) && Array.isArray(item.participants) && item.participants.every(person => person && string(person.id) && string(person.name))
      && item.location && ['online', 'physical', 'hybrid', 'custom', 'tbd'].includes(item.location.mode)
      && string(item.location.label) && string(item.location.url) && string(item.resourceUrl) && string(item.notes);
    const validCalendar = calendar && Array.isArray(calendar.events) && calendar.events.every(calendarEvent)
      && new Set(calendar.events.map(item => item.id)).size === calendar.events.length
      && Array.isArray(calendar.availabilityRules) && calendar.availabilityRules.every(rule => rule && string(rule.id) && string(rule.hostId)
        && Number.isInteger(rule.weekday) && rule.weekday >= 0 && rule.weekday <= 6 && /^\d{2}:\d{2}$/.test(rule.start) && /^\d{2}:\d{2}$/.test(rule.end) && string(rule.label))
      && Array.isArray(calendar.availabilityExceptions) && calendar.availabilityExceptions.every(item => item && string(item.id) && string(item.hostId)
        && /^\d{4}-\d{2}-\d{2}$/.test(item.date) && /^\d{2}:\d{2}$/.test(item.start) && /^\d{2}:\d{2}$/.test(item.end)
        && ['external_busy', 'blocked', 'available'].includes(item.status) && string(item.label))
      && ['calendar', 'availability', 'operations'].includes(calendar.section) && ['month', 'week', 'day'].includes(calendar.view)
      && ['admin', 'manager', 'host', 'participant', 'guardian'].includes(calendar.role) && string(calendar.timezone)
      && /^\d{4}-\d{2}-\d{2}$/.test(calendar.selectedDate) && calendar.filters && ['hostId', 'type', 'status', 'search'].every(key => string(calendar.filters[key]))
      && string(calendar.selectedEventId) && (calendar.selectedEventId === '' || calendar.events.some(item => item.id === calendar.selectedEventId))
      && ['', 'event', 'availability'].includes(calendar.panel) && string(calendar.editingEventId)
      && (calendar.editingEventId === '' || calendar.events.some(item => item.id === calendar.editingEventId)) && Array.isArray(calendar.audit)
      && calendar.audit.every(item => item && string(item.action) && string(item.target) && string(item.at));
    if (value.version !== VERSION || !value.phaseByEvent || typeof value.phaseByEvent !== 'object' || Array.isArray(value.phaseByEvent)
      || !validCalendar
      || !Object.hasOwn(ROLE_LABELS, value.demoRole) || !events.some(item => item.id === value.demoEventId) || typeof value.participantPreview !== 'boolean'
      || !Array.isArray(value.roleAssignments) || !value.roleAssignments.every(item => item && string(item.id) && string(item.displayName) && string(item.email)
        && Object.hasOwn(ROLE_LABELS, item.role) && ['platform', 'studio', 'event'].includes(item.scopeType)
        && (item.scopeType === 'platform' ? item.scopeId === 'wistudi' : item.scopeType === 'studio' ? item.scopeId === 'publisher-studio' : events.some(event => event.id === item.scopeId))
        && ['active', 'revoked'].includes(item.status))
      || !Array.isArray(value.roleInvitations) || !value.roleInvitations.every(item => item && string(item.id) && string(item.email)
        && Object.hasOwn(ROLE_LABELS, item.role) && ['platform', 'studio', 'event'].includes(item.scopeType)
        && (item.scopeType === 'platform' ? item.scopeId === 'wistudi' : item.scopeType === 'studio' ? item.scopeId === 'publisher-studio' : events.some(event => event.id === item.scopeId))
        && ['pending', 'accepted', 'declined', 'expired', 'revoked'].includes(item.status) && string(item.createdAt) && string(item.expiresAt))
      || !Array.isArray(value.roleAudit) || !value.roleAudit.every(item => item && string(item.id) && string(item.action) && string(item.target) && string(item.scopeId) && string(item.at))
      || !Array.isArray(value.hiddenContentIds) || !value.hiddenContentIds.every(string)
      || !value.eventControls || typeof value.eventControls !== 'object' || Array.isArray(value.eventControls)
      || !Object.entries(value.eventControls).every(([eventId, settings]) => events.some(item => item.id === eventId) && settings && typeof settings.roomOpen === 'boolean'
        && settings.features && ['questions', 'chat', 'build', 'resources'].every(key => typeof settings.features[key] === 'boolean'))
      || !Object.entries(value.phaseByEvent).every(([eventId, phase]) => events.some(item => item.id === eventId) && ['upcoming', 'live', 'post_session'].includes(phase))
      || !Array.isArray(value.previewEventIds) || !value.previewEventIds.every(eventId => events.some(item => item.id === eventId)) || new Set(value.previewEventIds).size !== value.previewEventIds.length
      || !Array.isArray(value.joinedChallenges) || !value.joinedChallenges.every(challengeId => challenges.some(challengeItem => challengeItem.id === challengeId)) || new Set(value.joinedChallenges).size !== value.joinedChallenges.length
      || !(value.profile === null || (string(value.profile?.id) && string(value.profile?.displayName) && string(value.profile?.avatarSeed) && value.profile?.consentToStudio === true))
      || !Array.isArray(value.questions) || !value.questions.every(item => reply(item) && context(item.contextId) && Number.isInteger(item.votes) && item.votes >= 0 && string(item.createdAt) && (item.answer === null || string(item.answer)))
      || !Array.isArray(value.threads) || !value.threads.every(item => reply(item) && string(item.title) && Object.hasOwn(contributionKinds, item.kind) && context(item.contextId) && Array.isArray(item.replies) && item.replies.every(reply)
        && Array.isArray(item.attachments) && item.attachments.every(file => file && string(file.id) && string(file.name) && string(file.type) && Number.isFinite(file.size) && file.size >= 0)
        && Array.isArray(item.relatedContextIds) && item.relatedContextIds.every(context) && Array.isArray(item.relatedItems) && item.relatedItems.every(link => link && ['thread', 'question', 'submission'].includes(link.type) && string(link.id)
          && (link.type === 'thread' ? value.threads.some(target => target.id === link.id) : link.type === 'question' ? value.questions.some(target => target.id === link.id) : value.submissions.some(target => target.id === link.id)))
        && Number.isInteger(item.hearts) && item.hearts >= 0)
      || !Array.isArray(value.threadHearts) || !value.threadHearts.every(item => string(item) && value.threads.some(thread => thread.id === item)) || new Set(value.threadHearts).size !== value.threadHearts.length
      || !Array.isArray(value.votes) || !value.votes.every(item => string(item) && value.questions.some(question => question.id === item)) || new Set(value.votes).size !== value.votes.length
      || !Array.isArray(value.submissions) || !value.submissions.every(item => item && string(item.id) && string(item.author) && string(item.title) && string(item.description) && string(item.help) && safeLink(item.url) && challenges.some(challengeItem => challengeItem.id === item.challengeId) && item.moderationStatus === 'pending')
      || !value.resourceReplies || typeof value.resourceReplies !== 'object' || Array.isArray(value.resourceReplies)
      || !Object.entries(value.resourceReplies).every(([key, replies]) => context(key) && Array.isArray(replies) && replies.every(reply))) throw new Error('Invalid demo state');
    return { state: value, warning: '' };
  } catch { return { state: createState(), warning: 'Saved demo data could not be loaded. A fresh preview is ready.' }; }
}

export function saveState(storage, state) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; }
  catch { return false; }
}
