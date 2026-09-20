import { currentUser, dbFor, json, nowIso, sameOrigin } from './_security.js';
import { eventCapabilities } from './_policy.js';

const ApiError = class extends Error {
  constructor(status, message) { super(message); this.status = status; }
};
const text = (value, max) => {
  const out = String(value == null ? '' : value).trim();
  if (!out || out.length > max) throw new ApiError(400, 'Enter between 1 and ' + max + ' characters.');
  return out;
};
const optionalText = (value, max) => {
  const out = String(value == null ? '' : value).trim();
  if (out.length > max) throw new ApiError(400, 'Text must be ' + max + ' characters or fewer.');
  return out;
};
const validId = value => /^[A-Za-z0-9._:-]{1,120}$/.test(String(value || ''));
const parseArray = value => {
  try { const result = JSON.parse(value || '[]'); return Array.isArray(result) ? result : []; }
  catch { return []; }
};
const newId = () => crypto.randomUUID();

async function requireEvent(db, eventId) {
  const row = await db.prepare(
    'SELECT id, workspace_id, title, status FROM studio_events WHERE id = ? LIMIT 1'
  ).bind(eventId).first();
  if (!row) throw new ApiError(404, 'Event not found.');
  return row;
}

async function ensureContext(db, eventId, contextId) {
  if (contextId === eventId) return 'workshop';
  const challenge = await db.prepare(
    'SELECT id FROM studio_challenges WHERE id = ? AND event_id = ?'
  ).bind(contextId, eventId).first();
  if (challenge) return 'challenge';
  const resource = await db.prepare(
    'SELECT type FROM studio_resources WHERE id = ? AND event_id = ?'
  ).bind(contextId, eventId).first();
  if (resource) return resource.type;
  throw new ApiError(400, 'Choose a context inside this event.');
}

async function ensureRoomFeature(db, eventId, feature) {
  const controls = await db.prepare('SELECT * FROM studio_event_controls WHERE event_id = ?').bind(eventId).first();
  if (controls && !controls.room_open) throw new ApiError(423, 'This room is closed and read-only.');
  const field = { questions: 'questions_enabled', chat: 'chat_enabled', build: 'build_enabled' }[feature];
  if (controls && field && !controls[field]) throw new ApiError(403, 'This room feature is turned off by its event team.');
}

async function requireMemberOrWriter(db, user, capabilities) {
  const membership = await db.prepare(
    "SELECT status FROM studio_access_memberships WHERE studio_id = 'publisher-studio' AND studio_user_id = ? LIMIT 1"
  ).bind(user.id).first();
  if (membership?.status !== 'active' && !capabilities.canWrite) {
    throw new ApiError(403, 'Join the Publisher Studio with your verified account before posting.');
  }
}

function noAttachments(value) {
  if (value == null) return '[]';
  if (!Array.isArray(value)) throw new ApiError(400, 'Attachments must be uploaded through Studio storage.');
  if (value.length) throw new ApiError(501, 'Shared file uploads are not connected yet. The message was not shared.');
  return '[]';
}

async function validateRelatedContexts(db, eventId, values) {
  if (values == null) return [];
  if (!Array.isArray(values)) throw new ApiError(400, 'Related contexts are invalid.');
  const output = [];
  for (const value of [...new Set(values.map(String))].slice(0, 12)) {
    if (value === eventId) continue;
    await ensureContext(db, eventId, value);
    output.push(value);
  }
  return output;
}

async function validateRelatedItems(db, eventId, values) {
  if (values == null) return [];
  if (!Array.isArray(values)) throw new ApiError(400, 'Related conversations are invalid.');
  const output = [];
  for (const item of values.slice(0, 12)) {
    if (!item || !['thread', 'question', 'submission'].includes(item.type) || !validId(item.id)) continue;
    let exists = null;
    if (item.type === 'thread') exists = await db.prepare('SELECT id FROM studio_threads WHERE id = ? AND event_id = ?').bind(item.id, eventId).first();
    if (item.type === 'question') exists = await db.prepare('SELECT id FROM studio_questions WHERE id = ? AND event_id = ?').bind(item.id, eventId).first();
    if (item.type === 'submission') {
      exists = await db.prepare(
        'SELECT s.id FROM studio_submissions s JOIN studio_challenges c ON c.id = s.challenge_id WHERE s.id = ? AND c.event_id = ?'
      ).bind(item.id, eventId).first();
    }
    if (exists) output.push({ type: item.type, id: item.id });
  }
  return output;
}

