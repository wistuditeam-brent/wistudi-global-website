# Publisher Studio Roles and Permissions

Status: proposed launch architecture; no live authentication or enforcement is connected
Last updated: 2026-09-20

## Purpose and recommendation

Publisher Studio should use named roles with explicit scopes. There is no single
`isAdmin` or `user.role` flag that grants access everywhere. A person's active
assignment to the Publisher Studio, one event, or a defined moderation scope
determines which management actions the server allows.

The experience remains one application. Participants, trainers and administrators
use the same persistent Studio shell and event URLs. Staff see management tools
inside that shell; a **Participant preview** control lets them inspect the member
presentation. That control changes the interface only. It never changes the user's
identity or weakens/enlarges server permissions.

The role names and boundaries below are the proposed source of truth for design and
implementation. The current prototype only displays sample trainer controls and
browser-local data. It has no login, role assignment, staff invitations, shared
records or access enforcement.

## Scope model

Use three governing scopes:

| Scope | Applies to | Example |
| --- | --- | --- |
| Wistudi platform | All Publisher Studio workspaces and events | Platform Super Admin |
| Publisher Studio | All events and members in this Studio | Studio Admin |
| Event | One event, its room, resources, roster and submissions | Event Lead, Event Moderator |

Future subject Studios can be represented as separate Studio scopes without
changing the event role model. A role never silently carries into a different
Studio or event. Event moderators can be restricted to selected event objects or
areas, such as Chat and Questions, if those areas need separate moderation teams.

An account can hold several independent assignments. For example, the same person
can be a participant in Event A, Event Lead in Event B and moderator in Event C.
Within the same exact scope, effective permissions are the union of that person's
active, explicit assignments. A grant never carries into another event or Studio.
Permissions are evaluated for the specific requested object and action. Assignments
are not inferred from names, email domains, event creation, registration or a UI
toggle.

## Role catalogue

| Role | Scope | Assigned by | Main responsibility |
| --- | --- | --- | --- |
| **Platform Super Admin** | Wistudi platform | Another active Super Admin under the governance procedure | Own platform-wide Studio policy, appoint Studio Admins, resolve escalations and review the global audit trail |
| **Studio Admin** | Publisher Studio | Platform Super Admin | Govern the Studio, approve and publish events, assign event staff, oversee moderation and take over events |
| **Event Builder** | Studio event-creation workspace or named draft | Studio Admin | Create and edit assigned draft events, prepare resources and submit them for review |
| **Event Lead (Trainer/Owner)** | One named event | Studio Admin; an approved Event Lead may be transferred by a Studio Admin | Run the event and manage its event-specific content, settings, team and room operations |
| **Event Co-trainer** | One named event | Studio Admin; an Event Lead only if explicitly delegated that invitation capability | Facilitate the workshop and support its learning activities without inheriting every manager permission |
| **Event Moderator** | One event, optionally limited to selected room areas | Event Lead for that event; Studio Admin | Review reports and moderate discussions or submissions within the assigned area |
| **Participant** | One event, based on valid registration/access and active Studio membership where required | Derived from verified registration and membership; never from a staff invite | Use the event room and contribute within member permissions |
| **Visitor** | Public pages | None | Discover and share public event information; register through the event's registration flow |
| **Meeting Host** *(capability, not a Studio role)* | One event's connected meeting | Studio Admin after the meeting owner is confirmed | Access host/start controls for the assigned provider meeting |
| **Showcase Reviewer** *(capability, not a Studio role)* | Publisher Studio or one event | Studio Admin | Approve creator-opted work for a public showcase/permalink; no event or staff administration is implied |

“Event Admin” is not a separate role. Avoid that label because it can be mistaken
for Studio-wide administration. Give an event another operational manager by
assigning a second Event Lead, or give a narrower job to a Co-trainer or Moderator.

## Permission boundaries

The governing rule is least privilege: grant the smallest role and event scope that
lets the person do their assigned work. The server owns the capability map and
checks it for every read and write. Hiding a control in the browser is not access
control.

### Platform Super Admin

- Can appoint and revoke Studio Admins, including another Platform Super Admin,
  under the governance safeguards below.
- The first Platform Super Admin must be provisioned through a trusted Wistudi
  operator/bootstrap process; never through a public invitation URL or client-side
  setting.
- Can access all Studio and event management areas, global settings, role
  assignments and audit records.
- Can perform Studio Admin and event-management actions across Studio scopes,
  with the same scoped checks and audit requirements.
