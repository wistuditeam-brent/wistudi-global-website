import {
  activeAssignments, currentUser, dbFor, json, nowIso, sameOrigin,
} from '../_security.js';
import { hasCapability, STUDIO_SCOPE_ID } from '../_policy.js';

const WORKSPACE_ID = 'preview-workspace';
const ALLOWED_DURATIONS = new Set([60, 75, 90, 120]);
const RESOURCE_TYPES = new Set(['flow', 'worksheet', 'video', 'link', 'instructions', 'other']);
const RELEASE_PHASES = new Set(['upcoming', 'live', 'post_session']);

function canReadDraft(assignments, eventId) {
  return hasCapability(assignments, 'event.draft.read', 'event', eventId)
    || hasCapability(assignments, 'event.read', 'event', eventId)
    || hasCapability(assignments, 'studio.events.read', 'studio', STUDIO_SCOPE_ID);
}

function canWriteDraft(assignments, eventId) {
  return hasCapability(assignments, 'event.draft.write', 'event', eventId)
    || hasCapability(assignments, 'event.write', 'event', eventId)
    || hasCapability(assignments, 'event.manage', 'event', eventId);
}

function canCreateDraft(assignments) {
  return hasCapability(assignments, 'event.draft.create', 'studio', STUDIO_SCOPE_ID)
    || hasCapability(assignments, 'studio.events.create', 'studio', STUDIO_SCOPE_ID);
}

function canSeeMeetingLink(assignments, row, userId) {
  return row.created_by === userId
    || hasCapability(assignments, 'event.write', 'event', row.id)
    || hasCapability(assignments, 'studio.events.read', 'studio', STUDIO_SCOPE_ID);
}

function text(value, limit) {
  return String(value == null ? '' : value).trim().slice(0, limit);
}

function safeUrl(value, label) {
  const raw = text(value, 2048);
  if (!raw) return '';
  let parsed;
  try { parsed = new URL(raw); } catch { throw new Error(label + ' must be a valid https link.'); }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
    throw new Error(label + ' must be a valid https link without embedded credentials.');
  }
  return parsed.toString();
}

function localDateParts(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error('Enter a valid event start date and time.');
  const parts = match.slice(1).map(Number);
  const [year, month, day, hour, minute] = parts;
  const wall = Date.UTC(year, month - 1, day, hour, minute, 0);
  const check = new Date(wall);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() + 1 !== month
      || check.getUTCDate() !== day || check.getUTCHours() !== hour
      || check.getUTCMinutes() !== minute) {
    throw new Error('Enter a valid event start date and time.');
  }
  return { parts, wall };
}

function zonedLocalToIso(value, timezone) {
  const { parts, wall } = localDateParts(value);
  let formatter;
  try {
    formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hourCycle: 'h23',
    });
    formatter.format(new Date(wall));
  } catch {
    throw new Error('Choose a valid event timezone.');
  }
  const readParts = instant => {
    const values = {};
    for (const part of formatter.formatToParts(new Date(instant))) {
      if (part.type !== 'literal') values[part.type] = Number(part.value);
    }
    return [values.year, values.month, values.day, values.hour, values.minute, values.second || 0];
  };
  let instant = wall;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const displayed = readParts(instant);
    const displayedAsUtc = Date.UTC(displayed[0], displayed[1] - 1, displayed[2], displayed[3], displayed[4], displayed[5]);
    const correction = displayedAsUtc - wall;
    if (!correction) break;
    instant -= correction;
  }
  const actual = readParts(instant);
  if (actual.slice(0, 5).some((valuePart, index) => valuePart !== parts[index])) {
    throw new Error('That local time does not exist in the selected timezone. Choose another time.');
  }
  return new Date(instant).toISOString();
}

