import {
  activeAssignments, constantTimeEqual, currentUser, dbFor, isValidEmail, json,
  normalizeEmail, nowIso, randomToken, sameOrigin, sha256,
} from '../_security.js';
import {
  canGrantRole, eventCapabilities, PLATFORM_SCOPE_ID, ROLE_NAMES, STUDIO_SCOPE_ID,
} from '../_policy.js';

const labels = {
  platform_super_admin: 'Wistudi Super Admin',
  studio_admin: 'Studio Admin',
  event_builder: 'Event Builder',
  event_lead: 'Event Lead / Trainer',
  event_co_trainer: 'Co-trainer',
  event_moderator: 'Event Moderator',
};
const ApiError = class extends Error {
  constructor(status, message) { super(message); this.status = status; }
};
const id = () => crypto.randomUUID();
const daysFromNow = days => new Date(Date.now() + days * 86400000).toISOString();
const isRoot = rows => rows.some(row => row.role === 'platform_super_admin'
  && row.scopeType === 'platform' && row.scopeId === PLATFORM_SCOPE_ID);
const isStudioAdmin = rows => rows.some(row => row.role === 'studio_admin'
  && row.scopeType === 'studio' && row.scopeId === STUDIO_SCOPE_ID);

async function sendInvite(env, email, role, link) {
  const key = env.RESEND_API_KEY;
  const from = env.STUDIO_AUTH_FROM || env.CONTACT_FROM_EMAIL;
  if (!key || !from) return false;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: from,
        to: [email],
        subject: 'You have been invited to Wistudi Publisher Studio',
        text: 'You have been invited as ' + (labels[role] || role) + '. Open this secure invitation link to sign in or join: ' + link + '. The link expires in 7 days.',
      }),
    });
    return response.ok;
  } catch { return false; }
}

async function audit(db, actor, action, details) {
  await db.prepare(
    'INSERT INTO studio_role_audit ' +
    '(id, actor_user_id, action, target_user_id, target_email_normalized, role, scope_type, scope_id, invitation_id, reason, created_at) ' +
    'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    id(), actor.id, action, details.targetUserId || null, details.email || null,
    details.role || null, details.scopeType || null, details.scopeId || null,
    details.invitationId || null, details.reason || '', nowIso()
  ).run();
}

async function eventRoster(db, eventId) {
  const rows = await db.prepare(
    'SELECT r.id, COALESCE(NULLIF(r.display_name, \'\'), u.display_name, \'Participant\') AS display_name, ' +
    'r.email, r.status, r.consent_to_studio, r.registered_at ' +
    'FROM studio_event_registrations r LEFT JOIN studio_users u ON u.id = r.user_id ' +
    'WHERE r.event_id = ? ORDER BY r.registered_at DESC LIMIT 500'
  ).bind(eventId).all();
  return (rows.results || []).map(row => ({
    id: row.id,
    displayName: row.display_name,
    email: row.email || '',
    status: row.status,
    studioConsent: Boolean(row.consent_to_studio),
    registeredAt: row.registered_at,
  }));
}

