import { activeAssignments } from './_security.js';

export const STUDIO_SCOPE_ID = 'publisher-studio';
export const PLATFORM_SCOPE_ID = 'wistudi';
export const ROLE_NAMES = Object.freeze([
  'platform_super_admin',
  'studio_admin',
  'event_builder',
  'event_lead',
  'event_co_trainer',
  'event_moderator',
]);

const CAPABILITIES = Object.freeze({
  platform_super_admin: new Set(['*']),
  studio_admin: new Set([
    'studio.events.create', 'studio.events.read', 'studio.events.publish',
    'studio.roles.manage', 'studio.members.manage', 'studio.moderate',
    'studio.audit.read', 'event.manage', 'event.read', 'event.write',
    'event.room.manage', 'event.questions.answer', 'event.moderate',
  ]),
  event_builder: new Set(['event.draft.create', 'event.draft.read', 'event.draft.write', 'event.draft.submit']),
  event_lead: new Set([
    'event.manage', 'event.read', 'event.write', 'event.room.manage',
    'event.questions.answer', 'event.moderate', 'event.roles.invite_moderator',
  ]),
  event_co_trainer: new Set(['event.read', 'event.write', 'event.questions.answer']),
  event_moderator: new Set(['event.read', 'event.moderate']),
});

export function hasCapability(assignments, capability, scopeType = '', scopeId = '') {
  return assignments.some(assignment => {
    const inScope = assignment.scopeType === 'platform'
      || (assignment.scopeType === 'studio' && assignment.scopeId === STUDIO_SCOPE_ID
        && (!scopeType || scopeType === 'studio' || scopeType === 'event'))
      || (assignment.scopeType === scopeType && assignment.scopeId === scopeId);
    const grants = CAPABILITIES[assignment.role];
    return inScope && Boolean(grants) && (grants.has('*') || grants.has(capability));
  });
}

export async function assignmentsFor(db, userId) {
  return activeAssignments(db, userId);
}

export async function canGrantRole(db, actorId, role, scopeType, scopeId) {
  if (!ROLE_NAMES.includes(role)) return false;
  const assignments = await assignmentsFor(db, actorId);
  const superAdmin = assignments.some(item => item.role === 'platform_super_admin'
    && item.scopeType === 'platform' && item.scopeId === PLATFORM_SCOPE_ID);
  const studioAdmin = assignments.some(item => item.role === 'studio_admin'
    && item.scopeType === 'studio' && item.scopeId === STUDIO_SCOPE_ID);
  const eventLeads = assignments.filter(item => item.role === 'event_lead' && item.scopeType === 'event');

  if (role === 'platform_super_admin') return superAdmin && scopeType === 'platform' && scopeId === PLATFORM_SCOPE_ID;
  if (role === 'studio_admin') return superAdmin && scopeType === 'studio' && scopeId === STUDIO_SCOPE_ID;
  if (role === 'event_builder') return scopeType === 'studio' && scopeId === STUDIO_SCOPE_ID && (superAdmin || studioAdmin);
  if (!['event_lead','event_co_trainer','event_moderator'].includes(role) || scopeType !== 'event') return false;

  const event = await db.prepare(
    "SELECT id FROM studio_events WHERE id = ? AND workspace_id = 'preview-workspace'"
  ).bind(scopeId).first();
  if (!event) return false;
  if (superAdmin || studioAdmin) return true;
  return role === 'event_moderator' && eventLeads.some(item => item.scopeId === scopeId);
}

export async function eventCapabilities(db, userId, eventId) {
  const assignments = await assignmentsFor(db, userId);
  const scoped = assignments.filter(item =>
    (item.scopeType === 'platform' && item.scopeId === PLATFORM_SCOPE_ID)
    || (item.scopeType === 'studio' && item.scopeId === STUDIO_SCOPE_ID)
    || (item.scopeType === 'event' && item.scopeId === eventId)
  );
  return {
    assignments: scoped,
    canRead: hasCapability(scoped, 'event.read', 'event', eventId),
    canWrite: hasCapability(scoped, 'event.write', 'event', eventId),
    canAnswer: hasCapability(scoped, 'event.questions.answer', 'event', eventId),
    canModerate: hasCapability(scoped, 'event.moderate', 'event', eventId),
    canManage: hasCapability(scoped, 'event.manage', 'event', eventId),
    canManageTeam: hasCapability(scoped, 'studio.roles.manage', 'event', eventId)
      || hasCapability(scoped, 'event.roles.invite_moderator', 'event', eventId),
  };
}

export function rolesForClient(assignments) {
  return assignments.map(item => ({
    id: item.id,
    role: item.role,
    scopeType: item.scopeType,
    scopeId: item.scopeId,
    createdAt: item.createdAt,
    expiresAt: item.expiresAt,
  }));
}
