# Wistudi Publisher Studio Architecture

Phase: Architecture and first development prototype
Status: Implemented prototype on `feature/publisher-studio-mvp`; not production-ready
Last updated: 2026-09-19

## Purpose

Wistudi Publisher Studio is a recurring learning, creation and discussion space for educators who want to create, adapt, publish and share interactive learning experiences.

The first implementation should live inside the existing Wistudi global website. It should not be built as a separate repository or disconnected community product.

The architecture should support:

- A public catalogue of Publisher Studio events and shareable event pages.
- A standardized, role-scoped Event Builder.
- A protected, mobile-first room for each event.
- A clear journey from registration through workshop, project, discussion and optional Wistudi publishing.
- A portable event/content data model that can later connect to the main Wistudi platform.

## Product Boundary

Publisher Studio is not a generic social network, chatroom or webinar archive.

The core object model is contextual:

- Workshop
- Template
- Worksheet
- Tool
- Resource
- Question
- Challenge
- Submission
- Discussion thread

Conversation should happen around these objects, not as a loose public feed.

## Route Architecture

Recommended initial routes:

| Route | Purpose | Access |
| --- | --- | --- |
| `/publisher-studio/` | Publisher Studio event catalogue, journey overview and selected showcase | Public |
| `/publisher-studio/events/[slug]/` | Canonical public event details, registration, share metadata and optional event resources | Public |
| `/publisher-studio/events/[slug]/room/` | Chat-shaped room for the event's registered participants | Verified event registration and Studio membership; staff access is scoped |
| `/publisher-studio/manage/events/` | Guided event creation, scheduling, media, room and project setup | Assigned event builder or Studio admin |
| `/publisher-studio/submissions/[id]` | Shared participant creation detail | Author/moderator until approved for the public showcase |
| `/publisher-studio/admin/` | Event assignments, approvals and moderation controls | Studio admin or scoped moderator |

The existing site uses static HTML and Cloudflare Pages Functions, not Next.js.
The exact feature-branch Pages alias is open for public prototype review. Other
hosts, including production, stay closed unless the server-side override
`PUBLISHER_STUDIO_PREVIEW_ENABLED=true` is configured. The branch alias is public
and contains fixture data only. Noindex and unlisted paths are not authentication
or private preview access controls.

The access column above describes the target system. The current prototype uses
demo participation only, without login. The room URLs do not enforce registration
in the preview and must not be treated as private access. See `development.md` for implemented
routes, the integration audit and the boundary between local state and real identity.

## Main Experience Areas

### Events Catalogue

The Studio landing page is the front door for Studio workshops. The existing
`/resources/events/` page remains the wider Wistudi event directory. Both views must
read one canonical event record, rather than maintaining competing event lists.
Publisher Studio displays events flagged for the Studio experience and leads into
their own rooms and projects.

Primary content:

- Upcoming and archived event cards with subject, trainer, audience and local time.
- A concrete “you'll make” output on every event card.
- A direct share action and public event detail link.
- A short progress model: Discover → Learn → Build → Share → Publish.
- Published participant examples only when separately approved.

The landing page describes the output and follow-on project. A live room, questions,
submissions and meeting link require event access.

### Event Page

The event page is the main conversion point before each workshop.

Primary content:

- Workshop title
- Date and time
- Trainer
- Short description, learning outcomes and what participants will make
- Event page banner and optional promotion video
- Registration form or an adapter to the existing event booking flow
- Publicly approved resources that are available before the event
- Pre-session question prompt
- Add-to-calendar action, if supported
- Share hub with copy, native sharing, direct channels and event-specific preview metadata

Event page and registration remain public. Booking, optional Studio membership and
verified sign-in are separate records and permissions. Booking must continue to work
if the optional Studio identity service is unavailable.

### Event Room

Every event has one connected participant room. Recurring sessions may share a
series ID, but each date/event has its own stable event ID, registration, room
permissions, event resources, conversations and challenge. The room is the working
space after registration, not another event landing page.

