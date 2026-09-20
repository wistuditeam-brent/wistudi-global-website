const COOKIE_NAME = 'wistudi_studio_session';
const SESSION_DAYS = 30;

export const json = (data, status = 200, headers = {}) => Response.json(data, {
  status,
  headers: {
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    ...headers,
  },
});

export const dbFor = context => context.env.PUBLISHER_STUDIO_DB || null;
export const nowIso = () => new Date().toISOString();
export const normalizeEmail = value => String(value || '').trim().toLowerCase();
export const isValidEmail = value => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export function sameOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; }
  catch { return false; }
}

export function randomToken(bytes = 32) {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  let binary = '';
  for (const value of buffer) binary += String.fromCharCode(value);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function sha256(value) {
  const bytes = new TextEncoder().encode(String(value));
  const result = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(result)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function hmac(value, secret) {
  if (!secret || String(secret).length < 32) throw new Error('Studio authentication is not configured.');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(String(secret)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(String(value)));
  return [...new Uint8Array(signature)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export function constantTimeEqual(left, right) {
  const a = String(left || '');
  const b = String(right || '');
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return mismatch === 0;
}

export function cookieValue(request, name = COOKIE_NAME) {
  const cookie = request.headers.get('Cookie') || '';
  for (const part of cookie.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name) return decodeURIComponent(part.slice(separator + 1).trim());
  }
  return '';
}

export function sessionCookie(token, request, maxAge = SESSION_DAYS * 86400) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return COOKIE_NAME + '=' + encodeURIComponent(token) + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + maxAge + secure;
}

export function clearedSessionCookie(request) {
  return sessionCookie('', request, 0);
}

export async function currentUser(context) {
  const db = dbFor(context);
  if (!db) return null;
  const token = cookieValue(context.request);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const query = 'SELECT u.id, u.email, u.display_name, u.status, s.expires_at ' +
    'FROM studio_auth_sessions s ' +
    'JOIN studio_users u ON u.id = s.studio_user_id ' +
    'JOIN studio_verified_emails v ON v.studio_user_id = u.id AND v.email_normalized = u.email ' +
    'WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > ? ' +
    "AND u.status = 'active' LIMIT 1";
  const user = await db.prepare(query).bind(tokenHash, nowIso()).first();
  if (!user) return null;
  await db.prepare('UPDATE studio_auth_sessions SET last_seen_at = ? WHERE token_hash = ?')
    .bind(nowIso(), tokenHash).run();
  return {
    id: user.id,
    email: normalizeEmail(user.email),
    displayName: user.display_name,
  };
}

export async function activeAssignments(db, userId) {
  const query = 'SELECT id, role, scope_type AS scopeType, scope_id AS scopeId, ' +
    'created_at AS createdAt, expires_at AS expiresAt FROM studio_role_assignments ' +
    'WHERE studio_user_id = ? AND revoked_at IS NULL ' +
    'AND (expires_at IS NULL OR expires_at > ?) ORDER BY scope_type, scope_id, role';
  const rows = await db.prepare(query).bind(userId, nowIso()).all();
  return rows.results || [];
}

export async function createSession(db, userId, request) {
  const token = randomToken(32);
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  await db.prepare(
    'INSERT INTO studio_auth_sessions (token_hash, studio_user_id, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(await sha256(token), userId, createdAt, expiresAt, createdAt).run();
  return { token, cookie: sessionCookie(token, request) };
}

export function publicProfile(user) {
  return { id: user.id, displayName: user.displayName };
}