function toLocalDateTime(iso, timezone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  const values = {};
  for (const part of formatter.formatToParts(new Date(iso))) {
    if (part.type !== 'literal') values[part.type] = part.value;
  }
  return values.year + '-' + values.month + '-' + values.day + 'T' + values.hour + ':' + values.minute;
}

function normalizeOutcomes(value) {
  const items = Array.isArray(value) ? value : String(value || '').split(/\r?\n/);
  return items.map(item => text(item, 180)).filter(Boolean).slice(0, 10);
}

function normalizeResources(value) {
  if (!Array.isArray(value) || value.length > 20) throw new Error('Add no more than 20 event resources.');
  return value.map(item => {
    const kind = text(item?.type, 30);
    if (!RESOURCE_TYPES.has(kind)) throw new Error('Choose a supported event resource type.');
    const availableFrom = text(item?.availableFrom, 20) || 'upcoming';
    if (!RELEASE_PHASES.has(availableFrom)) throw new Error('Choose a valid resource release time.');
    const url = safeUrl(item?.url, 'Resource link');
    return {
      clientId: /^[A-Za-z0-9_-]{4,80}$/.test(text(item?.key || item?.id, 80))
        ? text(item.key || item.id, 80) : '',
      type: kind,
      title: text(item?.title, 100),
      description: text(item?.description, 220),
      instructions: text(item?.instructions, 1000),
      fileName: text(item?.fileName, 180),
      url,
      availableFrom,
      publicPreview: availableFrom === 'upcoming' && Boolean(item?.publicPreview),
    };
  }).filter(item => item.title);
}

function normalizePayload(body) {
  const title = text(body.title, 100);
  const summary = text(body.summary, 320);
  const subject = text(body.subject, 40);
  const topic = text(body.topic, 50);
  const level = text(body.level, 32);
  const audience = text(body.audience, 100);
  const trainer = text(body.trainer, 60);
  const output = text(body.output, 220);
  const challengeTitle = text(body.challengeTitle, 100);
  const challengeBrief = text(body.challengeBrief, 400);
  const timezone = text(body.timezone, 80) || 'Asia/Ho_Chi_Minh';
  const duration = Number(body.duration);
  const outcomes = normalizeOutcomes(body.learningOutcomes);
  if (!title || !summary || !subject || !topic || !level || !audience || !trainer
      || !output || !challengeTitle || !challengeBrief || !outcomes.length) {
    throw new Error('Complete the required event details, learning outcomes and build challenge.');
  }
  if (!ALLOWED_DURATIONS.has(duration)) throw new Error('Choose a supported event duration.');
  const startsAt = zonedLocalToIso(text(body.startsAt, 40), timezone);
  const resources = normalizeResources(body.resources);
  return {
    title, summary, subject, topic, level, audience, trainer, output,
    timezone, duration, startsAt,
    endsAt: new Date(new Date(startsAt).getTime() + duration * 60000).toISOString(),
    outcomes, resources, challengeTitle, challengeBrief,
    zoomUrl: safeUrl(body.zoomUrl, 'Zoom link'),
    bannerUrl: safeUrl(body.bannerUrl, 'Banner image'),
    cardImageUrl: safeUrl(body.cardImageUrl, 'Event listing image'),
    mobileCardImageUrl: safeUrl(body.mobileCardImageUrl, 'Mobile listing image'),
    promoVideoUrl: safeUrl(body.promoVideoUrl, 'Promotion video link'),
    imageAlt: text(body.imageAlt, 150),
    discussionPrompt: text(body.discussionPrompt, 180),
    wistudiLink: safeUrl(body.wistudiLink, 'Wistudi link'),
  };
}

function resourceDbType(kind, url) {
  if (kind === 'flow') return 'template';
  if (kind === 'worksheet') return 'worksheet';
  if (kind === 'instructions') return 'guide';
  if (kind === 'link' || (kind === 'video' && url)) return 'link';
  return 'file';
}

