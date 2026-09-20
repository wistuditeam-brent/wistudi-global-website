const json = (data, init = {}) => Response.json(data, {
  ...init,
  headers: {
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    ...(init.headers || {}),
  },
});

const text = (value, max) => {
  const out = String(value ?? '').trim();
  if (!out || out.length > max) throw new Error(`Expected 1-${max} characters.`);
  return out;
};

const optionalText = (value, max) => {
  const out = String(value ?? '').trim();
  if (out.length > max) throw new Error(`Expected at most ${max} characters.`);
  return out;
};

const validId = value => /^[A-Za-z0-9._:-]{1,120}$/.test(String(value || ''));
const now = () => new Date().toISOString();

async function requireEvent(db, eventId) {
  const row = await db.prepare('SELECT id FROM studio_events WHERE id = ?').bind(eventId).first();
  if (!row) throw new Error('Unknown event.');
}

async function ensureContext(db, eventId, contextId) {
  if (contextId === eventId) return 'workshop';
  const challenge = await db.prepare('SELECT id FROM studio_challenges WHERE id = ? AND event_id = ?').bind(contextId, eventId).first();
  if (challenge) return 'challenge';
  const resource = await db.prepare('SELECT type FROM studio_resources WHERE id = ? AND event_id = ?').bind(contextId, eventId).first();
  if (resource) return resource.type;
  throw new Error('Unknown event context.');
}

async function upsertUser(db, user) {
  if (!user?.id || !validId(user.id)) return null;
  const displayName = text(user.displayName, 60);
  await db.prepare(`
    INSERT INTO studio_users (id, display_name, avatar_seed, status, created_at, updated_at)
    VALUES (?, ?, ?, 'active', ?, ?)
    ON CONFLICT(id) DO UPDATE SET display_name = excluded.display_name, avatar_seed = excluded.avatar_seed, updated_at = excluded.updated_at
  `).bind(user.id, displayName, optionalText(user.avatarSeed, 120) || user.id, now(), now()).run();
  return user.id;
}

async function bootstrap(db, eventId, userId) {
  await requireEvent(db, eventId);
  const qRows = await db.prepare(`
    SELECT q.*, COUNT(v.user_id) AS vote_count,
      MAX(CASE WHEN v.user_id = ? THEN 1 ELSE 0 END) AS voted_by_user
    FROM studio_questions q
    LEFT JOIN studio_question_votes v ON v.question_id = q.id
    WHERE q.event_id = ? AND q.status != 'hidden'
    GROUP BY q.id
    ORDER BY q.created_at DESC
  `).bind(userId || '', eventId).all();

  const tRows = await db.prepare(`
    SELECT t.*,
      (SELECT COUNT(*) FROM studio_thread_reactions r WHERE r.thread_id = t.id AND r.reaction = 'heart') AS hearts,
      (SELECT COUNT(*) FROM studio_thread_reactions r WHERE r.thread_id = t.id AND r.user_id = ? AND r.reaction = 'heart') AS hearted_by_user
    FROM studio_threads t
    WHERE t.event_id = ? AND t.status != 'hidden'
    ORDER BY t.created_at DESC
  `).bind(userId || '', eventId).all();

  const threadIds = (tRows.results || []).map(r => r.id);
  let replies = [];
  if (threadIds.length) {
    const placeholders = threadIds.map(() => '?').join(',');
    replies = (await db.prepare(`
      SELECT * FROM studio_thread_replies
      WHERE thread_id IN (${placeholders}) AND status != 'hidden'
      ORDER BY created_at ASC
    `).bind(...threadIds).all()).results || [];
  }

  const sRows = await db.prepare(`
    SELECT * FROM studio_submissions
    WHERE challenge_id IN (SELECT id FROM studio_challenges WHERE event_id = ?)
    ORDER BY created_at DESC
  `).bind(eventId).all();

  const replyMap = new Map();
  for (const reply of replies) {
    if (!replyMap.has(reply.thread_id)) replyMap.set(reply.thread_id, []);
    replyMap.get(reply.thread_id).push({
      id: reply.id, author: reply.author_name, body: reply.body,
      attachments: JSON.parse(reply.attachments_json || '[]'),
    });
  }

  return {
    questions: (qRows.results || []).map(q => ({
      id: q.id, author: q.author_name, body: q.body, contextId: q.context_id,
      votes: Number(q.vote_count || 0), answer: q.answer, createdAt: q.created_at,
      votedByUser: Boolean(q.voted_by_user),
    })),
    threads: (tRows.results || []).map(t => ({
      id: t.id, author: t.author_name, title: t.title, body: t.body, kind: t.kind,
      contextId: t.context_id, replies: replyMap.get(t.id) || [],
      attachments: JSON.parse(t.attachments_json || '[]'),
      relatedContextIds: JSON.parse(t.related_context_ids_json || '[]'),
      relatedItems: JSON.parse(t.related_items_json || '[]'),
      hearts: Number(t.hearts || 0), heartedByUser: Boolean(t.hearted_by_user),
    })),
    submissions: (sRows.results || []).map(s => ({
      id: s.id, author: s.author_name, challengeId: s.challenge_id, title: s.title,
      description: s.description, url: s.url, help: s.help_text,
      moderationStatus: s.moderation_status, createdAt: s.created_at,
    })),
  };
}

export async function onRequestGet(context) {
  const db = context.env.PUBLISHER_STUDIO_DB;
  if (!db) return json({ ok: false, error: 'PUBLISHER_STUDIO_DB binding missing' }, { status: 500 });
  try {
    const url = new URL(context.request.url);
    const eventId = url.searchParams.get('eventId') || '';
    const userId = url.searchParams.get('userId') || '';
    if (!validId(eventId) || (userId && !validId(userId))) return json({ ok: false, error: 'Invalid request.' }, { status: 400 });
    return json({ ok: true, ...(await bootstrap(db, eventId, userId)) });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : 'Request failed.' }, { status: 400 });
  }
}

