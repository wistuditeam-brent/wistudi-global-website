# Publisher Studio Identity and Storage Design

Status: architecture baseline for review; no provider selected or connected  
Date: 2026-09-19  
Scope: identity, membership, registration handoff, contextual content and migration

## Decision in one sentence

Keep workshop booking, optional Studio membership, and verified sign-in as separate
records and steps; give Studio its own stable IDs and relational data model, while
leaving the existing Sheets and Resend booking path intact until a retryable handoff
and the Wistudi platform's current identity stack are confirmed.

This document is a design contract, not a production implementation. No personal
data, authentication provider, database binding or external service is added here.

## What the repository audit found

The global website source currently shows:

- Static HTML/CSS/JavaScript served with Cloudflare Pages Functions.
- `POST /api/event-register` sends event registration to Google Apps Script / Sheets
  and sends confirmations through Resend.
- The Sheets script checks for duplicates by event ID and normalized email, then
  appends a row. The check and append are not protected by a lock or database unique
  constraint in the inspected script, so simultaneous duplicate requests can race.
- If Sheets storage fails, the event endpoint sends an operational fallback email.
  That is a manual recovery path, not a durable outbox; a later retry can be given a
  different generated registration ID.
- No reusable participant login or transactional Studio database was found in this
  repository.

This is a source audit only. It does not inspect Cloudflare account bindings/secrets,
the Wistudi product repository's contents, or any external identity/database
accounts. The connected GitHub account currently exposes `wistudi-global-website`
and a `prototypes` repository; neither is a clearly identifiable Wistudi product/auth
repository. A separate organization, account or private repository may still exist.
The existing platform's authentication and database remain unknown and must be
checked with its owner before choosing a provider.

## Product and identity boundaries

| Concern | Meaning | Creates access to discussion? |
| --- | --- | --- |
| Event registration | Reserves a place and stores event contact details in the existing registration system | No |
| Studio membership choice | Explicit permission to create a Studio profile and participate | Not by itself |
| Verified sign-in | Proves control of an email or linked identity | No, unless membership is active |
| Studio membership | Allows member actions such as asking, replying, voting and submitting | Yes |
| Workshop attendance | A relationship to one workshop; it can exist without Studio membership | No |
| Wistudi account link | A later, explicit connection to a Wistudi account | No change to existing content ownership by itself |

The event form should offer a separate, unchecked Studio opt-in. Booking must still
succeed if the participant declines it or the Studio service is unavailable. Privacy
consent for booking, optional marketing consent, and Studio membership consent are
separate purposes and must not share one checkbox.

The prototype already illustrates an unchecked Studio opt-in. The production event
endpoint currently accepts booking privacy and marketing consent only; it does not
accept or persist a Studio opt-in. No production UI or endpoint should imply that it
does until the reviewed onboarding flow and durable storage are implemented.

## Proposed enrollment flow

1. The participant submits the existing event form. Studio opt-in is optional,
   unchecked, and represented as a server-validated boolean with a server-owned
   consent-text version.
2. The existing event API and Sheets/Resend flow continue to own the booking. An
   event registration ID is a correlation reference only; it is never a login token.
3. If the participant opted in, the server records an idempotent enrollment intent
   in the future Studio store. Enforce uniqueness for `(event, keyed normalized
   email)` and attach the canonical registration reference when available. The
   intent is `pending_verification`; it grants no access.
4. The participant receives a separate, single-use email verification/sign-in link.
   The current event confirmation email is not proof of mailbox ownership because
   it does not require the recipient to complete a verification step.
5. On successful link redemption, the server consumes the token, creates or finds
   the Studio identity, records the consent evidence, and activates the Studio
   membership. It then creates a secure session.
6. Later workshop registrations attach to the existing Studio identity only after
   the user proves control of that identity. They do not create another profile,
   avatar or membership.

### UI state transitions