- Global oversight does not automatically expose attendee contact data or meeting
  host secrets; those remain subject to explicit, audited access capabilities.
- Can suspend an account or event access where necessary, with a reason and audit
  entry.
- Must re-authenticate for sensitive global role changes. Protect the last active
  Super Admin from accidental removal. Two-person approval is preferred when the
  operating team can support it; otherwise require re-authentication, a reason and
  an alert to the other Super Admins.

### Studio Admin

- Can create events, assign Event Builders and Event Leads, review and publish
  events, manage Studio-wide settings, assign/revoke event staff, moderate any
  event, and close or reopen any room.
- Can appoint Event Moderators and Co-trainers across events in this Studio.
- Can assign the Showcase Reviewer capability to a named staff member and scope.
- Can inspect the audit trail and take over an event if its lead becomes unavailable.
- Cannot appoint a Platform Super Admin or change global Wistudi identity,
  authentication-provider or infrastructure settings.

### Event Builder

- Can create an event draft in an explicitly assigned creation workspace and edit
  the drafts assigned to them.
- Can prepare event description, learning outcomes, schedule, artwork, promotion
  media, event resources and challenge content.
- Can preview desktop and mobile, save drafts and submit them for review.
- Cannot publish or cancel a live event, see registrant contact information, access
  the protected room or meeting credentials, change Studio policy, grant roles or
  moderate member content unless separately assigned another role.
- Creating the draft does not grant ongoing access. A Studio Admin must assign an
  Event Lead before the event is published or run.

### Event Lead (Trainer/Owner)

The Event Lead is the event's primary operational manager. A trainer who needs to
manage an event receives this role for that event; “trainer” is not a global role.

- Can edit the assigned event's details, resources, promotion assets, challenge,
  room settings, enabled participant features and event-specific announcements.
- Can cancel their own event after a confirmation step and reason. This stops new
  registrations and triggers the approved attendee-notification flow; it never
  deletes the event or room history.
- Can see the event roster's minimum operational fields and registration/access
  status, answer questions, participate in chat, pin event resources, review
  submissions and give feedback.
- Can open, close and reopen the event room. Closure is audited and makes member
  contributions read-only; it does not delete content or event records.
- Can access the participant join link when assigned to the event. Host/start
  credentials require the separate Meeting Host capability and must match the
  person authorized in the connected meeting provider.
- Can invite or remove **Event Moderators** for this event, limited to the
  moderation scope the lead is allowed to delegate. Invitations must be
  email-bound, named, time-limited and revocable.
- Cannot appoint Studio Admins or Platform Super Admins; grant Event Lead to
  another person; publish a first-time event unless the Studio Admin has explicitly
  granted that event capability; change Studio-wide settings; transfer ownership;
  inspect other events' rosters; edit the underlying booking/payment record; or
  access Zoom host credentials by default.
- The Studio Admin can grant an additional, explicit capability when an event has a
  real operational need, but the grant is named, event-scoped and audited. Do not
  create open-ended custom roles in the first live release.

### Event Co-trainer

- Can view event preparation material, facilitate the live session, answer
  questions, join event discussions and add or update learning content when the
  Event Lead enables that capability.
- Cannot manage the roster, change registration or room policy, invite staff,
  publish/cancel the event, close the room, or see protected meeting host details
  unless upgraded to Event Lead by a Studio Admin.

### Event Moderator

- Can review reports and hide/restore inappropriate threads, replies, questions or
  submissions within the assigned event/area. Moderation actions require a reason
  and are written to the audit trail.
- Cannot approve private work for an external public permalink. A creator must
  explicitly request public sharing, and a Studio Admin or designated showcase
  reviewer must approve that publication separately. A creator cannot approve
  their own work.
- Can escalate a safeguarding, privacy or account issue to the Studio Admin.
- Cannot edit event setup, view attendee contact details, access Zoom links, assign
  roles, change room lifecycle state, publish event changes or moderate another
  event. A moderator may answer a question only when also assigned as a Co-trainer
  or Event Lead.

### Participant and Visitor

- A valid booking grants event attendance according to the existing registration
  system. It does not by itself create a Studio profile or discussion membership.
- Verified Studio membership plus valid event access grants member actions such as
  reading eligible room discussions, asking and replying, reacting, joining the
  build challenge and sharing a creation with the event.
- Participants can edit or remove their own content subject to the retention and
  moderation policy. They cannot moderate other people, manage event settings or
  see another event's member space.