async function overview(context, db, user) {
  const now = nowIso();
  const myAssignments = await activeAssignments(db, user.id);
  const root = isRoot(myAssignments);
  const studioAdmin = isStudioAdmin(myAssignments);
  const superAdminCount = await db.prepare(
    'SELECT COUNT(*) AS total FROM studio_role_assignments WHERE role = ? AND scope_type = ? AND scope_id = ? ' +
    'AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > ?)'
  ).bind('platform_super_admin', 'platform', PLATFORM_SCOPE_ID, now).first();
  const setupRequired = Number(superAdminCount?.total || 0) === 0;

  const eventRows = await db.prepare(
    "SELECT id, title, slug, status, starts_at FROM studio_events WHERE workspace_id = 'preview-workspace' ORDER BY starts_at ASC"
  ).all();
  const events = [];
  for (const event of eventRows.results || []) {
    const caps = await eventCapabilities(db, user.id, event.id);
    if (!caps.canManage) continue;
    const settings = await db.prepare('SELECT * FROM studio_event_controls WHERE event_id = ?').bind(event.id).first();
    events.push({
      id: event.id,
      title: event.title,
      slug: event.slug,
      status: event.status,
      startsAt: event.starts_at,
      roomOpen: settings ? Boolean(settings.room_open) : true,
      registrationOpen: settings ? Boolean(settings.registration_open) : true,
      features: {
        questions: settings ? Boolean(settings.questions_enabled) : true,
        chat: settings ? Boolean(settings.chat_enabled) : true,
        build: settings ? Boolean(settings.build_enabled) : true,
        resources: settings ? Boolean(settings.resources_enabled) : true,
      },
      participants: await eventRoster(db, event.id),
    });
  }

  const candidates = [
    { role: 'platform_super_admin', scopeType: 'platform', scopeId: PLATFORM_SCOPE_ID, label: 'Wistudi' },
    { role: 'studio_admin', scopeType: 'studio', scopeId: STUDIO_SCOPE_ID, label: 'Publisher Studio' },
    { role: 'event_builder', scopeType: 'studio', scopeId: STUDIO_SCOPE_ID, label: 'Publisher Studio' },
  ];
  for (const event of eventRows.results || []) {
    for (const role of ['event_lead', 'event_co_trainer', 'event_moderator']) {
      candidates.push({ role: role, scopeType: 'event', scopeId: event.id, label: event.title });
    }
  }
  const inviteOptions = [];
  for (const candidate of candidates) {
    if (await canGrantRole(db, user.id, candidate.role, candidate.scopeType, candidate.scopeId)) {
      inviteOptions.push(Object.assign({}, candidate, {
        roleLabel: labels[candidate.role], scopeLabel: candidate.label,
      }));
    }
  }

  const activeRows = await db.prepare(
    'SELECT a.id, a.studio_user_id, a.role, a.scope_type, a.scope_id, a.created_at, a.expires_at, ' +
    'u.display_name, u.email FROM studio_role_assignments a JOIN studio_users u ON u.id = a.studio_user_id ' +
    'WHERE a.revoked_at IS NULL AND (a.expires_at IS NULL OR a.expires_at > ?) ORDER BY a.created_at DESC LIMIT 500'
  ).bind(now).all();
  const managedAssignments = [];
  for (const row of activeRows.results || []) {
    if (await canGrantRole(db, user.id, row.role, row.scope_type, row.scope_id)) {
      managedAssignments.push({
        id: row.id, userId: row.studio_user_id, displayName: row.display_name,
        email: row.email, role: row.role, roleLabel: labels[row.role] || row.role,
        scopeType: row.scope_type, scopeId: row.scope_id,
        createdAt: row.created_at, expiresAt: row.expires_at, canRevoke: true,
      });
    }
  }

  const invitationRows = await db.prepare(
    "SELECT id, email_normalized, role, scope_type, scope_id, status, expires_at, created_at " +
    "FROM studio_role_invitations WHERE status = 'pending' ORDER BY created_at DESC LIMIT 500"
  ).all();
  const invitations = [];
  for (const row of invitationRows.results || []) {
    if (await canGrantRole(db, user.id, row.role, row.scope_type, row.scope_id)) {
      invitations.push({
        id: row.id, email: row.email_normalized, role: row.role,
        roleLabel: labels[row.role] || row.role, scopeType: row.scope_type,
        scopeId: row.scope_id, status: row.status, expiresAt: row.expires_at,
        createdAt: row.created_at,
      });
    }
  }

  const ownRoles = myAssignments.map(row => ({
    id: row.id, role: row.role, roleLabel: labels[row.role] || row.role,
    scopeType: row.scopeType, scopeId: row.scopeId,
    createdAt: row.createdAt, expiresAt: row.expiresAt,
  }));

  let auditRows = [];
  if (root || studioAdmin || myAssignments.some(row => row.role === 'event_lead')) {
    const rows = await db.prepare(
      'SELECT a.id, a.actor_user_id, a.action, a.target_email_normalized, a.role, a.scope_type, a.scope_id, a.reason, a.created_at, u.display_name AS actor_name ' +
      'FROM studio_role_audit a JOIN studio_users u ON u.id = a.actor_user_id ORDER BY a.created_at DESC LIMIT 100'
    ).all();
    auditRows = (rows.results || []).filter(row =>
      root || studioAdmin || (row.scope_type === 'event' && myAssignments.some(item => item.role === 'event_lead' && item.scopeId === row.scope_id))
    ).map(row => ({
      id: row.id, actor: row.actor_name, action: row.action, email: row.target_email_normalized || '',
      role: labels[row.role] || row.role || '', scopeType: row.scope_type || '',
      scopeId: row.scope_id || '', reason: row.reason, createdAt: row.created_at,
    }));
  }

  return {
    ok: true,
    user: { id: user.id, email: user.email, displayName: user.displayName },
    setupRequired: setupRequired,
    isPlatformSuperAdmin: root,
    isStudioAdmin: studioAdmin,
    roles: ownRoles,
    inviteOptions: inviteOptions,
    assignments: managedAssignments,
    invitations: invitations,
    events: events,
    audit: auditRows,
  };
}

