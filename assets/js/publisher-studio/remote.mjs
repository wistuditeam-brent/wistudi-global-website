const endpoint = '/api/publisher-studio/state';

async function request(method, payload = null, query = '') {
  const response = await fetch(endpoint + query, {
    method,
    headers: payload ? { 'Content-Type': 'application/json' } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({ ok: false, error: 'Invalid API response.' }));
  if (!response.ok || !data.ok) throw new Error(data.error || 'Studio API request failed.');
  return data;
}

const userPayload = profile => profile ? {
  id: profile.id,
  displayName: profile.displayName,
  avatarSeed: profile.avatarSeed,
} : null;

export async function loadRemoteEvent(eventId, profile) {
  const params = new URLSearchParams({ eventId });
  if (profile?.id) params.set('userId', profile.id);
  return request('GET', null, `?${params}`);
}

export async function sendRemoteAction(eventId, profile, action, payload = {}) {
  return request('POST', { eventId, user: userPayload(profile), action, ...payload });
}