| Participant state | What the page says | Available actions |
| --- | --- | --- |
| Visitor | Explore the Studio and public material | View event, approved kit and curated public showcase |
| Booking confirmed, no Studio opt-in | Workshop place is confirmed; Studio profile was not created | Keep browsing; opt in later through a verified flow |
| Enrollment pending | Workshop place is confirmed; check email to activate Studio participation | Resend verification with neutral responses; change email through a safe retry flow |
| Verified member | Studio profile is active; show generated avatar and editable display name | Read member discussions; ask, reply, vote, join challenges and share work |
| Suspended/withdrawn | Access is paused or membership ended | Follow support/recovery path; private data is not exposed |

Do not show a success state that implies the user can post while verification is
pending. Email link `GET` requests should show a confirmation screen; consume the
single-use token only after an explicit user action so mail-security scanners do not
activate accounts accidentally. A link expiry should lead to a safe resend flow,
not a dead end. Resend/sign-in responses should not disclose whether an address has
an account. Rate-limit by address digest and network risk. Changing a pending email
requires a fresh verification and must not silently transfer an existing identity.

The cross-system write cannot be one atomic transaction while Sheets and the Studio
store are separate. Before live opt-in is enabled, the implementation must include a
durable retry mechanism (an outbox/queue or a reconciliation job) and explicit
statuses for pending, delivered, retryable failure and terminal failure. It must
never report Studio membership as active before verification. If Studio enrollment
setup fails, the event booking remains successful and the participant receives a
clear way to retry; the failure must be observable to the Wistudi team without
exposing the attendee's email in logs.

Use a database uniqueness constraint for the event/email opt-in identity, and keep
any idempotency key separate from the bearer verification token. The existing Sheets
read-then-append duplicate check is not race-safe; its fallback email is not a
machine-retryable queue. Decide whether to add locking/unique storage there or make a
new transactional source of truth before depending on it for Studio provisioning.

For the first data release, use the Studio store only for opted-in/pending Studio
identity work and Studio content. Do not bulk-import all historical event
registrations into Studio. Do not copy names, organization fields, marketing choices
or other booking PII into the Studio database when an opaque registration reference
is sufficient.

## Logical data model

IDs are opaque, immutable UUIDs generated by the server. Human-readable names,
emails, event slugs and third-party identifiers are not primary keys. Timestamps are
server-generated UTC values. Every table with user content has a moderation/deletion
policy and a server-side authorization check.

The role catalogue, assigner hierarchy, invitation workflow and UI permissions are
defined in [`roles-and-permissions.md`](roles-and-permissions.md). Store role names
and scopes as normalized records; keep the permission map in server-owned policy
code for the MVP. Do not create ad hoc `is_admin` flags or client-selected custom
role JSON.

