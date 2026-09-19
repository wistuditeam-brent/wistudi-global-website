# Publisher Studio Decisions

This file records product, UX and technical decisions for Publisher Studio so future edits build on prior choices.

## Event System and Builder / 2026-09-19

### One Canonical Event, Multiple Views

Decision: model one event record and render it in the Publisher Studio catalogue,
public event page, registered room, registration handoff, share preview and relevant
Resources Events listing.

Reason:

- A second manually maintained listing or static copy of event information will
  drift in title, schedule, registration URL and status.
- The room, kit, discussion, challenge and final content all need a durable event ID.
- The broader Resources Events directory can remain general-purpose while Studio
  displays events configured for the creator/workshop experience.

### One Room Per Event

Decision: each event has one protected participant room. A recurring series can
group several event instances, but each instance keeps its own event ID, bookings,
staff assignments, room discussion and challenge/project.

Reason:

- Participants need the event's own schedule, resources and follow-up task.
- Staff access and attendee access must be scoped to the relevant event.
- This prevents a generic public chatroom and supports later contextual discussions
  inside Wistudi.

### Public Event Link Versus Room/Meeting Access

Decision: share the public event details URL. It leads recipients to registration;
it does not grant room or Zoom access. Zoom participant links are served only to
authorized registrants and assigned staff from the protected room.

Reason:

- Colleagues can be invited without transferring another person's access.
- Public metadata and link previews cannot expose a private meeting link.
- Event and meeting credentials need distinct permissions and revocation rules.

### Event Builder Permissions

Decision: keep creator, trainer/moderator and administrator capabilities as scoped
role assignments. Start with review-before-publish for invited event builders.
Builder invitations are named, expiring and revocable after verified acceptance.

Reason:

- Different trainers can run different rooms without global admin access.
- A transferable builder URL would grant broad control to whoever receives it.
- Staff changes need an audit trail and an accountable owner.

### Event Builder and Zoom Scope

Decision: first live builder supports an assigned manual participant join link,
stored privately; automated Zoom meeting creation is a later integration. Do not
embed Zoom merely because a meeting URL exists.

Reason:

- Booking, event publication, room access and meeting management are separate
  capabilities.
- Automated meeting creation requires a Wistudi-controlled OAuth connection,
  host assignment, credential storage, scope management and synchronization.
- The event room remains the durable learning/workbench experience regardless of
  which video meeting provider is used.

### Event Lifecycle and Creator Journey

Decision: display `Discover → Learn → Build → Share → Publish` as a lightweight
participant guide. Store event lifecycle separately as `Draft → Review → Scheduled
→ Live → Completed → Archived`. Wistudi publication remains optional.

Reason:

- Event operations and participant progress are separate facts.
- A participant may miss the live workshop but still complete a project from the
  recording/resources.
- Sharing a work-in-progress inside a room does not equal public Wistudi publishing.

## Identity and Storage Architecture / 2026-09-19

### Separate Booking, Membership and Sign-in

Decision: treat event booking, Studio membership consent and verified sign-in as
separate records and steps. Studio membership is optional, unchecked by default,
and becomes active only after identity verification.

Reason:

- Booking confirmation does not prove control of the attendee's email inbox.
- A participant can attend a workshop without joining ongoing discussions.
- Membership needs its own consent, access checks, retention and deletion behavior.

The live event endpoint currently does not collect Studio opt-in. Do not represent
the prototype checkbox as a connected production feature until the handoff is
implemented.

### Keep Existing Registration as a Separate System

Decision: preserve the current Google Apps Script / Sheets and Resend booking flow
while designing a durable, idempotent handoff to Studio.

Reason:

- The event path already supports booking and confirmations.
- Studio setup or storage failure must not silently cancel a valid booking.
- Cross-system writes need an outbox/queue or reconciliation process because Sheets
  and a future Studio database cannot share one transaction.
- The inspected Sheets webhook's duplicate scan and append are not guarded by a lock
  or database uniqueness constraint; its storage-fallback email is manual recovery,
  not a durable retry queue.

The opaque event registration reference is for correlation only; it is not a login
credential and must not grant access.

### Provider Choice Remains Open

Decision: do not select a database or auth vendor until the Wistudi platform's
canonical account provider/user ID and current Cloudflare bindings are confirmed.

Reason:

- The global website source audit found no Studio database or reusable participant
  login, but it did not inspect platform repositories, deployed account settings or
  external provider accounts.
- Reusing an existing, documented Wistudi identity flow should take priority if one
  is available; otherwise the Studio needs an owned relational store and identity
  provider with a clear operator.
- Cloudflare D1 is a candidate for the current Pages Functions host, but it does not
  provide the complete identity, recovery and consent lifecycle by itself.

### Stable IDs and Relational Context

Decision: create opaque Studio IDs independent of email/provider IDs. Keep provider
subjects in an identity mapping, place roles in scoped assignments, and make
discussions reference a stable context row with a foreign key.

Reason:

- Email can change and is private; it must not become a public ID or author key.
- Trainer permissions differ by Studio/workshop and should not be a global profile
  flag.