function resourceLabel(kind) {
  const labels = {
    flow: 'Wistudi Flow or template',
    worksheet: 'Worksheet or document',
    video: 'Video',
    link: 'External link',
    instructions: 'Step-by-step instructions',
    other: 'Other resource',
  };
  return labels[kind] || 'Event resource';
}

function parseContent(value) {
  try { return JSON.parse(value || '{}'); } catch { return {}; }
}

async function serializeEvent(db, row, assignments, userId) {
  const [resourceRows, challenge] = await Promise.all([
    db.prepare(
      'SELECT id, type, label, title, description, available_from, public_preview, content_json ' +
      'FROM studio_resources WHERE event_id = ? ORDER BY created_at, id'
    ).bind(row.id).all(),
    db.prepare(
      'SELECT id, title, description FROM studio_challenges WHERE event_id = ? ORDER BY created_at LIMIT 1'
    ).bind(row.id).first(),
  ]);
  const outcomes = (() => { try { return JSON.parse(row.learning_outcomes_json || '[]'); } catch { return []; } })();
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    subject: row.subject || '',
    topic: row.topic || '',
    level: row.level || '',
    audience: row.audience || '',
    trainer: row.trainer || '',
    startsAt: row.starts_at,
    startsAtLocal: toLocalDateTime(row.starts_at, row.timezone || 'UTC'),
    timezone: row.timezone || 'UTC',
    duration: Number(row.duration_minutes || 60),
    output: row.output || '',
    learningOutcomes: Array.isArray(outcomes) ? outcomes : [],
    zoomUrl: canSeeMeetingLink(assignments, row, userId) ? (row.meeting_url || '') : '',
    bannerUrl: row.banner_url || '',
    cardImageUrl: row.card_image_url || '',
    mobileCardImageUrl: row.mobile_card_image_url || '',
    promoVideoUrl: row.promo_video_url || '',
    imageAlt: row.image_alt || '',
    discussionPrompt: row.discussion_prompt || '',
    wistudiLink: row.wistudi_link || '',
    challengeTitle: challenge?.title || '',
    challengeBrief: challenge?.description || '',
    resources: (resourceRows.results || []).map(item => {
      const content = parseContent(item.content_json);
      return {
        key: item.id,
        type: content.originalType || (item.type === 'template' ? 'flow' : item.type === 'guide' ? 'instructions' : item.type),
        title: item.title,
        description: item.description,
        url: content.url || '',
        instructions: content.instructions || '',
        fileName: content.fileName || '',
        availableFrom: item.available_from || 'upcoming',
        publicPreview: Boolean(item.public_preview),
      };
    }),
    updatedAt: row.updated_at,
  };
}

async function authorizedDrafts(context, user) {
  const db = dbFor(context);
  const assignments = await activeAssignments(db, user.id);
  const result = await db.prepare(
    "SELECT * FROM studio_events WHERE workspace_id = ? AND status = 'draft' ORDER BY updated_at DESC LIMIT 100"
  ).bind(WORKSPACE_ID).all();
  const events = [];
  for (const row of result.results || []) {
    if (!canReadDraft(assignments, row.id)) continue;
    events.push(await serializeEvent(db, row, assignments, user.id));
  }
  return events;
}

export async function onRequestGet(context) {
  const db = dbFor(context);
  if (!db) return json({ error: 'Shared Studio database is not configured.' }, 503);
  const user = await currentUser(context);
  if (!user) return json({ error: 'Sign in to access shared event drafts.' }, 401);
  try {
    return json({ events: await authorizedDrafts(context, user) });
  } catch {
    return json({ error: 'Could not load shared event drafts. Check the Publisher Studio database migration.' }, 500);
  }
}

