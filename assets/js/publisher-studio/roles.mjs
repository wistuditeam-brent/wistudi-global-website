export const ROLE_LABELS = Object.freeze({
  visitor: 'Visitor',
  participant: 'Participant',
  event_builder: 'Event Builder',
  event_lead: 'Event Lead',
  event_co_trainer: 'Event Co-trainer',
  event_moderator: 'Event Moderator',
  studio_admin: 'Studio Admin',
  platform_super_admin: 'Platform Super Admin',
});

export const ROLE_KEYS = Object.freeze(Object.keys(ROLE_LABELS));
export const EVENT_ROLE_KEYS = Object.freeze(['event_builder', 'event_lead', 'event_co_trainer', 'event_moderator']);
export const STAFF_ROLE_KEYS = Object.freeze([...EVENT_ROLE_KEYS, 'studio_admin', 'platform_super_admin']);

export const ROLE_DESCRIPTIONS = Object.freeze({
  visitor: 'Browse public event pages and register.',
  participant: 'Join the selected event and take part in its room.',
  event_builder: 'Create and prepare event drafts assigned to you.',
  event_lead: 'Manage one assigned event, its room and its event team.',
  event_co_trainer: 'Facilitate the assigned event and answer learner questions.',
  event_moderator: 'Moderate conversations and submissions in the assigned event.',
  studio_admin: 'Govern Publisher Studio and manage its events and staff.',
  platform_super_admin: 'Govern all Studio scopes and appoint Studio Admins.',
});

export function demoRole(state) {
  return ROLE_LABELS[state?.demoRole] ? state.demoRole : 'visitor';
}

export function roleName(role) {
  return ROLE_LABELS[role] || ROLE_LABELS.visitor;
}

export function isStudioAdmin(state) {
  return ['studio_admin', 'platform_super_admin'].includes(demoRole(state));
}

export function isPlatformSuperAdmin(state) {
  return demoRole(state) === 'platform_super_admin';
}

export function isEventRoleFor(state, eventId) {
  return EVENT_ROLE_KEYS.includes(demoRole(state)) && state?.demoEventId === eventId;
}

export function canCreateEvent(state) {
  return !state?.participantPreview && ['event_builder', 'studio_admin', 'platform_super_admin'].includes(demoRole(state));
}

export function canManageEvent(state, eventId) {
  if (state?.participantPreview) return false;
  return isStudioAdmin(state) || (demoRole(state) === 'event_lead' && isEventRoleFor(state, eventId));
}

export function canManageTeam(state, eventId) {
  if (state?.participantPreview) return false;
  return isStudioAdmin(state) || (demoRole(state) === 'event_lead' && isEventRoleFor(state, eventId));
}

export function canModerateEvent(state, eventId) {
  if (state?.participantPreview) return false;
  return isStudioAdmin(state)
    || (['event_lead', 'event_moderator'].includes(demoRole(state)) && isEventRoleFor(state, eventId));
}

export function canAnswerEventQuestions(state, eventId) {
  if (state?.participantPreview) return false;
  return isStudioAdmin(state)
    || (['event_lead', 'event_co_trainer'].includes(demoRole(state)) && isEventRoleFor(state, eventId));
}

export function canViewParticipants(state, eventId) {
  return canManageEvent(state, eventId);
}

export function canChangeRoom(state, eventId) {
  return canManageEvent(state, eventId);
}

export function hasEventRoomAccess(state, eventId) {
  if (state?.participantPreview) return true;
  const role = demoRole(state);
  return role === 'participant' || canManageEvent(state, eventId) || canModerateEvent(state, eventId)
    || (role === 'event_co_trainer' && isEventRoleFor(state, eventId));
}

export function canContributeToEvent(state, eventId) {
  if (state?.participantPreview) return true;
  const role = demoRole(state);
  return role === 'participant' || canManageEvent(state, eventId)
    || (role === 'event_co_trainer' && isEventRoleFor(state, eventId));
}

export function inviteableRoles(state, scope = 'event') {
  const role = demoRole(state);
  if (role === 'platform_super_admin') {
    return scope === 'platform'
      ? ['platform_super_admin']
      : scope === 'studio'
        ? ['studio_admin']
        : [...EVENT_ROLE_KEYS];
  }
  if (role === 'studio_admin' && scope === 'event') return [...EVENT_ROLE_KEYS];
  if (role === 'event_lead' && scope === 'event') return ['event_moderator'];
  return [];
}

export function canInviteRole(state, role, eventId) {
  return Boolean(eventId && inviteableRoles(state, 'event').includes(role) && canManageTeam(state, eventId));
}

export function canInviteStudioAdmin(state) {
  return isPlatformSuperAdmin(state) && inviteableRoles(state, 'studio').includes('studio_admin');
}

export function canInvitePlatformSuperAdmin(state) {
  return isPlatformSuperAdmin(state) && inviteableRoles(state, 'platform').includes('platform_super_admin');
}

export function isStaffViewAvailable(state) {
  return STAFF_ROLE_KEYS.includes(demoRole(state));
}

export function canRevokeAssignment(state, assignment, assignments) {
  if (!assignment || assignment.status !== 'active' || state?.participantPreview) return false;
  const current = demoRole(state);
  if (current === 'platform_super_admin') {
    if (assignment.role === 'platform_super_admin' && assignments.filter(item => item.role === 'platform_super_admin' && item.status === 'active').length <= 1) return false;
    return true;
  }
  if (current === 'studio_admin') return ['event_builder', 'event_lead', 'event_co_trainer', 'event_moderator'].includes(assignment.role);
  return current === 'event_lead' && assignment.role === 'event_moderator' && assignment.scopeId === state.demoEventId;
}