async function snapshot(db, event, user, capabilities) {
  const userId = user ? user.id : '';
  const qRows = await db.prepare(
    'SELECT q.*, COUNT(v.user_id) AS vote_count, ' +
    'MAX(CASE WHEN v.user_id = ? THEN 1 ELSE 0 END) AS voted_by_user ' +
    'FROM studio_questions q LEFT JOIN studio_question_votes v ON v.question_id = q.id ' +
    "WHERE q.event_id = ? AND q.status != 'hidden' GROUP BY q.id ORDER BY q.created_at DESC LIMIT 500"
  ).bind(userId, event.id).all();

  const tRows = await db.prepare(
    'SELECT t.*, (SELECT COUNT(*) FROM studio_thread_reactions r WHERE r.thread_id = t.id AND r.reaction = ?) AS hearts, ' +
    ' (SELECT COUNT(*) FROM studio_thread_reactions r WHERE r.thread_id = t.id AND r.user_id = ? AND r.reaction = ?) AS hearted_by_user ' +
    'FROM studio_threads t WHERE t.event_id = ? AND t.status != ? ORDER BY t.created_at DESC LIMIT 500'
  ).bind('heart', userId, 'heart', event.id, 'hidden').all();

  const threadIds = (tRows.results || []).map(row => row.id);
  let replies = [];
  if (threadIds.length) {
    const placeholders = threadIds.map(() => '?').join(',');
    replies = (await db.prepare(
      'SELECT * FROM studio_thread_replies WHERE thread_id IN (' + placeholders + ') AND status = ? ORDER BY created_at ASC'
    ).bind(...threadIds, 'visible').all()).results || [];
  }
  const submissions = await db.prepare(
    'SELECT s.* FROM studio_submissions s JOIN studio_challenges c ON c.id = s.challenge_id ' +
    'WHERE c.event_id = ? AND (s.moderation_status = ? OR s.author_user_id = ? OR ? = 1) ' +
    'ORDER BY s.created_at DESC LIMIT 500'
  ).bind(event.id, 'approved', userId, capabilities.canModerate ? 1 : 0).all();

  const replyMap = new Map();
  for (const reply of replies) {
    if (!replyMap.has(reply.thread_id)) replyMap.set(reply.thread_id, []);
    replyMap.get(reply.thread_id).push({
      id: reply.id, author: reply.author_name, body: reply.body,
      attachments: parseArray(reply.attachments_json),
    });
  }
  const settings = await db.prepare('SELECT * FROM studio_event_controls WHERE event_id = ?').bind(event.id).first();

  return {
    event: {
      id: event.id, title: event.title, status: event.status,
      roomOpen: settings ? Boolean(settings.room_open) : true,
      registrationOpen: settings ? Boolean(settings.registration_open) : true,
      features: {
        questions: settings ? Boolean(settings.questions_enabled) : true,
        chat: settings ? Boolean(settings.chat_enabled) : true,
        build: settings ? Boolean(settings.build_enabled) : true,
        resources: settings ? Boolean(settings.resources_enabled) : true,
      },
    },
    questions: (qRows.results || []).map(row => ({
      id: row.id, author: row.author_name, body: row.body, contextId: row.context_id,
      votes: Number(row.vote_count || 0), answer: row.answer, createdAt: row.created_at,
      votedByUser: Boolean(row.voted_by_user),
    })),
    threads: (tRows.results || []).map(row => ({
      id: row.id, author: row.author_name, title: row.title, body: row.body,
      kind: row.kind, contextId: row.context_id, replies: replyMap.get(row.id) || [],
      attachments: parseArray(row.attachments_json),
      relatedContextIds: parseArray(row.related_context_ids_json),
      relatedItems: parseArray(row.related_items_json),
      hearts: Number(row.hearts || 0), heartedByUser: Boolean(row.hearted_by_user),
    })),
    submissions: (submissions.results || []).map(row => ({
      id: row.id, author: row.author_name, challengeId: row.challenge_id,
      title: row.title, description: row.description, url: row.url,
      help: row.help_text, moderationStatus: row.moderation_status,
      moderationNote: row.moderation_note || '', createdAt: row.created_at,
    })),
  };
}

export async function onRequestGet(context) {
  const db = dbFor(context);
  if (!db) return json({ ok: false, error: 'Studio database is not configured.' }, 503);
  try {
    const url = new URL(context.request.url);
    const eventId = url.searchParams.get('eventId') || '';
    if (!validId(eventId)) throw new ApiError(400, 'Choose a valid event.');
    const event = await requireEvent(db, eventId);
    const user = await currentUser(context);
    const capabilities = user ? await eventCapabilities(db, user.id, eventId) : {
      canRead: false, canWrite: false, canAnswer: false, canModerate: false, canManage: false,
    };
    if (event.status === 'draft' && !capabilities.canRead) throw new ApiError(403, 'This event is not public yet.');
    return json(Object.assign({ ok: true }, await snapshot(db, event, user, capabilities)));
  } catch (error) {
    return json({ ok: false, error: error.message || 'Studio request failed.' }, error.status || 500);
  }
}

