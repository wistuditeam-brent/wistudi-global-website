import {
  clearedSessionCookie,
  constantTimeEqual,
  createSession,
  currentUser,
  dbFor,
  hmac,
  isValidEmail,
  json,
  normalizeEmail,
  nowIso,
  randomToken,
  sameOrigin,
  sha256,
} from '../_security.js';

const CONSENT_VERSION = 'studio-membership-v1';
const CODE_LIFETIME_MS = 10 * 60 * 1000;
const SESSION_COOKIE_HEADER = 'Set-Cookie';

async function sendCode(env, email, code) {
  const key = env.RESEND_API_KEY;
  const from = env.STUDIO_AUTH_FROM || env.CONTACT_FROM_EMAIL;
  if (!key || !from) return false;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [email],
        subject: 'Your Wistudi Publisher Studio sign-in code',
        text: 'Your one-time Wistudi Publisher Studio code is ' + code +
          '. It expires in 10 minutes. If you did not request it, you can ignore this email.',
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function profilePayload(user, roles, membership) {
  return {
    id: user.id,
    displayName: user.display_name,
    initials: String(user.display_name || '?').trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase(),
    roles: roles.map(item => ({
      id: item.id,
      role: item.role,
      scopeType: item.scope_type,
      scopeId: item.scope_id,
      expiresAt: item.expires_at,
    })),
    studioMember: membership?.status === 'active',
  };
}

export async function onRequestGet(context) {
  const db = dbFor(context);
  if (!db) return json({ ok: false, error: 'Studio database is not configured.' }, 503);
  try {
    const user = await currentUser(context);
    if (!user) return json({ ok: false, authenticated: false }, 401);
    const roles = await db.prepare(
      'SELECT id, role, scope_type, scope_id, expires_at FROM studio_role_assignments ' +
      'WHERE studio_user_id = ? AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > ?) ' +
      'ORDER BY scope_type, scope_id, role'
    ).bind(user.id, nowIso()).all();
    const membership = await db.prepare(
      "SELECT status FROM studio_access_memberships WHERE studio_user_id = ? AND studio_id = 'publisher-studio' LIMIT 1"
    ).bind(user.id).first();
    return json({
      ok: true,
      authenticated: true,
      user: profilePayload(user, roles.results || [], membership),
    });
  } catch {
    return json({ ok: false, error: 'Could not load the Studio session.' }, 500);
  }
}

export async function onRequestPost(context) {
  const db = dbFor(context);
  if (!db) return json({ ok: false, error: 'Studio database is not configured.' }, 503);
  if (!sameOrigin(context.request)) return json({ ok: false, error: 'Request origin could not be verified.' }, 403);

  let body;
  try {
    const raw = await context.request.text();
    if (raw.length > 8192) return json({ ok: false, error: 'Request is too large.' }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: 'Invalid request.' }, 400);
  }

  const action = String(body?.action || '');

  if (action === 'request_code') {
    const email = normalizeEmail(body.email);
    const purpose = body.mode === 'join' ? 'join' : body.mode === 'sign_in' ? 'sign_in' : '';
    if (!isValidEmail(email) || !purpose) return json({ ok: false, error: 'Enter a valid email and choose Join or Sign in.' }, 400);
    if (purpose === 'join' && body.consent !== true) return json({ ok: false, error: 'Confirm the Studio membership choice to continue.' }, 400);
    const displayName = purpose === 'join' ? String(body.displayName || '').trim().slice(0, 60) : '';
    if (purpose === 'join' && displayName.length < 2) return json({ ok: false, error: 'Enter a display name with at least 2 characters.' }, 400);
    const pepper = context.env.STUDIO_AUTH_PEPPER;
    if (!context.env.RESEND_API_KEY || !(context.env.STUDIO_AUTH_FROM || context.env.CONTACT_FROM_EMAIL) || !pepper) {
      return json({ ok: false, error: 'Studio email sign-in is not configured for this environment.' }, 503);
    }

    try {
      const created = new Date();
      const createdAt = created.toISOString();
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown';
      const ipDigest = await hmac(ip, pepper);
      const emailCount = await db.prepare(
        'SELECT COUNT(*) AS total FROM studio_auth_challenges WHERE email_normalized = ? AND created_at > ?'
      ).bind(email, hourAgo).first();
      const ipCount = await db.prepare(
        'SELECT COUNT(*) AS total FROM studio_auth_challenges WHERE ip_digest = ? AND created_at > ?'
      ).bind(ipDigest, hourAgo).first();
      if (Number(emailCount?.total || 0) >= 5 || Number(ipCount?.total || 0) >= 12) {
        return json({ ok: false, error: 'Too many code requests. Wait before trying again.' }, 429);
      }

      const known = await db.prepare('SELECT id FROM studio_users WHERE email = ? AND status != ? LIMIT 1')
        .bind(email, 'suspended').first();
      const shouldSend = purpose === 'join' || Boolean(known);
      const challengeId = crypto.randomUUID();
      const codeBytes = new Uint32Array(1);
      crypto.getRandomValues(codeBytes);
      const code = String(codeBytes[0] % 100000000).padStart(8, '0');
      const storedCode = shouldSend ? code : randomToken(16);
      const codeHash = await hmac(email + '|' + challengeId + '|' + storedCode, pepper);
      const expiresAt = new Date(Date.now() + CODE_LIFETIME_MS).toISOString();

      await db.prepare(
        'UPDATE studio_auth_challenges SET consumed_at = ? WHERE email_normalized = ? AND consumed_at IS NULL'
      ).bind(createdAt, email).run();
      await db.prepare(
        'INSERT INTO studio_auth_challenges ' +
        '(id, email_normalized, purpose, display_name, consent_version, code_hash, ip_digest, expires_at, created_at) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        challengeId, email, purpose, displayName,
        purpose === 'join' ? CONSENT_VERSION : '',
        codeHash, ipDigest, expiresAt, createdAt
      ).run();

      if (shouldSend) {
        const sent = await sendCode(context.env, email, code);
        await db.prepare('UPDATE studio_auth_challenges SET delivery_status = ? WHERE id = ?')
          .bind(sent ? 'sent' : 'failed', challengeId).run();
        if (!sent) return json({ ok: false, error: 'The code email could not be sent. Try again shortly.' }, 503);
      } else {
        await db.prepare('UPDATE studio_auth_challenges SET delivery_status = ? WHERE id = ?')
          .bind('sent', challengeId).run();
      }
      return json({ ok: true, challengeId, expiresInSeconds: 600, message: 'If the address can use this option, a code has been sent.' });
    } catch {
      return json({ ok: false, error: 'Could not request a sign-in code.' }, 500);
    }
  }

  if (action === 'verify_code') {
    const email = normalizeEmail(body.email);
    const challengeId = String(body.challengeId || '');
    const code = String(body.code || '').replace(/\s/g, '');
    if (!isValidEmail(email) || !/^\d{8}$/.test(code) || !/^[0-9a-f-]{36}$/i.test(challengeId)) {
      return json({ ok: false, error: 'Enter the email and 8-digit code.' }, 400);
    }
    const challenge = await db.prepare(
      'SELECT * FROM studio_auth_challenges WHERE id = ? AND email_normalized = ? ' +
      'AND consumed_at IS NULL AND expires_at > ? AND attempts < 5 LIMIT 1'
    ).bind(challengeId, email, nowIso()).first();
    if (!challenge) return json({ ok: false, error: 'That code is invalid or expired. Request a new one.' }, 400);

    let expected;
    try { expected = await hmac(email + '|' + challengeId + '|' + code, context.env.STUDIO_AUTH_PEPPER); }
    catch { return json({ ok: false, error: 'Studio email sign-in is not configured.' }, 503); }

    if (!constantTimeEqual(expected, challenge.code_hash)) {
      await db.prepare('UPDATE studio_auth_challenges SET attempts = MIN(attempts + 1, 5) WHERE id = ?')
        .bind(challengeId).run();
      return json({ ok: false, error: 'That code is invalid or expired. Request a new one.' }, 400);
    }

    const consumedAt = nowIso();
    const consumed = await db.prepare(
      'UPDATE studio_auth_challenges SET consumed_at = ? WHERE id = ? AND consumed_at IS NULL ' +
      'AND expires_at > ? AND attempts < 5'
    ).bind(consumedAt, challengeId, consumedAt).run();
    if (Number(consumed.meta?.changes || 0) !== 1) {
      return json({ ok: false, error: 'That code has already been used or expired. Request a new one.' }, 400);
    }

    try {
      let user = await db.prepare('SELECT id, email, display_name, status FROM studio_users WHERE email = ? LIMIT 1')
        .bind(email).first();
      if (challenge.purpose === 'join') {
        if (!user) {
          await db.prepare(
            "INSERT OR IGNORE INTO studio_users (id, email, display_name, avatar_seed, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'active', ?, ?)"
          ).bind(crypto.randomUUID(), email, challenge.display_name, randomToken(18), consumedAt, consumedAt).run();
          user = await db.prepare('SELECT id, email, display_name, status FROM studio_users WHERE email = ? LIMIT 1')
            .bind(email).first();
        } else {
          await db.prepare("UPDATE studio_users SET status = 'active', updated_at = ? WHERE id = ? AND status = 'invited'")
            .bind(consumedAt, user.id).run();
          user = await db.prepare('SELECT id, email, display_name, status FROM studio_users WHERE id = ?')
            .bind(user.id).first();
        }
      }
      if (!user || user.status !== 'active') return json({ ok: false, error: 'That code is invalid or expired. Request a new one.' }, 400);

      await db.prepare(
        'INSERT OR IGNORE INTO studio_verified_emails (email_normalized, studio_user_id, verified_at, is_primary) VALUES (?, ?, ?, 1)'
      ).bind(email, user.id, consumedAt).run();
      const verified = await db.prepare('SELECT studio_user_id FROM studio_verified_emails WHERE email_normalized = ?')
        .bind(email).first();
      if (!verified || verified.studio_user_id !== user.id) {
        return json({ ok: false, error: 'This email is already linked to another Studio profile. Contact Wistudi support.' }, 409);
      }

      if (challenge.purpose === 'join') {
        const membershipId = crypto.randomUUID();
        await db.prepare(
          "INSERT INTO studio_access_memberships (id, studio_id, studio_user_id, status, joined_at) " +
          "VALUES (?, 'publisher-studio', ?, 'active', ?) " +
          "ON CONFLICT(studio_id, studio_user_id) DO UPDATE SET status = 'active', withdrawn_at = NULL"
        ).bind(membershipId, user.id, consumedAt).run();
        await db.prepare(
          'INSERT INTO studio_membership_consents (id, studio_user_id, purpose, policy_version, action, source, captured_at) ' +
          "VALUES (?, ?, 'studio_membership', ?, 'grant', 'email_verification', ?)"
        ).bind(crypto.randomUUID(), user.id, challenge.consent_version || CONSENT_VERSION, consumedAt).run();
      }

      const session = await createSession(db, user.id, context.request);
      const roles = await db.prepare(
        'SELECT id, role, scope_type, scope_id, expires_at FROM studio_role_assignments ' +
        'WHERE studio_user_id = ? AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > ?)'
      ).bind(user.id, nowIso()).all();
      const membership = await db.prepare(
        "SELECT status FROM studio_access_memberships WHERE studio_user_id = ? AND studio_id = 'publisher-studio'"
      ).bind(user.id).first();
      const initials = String(user.display_name || '?').trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase();
      return json({
        ok: true,
        authenticated: true,
        user: {
          id: user.id, displayName: user.display_name, initials,
          roles: roles.results || [], studioMember: membership?.status === 'active',
        },
      }, 200, { [SESSION_COOKIE_HEADER]: session.cookie });
    } catch {
      return json({ ok: false, error: 'Could not activate this Studio session.' }, 500);
    }
  }

  if (action === 'sign_out') {
    const token = (context.request.headers.get('Cookie') || '').split(';')
      .map(part => part.trim()).find(part => part.startsWith('wistudi_studio_session='))
      ?.slice('wistudi_studio_session='.length) || '';
    if (token) {
      const tokenHash = await sha256(decodeURIComponent(token));
      await db.prepare('UPDATE studio_auth_sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL')
        .bind(nowIso(), tokenHash).run();
    }
    return json({ ok: true }, 200, { [SESSION_COOKIE_HEADER]: clearedSessionCookie(context.request) });
  }

  return json({ ok: false, error: 'Unsupported identity action.' }, 400);
}
