import { events, challenges, workshop, challenge, initialQuestions, initialThreads, contextFor, contributionKinds } from './data.mjs';

export const STORAGE_KEY = 'wistudi.publisher-studio.prototype.v1';
export const VERSION = 5;
const copy = value => JSON.parse(JSON.stringify(value));
const id = () => globalThis.crypto.randomUUID();

export function createState() {
  return { version: VERSION, phaseByEvent: {}, profile: null, previewEventIds: [], joinedChallenges: [],
    questions: copy(initialQuestions), threads: copy(initialThreads).map(thread => ({ ...thread, attachments: [], relatedContextIds: [], relatedItems: [], hearts: thread.id === 'demo-thread-01' ? 3 : 1 })),
    threadHearts: [], votes: [], submissions: [], resourceReplies: {} };
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
    const value = JSON.parse(storage?.getItem(STORAGE_KEY) || 'null');
    if (!value) return { state: createState(), warning: '' };
    const string = item => typeof item === 'string';
    const context = item => { try { contextFor(item); return true; } catch { return false; } };
    const reply = item => item && string(item.id) && string(item.author) && string(item.body);
    if (value.version !== VERSION || !value.phaseByEvent || typeof value.phaseByEvent !== 'object' || Array.isArray(value.phaseByEvent)
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
