import {
  currentUser, dbFor, json, nowIso, sameOrigin, sha256,
} from '../_security.js';

export async function onRequestPost(context) {
  const db = dbFor(context);
  if (!db) return json({ ok: false, error: 'Studio database is not configured.' }, 503);
  if (!sameOrigin(context.request)) return json({ ok: false, error: 'Request origin could not be verified.' }, 403);
  const user = await currentUser(context);
  if (!user) return json({ ok: false, error: 'Sign in with the invited email first.' }, 401);

  let body;
  try {
    const raw = await context.request.text();
    if (raw.length > 4096) return json({ ok: false, error: 'Request is too large.' }, 413);
    body = JSON.parse(raw);
  } catch { return json({ ok: false, error: 'Invalid request.' }, 400); }

  const token = String(body.token || '');
  if (!/^[A-Za-z0-9_-]{32,100}$/.test(token)) return json({ ok: false, error: 'Invitation is invalid or expired.' }, 400);
  const tokenHash = await sha256(token);
  const invitation = await db.prepare(
    'SELECT * FROM studio_role_invitations WHERE token_hash = ? LIMIT 1'
  ).bind(tokenHash).first();
  if (!invitation || invitation.email_normalized !== user.email) {
    return json({ ok: false, error: 'This invitation is for a different email address.' }, 403);
  }

  const now = nowIso();
  if (invitation.status === 'accepted') {
    const existing = await db.prepare(
      'SELECT id FROM studio_role_assignments WHERE studio_user_id = ? AND role = ? AND scope_type = ? AND scope_id = ? AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > ?) LIMIT 1'
    ).bind(user.id, invitation.role, invitation.scope_type, invitation.scope_id, now).first();
    if (existing) return json({ ok: true, accepted: true, role: invitation.role, scopeType: invitation.scope_type, scopeId: invitation.scope_id });
  }
  if (invitation.status !== 'pending' || invitation.expires_at <= now) {
    return json({ ok: false, error: 'Invitation is no longer active. Ask the inviter to reissue it.' }, 410);
  }

  const assignmentId = crypto.randomUUID();
  const acceptedAt = now;
  const batch = await db.batch([
    db.prepare(
      "UPDATE studio_role_invitations SET status = 'accepted', accepted_at = ? WHERE id = ? AND token_hash = ? AND email_normalized = ? AND status = 'pending' AND expires_at > ?"
    ).bind(acceptedAt, invitation.id, tokenHash, user.email, acceptedAt),
    db.prepare(
      "INSERT OR IGNORE INTO studio_role_assignments (id, studio_user_id, role, scope_type, scope_id, assigned_by, created_at) " +
      "SELECT ?, ?, role, scope_type, scope_id, invited_by, ? FROM studio_role_invitations " +
      "WHERE id = ? AND status = 'accepted' AND accepted_at = ? AND email_normalized = ?"
    ).bind(assignmentId, user.id, acceptedAt, invitation.id, acceptedAt, user.email),
    db.prepare(
      "INSERT INTO studio_role_audit (id, actor_user_id, action, target_user_id, target_email_normalized, role, scope_type, scope_id, invitation_id, reason, created_at) " +
      "SELECT ?, ?, 'role.invitation.accepted', ?, email_normalized, role, scope_type, scope_id, id, 'Invited user accepted role', ? " +
      "FROM studio_role_invitations WHERE id = ? AND status = 'accepted' AND accepted_at = ? AND email_normalized = ?"
    ).bind(crypto.randomUUID(), user.id, user.id, acceptedAt, invitation.id, acceptedAt, user.email),
  ]);
  const updated = Number(batch?.[0]?.meta?.changes || 0);
  if (updated !== 1) {
    const existing = await db.prepare(
      'SELECT id FROM studio_role_assignments WHERE studio_user_id = ? AND role = ? AND scope_type = ? AND scope_id = ? AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > ?) LIMIT 1'
    ).bind(user.id, invitation.role, invitation.scope_type, invitation.scope_id, nowIso()).first();
    if (existing) return json({ ok: true, accepted: true, role: invitation.role, scopeType: invitation.scope_type, scopeId: invitation.scope_id });
    return json({ ok: false, error: 'Invitation was already used or expired.' }, 409);
  }

  return json({
    ok: true, accepted: true, role: invitation.role,
    scopeType: invitation.scope_type, scopeId: invitation.scope_id,
  });
}