- Visitors can view public event details and explicitly public resources only.
  Event, room and meeting links never bypass registration or room authorization.

## Capability matrix

`Yes` means the role may perform the action inside its scope. `Assigned` means a
Studio Admin must grant that exact event role/capability. `No` means the role cannot
do it. Platform Super Admin acts across Studio scopes, with the same scoped checks
and audit requirements for sensitive actions.

| Capability | Platform Super Admin | Studio Admin | Event Builder | Event Lead | Co-trainer | Moderator | Participant |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Create/edit assigned draft | Yes | Yes | Yes | Assigned | No | No | No |
| Submit draft for review | Yes | Yes | Yes | Assigned | No | No | No |
| First publication / schedule | Yes | Yes | No by default | Assigned | No | No | No |
| Edit published event details/settings | Yes | Yes | No | Yes, own event | Assigned | No | No |
| Cancel event with confirmation and attendee notice | Yes | Yes | No | Yes, own event | No | No | No |
| View event participation status | Yes | Yes | No | Yes, own event; minimum fields | No | No | Own status only |
| Send event announcement through Studio | Yes | Yes | No | Yes, own event | Assigned | No | No |
| View raw attendee email / export roster | Restricted, audited only for an approved operational need | Restricted, audited only for an approved operational need | No | No by default | No | No | No |
| Moderate event discussion/submissions | Yes | Yes | No | Yes, own event | No by default | Yes, assigned area | Own content only |
| Approve creator-opted public showcase/permalink | Yes | Yes | No | Assigned as Showcase Reviewer | No by default | No by default | No |
| Invite/revoke Event Moderator | Yes | Yes | No | Yes, own event | No by default | No | No |
| Assign Event Lead | Yes | Yes | No | No | No | No | No |
| Assign Studio Admin / Platform Super Admin | Yes, under safeguards | No / No | No | No | No | No | No |
| Open/close/reopen room | Yes | Yes | No | Yes, own event | No by default | No | No |
| Access participant Zoom join link | If assigned/eligible | If assigned/eligible | No | Yes, own event | If assigned | No | If registered |
| Access Zoom host/start credentials | Only when separately designated as Meeting Host | Only when separately designated as Meeting Host | No | Only when separately designated as Meeting Host | No by default | No | No |
| View Studio-wide audit | Yes | Yes | No | No | No | No | No |

For any capability marked `Assigned`, an assignment must state the specific person,
event and capability; it cannot be inferred from a broad invitation or role label.
Meeting Host is assigned separately from Event Lead and does not grant any Studio
or event-management permissions.

## Invitation and delegation rules

### Who can invite whom

| Inviter | Allowed invitation |
| --- | --- |
| Platform Super Admin | Any role at a Studio/event scope; Studio Admin or another Platform Super Admin under the governance safeguards |
| Studio Admin | Event Builder, Event Lead, Co-trainer or Event Moderator within this Studio |
| Event Lead | Event Moderator for their own event; Co-trainer only if a Studio Admin explicitly delegated that capability |
| Event Builder, Co-trainer, Moderator, Participant | None |

Trainers do not invite “admins” through a general link. They may invite an
event-scoped Moderator. A person who needs to manage event settings or the
participant roster must be assigned as an Event Lead by a Studio Admin. Studio-wide
admin appointments remain a Wistudi governance action. Platform Super Admin
invitations for Studio/event roles remain subject to the same scope, audit and
re-authentication controls as the corresponding Studio Admin action.

### Invitation lifecycle

1. The inviter selects a named email address, role, scope and allowed capabilities.
   The confirmation screen shows exactly what the recipient can manage.
2. The server verifies the inviter's authority and creates a pending invitation
   with a cryptographically random token stored as a hash. The link is single-use,
   email-bound, revocable and expires after a short period (recommended default:
   seven days).
3. The recipient signs in or verifies the invited email. A forwarded link alone
   does not identify or authorize a different person.
4. On acceptance, the server re-checks the inviter's current authority, the target
   event/Studio state and the invitation status. Only then does it create an active
   scoped assignment and mark the invitation accepted.
5. Acceptance, decline, expiry, revocation, role change and scope transfer are
   recorded in the audit history. Revocation takes effect on the next server
   authorization check and invalidates relevant sessions/caches.

Required invitation states: `pending`, `accepted`, `declined`, `expired`,
`revoked`. Do not use a reusable bearer URL, a client-created role, an email-domain
rule or an invitation to an unverified address as authorization. If the inviter's
role is revoked while an invitation is pending, acceptance must fail or be reviewed
by the next authorized Studio Admin.