export async function onRequestPost(context) {
  if (!sameOrigin(context.request)) return json({ error: 'Request origin could not be verified.' }, 403);
  const db = dbFor(context);
  if (!db) return json({ error: 'Shared Studio database is not configured.' }, 503);
  const user = await currentUser(context);
  if (!user) return json({ error: 'Sign in before saving a shared event draft.' }, 401);
  const assignments = await activeAssignments(db, user.id);
  const contentLength = Number(context.request.headers.get('Content-Length') || 0);
  if (contentLength > 65536) return json({ error: 'This event draft is too large to save.' }, 413);

  let body;
  try { body = await context.request.json(); }
  catch { return json({ error: 'Send a valid event draft.' }, 400); }

  let draft;
  try { draft = normalizePayload(body); }
  catch (error) { return json({ error: error.message || 'Check the event details.' }, 400); }

  const eventId = text(body.eventId, 80);
  let existing = null;
  if (eventId) {
    existing = await db.prepare(
      'SELECT * FROM studio_events WHERE id = ? AND workspace_id = ? LIMIT 1'
    ).bind(eventId, WORKSPACE_ID).first();
    if (!existing || existing.status !== 'draft') return json({ error: 'This draft no longer exists or is no longer editable.' }, 404);
    if (!canWriteDraft(assignments, existing.id)) return json({ error: 'You do not have permission to edit this event draft.' }, 403);
  } else if (!canCreateDraft(assignments)) {
    return json({ error: 'Event Builder access is required to create a shared draft.' }, 403);
  }

  const workspace = await db.prepare('SELECT id FROM studio_workspaces WHERE id = ?').bind(WORKSPACE_ID).first();
  if (!workspace) return json({ error: 'The Publisher Studio workspace has not been initialized.' }, 503);

  const id = existing?.id || crypto.randomUUID();
  const slug = existing?.slug || (draft.title.toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 56) + '-' + id.slice(0, 8));
  const timestamp = nowIso();
  const meetingUrl = existing && !canSeeMeetingLink(assignments, existing, user.id)
    ? (existing.meeting_url || null) : (draft.zoomUrl || null);
  const bannerUrl = draft.bannerUrl || (existing?.banner_url || null);
  const cardImageUrl = draft.cardImageUrl || (existing?.card_image_url || null);
  const mobileCardImageUrl = draft.mobileCardImageUrl || (existing?.mobile_card_image_url || null);

  const statements = [];
  if (existing) {
    statements.push(db.prepare(
      'UPDATE studio_events SET title = ?, summary = ?, subject = ?, topic = ?, level = ?, audience = ?, trainer = ?, ' +
      'starts_at = ?, ends_at = ?, timezone = ?, duration_minutes = ?, format = ?, banner_url = ?, meeting_url = ?, ' +
      'meeting_mode = ?, output = ?, learning_outcomes_json = ?, card_image_url = ?, mobile_card_image_url = ?, ' +
      'promo_video_url = ?, image_alt = ?, discussion_prompt = ?, wistudi_link = ?, updated_at = ? ' +
      "WHERE id = ? AND workspace_id = ? AND status = 'draft'"
    ).bind(
      draft.title, draft.summary, draft.subject, draft.topic, draft.level, draft.audience, draft.trainer,
      draft.startsAt, draft.endsAt, draft.timezone, draft.duration, 'online workshop', bannerUrl, meetingUrl,
      meetingUrl ? 'zoom' : 'online', draft.output, JSON.stringify(draft.outcomes), cardImageUrl, mobileCardImageUrl,
      draft.promoVideoUrl || null, draft.imageAlt, draft.discussionPrompt, draft.wistudiLink || null, timestamp,
      id, WORKSPACE_ID
    ));
  } else {
    statements.push(db.prepare(
      'INSERT INTO studio_events ' +
      '(id, workspace_id, slug, title, summary, subject, topic, level, audience, trainer, starts_at, ends_at, timezone, ' +
      'duration_minutes, format, status, banner_url, meeting_url, meeting_mode, output, learning_outcomes_json, ' +
      'card_image_url, mobile_card_image_url, promo_video_url, image_alt, discussion_prompt, wistudi_link, created_by, created_at, updated_at) ' +
      "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      id, WORKSPACE_ID, slug, draft.title, draft.summary, draft.subject, draft.topic, draft.level, draft.audience,
      draft.trainer, draft.startsAt, draft.endsAt, draft.timezone, draft.duration, 'online workshop', bannerUrl,
      meetingUrl, meetingUrl ? 'zoom' : 'online', draft.output, JSON.stringify(draft.outcomes), cardImageUrl,
      mobileCardImageUrl, draft.promoVideoUrl || null, draft.imageAlt, draft.discussionPrompt,
      draft.wistudiLink || null, user.id, timestamp, timestamp
    ));
  }

  const challenge = existing
    ? await db.prepare('SELECT id FROM studio_challenges WHERE event_id = ? ORDER BY created_at LIMIT 1').bind(id).first()
    : null;
  if (challenge) {
    statements.push(db.prepare(
      "UPDATE studio_challenges SET title = ?, description = ?, status = 'draft', updated_at = ? WHERE id = ?"
    ).bind(draft.challengeTitle, draft.challengeBrief, timestamp, challenge.id));
  } else {
    statements.push(db.prepare(
      "INSERT INTO studio_challenges (id, event_id, title, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'draft', ?, ?)"
    ).bind(crypto.randomUUID(), id, draft.challengeTitle, draft.challengeBrief, timestamp, timestamp));
  }

  const oldResources = existing
    ? await db.prepare('SELECT id FROM studio_resources WHERE event_id = ?').bind(id).all()
    : { results: [] };
  const oldIds = new Set((oldResources.results || []).map(item => item.id));
  const retainedIds = [];
  const normalizedResources = draft.resources.map(item => {
    const resourceId = item.clientId && oldIds.has(item.clientId) ? item.clientId : crypto.randomUUID();
    retainedIds.push(resourceId);
    return { ...item, id: resourceId };
  });
  const deleteParams = [id, ...retainedIds];
  const deleteSql = retainedIds.length
    ? 'DELETE FROM studio_resources WHERE event_id = ? AND id NOT IN (' + retainedIds.map(() => '?').join(',') + ')'
    : 'DELETE FROM studio_resources WHERE event_id = ?';
  statements.push(db.prepare(deleteSql).bind(...deleteParams));
  for (const item of normalizedResources) {
    const dbType = resourceDbType(item.type, item.url);
    const content = JSON.stringify({
      originalType: item.type,
      url: item.url,
      instructions: item.instructions,
      fileName: item.fileName,
    });
    if (oldIds.has(item.id)) {
      statements.push(db.prepare(
        'UPDATE studio_resources SET type = ?, label = ?, title = ?, description = ?, available_from = ?, ' +
        'public_preview = ?, content_json = ?, updated_at = ? WHERE id = ? AND event_id = ?'
      ).bind(
        dbType, resourceLabel(item.type), item.title, item.description, item.availableFrom,
        item.publicPreview ? 1 : 0, content, timestamp, item.id, id
      ));
    } else {
      statements.push(db.prepare(
        'INSERT INTO studio_resources (id, event_id, type, label, title, description, available_from, public_preview, content_json, created_at, updated_at) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        item.id, id, dbType, resourceLabel(item.type), item.title, item.description, item.availableFrom,
        item.publicPreview ? 1 : 0, content, timestamp, timestamp
      ));
    }
  }

  try {
    await db.batch(statements);
    const saved = await db.prepare('SELECT * FROM studio_events WHERE id = ?').bind(id).first();
    const serialized = await serializeEvent(db, saved, assignments, user.id);
    return json({ event: serialized, events: await authorizedDrafts(context, user) }, existing ? 200 : 201);
  } catch {
    return json({ error: 'The draft could not be saved. Check that migration 0004_event_builder_drafts is applied.' }, 500);
  }
}