| Entity | Important fields and relationships | Constraints and purpose |
| --- | --- | --- |
| `studio_user` | `id`, `display_name`, private `avatar_seed`, `avatar_style`, `status`, timestamps | Public profile shell. Never return the seed, email, global role or provider ID. Seed is random and independent of email. |
| `verified_email` | `id`, `studio_user_id`, normalized address, verified timestamp, primary flag | Private login/contact lookup. Enforce one active account per normalized address unless a reviewed recovery process resolves a collision. Never expose in public APIs. |
| `auth_identity` | `id`, `studio_user_id`, provider namespace, provider subject, linked/unlinked timestamps | Unique `(provider, subject)`. Allows Studio magic-link identity now and explicit Wistudi identity mapping later. |
| `auth_token` | `id`, email/user reference, token hash, purpose, expiry, consumed timestamp | Store only a cryptographic hash; single use; short expiry; rate limited. Raw token exists only in the email link. |
| `auth_session` | `id`, `studio_user_id`, session-token hash, created/last-used/expiry/revoked timestamps | Opaque random cookie token, stored hashed server-side; revoke on logout, account suspension and credential recovery. |
| `studio_membership` | `id`, `studio_user_id`, `studio_id`, status, joined/left timestamps | Unique active membership per user and Studio. Membership is distinct from workshop booking. |
| `membership_consent` | `id`, membership or enrollment intent, purpose, policy version, action, captured timestamp, source | Append-only grant/withdrawal evidence. Keep marketing consent in its current separate system. |
| `workshop` | `id`, stable slug, title, topic, status, UTC schedule, trainer assignment | Stable Studio context for current and archived sessions. External calendar/event IDs are mappings, not primary keys. |
| `workshop_registration_link` | `id`, `workshop_id`, source namespace, opaque registration reference, optional verified `studio_user_id`, status | Unique `(source, registration_reference)`. Link a booking to a person only after verified onboarding. Do not store a Sheets row number or the registration ID as a credential. |
| `enrollment_intent` | `id`, event/source reference, encrypted/private verification destination, keyed normalized-email digest + key version, consent version/time, state, retry timestamps | Unique `(event_id, email_digest)` prevents repeated opt-ins while pending. Expire unverified intents and remove their email data according to an approved retention period. The digest is private and never an ID or credential. |
| `studio_context` | `id`, `context_type`, origin namespace, origin ID, title, subject/topic/level metadata, lifecycle timestamps | Stable conversation anchor for a workshop, Flow, template, worksheet, tool, challenge or submission. Unique external mapping where available. Provides a real FK target instead of an unconstrained type/ID pair. |
| `discussion_thread` | `id`, `context_id`, `created_by`, contribution kind, title/body, moderation state, timestamps | Every conversation belongs to a context. Context access and visibility are checked server-side. |
| `thread_reply` | `id`, `thread_id`, `author_id`, body, moderation state, timestamps | Starts as one reply level for a clear mobile conversation; nested replies can be a later UX decision. |
| `question_vote` | `id`, `question_thread_id`, `studio_user_id`, vote type, timestamp | Unique `(question_thread_id, studio_user_id, vote_type)` prevents duplicate votes; vote counts are derived, not trusted from clients. |
| `studio_poll` / `poll_option` | Context, prompt, open/close times, vote policy; stable options | Polls are purposeful programming/learning choices, not generic engagement bait. |
| `poll_vote` | `poll_id`, option ID, member ID, timestamp | Unique vote rule per poll/member; enforce single- versus multi-select policy transactionally on the server. |
| `content_reaction` | Context/thread, member ID, reaction type, timestamp | Optional teaching-related feedback such as `useful` or `I'd remix this`; unique per member/target/type. |
| `challenge_submission` | `id`, challenge context, author, title/description, link or later media reference, help-needed text, moderation state | Pending by default; public showcase only after approval. Initial live scope should accept links, not uploads. |
| `moderation_report` | `id`, target type/ID, reporter, reason, status, timestamps | Private report workflow with rate limits and restricted access. |
| `moderation_action` | `id`, target, action, actor, reason, timestamp | Append-only audit trail for hide/restore/approve/reject/role changes. |
| `role_assignment` | `id`, user, named role, scope type/ID, assigned by, active/revoked timestamps | Roles are scoped to the platform, Studio or event; never a mutable global `user.role` field. Use the policy in [`roles-and-permissions.md`](roles-and-permissions.md), and do not accept roles/capabilities supplied by the browser. |
| `role_invitation` | `id`, invited email reference, role, scope type/ID, inviter, token hash, expiry, state, accepted/revoked timestamps | Named, email-bound, single-use invitations. Re-authorize the inviter and scope when accepted; only acceptance creates an active role assignment. |
| `authorization_audit` | `id`, actor, action, target, scope, reason, timestamp, safe change summary | Append-only record for role/invitation changes and sensitive event, roster, room or moderation actions. Exclude secrets and minimize personal data. |
| `integration_outbox` | `id`, event type, aggregate ID, idempotency key, status, attempt count, next attempt, timestamps | Durable retries for Studio enrollment and future platform sync. Avoid storing unnecessary PII in event payloads. |

### Context integrity

The prototype uses context type plus context ID in client state. The live schema
should make context a foreign key to `studio_context`; external Wistudi objects map
to that stable internal row through `(origin_namespace, origin_id)`. Context metadata
such as subject, level and topic is inherited by the server from the object and can
be cached for filtering. The browser cannot assign itself a trainer role or invent
authoritative context metadata.

Use database constraints for uniqueness and referential integrity, and transactions
for operations such as consuming a verification token, activating membership and
writing its consent record. Use cursor pagination on stable `(created_at, id)` keys.
Never trust client-supplied vote counts, moderation state, author IDs or timestamps.