export async function onRequestPost(context) {
  const db = context.env.PUBLISHER_STUDIO_DB;
  if (!db) return json({ ok: false, error: 'PUBLISHER_STUDIO_DB binding missing' }, { status: 500 });
  try {
    const body = await context.request.json();
    const action = String(body?.action || '');
    const eventId = String(body?.eventId || '');
    if (!validId(eventId)) throw new Error('Invalid event.');
    await requireEvent(db, eventId);
    const userId = await upsertUser(db, body.user || null);
    const authorName = body.user?.displayName ? text(body.user.displayName, 60) : text(body.authorName || 'Preview participant', 60);

    if (action === 'profile.upsert') {
      if (!userId) throw new Error('A Studio profile is required.');
    } else if (action === 'question.create') {
      const id = crypto.randomUUID();
      const contextId = String(body.contextId || eventId);
      const contextType = await ensureContext(db, eventId, contextId);
      await db.prepare(`
        INSERT INTO studio_questions
        (id, workspace_id, event_id, context_id, context_type, author_user_id, author_name, body, created_at, updated_at)
        VALUES (?, 'preview-workspace', ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(id, eventId, contextId, contextType, userId, authorName, text(body.text, 2000), now(), now()).run();
    } else if (action === 'question.vote') {
      if (!userId) throw new Error('Create a Studio profile before voting.');
      const questionId = String(body.questionId || '');
      const exists = await db.prepare('SELECT id FROM studio_questions WHERE id = ? AND event_id = ?').bind(questionId, eventId).first();
      if (!exists) throw new Error('Question not found.');
      const existing = await db.prepare('SELECT question_id FROM studio_question_votes WHERE question_id = ? AND user_id = ?').bind(questionId, userId).first();
      if (existing) await db.prepare('DELETE FROM studio_question_votes WHERE question_id = ? AND user_id = ?').bind(questionId, userId).run();
      else await db.prepare('INSERT INTO studio_question_votes (question_id, user_id, created_at) VALUES (?, ?, ?)').bind(questionId, userId, now()).run();
    } else if (action === 'thread.create') {
      const id = crypto.randomUUID();
      const contextId = String(body.contextId || eventId);
      const contextType = await ensureContext(db, eventId, contextId);
      const kind = ['idea','need_help','can_help','made_something'].includes(body.kind) ? body.kind : 'idea';
      await db.prepare(`
        INSERT INTO studio_threads
        (id, workspace_id, event_id, context_id, context_type, author_user_id, author_name, kind, title, body,
         related_context_ids_json, related_items_json, attachments_json, created_at, updated_at)
        VALUES (?, 'preview-workspace', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, eventId, contextId, contextType, userId, authorName, kind,
        optionalText(body.title, 120), text(body.text, 2000),
        JSON.stringify(Array.isArray(body.relatedContextIds) ? body.relatedContextIds.slice(0, 12) : []),
        JSON.stringify(Array.isArray(body.relatedItems) ? body.relatedItems.slice(0, 12) : []),
        JSON.stringify(Array.isArray(body.attachments) ? body.attachments.slice(0, 8) : []),
        now(), now()
      ).run();
    } else if (action === 'thread.reply') {
      const threadId = String(body.threadId || '');
      const thread = await db.prepare('SELECT id FROM studio_threads WHERE id = ? AND event_id = ?').bind(threadId, eventId).first();
      if (!thread) throw new Error('Conversation not found.');
      await db.prepare(`
        INSERT INTO studio_thread_replies
        (id, thread_id, author_user_id, author_name, body, attachments_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), threadId, userId, authorName, text(body.text, 2000),
        JSON.stringify(Array.isArray(body.attachments) ? body.attachments.slice(0, 8) : []), now(), now()
      ).run();
    } else if (action === 'thread.heart') {
      if (!userId) throw new Error('Create a Studio profile before reacting.');
      const threadId = String(body.threadId || '');
      const thread = await db.prepare('SELECT id FROM studio_threads WHERE id = ? AND event_id = ?').bind(threadId, eventId).first();
      if (!thread) throw new Error('Conversation not found.');
      const existing = await db.prepare("SELECT thread_id FROM studio_thread_reactions WHERE thread_id = ? AND user_id = ? AND reaction = 'heart'").bind(threadId, userId).first();
      if (existing) await db.prepare("DELETE FROM studio_thread_reactions WHERE thread_id = ? AND user_id = ? AND reaction = 'heart'").bind(threadId, userId).run();
      else await db.prepare("INSERT INTO studio_thread_reactions (thread_id, user_id, reaction, created_at) VALUES (?, ?, 'heart', ?)").bind(threadId, userId, now()).run();
    } else if (action === 'submission.create') {
      const challengeId = String(body.challengeId || '');
      const challenge = await db.prepare('SELECT id FROM studio_challenges WHERE id = ? AND event_id = ?').bind(challengeId, eventId).first();
      if (!challenge) throw new Error('Challenge not found.');
      const url = new URL(String(body.url || ''));
      if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Use a complete https:// link.');
      await db.prepare(`
        INSERT INTO studio_submissions
        (id, challenge_id, author_user_id, author_name, title, description, url, help_text, moderation_status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
      `).bind(
        crypto.randomUUID(), challengeId, userId, authorName, text(body.title, 120),
        text(body.description, 2000), url.href, optionalText(body.help, 1000), now(), now()
      ).run();
    } else {
      throw new Error('Unsupported action.');
    }

    return json({ ok: true, ...(await bootstrap(db, eventId, userId || '')) });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : 'Request failed.' }, { status: 400 });
  }
}