- Context foreign keys make the future Wistudi conversation layer migratable and
  prevent orphaned discussions when an object is renamed.

### HTTP First for Discussions

Decision: use persistent contextual threads over ordinary authenticated HTTP for
the first live backend. Add only short polling for an active live Q&A if needed;
defer WebSockets until usage demonstrates a need.

Reason:

- Mobile should feel like a focused conversation/workbench, while content remains
  attached to workshops, templates, resources and challenges.
- Persistent threads, pagination, moderation and context filters matter before
  instant delivery.

### Discussion Visibility (Proposed Baseline)

Recommendation: member discussions are private to verified Studio members by
default. Only resources and creations explicitly approved for the public showcase
are visible without membership.

Reason:

- Educators should know whether their questions and works in progress are public.
- A separate showcase approval/publishing action gives creators control over wider
  visibility.
- Visitors can still evaluate the Studio through public event information, the kit
  and curated examples.

This visibility rule needs product approval before the first live community data is
collected.

Retention durations, public read access, consent wording, deletion treatment of
authored content, and live-session refresh behavior remain open and must be approved
before collecting real Studio data.

## First Development Milestone / 2026-09-19

### Preserve Existing Integrations

Source inspection confirmed static HTML and Cloudflare Pages Functions, with the
event API using Google Apps Script / Sheets and Resend. Keep those files unchanged.
Add isolated native JavaScript modules and CSS; do not introduce a second framework.

### Explicit Demo Boundary

Use fixtures and versioned browser-tab storage for the prototype. Display a persistent
preview label, label sample dates and trainer answers, and never call production APIs.
Do not collect persistent email addresses or imply that a booking or login occurred.

### Membership Consent

Provide a visible, unchecked Studio-profile opt-in in the registration preview.
Declining it still allows read-only-style demo exploration. Live participation will
require verified identity; demo participation is not an authentication implementation.

### Default-Off Release Gate

Add a scoped Cloudflare middleware switch, disabled unless explicitly enabled in a
preview environment. No navigation, sitemap, hosting settings or production branch
changes. Noindex is indexing guidance, not a privacy boundary.

### Durable Identity Boundary

Use immutable IDs for people and content, with verified email as a private attribute.
Account linking needs proof from both identities. Never merge accounts solely because
unverified email strings match. Avatar seeds must not expose email addresses.

### Repeatable Review

Add separate Studio model tests and responsive workflow QA with screenshot artifacts.
Keep scope, integration findings and remaining work in `development.md`. Continue
iterating on the same feature branch without rewriting its shared history.

## 2026-09-19

### Build Location

Decision: Publisher Studio should be built inside the existing Wistudi global website repository, not a separate repository.

Reason:

- The global website already contains relevant routing, forms, APIs, environment variables, styling, deployment and integrations.
- A separate repo would duplicate setup work and increase merge risk later.
- Publisher Studio is intended to become part of the Wistudi website and later connect to the Wistudi platform.

### Branch Strategy

Decision: Use a long-running feature branch named:

```text
feature/publisher-studio-mvp
```

Reason:

- The feature will require many iterative edits before launch.
- Main should remain stable.
- A draft PR can track changes, screenshots, review comments and unresolved questions.

### Trainer Naming

Decision: Do not hard-code "Ask Nadia" into the product.

Use:

- Ask the Trainer
- Studio Trainer
- Trainer Answer
- Trainer Pick

Reason:

- Nadia may host the first workshops, but future sessions may use another Wistudi trainer.
- The product should support multiple trainers without renaming core UI.

### Identity Model

Decision: Use lightweight Studio identity before full Wistudi account connection.

Reason:

- Full account creation creates too much friction for early workshop participation.
- Anonymous posting creates moderation and migration problems.
- Email-based Studio identity can later connect to a Wistudi account.

### Avatar Model

Decision: Use generated initials or abstract avatars, not AI-generated faces.

Reason:

- Wistudi editorial standards discourage invented people and fake visual identity.
- Abstract generated avatars are lower-risk, consistent and easier to regenerate.

### Discussion Model

Decision: Publisher Studio discussion should be contextual, not a generic public feed.

Reason:

- The Studio is about learning, building, adapting and publishing.
- Threads should belong to workshops, templates, worksheets, tools, resources, challenges or submissions.
- This structure can later become part of the Wistudi platform knowledge layer.

### Mobile Experience

Decision: Keep event rooms route-based, with a persistent room bar linking to the event
catalogue and event details, plus thumb-reachable bottom navigation for Room, Questions,
Build, Workbench and Kit. Use brief route and section transitions only when reduced
motion is not requested.

Reason:

- Participants should not feel like they are interacting with a landing page.
- Mobile should prioritize current context, discussion, questions, resources and submission actions.
- A clear route back to the event catalogue must remain available after entering a room.
- Short mobile labels make the five section controls easier to scan while accessible
  names retain their full meaning.
- Event cards should show enough information to choose an event; full descriptions and
  registration belong on its event page.
