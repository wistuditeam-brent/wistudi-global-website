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
| `/publisher-studio/studio` | Participant Studio app shell | Registered participant |
| `/publisher-studio/studio/week/[weekSlug]` | Current or archived weekly Studio space | Registered participant |
| `/publisher-studio/submissions/[id]` | Shared participant creation detail | Public or registered, depending on moderation |
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
| Visitor | View public Studio pages, event details and approved public resources |
| Registered participant | Ask questions, vote, comment, join challenges, submit creations |
| Trainer or moderator | Highlight, answer, pin, hide, approve and manage content |
| Connected Wistudi user | Future state: remix, save to workspace, publish and connect contributions |

Use an immutable internal user ID. A verified email is a private lookup and
deduplication attribute, not a public ID or sufficient proof for account linking.

Avoid anonymous posting. It creates moderation problems and makes later migration to Wistudi harder.

## Registration and Access

Recommended flow:

1. User registers for a workshop.
2. Registration creates or updates a `StudioUser`.
3. User receives a confirmation email or magic link.
4. Magic link opens the Studio space.
5. The user can ask, vote, discuss or submit without creating a full Wistudi account.
6. Later, the Studio identity can be connected to a Wistudi account.

If the existing website already uses Google Forms, embedded forms or external registration tools, the first version can continue using them. However, a sync or import path should be planned so registration data can become Studio identity data.

## Avatar Model

Use generated non-human avatars.

Recommended options:

- Initials avatar
- Abstract SVG avatar
- Geometric Wi-style avatar

Avoid AI-generated faces or fictional people. The editorial standards prohibit invented people and fake visual identity in Wistudi publishing contexts. For Studio participants, generated abstract identity is safer and more credible.

Store:

```text
avatar_seed
avatar_style
display_name
```

The avatar can be regenerated from the stored seed, so image files do not need to be stored.

## Core Data Objects

### StudioUser

Represents a lightweight participant identity.

Suggested fields:

```text
id
email
display_name
avatar_seed
avatar_style
role
created_at
last_seen_at
wistudi_user_id
```

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
trainer_id
starts_at
ends_at
status
recording_url
created_at
updated_at
```

Workshop status:

```text
upcoming
live
post_session
archived
```

### Registration

Connects a user to a workshop.

Suggested fields:

```text
id
studio_user_id
workshop_id
source
status
registered_at
consent_to_studio
```

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

### Question

Used for trainer Q&A.

Suggested fields:

```text
id
workshop_id
studio_user_id
context_type
context_id
body
status
answer
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

Suggested fields:

```text
id
studio_user_id
target_type
target_id
vote_type
created_at
```

### Challenge

Represents the weekly build task.

Suggested fields:

```text
id
workshop_id
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
challenge_id
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
context_type
context_id
workshop_id
title
thread_type
created_by
moderation_status
created_at
updated_at
```

Thread types:

```text
discuss
ask
build
idea
need_help
can_help
made_something
```

### Comment

Represents replies within a contextual thread.

Suggested fields:

```text
id
thread_id
studio_user_id
body
moderation_status
created_at
updated_at
```

## Context Metadata

All questions, threads, comments and submissions should retain context.

Example:

```text
context_type: template
context_id: communicative-esl-flow
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

- Confirm the production database and participant authentication provider before Phase 3.
- Confirm ownership of the existing Google Apps Script / Sheets registration integration.
- Agree the retention, account-linking and moderation policies for real Studio data.
- Review the visible, default-unchecked Studio membership opt-in used in the prototype.
- What moderation level is acceptable for first public launch?