On mobile, this should feel closer to a focused chat/workbench app than a landing page.

Recommended bottom navigation:

| Tab | Purpose |
| --- | --- |
| Room | Current event stage, pinned resources, meeting/recording when eligible |
| Questions | Ask the trainer, vote, view answers |
| Build | Join or submit the event's project/challenge |
| Workbench | Ideas, help requests and shared creations |
| Event resources | Files, links, instructions and recordings for this event |

The Studio space should use sticky context headers, threaded content, fixed reply or submit actions and simple interaction states.

### Event Builder

The builder is a role-gated management tool within Publisher Studio, not a public
content form. It standardizes public event pages and room configuration while
allowing each creator to provide the event's subject-specific materials.

- Event basics, audience, topic, level and expected participant output.
- Start/end time, explicit IANA timezone, trainer and approved online meeting link.
- Required learning outcomes and participant output.
- Separate event-page banner, event-card image and optional mobile card crop; optional YouTube/Vimeo or hosted promotion video.
- Zero or more event resources. Each has a type, title, optional short description, link or attachment, optional step-by-step instructions, availability stage and public-preview setting.
- Event-specific discussion prompt, project/build challenge and Wistudi content links.
- Assigned event builders and trainers/moderators with event-scoped permissions.
- Save draft, preview desktop/mobile, submit for review, schedule, publish, update and archive.

Use one stable event record as the source for catalogue cards, event details, event
room, registration payload, confirmation messaging and structured data. Do not
copy event title/time/Zoom values manually into separate code or email templates.
The global Resources Events directory may render Studio events from this same
source while retaining its broader event types.

### Event Sharing and Zoom

The public event URL is the share/invitation link. A recipient lands on event details
and registers for their own access. A room URL or meeting join URL is never an
invitation credential.

Event-specific server-rendered metadata should supply `og:title`, `og:description`,
`og:image`, `og:url` and canonical URL so social link previews identify the event.
The native Studio share modal provides copy, browser-native sharing, email and
selected social channels. A Studio link resolver separately renders a native card
for Wistudi Flow URLs; it must use an approved Wistudi metadata/share endpoint rather
than trusting a client-supplied title or fetching arbitrary URLs from the browser.

At first, an assigned builder may enter a meeting URL stored as a restricted event
field. It becomes visible only to eligible registrants and assigned staff. A later
Zoom connection can create/update meetings server-side. Never expose the host's
`start_url` in public event metadata. The event builder can exist without an embedded
Zoom player; participants can join through a protected room button.

### Event lifecycle and participant progress

Keep event operations separate from a participant's learning progress.

| Event lifecycle | Participant journey |
| --- | --- |
| Draft → Review → Scheduled → Live → Completed → Archived | Discover → Learn → Build → Share → Publish (optional) |

An event being completed does not imply every participant has finished the
challenge. Publish in Wistudi is a separate creator action, not a prerequisite for
sharing a work-in-progress with the event room.

## Identity Model

The first version should use a lightweight Studio identity, not a full Wistudi account requirement.

Recommended user states:

| State | Capabilities |
| --- | --- |
| Visitor | View public Studio pages, event details, approved resources and curated showcase |
| Workshop registrant | Attend their workshop; registration alone does not unlock discussion |
| Enrollment pending | Complete email verification; no member actions yet |
| Verified Studio member | Read member discussions; ask, vote, reply, join challenges and submit creations |
| Trainer or moderator | Perform actions only within assigned Studio/workshop scopes |
| Member linked to Wistudi | Future state: remix, save to workspace and publish through a verified account connection |

Use an immutable internal user ID. A verified email is private login/contact data,
not a public ID or sufficient proof for account linking. Keep workshop booking,
Studio membership consent, email verification and workshop attendance as distinct
records. A booking does not automatically create an active Studio membership.