## Event management and participant view

### One event card, clear relationship

**My events** combines events the person attends and events they manage. Provide
filters or sections for **Attending**, **Managing**, **Drafts** and **Invitations**.
Show one card per event with explicit role/status chips (for example “Attending” and
“Event Lead” together) rather than duplicating the event. A pending invitation does
not appear as an accepted assignment.

The underlying participant and staff relationships remain distinct. A user who is
both a trainer and a registrant sees the combined event record, but does not receive
staff access through their attendee registration or vice versa.

### Staff management view

Inside the persistent Studio shell, authorized staff receive event tools in the
selected event's navigation:

- **Overview** — public-facing event page and current status.
- **Room** — participant experience and live-session entry points.
- **Questions / Chat** — participant threads, trainer responses and moderation
  queues appropriate to the staff role.
- **Build** — challenge and submission review.
- **Event resources** — resource visibility and release stage.
- **Participants** — roster status and event-specific announcements for Event Leads
  and Studio Admins.
- **Event setup** — schedule, description, artwork and event resource editing for
  Event Leads/Builders as appropriate.
- **Team & access** — current assignments and invitations; invite controls appear
  only for roles permitted to use them.
- **Room settings** — enabled features and explicit open/close/reopen controls.

The persistent global panel keeps **Home**, **Discover events**, **My events** and
the role-gated **Build an event** action. Studio Admin tools are visible only to
Studio Admins and Platform Super Admins.

### Participant preview is not impersonation

Show **Participant preview** in the header only to assigned staff. It previews the
learner-facing layout and hides management controls while displaying a visible
“Participant preview” banner and an **Exit preview** action. It does not sign the
staff member in as a participant, change their role, expose a private member-only
resource, call a different authorization path or provide a security test. Each API
request continues to use the staff member's real session and scope.

To verify participant permissions, use a separate test participant identity in a
non-production environment. Support impersonation, if ever needed, is a separate
privileged operation requiring a stated reason, time limit, audit and visible
impersonation banner; it is not part of the MVP.

## Event settings and room lifecycle

Event schedule and room access are separate state machines. The event may be
Draft, In Review, Scheduled, Live, Completed, Cancelled or Archived. Its room is
independently Open or Closed. Event completion or cancellation never silently
deletes content or changes room access.

| Situation | Required behavior |
| --- | --- |
| Draft is abandoned | Only assigned builders/admins can see or edit it; it is not public or in participant search. |
| New event is submitted | Studio Admin reviews required details, resource visibility, host assignment and public preview before first publication. |
| Event is published or materially changed | Record actor/time and previous/new values; for time, cancellation or registration changes, confirm and notify affected registrants through the approved channel. |
| Event reaches scheduled end | Mark the event completed as appropriate; leave the room open until an authorized Event Lead or admin closes it. |
| Room is closed | Keep eligible history readable; prevent new member posts, replies and submissions; retain files under the same access rules. Show who closed it and how to request reopening. |
| Room is reopened | Event Lead or Studio Admin must confirm and provide a reason; audit and notify watchers if configured. |
| Event is cancelled | Stop new registrations, preserve the record and room history, display cancellation, and notify registrants. Room access is then an explicit staff decision. |
| Event is archived | Remove it from active discovery while retaining it in eligible My events/history according to retention policy. No role is silently broadened. |
| Event Lead leaves or is suspended | Studio Admin assigns a replacement before removing the last active lead. Keep a Studio Admin recovery path for every event. |
| A participant's booking is cancelled | Reconcile event access with the booking source; do not delete their Studio identity or unrelated event memberships. |
| An event feature is turned off | Stop new use and explain the change; retain existing content and make it read-only or hidden by policy, never silently delete it. |

For the first live release, event-level switches may include registration,
participant discussion, Questions, submissions, attachments and public resource
preview. A setting can be disabled only by an authorized manager. Changes are
event-scoped, confirmed, audited and applied server-side.

## Privacy and integration boundaries

- Event Leads need an operational roster, not unrestricted booking-system access.
  Default roster fields are display name, booking/access status and required
  attendance status. Do not expose raw email addresses or allow bulk export by
  default. Send event announcements through an approved Studio service without
  exposing recipients to each other.
- If a documented operational process requires direct email access, give a named
  staff member a separate, event-scoped contact-data capability after policy review;
  audit access and do not grant it to Moderators.
