const authUrl = '/api/publisher-studio/auth';
const rolesUrl = '/api/publisher-studio/roles';
let currentUser = null;
let accessState = null;
let dialog = null;
let authMode = 'join';
let challengeId = '';
let challengeEmail = '';
let initialJoin = { displayName: '', email: '' };
let latestInvitationLink = '';
let currentPanel = 'access';
let onIdentityChanged = function() {};
let noticeTimer;

const escape = value => String(value == null ? '' : value).replace(/[&<>"']/g, function(char) {
  return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
});
const roleNames = {
  platform_super_admin: 'Wistudi Super Admin',
  studio_admin: 'Studio Admin',
  event_builder: 'Event Builder',
  event_lead: 'Event Lead / Trainer',
  event_co_trainer: 'Co-trainer',
  event_moderator: 'Event Moderator',
};
const scopeName = item => item.scopeType === 'platform' ? 'Wistudi' : item.scopeType === 'studio' ? 'Publisher Studio' : 'Event';

async function api(url, method, payload) {
  const response = await fetch(url, {
    method: method || 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: payload ? { 'Content-Type': 'application/json' } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const data = await response.json().catch(function() { return { ok: false, error: 'Invalid Studio response.' }; });
  if (!response.ok || !data.ok) {
    const error = new Error(data.error || 'Studio request failed.');
    error.status = response.status;
    throw error;
  }
  return data;
}

function toast(message) {
  const node = document.querySelector('#toast');
  if (!node) return;
  clearTimeout(noticeTimer);
  node.textContent = message;
  node.hidden = false;
  noticeTimer = setTimeout(function() { node.hidden = true; }, 6500);
}

function dispatchIdentity() {
  if (typeof onIdentityChanged === 'function') onIdentityChanged(currentUser);
  document.dispatchEvent(new CustomEvent('publisher-studio:identity', { detail: currentUser }));
  mountHeader();
}

function ensureDialog() {
  if (dialog && dialog.isConnected) return dialog;
  dialog = document.querySelector('#studio-identity-dialog');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'studio-identity-dialog';
    dialog.className = 'identity-dialog';
    dialog.setAttribute('aria-labelledby', 'identity-title');
    document.body.appendChild(dialog);
  }
  dialog.addEventListener('submit', handleSubmit, true);
  dialog.addEventListener('close', function() {
    if (dialog.dataset.view === 'team') {
      currentPanel = 'access';
      dialog.dataset.view = '';
    }
  });
  return dialog;
}

function headerMarkup() {
  if (!currentUser) {
    return '<button type="button" class="button secondary identity-signin" data-identity-action="open-auth">Sign in / Join</button>';
  }
  const name = escape(currentUser.displayName || 'Studio member');
  const letters = escape(String(currentUser.displayName || '?').trim().split(/\s+/).slice(0, 2).map(function(part) { return part[0] || ''; }).join('').toUpperCase());
  return '<button type="button" class="button secondary identity-team" data-identity-action="open-team"><span class="identity-avatar" aria-hidden="true">' + letters + '</span><span>Team &amp; access</span></button>' +
    '<button type="button" class="identity-profile" data-identity-action="open-account" aria-label="Account for ' + name + '"><span class="identity-avatar" aria-hidden="true">' + letters + '</span><span class="identity-profile-name">' + name + '</span></button>';
}

function mountHeader() {
  document.querySelectorAll('[data-identity-mount]').forEach(function(node) {
    const key = currentUser ? 'user:' + currentUser.id + ':' + currentUser.displayName : 'guest';
    if (node.dataset.identityState === key) return;
    node.dataset.identityState = key;
    node.innerHTML = headerMarkup();
  });
}

function authMarkup(message) {
  const join = authMode === 'join';
  let body = '';
  if (challengeId) {
    body = '<p class="muted">Enter the 8-digit code sent to <strong>' + escape(challengeEmail) + '</strong>. It expires in 10 minutes.</p>' +
      '<form data-identity-form="verify" class="identity-form"><label>Sign-in code<input name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="8" pattern="[0-9]{8}" required autofocus></label>' +
      '<p class="form-error" role="alert" data-identity-error></p><button class="button primary full-width" type="submit">Verify and continue</button></form>' +
      '<button type="button" class="text-button" data-identity-action="back-to-email">Use a different email</button>';
  } else {
    body = '<div class="identity-switch"><button type="button" data-identity-action="mode-join" aria-pressed="' + join + '">Join Studio</button><button type="button" data-identity-action="mode-signin" aria-pressed="' + !join + '">Sign in</button></div>' +
      '<form data-identity-form="request" class="identity-form">' +
      (join ? '<label>Your name<input name="displayName" autocomplete="name" maxlength="60" minlength="2" value="' + escape(initialJoin.displayName) + '" required></label>' : '') +
      '<label>Email address<input name="email" type="email" autocomplete="email" maxlength="254" value="' + escape(initialJoin.email) + '" required></label>' +
      (join ? '<label class="identity-consent"><input name="consent" type="checkbox" required><span>I agree to join Publisher Studio so I can take part in its discussions and share work. I can leave later.</span></label>' : '') +
      '<p class="muted small">' + (join ? 'We will verify your email and create your Studio profile. Event registration remains separate.' : 'We will send a one-time code to your verified email.') + '</p>' +
      '<p class="form-error" role="alert" data-identity-error>' + escape(message || '') + '</p>' +
      '<button class="button primary full-width" type="submit">' + (join ? 'Join with email' : 'Send sign-in code') + '</button></form>';
  }
  const inviteMessage = new URLSearchParams(location.search).get('invite') ? '<p class="identity-invite-note">You opened a role invitation. Use the invited email address to continue.</p>' : '';
  return '<div class="dialog-header"><div><div class="eyebrow">Publisher Studio identity</div><h2 id="identity-title">' + (join ? 'Join the Studio' : 'Sign in') + '</h2></div><button type="button" class="icon-button" data-identity-action="close" aria-label="Close">×</button></div>' +
    '<div class="dialog-content identity-content">' + inviteMessage + body + '<p class="identity-privacy">Your profile is connected to this Studio. Your email is shown only to authorized event staff when they need it for event management.</p></div>';
}

function renderAuth(message) {
  ensureDialog();
  dialog.dataset.view = 'auth';
  dialog.innerHTML = authMarkup(message || '');
  if (!dialog.open) dialog.showModal();
  const focusTarget = dialog.querySelector('input:not([type=checkbox])');
  if (focusTarget) setTimeout(function() { focusTarget.focus(); }, 0);
}

function badge(text) {
  return '<span class="tag">' + escape(text) + '</span>';
}

function renderAssignments() {
  const my = accessState && accessState.roles || [];
  const managed = accessState && accessState.assignments || [];
  const canManage = (accessState && accessState.inviteOptions || []).length > 0;
  let html = '<section class="identity-section"><h3>Your current roles</h3>';
  html += my.length ? '<ul class="identity-list">' + my.map(function(item) {
    return '<li><div><strong>' + escape(item.roleLabel || roleNames[item.role] || item.role) + '</strong><span>' + escape(scopeName(item)) + (item.scopeType === 'event' ? ' · ' + escape(item.scopeId) : '') + '</span></div></li>';
  }).join('') + '</ul>' : '<p class="muted">You have no staff role. Your participant access is separate from staff permissions.</p>';
  if (accessState && accessState.setupRequired) {
    html += '<section class="identity-bootstrap"><h3>Set up the first Wistudi Super Admin</h3><p>This one-time step grants full platform governance to your verified account. Enter the owner setup key configured in Cloudflare Preview.</p><form data-identity-form="bootstrap" class="identity-form"><label>Owner setup key<input name="secret" type="password" autocomplete="off" required minlength="32"></label><p class="form-error" role="alert" data-identity-error></p><button class="button primary" type="submit">Make my account Super Admin</button></form></section>';
  }
  if (canManage) {
    html += '<section class="identity-section"><h3>Invite a teammate</h3><p class="muted">Invitations are tied to one email, expire after 7 days and can be revoked.</p>' +
      '<form data-identity-form="invite" class="identity-form"><label>Email address<input name="email" type="email" autocomplete="email" required maxlength="254"></label>' +
      '<label>Role and scope<select name="option" required>' + accessState.inviteOptions.map(function(option, index) {
        return '<option value="' + index + '">' + escape(option.roleLabel) + ' · ' + escape(option.scopeLabel) + '</option>';
      }).join('') + '</select></label><p class="form-error" role="alert" data-identity-error></p><button class="button primary" type="submit">Create invitation</button></form>' +
      (latestInvitationLink ? '<div class="identity-invite-result"><p>' + (accessState.invitationEmailSent ? 'Invitation email sent. You can also copy this secure link.' : 'Email could not be sent from Preview. Copy and share this secure link directly.') + '</p><input readonly value="' + escape(latestInvitationLink) + '"><button type="button" class="button secondary" data-identity-action="copy-invite">Copy invitation link</button></div>' : '') +
      '<h3>Active staff</h3>' + (managed.length ? '<ul class="identity-list">' + managed.map(function(item) {
        const revoke = item.canRevoke ? '<button type="button" class="text-button" data-identity-action="revoke-assignment" data-id="' + escape(item.id) + '">Revoke</button>' : '';
        return '<li><div><strong>' + escape(item.displayName || item.email) + '</strong><span>' + escape(item.email) + ' · ' + escape(item.roleLabel) + ' · ' + escape(item.scopeType === 'event' ? item.scopeId : item.scopeId) + '</span></div>' + revoke + '</li>';
      }).join('') + '</ul>' : '<p class="muted">No staff roles are assigned in the scopes you manage.</p>') +
      '<h3>Pending invitations</h3>' + ((accessState.invitations || []).length ? '<ul class="identity-list">' + accessState.invitations.map(function(item) {
        return '<li><div><strong>' + escape(item.email) + '</strong><span>' + escape(item.roleLabel) + ' · ' + escape(item.scopeId) + ' · expires ' + escape(new Date(item.expiresAt).toLocaleDateString()) + '</span></div><div class="identity-inline-actions"><button type="button" class="text-button" data-identity-action="reissue-invite" data-id="' + escape(item.id) + '">Reissue link</button><button type="button" class="text-button" data-identity-action="revoke-invite" data-id="' + escape(item.id) + '">Revoke</button></div></li>';
      }).join('') + '</ul>' : '<p class="muted">No pending invitations.</p>') +
      '</section>';
  }
  return html + '</section>';
}

function renderEvents() {
  const events = accessState && accessState.events || [];
  if (!events.length) return '<section class="identity-section"><h3>Events and people</h3><p class="muted">No event management scope is assigned to your account.</p></section>';
  return '<section class="identity-section"><h3>Events you manage</h3><p class="muted">Manage your room, registration state and event features. Closing a room makes it read-only for participants.</p>' +
    events.map(function(event) {
      const features = event.features || {};
      const check = function(name, label, checked) {
        return '<label class="identity-setting"><input name="' + name + '" type="checkbox" ' + (checked ? 'checked' : '') + '><span>' + label + '</span></label>';
      };
      return '<article class="identity-event"><div class="identity-event-heading"><div><strong>' + escape(event.title) + '</strong><span>' + escape(event.status) + ' · ' + new Date(event.startsAt).toLocaleString() + '</span></div>' +
        '<a class="text-link" href="/publisher-studio/events/' + encodeURIComponent(event.slug) + '/">Open participant event page</a></div>' +
        '<form data-identity-form="settings" data-event-id="' + escape(event.id) + '" class="identity-settings-form">' +
        check('roomOpen', 'Room is open', event.roomOpen) +
        check('registrationOpen', 'Registration is open', event.registrationOpen) +
        check('questionsEnabled', 'Questions', features.questions) +
        check('chatEnabled', 'Chat', features.chat) +
        check('buildEnabled', 'Build challenge', features.build) +
        check('resourcesEnabled', 'Event resources', features.resources) +
        '<button class="button secondary" type="submit">Save event settings</button><p class="form-error" role="alert" data-identity-error></p></form>' +
        '<details class="identity-roster"><summary>Registered participants (' + event.participants.length + ')</summary>' +
        (event.participants.length ? '<div class="identity-roster-list">' + event.participants.map(function(person) {
          return '<div><strong>' + escape(person.displayName) + '</strong><span>' + escape(person.email || 'No email recorded') + ' · ' + escape(person.status) + (person.studioConsent ? ' · Studio member opt-in' : '') + '</span></div>';
        }).join('') + '</div>' : '<p class="muted">No participant registrations have been recorded for this event yet.</p>') +
        '</details></article>';
    }).join('') + '</section>';
}

function renderAudit() {
  const rows = accessState && accessState.audit || [];
  return '<section class="identity-section"><h3>Role change history</h3><p class="muted">A record of access invitations and changes visible to your role.</p>' +
    (rows.length ? '<ul class="identity-list">' + rows.map(function(item) {
      return '<li><div><strong>' + escape(item.action) + '</strong><span>' + escape(item.actor) + (item.email ? ' · ' + escape(item.email) : '') + (item.role ? ' · ' + escape(item.role) : '') + ' · ' + escape(new Date(item.createdAt).toLocaleString()) + '</span></div></li>';
    }).join('') + '</ul>' : '<p class="muted">No access changes to show.</p>') + '</section>';
}

function teamMarkup(error) {
  const access = accessState || { roles: [], inviteOptions: [], assignments: [], invitations: [], events: [], audit: [] };
  const tabs = '<div class="identity-tabs" role="tablist"><button type="button" role="tab" aria-selected="' + (currentPanel === 'access') + '" data-identity-action="team-tab" data-tab="access">Roles &amp; invitations</button><button type="button" role="tab" aria-selected="' + (currentPanel === 'events') + '" data-identity-action="team-tab" data-tab="events">Events &amp; members</button><button type="button" role="tab" aria-selected="' + (currentPanel === 'audit') + '" data-identity-action="team-tab" data-tab="audit">Audit</button></div>';
  const panel = currentPanel === 'events' ? renderEvents() : currentPanel === 'audit' ? renderAudit() : renderAssignments();
  return '<div class="dialog-header"><div><div class="eyebrow">Server-checked permissions</div><h2 id="identity-title">Team &amp; event access</h2></div><button type="button" class="icon-button" data-identity-action="close" aria-label="Close">×</button></div>' +
    '<div class="dialog-content identity-content"><p class="identity-session">Signed in as <strong>' + escape(currentUser.displayName) + '</strong> · ' + escape(currentUser.email) + '</p>' +
    '<p class="form-error" role="alert">' + escape(error || '') + '</p>' + tabs + panel +
    '<div class="identity-footer"><button type="button" class="text-button" data-identity-action="participant-view">Switch to participant view</button><button type="button" class="text-button" data-identity-action="sign-out">Sign out</button></div></div>';
}

async function showTeam() {
  ensureDialog();
  currentPanel = 'access';
  dialog.dataset.view = 'team';
  dialog.innerHTML = '<div class="dialog-header"><h2 id="identity-title">Team &amp; event access</h2><button type="button" class="icon-button" data-identity-action="close" aria-label="Close">×</button></div><div class="dialog-content">Loading your server permissions…</div>';
  if (!dialog.open) dialog.showModal();
  try {
    accessState = await api(rolesUrl, 'GET');
    dialog.innerHTML = teamMarkup('');
  } catch (error) {
    accessState = null;
    dialog.innerHTML = teamMarkup(error.message);
  }
}

function setError(form, message) {
  const field = form.querySelector('[data-identity-error]');
  if (field) field.textContent = message || '';
}

async function acceptInviteIfPresent() {
  const token = new URLSearchParams(location.search).get('invite');
  if (!token || !currentUser) return;
  try {
    const result = await api(rolesUrl + '/accept', 'POST', { token: token });
    const url = new URL(location.href);
    url.searchParams.delete('invite');
    history.replaceState(history.state, '', url.pathname + url.search + url.hash);
    accessState = null;
    dispatchIdentity();
    toast('Invitation accepted. Your ' + (roleNames[result.role] || result.role) + ' access is active.');
  } catch (error) {
    toast(error.message);
    if (error.status === 403) showAuth('sign_in');
  }
}

function closeDialog() {
  if (dialog && dialog.open) dialog.close();
}

async function handleSubmit(event) {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || !form.dataset.identityForm) return;
  event.preventDefault();
  event.stopPropagation();
  setError(form, '');
  const data = Object.fromEntries(new FormData(form));
  try {
    if (form.dataset.identityForm === 'request') {
      const email = String(data.email || '').trim().toLowerCase();
      const payload = { action: 'request_code', email: email, mode: authMode };
      if (authMode === 'join') {
        payload.displayName = data.displayName;
        payload.consent = data.consent === 'on';
      }
      const result = await api(authUrl, 'POST', payload);
      challengeId = result.challengeId;
      challengeEmail = email;
      renderAuth('');
      toast('Check your email for the one-time code.');
    } else if (form.dataset.identityForm === 'verify') {
      const result = await api(authUrl, 'POST', {
        action: 'verify_code', email: challengeEmail, challengeId: challengeId, code: data.code,
      });
      currentUser = result.user;
      challengeId = '';
      initialJoin = { displayName: '', email: '' };
      dispatchIdentity();
      closeDialog();
      toast(result.user.studioMember ? 'You are signed in to Publisher Studio.' : 'You are signed in. Your staff access is active.');
      await acceptInviteIfPresent();
    } else if (form.dataset.identityForm === 'invite') {
      const option = (accessState.inviteOptions || [])[Number(data.option)];
      if (!option) throw new Error('Choose a role and scope.');
      const result = await api(rolesUrl, 'POST', {
        action: 'invite', email: data.email, role: option.role,
        scopeType: option.scopeType, scopeId: option.scopeId,
      });
      accessState = result;
      latestInvitationLink = result.invitationLink || '';
      dialog.innerHTML = teamMarkup('');
      toast(result.invitationEmailSent ? 'Invitation created and emailed.' : 'Invitation created. Copy the link to share it securely.');
    } else if (form.dataset.identityForm === 'bootstrap') {
      const result = await api(rolesUrl, 'POST', { action: 'bootstrap', secret: data.secret });
      accessState = result;
      currentUser = Object.assign({}, currentUser, { roles: result.roles });
      dispatchIdentity();
      dialog.innerHTML = teamMarkup('');
      toast('Your Wistudi Super Admin role is active.');
    } else if (form.dataset.identityForm === 'settings') {
      const settings = new FormData(form);
      const result = await api(rolesUrl, 'POST', {
        action: 'event.settings.update',
        eventId: form.dataset.eventId,
        roomOpen: settings.has('roomOpen'),
        registrationOpen: settings.has('registrationOpen'),
        questionsEnabled: settings.has('questionsEnabled'),
        chatEnabled: settings.has('chatEnabled'),
        buildEnabled: settings.has('buildEnabled'),
        resourcesEnabled: settings.has('resourcesEnabled'),
      });
      accessState = result;
      dialog.innerHTML = teamMarkup('');
      toast('Event settings saved on the Studio server.');
    }
  } catch (error) {
    setError(form, error.message || 'This request could not be completed.');
  }
}

