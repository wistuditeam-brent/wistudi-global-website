(() => {
  'use strict';

  const TOKEN_RE = /^WST-[A-Za-z0-9_-]{8,128}$/;
  const TOKEN_KEY = 'wistudi_outreach_token';
  const TOKEN_TS_KEY = 'wistudi_outreach_token_ts';
  const SESSION_ID_KEY = 'wistudi_outreach_session_id';
  const SESSION_STARTED_KEY = 'wistudi_outreach_session_started';
  const CONFIRMED_KEY_PREFIX = 'wistudi_outreach_confirmed:';
  const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
  const SESSION_TTL_MS = 30 * 60 * 1000;
  const PROBABLE_VISIBLE_MS = 5000;

  const now = () => Date.now();
  const safeStorage = window.sessionStorage;

  function randomId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    const bytes = new Uint8Array(16);
    window.crypto?.getRandomValues?.(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }

  function cleanUrl(url) {
    url.searchParams.delete('wst');
    const next = `${url.pathname}${url.search}${url.hash}`;
    history.replaceState(history.state, '', next || '/');
  }

  function captureToken() {
    const url = new URL(window.location.href);
    const candidate = url.searchParams.get('wst');
    if (candidate !== null) cleanUrl(url);

    if (candidate && TOKEN_RE.test(candidate)) {
      safeStorage.setItem(TOKEN_KEY, candidate);
      safeStorage.setItem(TOKEN_TS_KEY, String(now()));
      return candidate;
    }

    const stored = safeStorage.getItem(TOKEN_KEY);
    const storedAt = Number(safeStorage.getItem(TOKEN_TS_KEY) || 0);
    if (!stored || !TOKEN_RE.test(stored) || now() - storedAt > TOKEN_TTL_MS) {
      safeStorage.removeItem(TOKEN_KEY);
      safeStorage.removeItem(TOKEN_TS_KEY);
      return null;
    }
    return stored;
  }

  function getSessionId() {
    const startedAt = Number(safeStorage.getItem(SESSION_STARTED_KEY) || 0);
    let sessionId = safeStorage.getItem(SESSION_ID_KEY);
    if (!sessionId || !startedAt || now() - startedAt > SESSION_TTL_MS) {
      sessionId = randomId();
      safeStorage.setItem(SESSION_ID_KEY, sessionId);
      safeStorage.setItem(SESSION_STARTED_KEY, String(now()));
    }
    return sessionId;
  }

  function refreshSessionActivity() {
    safeStorage.setItem(SESSION_STARTED_KEY, String(now()));
  }

  const token = captureToken();
  if (!token) return;

  const sessionId = getSessionId();
  const confirmedKey = `${CONFIRMED_KEY_PREFIX}${token}:${sessionId}`;
  let sent = safeStorage.getItem(confirmedKey) === '1';
  let probableTimer = null;

  async function emit(event, confidence) {
    refreshSessionActivity();
    if (sent) return;
    sent = true;
    safeStorage.setItem(confirmedKey, '1');

    const payload = {
      token,
      event,
      confidence,
      page_path: `${window.location.pathname}${window.location.search}`,
      client_timestamp: new Date().toISOString(),
      session_identifier: sessionId
    };

    try {
      await fetch('/api/outreach-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
        credentials: 'same-origin'
      });
    } catch (_) {
      // Tracking must never interfere with the website experience.
    }
  }

  function confirmInteraction(type) {
    void emit(type, 'confirmed');
  }

  const interactionEvents = ['click', 'pointerdown', 'touchstart', 'keydown', 'scroll'];
  for (const type of interactionEvents) {
    window.addEventListener(type, () => confirmInteraction(type), { once: true, passive: type !== 'keydown' });
  }

  function cancelProbableTimer() {
    if (probableTimer) clearTimeout(probableTimer);
    probableTimer = null;
  }

  function startProbableTimer() {
    cancelProbableTimer();
    if (sent || document.visibilityState !== 'visible' || !document.hasFocus()) return;
    probableTimer = setTimeout(() => {
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        void emit('visible_focus', 'probable');
      }
    }, PROBABLE_VISIBLE_MS);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') startProbableTimer();
    else cancelProbableTimer();
  });
  window.addEventListener('focus', startProbableTimer);
  window.addEventListener('blur', cancelProbableTimer);

  startProbableTimer();
})();