## Service and endpoint boundaries

Keep the present static UI. Add server-side Pages Functions as a thin API layer only
after the provider is selected. Suggested resource boundaries:

| Resource | Example operations | Authorization |
| --- | --- | --- |
| Enrollment | Create/retry opt-in intent; redeem verification link | Public request is rate limited; token is single-use; no content access until active membership |
| Session | Sign in, inspect current session, sign out | HttpOnly secure cookie; server checks active user and membership |
| Workshops | Read upcoming/archived workshop and public kit | Public read for approved information; private meeting credentials only for eligible registrants |
| Contexts/threads | List, create, reply, report | Members read member threads; public readers see only explicitly published/curated items; verified member for writes |
| Questions/votes | Ask, vote, answer, mark answered | Member writes; assigned trainer/moderator for answers and status changes |
| Challenges/submissions | Join and submit; list approved showcase | Member writes; pending items private to author and moderators; public read only after approval |
| Admin/moderation | Review, hide, restore, approve, assign trainer | Scoped staff role checked on every request and object |

Event Lead access to participant data is limited to event operations. Do not treat a
Studio role as automatic access to the current Google Sheet, Resend account or Zoom
host credentials. See the role design for attendee-contact and meeting-secret
boundaries.

Mutations need CSRF protection when cookie-authenticated, origin checks, rate limits,
input length/type validation, output escaping, and audit records for staff actions.
The browser must never connect directly to the database or receive provider secrets.

## Mobile discussion is chat-shaped, not a public chatroom

The mobile shell can use familiar conversation layout and fast reply controls, but
each thread remains attached to a known learning object and is persistent, searchable
and moderated. Initial live architecture should use ordinary authenticated HTTP
requests and cursor-based refresh. Add short polling only for the active workshop
Q&A if live-session behavior needs it. Do not promise instant delivery or build
WebSocket infrastructure until observed participation requires it. A Studio Table
is a filtered view of contextual threads, not a separate unstructured room.