async function handleAction(action, target) {
  const id = target.dataset.id || '';
  if (action === 'open-auth') {
    authMode = 'join';
    challengeId = '';
    initialJoin = { displayName: '', email: '' };
    renderAuth('');
  } else if (action === 'open-team') {
    if (!currentUser) return renderAuth('Sign in to manage your access.');
    await showTeam();
  } else if (action === 'open-account') {
    if (!currentUser) return renderAuth('');
    await showTeam();
  } else if (action === 'close') closeDialog();
  else if (action === 'mode-join') { authMode = 'join'; challengeId = ''; renderAuth(''); }
  else if (action === 'mode-signin') { authMode = 'sign_in'; challengeId = ''; renderAuth(''); }
  else if (action === 'back-to-email') { challengeId = ''; renderAuth(''); }
  else if (action === 'team-tab') { currentPanel = target.dataset.tab || 'access'; dialog.innerHTML = teamMarkup(''); }
  else if (action === 'participant-view') { closeDialog(); history.pushState(history.state, '', '/publisher-studio/?view=home'); window.dispatchEvent(new PopStateEvent('popstate')); }
  else if (action === 'sign-out') {
    try { await api(authUrl, 'POST', { action: 'sign_out' }); } catch { /* Clear the client state even if the server session expired. */ }
    currentUser = null; accessState = null; latestInvitationLink = '';
    dispatchIdentity(); closeDialog(); toast('You have signed out.');
  } else if (action === 'copy-invite') {
    try { await navigator.clipboard.writeText(latestInvitationLink); toast('Invitation link copied.'); }
    catch { toast('Copy is unavailable. Select and copy the invitation link above.'); }
  } else if (action === 'revoke-assignment' || action === 'revoke-invite' || action === 'reissue-invite') {
    try {
      const actionName = action === 'revoke-assignment' ? 'assignment.revoke' : action === 'revoke-invite' ? 'invitation.revoke' : 'invitation.reissue';
      const payload = actionName === 'assignment.revoke' ? { assignmentId: id } : { invitationId: id };
      const result = await api(rolesUrl, 'POST', Object.assign({ action: actionName }, payload));
      accessState = result;
      latestInvitationLink = result.invitationLink || '';
      dialog.innerHTML = teamMarkup('');
      if (actionName === 'invitation.reissue') toast(result.invitationEmailSent ? 'Invitation reissued and emailed.' : 'New secure link created. Copy it to share.');
      else toast(actionName === 'assignment.revoke' ? 'Role access revoked.' : 'Invitation revoked.');
    } catch (error) { dialog.innerHTML = teamMarkup(error.message); }
  }
}