- Studio Admin access to booking PII is also restricted to an approved need. A role
  should not silently grant access to the Google Sheet, payment data or Resend
  account. Existing event registration remains its own source of truth until an
  approved adapter is implemented.
- A participant Zoom join link is available only to eligible registrants and
  assigned staff. Zoom host/start credentials are a separate integration secret
  available only to a separately designated meeting owner.
- Event resource files, videos, message attachments, link previews, notification
  links and related-context suggestions inherit the parent event/context access
  check. A link to another room never grants that room's membership.
- Public event shares contain public event information only. Room invitations,
  messages, rosters, meeting links, unpublished resources and unapproved creations
  must not appear in Open Graph cards, previews or public endpoints.

## Technical authorization contract

Before implementing production roles:

1. Confirm the canonical Wistudi account provider and stable user ID, current
   website/runtime bindings, Studio database owner, and preview/production
   separation. Keep the identity/provider decision in
   [`identity-and-storage.md`](identity-and-storage.md).
2. Add server-owned role definitions and a policy map. For each request, verify the
   session, account status, active role assignment, target scope, object status,
   membership/registration entitlement and requested action. Deny by default.
3. Keep role assignment data, invitations, event access, registration linkage and
   audit records in durable storage with unique constraints and transactions.
   Role checks must occur server-side for every endpoint; direct browser-to-database
   access is prohibited.
4. Revoke assignments and invitations immediately, re-check at invitation
   acceptance and avoid long-lived permission caches. Use CSRF/origin checks,
   rate limits and re-authentication for sensitive governance actions.
5. Use an append-only `authorization_audit`/moderation log for role grants,
   invitation actions, publishing/cancellation, roster contact access, moderation,
   room closure/reopening, feature-setting changes and account suspension. Store
   actor, target, scope, action, reason and timestamp; exclude secrets and minimize
   personal data.
6. Keep the role policy independent of the website UI so a future Wistudi
   platform integration can map a verified canonical identity to the same Studio
   user and scoped assignments.

The existing `role_assignment` proposal in `identity-and-storage.md` should be
extended with a first-class invitation record and a protected audit record. Use
named roles in the MVP rather than arbitrary client-supplied permissions. If a
specific delegation capability is required, store it as a server-approved,
event-scoped grant with an audit trail.

## Launch acceptance criteria

Before enabling real members or staff, the implementation must demonstrate that:

- every role has a declared scope, inviter and permitted capability set;
- an Event Lead cannot access another event's roster, content, settings or team by
  changing an ID in a URL or request;
- moderators cannot view attendee PII, invite staff, change event setup or close a
  room;
- Studio Admins can take over an event, while only Platform Super Admins can
  appoint Studio Admins or Platform Super Admins;
- each invitation is named, scoped, email-bound, single-use, expiring and
  revocable, and pending invites are re-authorized at acceptance;
- dual-role users see a single My events item with separate relationship badges;
- Participant preview does not change the authorization result of any request;
- a closed room is read-only, event end does not auto-close it, and reopen/close
  actions are audited;
- cancelled bookings, suspended memberships, removed staff, event cancellation
  and archive each have explicit access outcomes;
- meeting secrets, registration credentials, raw emails, private files and
  unapproved content never leak through public pages or link previews; and
- access-policy tests cover both allowed and denied reads/writes for every role and
  relevant scope before production launch.

## Decisions to confirm before live access

These are product/operations sign-offs, not reasons to block the prototype:

1. **Publisher scope:** Treat Publisher Studio as one Studio scope for launch; add
   subject Studios later as separate scopes if/when they are introduced.
2. **First publication:** Require Studio Admin approval for an event's first
   publication. An Event Lead can update their event after assignment; schedule,
   cancellation and registration changes require confirmation and attendee notice.
3. **Attendee contact data:** Keep raw email hidden from Event Leads and Moderators
   by default; provide event announcements without exposing the list. Add audited,
   named contact access only if the operating process needs it.
4. **Trainer delegation:** Event Leads can invite event Moderators. A Studio Admin
   appoints Event Leads and Studio Admins. Any extra co-trainer/team invitation
   capability is explicitly delegated by a Studio Admin.
5. **Super Admin safeguards:** Require re-authentication and audit for Super Admin
   grants/revocations, protect the final active Super Admin, and add two-person
   approval if Wistudi's staffing model supports it.

When approved, record changes in `decisions.md` before adding live RBAC behavior.