async function requireActor(context, db) {
  const user = await currentUser(context);
  if (!user) throw new ApiError(401, 'Sign in with a verified email to manage Studio access.');
  return user;
}

export async function onRequestGet(context) {
  const db = dbFor(context);
  if (!db) return json({ ok: false, error: 'Studio database is not configured.' }, 503);
  try {
    const user = await requireActor(context, db);
    return json(await overview(context, db, user));
  } catch (error) {
    return json({ ok: false, error: error.message || 'Could not load Studio access.' }, error.status || 500);
  }
}

export async function onRequestPost(context) {
  const db = dbFor(context);
  if (!db) return json({ ok: false, error: 'Studio database is not configured.' }, 503);
  if (!sameOrigin(context.request)) return json({ ok: false, error: 'Request origin could not be verified.' }, 403);
  let body;
  try {
    const raw = await context.request.text();
    if (raw.length > 12000) return json({ ok: false, error: 'Request is too large.' }, 413);
    body = JSON.parse(raw);
  } catch { return json({ ok: false, error: 'Invalid request.' }, 400); }

  try {
    const user = await requireActor(context, db);
    const action = String(body.action || '');

    if (action === 'bootstrap') {
      const secret = String(context.env.PUBLISHER_STUDIO_BOOTSTRAP_SECRET || '');
      if (secret.length < 32 || !constantTimeEqual(String(body.secret || ''), secret)) {
        throw new ApiError(403, 'The owner setup key is missing or does not match.');
      }
      const createdAt = nowIso();
      const assignmentId = id();
      const bootstrapped = await db.prepare(
        'INSERT INTO studio_role_assignments (id, studio_user_id, role, scope_type, scope_id, assigned_by, created_at) ' +
        'SELECT ?, ?, ?, ?, ?, ?, ? WHERE NOT EXISTS (' +
        'SELECT 1 FROM studio_role_assignments WHERE role = ? AND scope_type = ? AND scope_id = ? ' +
        'AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > ?))'
      ).bind(
        assignmentId, user.id, 'platform_super_admin', 'platform', PLATFORM_SCOPE_ID, user.id, createdAt,
        'platform_super_admin', 'platform', PLATFORM_SCOPE_ID, createdAt
      ).run();
      if (Number(bootstrapped.meta?.changes || 0) !== 1) {
        throw new ApiError(409, 'The first Super Admin has already been assigned.');
      }
      await audit(db, user, 'platform_super_admin.bootstrapped', {
        targetUserId: user.id, email: user.email, role: 'platform_super_admin',
        scopeType: 'platform', scopeId: PLATFORM_SCOPE_ID, reason: 'Initial Studio owner setup',
      });
      return json(await overview(context, db, user));
    }

    if (action === 'invite') {
      const email = normalizeEmail(body.email);
      const role = String(body.role || '');
      const scopeType = String(body.scopeType || '');
      const scopeId = String(body.scopeId || '');
      if (!isValidEmail(email) || !ROLE_NAMES.includes(role)) throw new ApiError(400, 'Enter a valid email and role.');
      if (!(await canGrantRole(db, user.id, role, scopeType, scopeId))) throw new ApiError(403, 'You cannot assign that role in this scope.');
      const already = await db.prepare(
        'SELECT a.id FROM studio_role_assignments a JOIN studio_users u ON u.id = a.studio_user_id ' +
        'WHERE lower(u.email) = ? AND a.role = ? AND a.scope_type = ? AND a.scope_id = ? ' +
        'AND a.revoked_at IS NULL AND (a.expires_at IS NULL OR a.expires_at > ?) LIMIT 1'
      ).bind(email, role, scopeType, scopeId, nowIso()).first();
      if (already) throw new ApiError(409, 'That person already has this active role.');
      const pending = await db.prepare(
        "SELECT id FROM studio_role_invitations WHERE email_normalized = ? AND role = ? AND scope_type = ? AND scope_id = ? AND status = 'pending' AND expires_at > ? LIMIT 1"
      ).bind(email, role, scopeType, scopeId, nowIso()).first();
      if (pending) throw new ApiError(409, 'An invitation for this role is already pending. Reissue it from the invitation list.');
      const invitationId = id();
      const token = randomToken(32);
      const createdAt = nowIso();
      const expiresAt = daysFromNow(7);
      await db.prepare(
        'INSERT INTO studio_role_invitations (id, email_normalized, role, scope_type, scope_id, invited_by, token_hash, status, expires_at, created_at) ' +
        "VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)"
      ).bind(invitationId, email, role, scopeType, scopeId, user.id, await sha256(token), expiresAt, createdAt).run();
      await audit(db, user, 'role.invited', {
        email: email, role: role, scopeType: scopeType, scopeId: scopeId,
        invitationId: invitationId, reason: 'Role invitation created',
      });
      const link = new URL('/publisher-studio/?invite=' + encodeURIComponent(token), context.request.url).href;
      const emailSent = await sendInvite(context.env, email, role, link);
      return json(Object.assign(await overview(context, db, user), {
        invitationLink: link, invitationEmailSent: emailSent,
      }));
    }

    if (action === 'invitation.reissue') {
      const invitationId = String(body.invitationId || '');
      const invitation = await db.prepare(
        "SELECT * FROM studio_role_invitations WHERE id = ? AND status = 'pending' LIMIT 1"
      ).bind(invitationId).first();
      if (!invitation) throw new ApiError(404, 'Pending invitation not found.');
      if (!(await canGrantRole(db, user.id, invitation.role, invitation.scope_type, invitation.scope_id))) {
        throw new ApiError(403, 'You cannot manage this invitation.');
      }
      const token = randomToken(32);
      const expiresAt = daysFromNow(7);
      const update = await db.prepare(
        "UPDATE studio_role_invitations SET token_hash = ?, expires_at = ?, created_at = ? WHERE id = ? AND status = 'pending'"
      ).bind(await sha256(token), expiresAt, nowIso(), invitationId).run();
      if (Number(update.meta?.changes || 0) !== 1) throw new ApiError(409, 'Invitation changed. Refresh and try again.');
      await audit(db, user, 'role.invitation.reissued', {
        email: invitation.email_normalized, role: invitation.role,
        scopeType: invitation.scope_type, scopeId: invitation.scope_id, invitationId: invitationId,
      });
      const link = new URL('/publisher-studio/?invite=' + encodeURIComponent(token), context.request.url).href;
      const emailSent = await sendInvite(context.env, invitation.email_normalized, invitation.role, link);
      return json(Object.assign(await overview(context, db, user), {
        invitationLink: link, invitationEmailSent: emailSent,
      }));
    }

    if (action === 'invitation.revoke') {
      const invitationId = String(body.invitationId || '');
      const invitation = await db.prepare(
        "SELECT * FROM studio_role_invitations WHERE id = ? AND status = 'pending' LIMIT 1"
      ).bind(invitationId).first();
      if (!invitation) throw new ApiError(404, 'Pending invitation not found.');
      if (!(await canGrantRole(db, user.id, invitation.role, invitation.scope_type, invitation.scope_id))) {
        throw new ApiError(403, 'You cannot revoke this invitation.');
      }
      await db.prepare(
        "UPDATE studio_role_invitations SET status = 'revoked', revoked_at = ? WHERE id = ? AND status = 'pending'"
      ).bind(nowIso(), invitationId).run();
      await audit(db, user, 'role.invitation.revoked', {
        email: invitation.email_normalized, role: invitation.role,
        scopeType: invitation.scope_type, scopeId: invitation.scope_id, invitationId: invitationId,
      });
      return json(await overview(context, db, user));
    }

    if (action === 'assignment.revoke') {
      const assignmentId = String(body.assignmentId || '');
      const assignment = await db.prepare(
        "SELECT id, studio_user_id, role, scope_type, scope_id FROM studio_role_assignments WHERE id = ? AND revoked_at IS NULL"
      ).bind(assignmentId).first();
      if (!assignment) throw new ApiError(404, 'Active role assignment not found.');
      if (!(await canGrantRole(db, user.id, assignment.role, assignment.scope_type, assignment.scope_id))) {
        throw new ApiError(403, 'You cannot revoke that role in this scope.');
      }
      if (assignment.role === 'platform_super_admin') {
        const count = await db.prepare(
          "SELECT COUNT(*) AS total FROM studio_role_assignments WHERE role = 'platform_super_admin' AND scope_type = 'platform' AND scope_id = ? AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > ?)"
        ).bind(PLATFORM_SCOPE_ID, nowIso()).first();
        if (Number(count?.total || 0) <= 1) throw new ApiError(409, 'Assign another Super Admin before removing the last one.');
      }
      const at = nowIso();
      await db.prepare(
        'UPDATE studio_role_assignments SET revoked_at = ?, revoked_by = ? WHERE id = ? AND revoked_at IS NULL'
      ).bind(at, user.id, assignmentId).run();
      const target = await db.prepare('SELECT email FROM studio_users WHERE id = ?').bind(assignment.studio_user_id).first();
      await audit(db, user, 'role.revoked', {
        targetUserId: assignment.studio_user_id, email: target?.email || '',
        role: assignment.role, scopeType: assignment.scope_type, scopeId: assignment.scope_id,
      });
      return json(await overview(context, db, user));
    }

    if (action === 'event.settings.update') {
      const eventId = String(body.eventId || '');
      const event = await db.prepare(
        "SELECT id FROM studio_events WHERE id = ? AND workspace_id = 'preview-workspace'"
      ).bind(eventId).first();
      if (!event) throw new ApiError(404, 'Event not found.');
      const caps = await eventCapabilities(db, user.id, eventId);
      if (!caps.canManage) throw new ApiError(403, 'Only the event lead or a Studio admin can change event settings.');
      const current = await db.prepare('SELECT * FROM studio_event_controls WHERE event_id = ?').bind(eventId).first();
      const boolValue = (key, fallback) => typeof body[key] === 'boolean' ? Number(body[key]) : Number(current ? current[key] : fallback);
      const roomOpen = boolValue('roomOpen', 1);
      const registrationOpen = boolValue('registrationOpen', 1);
      const questions = boolValue('questionsEnabled', 1);
      const chat = boolValue('chatEnabled', 1);
      const build = boolValue('buildEnabled', 1);
      const resources = boolValue('resourcesEnabled', 1);
      const at = nowIso();
      await db.prepare(
        'INSERT INTO studio_event_controls ' +
        '(event_id, room_open, registration_open, questions_enabled, chat_enabled, build_enabled, resources_enabled, updated_by, updated_at, room_closed_by, room_closed_at) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ' +
        'ON CONFLICT(event_id) DO UPDATE SET room_open=excluded.room_open, registration_open=excluded.registration_open, ' +
        'questions_enabled=excluded.questions_enabled, chat_enabled=excluded.chat_enabled, build_enabled=excluded.build_enabled, ' +
        'resources_enabled=excluded.resources_enabled, updated_by=excluded.updated_by, updated_at=excluded.updated_at, ' +
        'room_closed_by=excluded.room_closed_by, room_closed_at=excluded.room_closed_at'
      ).bind(
        eventId, roomOpen, registrationOpen, questions, chat, build, resources, user.id, at,
        roomOpen ? null : user.id, roomOpen ? null : at
      ).run();
      await audit(db, user, 'event.settings.updated', {
        role: '', scopeType: 'event', scopeId: eventId,
        reason: 'Room ' + (roomOpen ? 'open' : 'closed') + '; registrations ' + (registrationOpen ? 'open' : 'closed'),
      });
      return json(await overview(context, db, user));
    }

    throw new ApiError(400, 'Unsupported Studio access action.');
  } catch (error) {
    return json({ ok: false, error: error.message || 'Studio access request failed.' }, error.status || 500);
  }
}