See [`identity-and-storage.md`](identity-and-storage.md) for the proposed data model,
enrollment flow, provider decision gate, authorization boundaries and migration plan.

Avoid anonymous posting. It creates moderation problems and makes later migration to Wistudi harder.

## Registration and Access

Recommended flow:

1. User registers for a workshop through the existing event flow.
2. The user may separately opt in to a Studio profile; this choice is unchecked by default.
3. The booking remains valid whether Studio is declined or temporarily unavailable.
4. An opted-in user receives a single-use email verification/sign-in link. Booking
   confirmation alone does not prove mailbox ownership.
5. Successful verification activates a lightweight Studio identity and membership.
   Repeated workshop registrations attach to the same identity after proof.
6. Later, the user can explicitly connect the Studio identity to a Wistudi account.

The repository's current event path uses Google Apps Script / Sheets and Resend.
Keep it unchanged until a durable, idempotent Studio handoff and retry policy are
implemented. A registration ID is a correlation reference, never an access token.

See [`event-system.md`](event-system.md) for the full event record, Event Builder,
scoped team invitations, Zoom, sharing and event-to-project architecture.

## Avatar Model

Use generated non-human avatars.

Recommended options:

- Initials avatar
- Abstract SVG avatar
- Geometric Wi-style avatar

Avoid AI-generated faces or fictional people. The editorial standards prohibit invented people and fake visual identity in Wistudi publishing contexts. For Studio participants, generated abstract identity is safer and more credible.

Store:

```text
private_server_avatar_seed
avatar_style
display_name
```

The avatar can be regenerated from the stored random seed, so image files do not need
to be stored. Never derive the seed from a name, email or registration ID, or expose
the seed through the public profile API.

## Core Data Objects

### StudioUser

Represents a lightweight participant profile. Keep email in a private verified
identity record, staff roles in scoped role assignments, and future Wistudi identity
in a provider mapping. Suggested fields are `id`, `display_name`, `avatar_seed`,
`avatar_style`, `status`, `created_at`, `updated_at`, and `deleted_at`.

### Workshop

Represents a weekly Studio session.

Suggested fields:

```text
id
slug
title
summary
subject
topic
level
starts_at
ends_at
status
created_at
updated_at
```

Assign trainers with a separate scoped workshop-staff relation. Keep restricted
meeting credentials out of public workshop/resource records. Recording access follows
the workshop's visibility rules.

Workshop status:

```text
upcoming
live
post_session
archived
```

### Workshop Registration

Represents an event booking in the existing registration system. Studio should keep
an opaque source reference and event ID. Link it to a Studio user only after that
person verifies the email/identity; store consent evidence separately. Booking and
membership remain valid independently of each other.

### AuthIdentity and VerifiedEmail

Keep provider subject IDs in `AuthIdentity` mappings and private verified email
addresses in a separate identity record. Neither belongs on the public profile. A
future Wistudi account link must prove control of both signed-in identities.

### StudioMembership and Consent

Membership is a separate relation between a profile and a Studio. Consent records
the purpose, exact policy version, grant/withdraw action, timestamp and source.
Marketing consent remains separate. Role assignments are scoped to the Studio or a
workshop rather than stored as one global user role.

### Event Resource Collection

There is no separate Publisher Kit entity. Event resources are zero or more records
owned directly by the event. The Event Builder may group them in one editor, but a
workshop with no attached materials has no empty resource section in the participant
experience. Room questions, discussion and build challenges remain separate records.

### Resource

Stores an optional event-specific file, Wistudi object, link, video, worksheet or set of instructions. The public event page omits the Event resources section when there are no resources explicitly marked for public preview.

Suggested fields:

```text
id
event_id
resource_type
title
description
external_url
asset_id
instructions[]
available_from          before_event/live/post_session
public_preview          boolean; allowed only when available_from=before_event
metadata_provider
preview_title
preview_description
preview_image_asset_id
created_at
```