If realtime later becomes necessary on Cloudflare, the Pages Functions binding guide
describes Durable Objects for state/WebSocket use and requires a separately deployed
Durable Object Worker bound to Pages. That is additional infrastructure, so it is
not part of the initial discussion architecture. See the [Pages Functions binding
guide](https://developers.cloudflare.com/pages/functions/bindings/).

## Provider decision gate

Do not choose a database or auth vendor from the website repo alone. First confirm
with the Wistudi platform owner:

1. Which auth provider and stable user ID the Wistudi product uses today.
2. Which database stores accounts/content and whether a supported API or OAuth/OIDC
   account-linking flow exists.
3. Whether the global site has an approved Cloudflare D1 binding or other existing
   transactional store, backups, migrations and production/preview separation.
4. Who owns email delivery, sender verification, support/recovery and Studio data
   deletion requests.

Selection criteria, in order:

- Reuse the Wistudi identity provider later through a documented, proof-based link
  if that service already exists and is available to this site.
- Otherwise choose a relational store with transactions, foreign keys, unique
  constraints, backups, migrations, preview isolation and exportable data. Cloudflare
  D1 is a plausible fit for the current Pages Functions host, but it does not itself
  solve identity, account recovery or consent operations.
- If managed authentication is selected, keep Studio IDs and domain tables in the
  Studio schema and map provider subject IDs through `auth_identity`. Avoid coupling
  discussion records to provider-specific user IDs.
- Keep a repository/service boundary so the UI/API does not depend directly on one
  database SDK. Do not add a second provider until operational ownership is clear.

| Option | Fit | Main trade-off | Status |
| --- | --- | --- | --- |
| Existing Wistudi account/data service | Best long-term identity continuity if it exposes a supported login/linking API and permission model | Availability and platform ownership are not confirmed in the connected repos | Check first |
| Cloudflare D1 plus Pages Functions | Closest to the current website runtime; relational SQL can model membership, threads, votes and moderation | Requires an owned database/binding per environment; D1 is a database, not an identity/recovery product | Plausible fallback |
| Managed relational database plus managed auth | Relational data and authentication/recovery can be managed together | Adds a separate service, security/operations owner and future identity bridge | Compare if platform auth is unavailable |
| Google Sheets for discussion | Reuses the booking store | Poor fit for concurrent threaded discussion, authorization, unique votes, moderation and durable relationships | Keep for booking only |

Cloudflare documents D1 bindings for Pages Functions, with production and preview
environments configured separately. That establishes technical compatibility, not
that this Wistudi Pages project already has a D1 database or approved binding. See
[Pages Functions bindings](https://developers.cloudflare.com/pages/functions/bindings/)
and the [D1 overview](https://developers.cloudflare.com/d1/). The current Resend
integration is a possible delivery path for verification mail, but its sender,
recovery and authentication-email operations have not been confirmed.

Provider choice remains explicitly open because the Wistudi platform's identity
stack and the website's deployed bindings have not been inspected. No Cloudflare
account, secret or external vendor has been accessed for this design.

## Data access, retention and safety defaults

- Public pages: workshop descriptions, approved resources and curated showcase
  items only. Studio discussions default to members-only; an approved item becomes
  public only through an explicit showcase/publishing action.
- Verified members: read member discussions and create questions, replies, votes
  and challenge submissions.
- Workshop-specific joining URLs and participant contact details remain private;
  never place them in public fixtures, route source or Studio context metadata.
- Public author fields use display name and generated initials/abstract avatar only.
- No AI-generated human faces. Generate avatar appearance from a random seed, never
  from an email, name or registration ID. Do not store avatar image files.
- No student-identifiable work or learner contact details in uploads/submissions.
  Initial live submissions should be text plus a validated HTTPS link. Add uploads
  only with scanning, limits, access control, retention and removal behavior.
- Choose and publish retention periods before collecting live membership data.
  Account deletion must revoke sessions and remove private identity data; treatment
  of authored public learning content (delete versus anonymize) needs an explicit
  policy decision rather than an accidental cascade.
- Keep secrets out of Git, logs and browser code. Redact emails, tokens and provider
  responses from application logs.

## Wistudi connection and migration

The Studio owns stable internal IDs. When the Wistudi account system is confirmed,
link accounts only while the user is authenticated in Studio and proves control of
the Wistudi account (or completes an equally strong provider flow). Require explicit
confirmation, enforce unique provider subject, and route collisions to recovery.
Matching email strings alone never merges identities.

Map future Wistudi Flow/Page/Block/template IDs into `studio_context` while keeping
the Studio context ID stable. Store origin namespace and external ID, version API
payloads, and keep a portable export of users (with private fields separated),
memberships, contexts, threads, replies, votes, submissions and moderation history.
Migration should be additive: preserve creation times and original IDs, reconcile
duplicates before import, and keep the old-to-new ID map for rollback and audit.

## Open decisions before implementing live identity

- Wistudi product's current auth provider and canonical user ID.
- Database provider, account owner, preview/prod bindings, backup and migration plan.
- Enrollment email sender and whether it can be combined with the booking email.
- Membership consent wording/version, retention duration, account recovery and
  deletion/anonymization policy.
- Whether any approved discussion threads should be made publicly readable outside
  the curated showcase.
- Staff scopes: Studio-wide moderators versus workshop-assigned trainers.
- Public showcase licensing/remix permission and learner-work restrictions.
- Whether the live workshop needs short polling or any realtime transport.

## Implementation order after approval

1. Confirm current Wistudi identity/database and choose an owned provider.
2. Approve consent, retention, recovery, moderation and visibility policies.
3. Implement migrations and API authorization with a repository boundary; add
   preview-only credentials and data separate from production.
4. Implement idempotent enrollment intent, verification, session and retry states.
5. Connect existing event registration through a retryable adapter without changing
   booking success semantics; add observability that excludes attendee PII.
6. Move questions, votes, replies and submissions from local demo state to the API;
   retain the local prototype mode for visual review until server behavior is ready.
7. Complete security/privacy review and real-device mobile/accessibility review
   before enabling the feature for public participation.
