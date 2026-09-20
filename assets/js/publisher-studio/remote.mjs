const endpoint = '/api/publisher-studio/state';

async function request(method, payload = null, query = '') {
  const response = await fetch(endpoint + query, {
    method,
    credentials: 'same-origin',
    headers: payload ? { 'Content-Type': 'application/json' } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({ ok: false, error: 'Invalid API response.' }));
  if (!response.ok || !data.ok) {
    const error = new Error(data.error || 'Studio API request failed.');
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function loadRemoteEvent(eventId) {
  const params = new URLSearchParams({ eventId });
  return request('GET', null, '?' + params.toString());
}

export async function sendRemoteAction(eventId, _profile, action, payload = {}) {
  return request('POST', Object.assign({ eventId, action }, payload));
}