Resource types:

```text
wistudi_flow
file
video
external_link
instructions
other
```

For an external link, show the creator-provided title and description first. Embed only supported providers such as YouTube or Vimeo. Other URLs use a simple link card; a server-side resolver may add trusted metadata for approved Wistudi content or external providers. Do not fetch arbitrary URLs from the browser or embed arbitrary iframes. Google Drive previews depend on the document owner's sharing settings and each participant's access.

### Question (thread kind)

Questions are a kind of contextual thread, not a duplicate post table. Question-only
fields such as answer status and assigned/answering trainer can extend that thread.

Suggested fields:

```text
id
context_id
created_by
body
status
answered_by
answered_at
recording_timestamp
created_at
```

Question status:

```text
open
planned
answered
closed
hidden
```

### Vote

Used for "I want this answered too" and purposeful voting.
Store a unique participant vote per target/type; compute counts server-side rather
than accepting counts from the browser.

Suggested fields:

```text
id
studio_user_id
target_thread_id
vote_type
created_at
```

### Challenge

Represents the weekly build task.

Suggested fields:

```text
id
context_id
title
description
prompt
opens_at
closes_at
status
```

### Submission

Represents participant-created work.

Suggested fields:

```text
id
challenge_context_id
studio_user_id
title
description
screenshot_url
wistudi_link
template_link
help_needed
moderation_status
created_at
updated_at
```

### DiscussionThread

Represents contextual discussion around an object.

Suggested fields:

```text
id
context_id
title
thread_type
created_by
moderation_status
created_at
updated_at
```

Contribution types:

```text
discuss
ask
build
idea
need_help
can_help
made_something
```

### ThreadReply

Represents replies within a contextual thread.

Suggested fields:

```text
id
thread_id
author_id
body
moderation_status
created_at
updated_at
```

## Context Metadata

All questions, threads, replies and submissions should retain context through a
stable `StudioContext` foreign key. The browser's context type/ID pair is only a
prototype representation. Question and discussion records share the thread model;
the challenge is also a context object.

Example:

```text
context_type: template
context_id: immutable-studio-context-uuid
origin_id: wistudi-template-or-studio-resource-id
workshop_id: publisher-studio-week-01
subject: English
topic: Speaking
level: B1
content_type: Flow Template
```

Participants should not manually enter most metadata. It should be inherited from the object where the interaction begins.

## Moderation

The first version should support light moderation.

Recommended states:

```text
pending
approved
hidden
rejected
flagged
```

Suggested defaults:

- Questions can appear immediately but can be hidden by moderators.
- Public showcase submissions should require approval.
- Comments from first-time participants can optionally require approval.
- Trainer-highlighted answers should be clearly marked.

## Naming

Avoid hard-coding a specific trainer name in product architecture.

Use:

- Studio Trainer
- Ask the Trainer
- Trainer Answer
- Trainer Pick

The page can still display Nadia or another real trainer when assigned to a specific workshop.

## Initial Build Scope

The first development milestone implements the routes and local-data interactions
described in `development.md`. This extends the static shell for usability testing
without introducing live services.

Included:

- Architecture docs
- Route plan
- Mock data model
- Static Studio home shell
- Static event page shell
- Static mobile-first Studio shell
- Mock event resources
- Mock Questions tab
- Mock Challenge tab

Not included:

- Live database
- Authentication
- Real-time messaging
- Production moderation dashboard
- Wistudi account linking
- Payment or credits
- Public navigation launch

## Open Questions

- Confirm the Wistudi platform's canonical identity provider and user ID before Phase 3.
- Confirm the Studio database provider, owner, backups and preview/production separation.
- Confirm ownership of the existing Google Apps Script / Sheets registration integration.
- Agree membership consent, retention, deletion, account recovery and moderation policies.
- Decide whether approved discussions can be read without membership.
- What moderation level is acceptable for first public launch?
