# Wistudi Publisher Studio Architecture

Phase: Architecture and first development prototype
Status: Implemented prototype on `feature/publisher-studio-mvp`; not production-ready
Last updated: 2026-09-19

## Purpose

Wistudi Publisher Studio is a recurring learning, creation and discussion space for educators who want to create, adapt, publish and share interactive learning experiences.

The first implementation should live inside the existing Wistudi global website. It should not be built as a separate repository or disconnected community product.

The architecture should support three immediate needs:

- A public event and registration experience.
- A mobile-first Studio space where participants engage around the weekly topic.
- A data model that can later connect to the main Wistudi platform.

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
| `/publisher-studio` | Studio home and current weekly overview | Public |
| `/publisher-studio/events/[slug]` | Event detail and registration | Public |
| `/publisher-studio/studio` | Participant Studio app shell | Public overview; verified Studio membership to read discussions or contribute |
| `/publisher-studio/studio/week/[weekSlug]` | Current or archived weekly Studio space | Public event/kit summary; verified Studio membership for discussions and contributions |
| `/publisher-studio/submissions/[id]` | Shared participant creation detail | Author/moderator until approved for the public showcase |
| `/publisher-studio/admin` | Trainer and Wistudi team controls | Restricted |

The existing site uses static HTML and Cloudflare Pages Functions, not Next.js.
The implemented release switch is a server-side environment value:

```text
PUBLISHER_STUDIO_PREVIEW_ENABLED=false
```

The Studio middleware returns 404 unless the value is exactly `true`. Leave it
unset in production. Public navigation and the sitemap remain unchanged. Noindex
and unlisted paths are not authentication or private preview access controls.

The access column above describes the target system. The current prototype uses
demo participation only, without login. See `development.md` for implemented
routes, the integration audit and the boundary between local state and real identity.

## Main Experience Areas

### Public Studio Home

The Studio home introduces the concept and points users toward the current weekly Studio.

Primary content:

- Current weekly topic
- Next event
- Trainer
- Featured Publisher Kit
- Workshop registration
- Recent Studio activity
- Made in the Studio showcase
- Past Studio sessions

This page can feel like a website page, but it should still be practical and resource-led rather than sales-heavy.

### Event Page

The event page is the main conversion point before each workshop.

Primary content:

- Workshop title
- Date and time
- Trainer
- What participants will create or learn
- Registration form
- Publisher Kit preview
- Pre-session question prompt
- Related template or worksheet
- Add-to-calendar action, if supported

Registration should create or update a lightweight Studio identity.

### Studio Space

The Studio space is the participant-facing engagement area.

On mobile, this should feel closer to a focused chat/workbench app than a landing page.

Recommended bottom navigation:

| Tab | Purpose |
| --- | --- |
| This Week | Current topic, pinned resources, join link, recording |
| Questions | Ask the trainer, vote, view answers |
| Challenge | Join or submit the weekly build task |
| Workbench | Ideas, help requests and shared creations |
| Resources | Templates, worksheets, tools and recordings |

The Studio space should use sticky context headers, threaded content, fixed reply or submit actions and simple interaction states.

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

### PublisherKit

Groups the weekly resources.

Suggested fields:

```text
id
workshop_id
featured_template_id
worksheet_resource_id
example_activity_id
tool_resource_id
challenge_id
discussion_prompt
```

### Resource

Stores resources such as worksheets, templates, tools, links and recordings.

Suggested fields:

```text
id
workshop_id
type
title
description
url
file_id
visibility
created_at
```

Resource types:

```text
flow_template
worksheet
example_activity
tool
recording
guide
external_link
```

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
- Mock Publisher Kit
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