function handleDialogClick(event) {
  const target = event.target instanceof Element ? event.target.closest('[data-identity-action]') : null;
  if (!target) return;
  event.preventDefault();
  event.stopPropagation();
  handleAction(target.dataset.identityAction, target);
}

function handleDocumentClick(event) {
  const target = event.target instanceof Element ? event.target.closest('[data-identity-action]') : null;
  if (!target) return;
  const mount = target.closest('[data-identity-mount]');
  if (!mount) return;
  event.preventDefault();
  handleAction(target.dataset.identityAction, target);
}

export function initIdentity(options) {
  onIdentityChanged = options && options.onIdentity || function() {};
  ensureDialog();
  mountHeader();
  const observer = new MutationObserver(mountHeader);
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('click', function(event) {
    const target = event.target instanceof Element ? event.target.closest('[data-identity-action]') : null;
    if (target && dialog && dialog.contains(target)) handleDialogClick(event);
  }, true);

  api(authUrl, 'GET').then(function(result) {
    currentUser = result.user;
    dispatchIdentity();
    return acceptInviteIfPresent();
  }).catch(function() {
    currentUser = null;
    mountHeader();
    const token = new URLSearchParams(location.search).get('invite');
    if (token) {
      authMode = 'join';
      renderAuth('');
    }
  });

  window.StudioIdentity = {
    openJoin: function(details) {
      const values = details || {};
      authMode = 'join';
      challengeId = '';
      initialJoin = {
        displayName: String(values.displayName || ''),
        email: String(values.email || ''),
      };
      renderAuth('');
    },
    refresh: function() { return api(authUrl, 'GET'); },
    currentUser: function() { return currentUser; },
  };
}