export async function onRequestPost(context) {
  const db = dbFor(context);
  if (!db) return json({ ok: false, error: 'Studio database is not configured.' }, 503);
  if (!sameOrigin(context.request)) return json({ ok: false, error: 'Request origin could not be verified.' }, 403);

  let body;
  try {
    const raw = await context.request.text();
    if (raw.length > 16000) return json({ ok: false, error: 'Request is too large.' }, 413);
    body = JSON.parse(raw);
  } catch { return json({ ok: false, error: 'Invalid request.' }, 400); }

  try {
    const action = String(body.action || '');
    const eventId = String(body.eventId || '');
    if (!validId(eventId)) throw new ApiError(400, 'Choose a valid event.');
    const event = await requireEvent(db, eventId);
    const user = await currentUser(context);
    if (!user) throw new ApiError(401, 'Sign in with your verified email before contributing.');
    const capabilities = await eventCapabilities(db, user.id, eventId);
    const staffModeration = ['question.answer','question.hide','thread.hide','reply.hide','submission.review'].includes(action);
    if (staffModeration) {
      if (action === 'question.answer' && !capabilities.canAnswer && !capabilities.canManage) throw new ApiError(403, 'Only the event trainer or an authorized Studio admin can answer questions.');
      if (action !== 'question.answer' && !capabilities.canModerate && !capabilities.canManage) throw new ApiError(403, 'You do not have moderation permission for this event.');
    } else {
      await requireMemberOrWriter(db, user, capabilities);
      if (!['question.create','question.vote','thread.create','thread.reply','thread.heart','submission.create'].includes(action)) {
        throw new ApiError(400, 'Unsupported Studio action.');
      }
      const feature = action.startsWith('question.') ? 'questions' : action.startsWith('thread.') ? 'chat' : 'build';
      await ensureRoomFeature(db, eventId, feature);
    }

    if (action === 'question.create') {
      const contextId = String(body.contextId || eventId);
      const contextType = await ensureContext(db, eventId, contextId);
      await db.prepare(
        'INSERT INTO studio_questions (id, workspace_id, event_id, context_id, context_type, author_user_id, author_name, body, created_at, updated_at) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        newId(), event.workspace_id, eventId, contextId, contextType,
        user.id, text(user.displayName, 60), text(body.text, 2000), nowIso(), nowIso()
      ).run();
    } else if (action === 'question.vote') {
      const questionId = String(body.questionId || '');
      const question = await db.prepare('SELECT id FROM studio_questions WHERE id = ? AND event_id = ? AND status != ?').bind(questionId, eventId, 'hidden').first();
      if (!question) throw new ApiError(404, 'Question not found.');
      const existing = await db.prepare('SELECT question_id FROM studio_question_votes WHERE question_id = ? AND user_id = ?').bind(questionId, user.id).first();
      if (existing) await db.prepare('DELETE FROM studio_question_votes WHERE question_id = ? AND user_id = ?').bind(questionId, user.id).run();
      else await db.prepare('INSERT INTO studio_question_votes (question_id, user_id, created_at) VALUES (?, ?, ?)').bind(questionId, user.id, nowIso()).run();
    } else if (action === 'question.answer') {
      const questionId = String(body.questionId || '');
      const answer = text(body.answer, 2000);
      const changed = await db.prepare(
        "UPDATE studio_questions SET answer = ?, status = 'answered', updated_at = ? WHERE id = ? AND event_id = ? AND status != 'hidden'"
      ).bind(answer, nowIso(), questionId, eventId).run();
      if (Number(changed.meta?.changes || 0) !== 1) throw new ApiError(404, 'Question not found.');
    } else if (action === 'question.hide') {
      const changed = await db.prepare(
        "UPDATE studio_questions SET status = 'hidden', updated_at = ? WHERE id = ? AND event_id = ?"
      ).bind(nowIso(), String(body.questionId || ''), eventId).run();
      if (Number(changed.meta?.changes || 0) !== 1) throw new ApiError(404, 'Question not found.');
    } else if (action === 'thread.create') {
      const contextId = String(body.contextId || eventId);
      const contextType = await ensureContext(db, eventId, contextId);
      const kind = ['idea','need_help','can_help','made_something'].includes(body.kind) ? body.kind : 'idea';
      const relatedContextIds = await validateRelatedContexts(db, eventId, body.relatedContextIds);
      const relatedItems = await validateRelatedItems(db, eventId, body.relatedItems);
      const attachments = noAttachments(body.attachments);
      await db.prepare(
        'INSERT INTO studio_threads (id, workspace_id, event_id, context_id, context_type, author_user_id, author_name, kind, title, body, related_context_ids_json, related_items_json, attachments_json, created_at, updated_at) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        newId(), event.workspace_id, eventId, contextId, contextType, user.id,
        text(user.displayName, 60), kind, optionalText(body.title, 120), text(body.text, 2000),
        JSON.stringify(relatedContextIds), JSON.stringify(relatedItems), attachments, nowIso(), nowIso()
      ).run();
    } else if (action === 'thread.reply') {
      const threadId = String(body.threadId || '');
      const thread = await db.prepare('SELECT id FROM studio_threads WHERE id = ? AND event_id = ? AND status = ?').bind(threadId, eventId, 'visible').first();
      if (!thread) throw new ApiError(404, 'Conversation not found or replies are closed.');
      const attachments = noAttachments(body.attachments);
      await db.prepare(
        'INSERT INTO studio_thread_replies (id, thread_id, author_user_id, author_name, body, attachments_json, created_at, updated_at) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(newId(), threadId, user.id, text(user.displayName, 60), text(body.text, 2000), attachments, nowIso(), nowIso()).run();
    } else if (action === 'thread.heart') {
      const threadId = String(body.threadId || '');
      const thread = await db.prepare('SELECT id FROM studio_threads WHERE id = ? AND event_id = ? AND status = ?').bind(threadId, eventId, 'visible').first();
      if (!thread) throw new ApiError(404, 'Conversation not found.');
      const existing = await db.prepare(
        "SELECT thread_id FROM studio_thread_reactions WHERE thread_id = ? AND user_id = ? AND reaction = 'heart'"
      ).bind(threadId, user.id).first();
      if (existing) await db.prepare("DELETE FROM studio_thread_reactions WHERE thread_id = ? AND user_id = ? AND reaction = 'heart'").bind(threadId, user.id).run();
      else await db.prepare("INSERT INTO studio_thread_reactions (thread_id, user_id, reaction, created_at) VALUES (?, ?, 'heart', ?)").bind(threadId, user.id, nowIso()).run();
    } else if (action === 'thread.hide') {
      const changed = await db.prepare(
        "UPDATE studio_threads SET status = 'hidden', updated_at = ? WHERE id = ? AND event_id = ?"
      ).bind(nowIso(), String(body.threadId || ''), eventId).run();
      if (Number(changed.meta?.changes || 0) !== 1) throw new ApiError(404, 'Conversation not found.');
    } else if (action === 'reply.hide') {
      const changed = await db.prepare(
        "UPDATE studio_thread_replies SET status = 'hidden', updated_at = ? WHERE id = ? AND thread_id IN (SELECT id FROM studio_threads WHERE event_id = ?)"
      ).bind(nowIso(), String(body.replyId || ''), eventId).run();
      if (Number(changed.meta?.changes || 0) !== 1) throw new ApiError(404, 'Reply not found.');
    } else if (action === 'submission.create') {
      const challengeId = String(body.challengeId || '');
      const challenge = await db.prepare('SELECT id FROM studio_challenges WHERE id = ? AND event_id = ? AND status = ?').bind(challengeId, eventId, 'active').first();
      if (!challenge) throw new ApiError(404, 'Build challenge is unavailable.');
      let url;
      try { url = new URL(String(body.url || '')); } catch { throw new ApiError(400, 'Use a complete HTTPS creation link.'); }
      if (url.protocol !== 'https:' || url.username || url.password) throw new ApiError(400, 'Use a complete HTTPS creation link.');
      await db.prepare(
        "INSERT INTO studio_submissions (id, challenge_id, author_user_id, author_name, title, description, url, help_text, moderation_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)"
      ).bind(
        newId(), challengeId, user.id, text(user.displayName, 60), text(body.title, 120),
        text(body.description, 2000), url.href, optionalText(body.help, 1000), nowIso(), nowIso()
      ).run();
    } else if (action === 'submission.review') {
      const submissionId = String(body.submissionId || '');
      const status = ['approved','rejected'].includes(body.status) ? body.status : '';
      if (!status) throw new ApiError(400, 'Choose approve or reject.');
      const changed = await db.prepare(
        "UPDATE studio_submissions SET moderation_status = ?, moderation_note = ?, updated_at = ? WHERE id = ? AND challenge_id IN (SELECT id FROM studio_challenges WHERE event_id = ?)"
      ).bind(status, optionalText(body.note, 1000), nowIso(), submissionId, eventId).run();
      if (Number(changed.meta?.changes || 0) !== 1) throw new ApiError(404, 'Creation not found.');
    }

    return json(Object.assign({ ok: true }, await snapshot(db, event, user, capabilities)));
  } catch (error) {
    return json({ ok: false, error: error.message || 'Studio request failed.' }, error.status || 500);
  }
}
