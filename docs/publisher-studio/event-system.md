# Publisher Studio Event System

Status: product and technical architecture baseline. The browser prototype uses
fixtures and does not create or publish live events.

## Product Structure

Publisher Studio is the workshop and creation experience. It contains:

1. **Home, Discover events and My events**: three distinct destinations in the persistent Publisher Studio shell.
2. **Event Overview** at `/publisher-studio/events/{slug}/`: event details, learning outcomes, registration, share action and optional public Event resources, still inside that shell.
3. **Event room** at `/publisher-studio/events/{slug}/room/`: Room, Questions, Build, Chat and optional Event resources in the same shell.
4. **Inline event chat and project** inside the room: questions, discussions, resources, challenge and participant submissions attached to stable contexts.
5. **Wistudi content link**: a Flow, template or XP Video that can be viewed, adapted or remixed in the Wistudi platform when identity integration is available.
6. **Event Builder** at `/publisher-studio/manage/events/`: staff interface for drafts, assignment, review, scheduling and publication, opened from the persistent left navigation.

These are views in one application, even where a direct URL changes. Keep the
Wistudi header and Studio navigation consistent across them. On desktop, global
Studio navigation and event-specific sections share the left panel. On phones, the
global actions remain fixed and the active event sections sit directly below the
event bar. The selected event stays visible as the participant moves among its
overview, room and creation work.

The global `/resources/events/` directory remains the wider Wistudi events index.
Studio events should be a filtered presentation of the same canonical event records,
not a second set of separately maintained content. A shared event ID and canonical
public event URL tie together event discovery, registration, its room, discussions,
submissions and Wistudi content.

## Journey and progress

Show participants one readable path:

```text
Discover → Learn → Build → Share → Publish (optional)
```

Use this as a guide, not a points system. Keep it separate from the event's
operational status:

```text
Draft → Review → Scheduled → Live → Completed → Archived
```

Event status is set by staff and controls event operations. Participant progress is
per person and per event. Finishing the live session must not imply that someone has
submitted a project; completing a room project must not automatically publish it to
Wistudi. Public publishing is an optional, explicit action.

## Event record

The builder saves a single event aggregate. Suggested durable fields:

```text
id                    immutable opaque ID
series_id             optional recurring-series ID
slug                  unique, stable public route component
title
summary
subject, topic, level, audience
learning_outcomes[]
participant_output
starts_at_utc, ends_at_utc
event_timezone        IANA timezone used for authoring/display reference
status                draft/review/scheduled/live/completed/archived
visibility            public event page; registration-gated room
banner_asset_id, banner_alt
card_image_asset_id, mobile_card_image_asset_id
promotion_video_asset_id or approved external video URL
challenge_id
canonical_url
created_by, updated_by, published_by
created_at, updated_at, published_at
```

Relationships use stable internal IDs:

```text
Event 1—many EventStaff assignments
Event 1—many Registrations
Event 1—1 Room
Room 1—many Contexts, Projects, Threads, Replies and Submissions
Event 1—many EventResource records (zero allowed)
Resource 0..1—1 external Wistudi content mapping
```

Timezone handling: store an unambiguous UTC instant and the IANA timezone used
when the creator scheduled it. Display an attendee-friendly local time and include
the event timezone in details or calendar exports. Recompute display time from the
stored instant; do not save a browser-local string as the canonical time.

## Builder workflow

The Event Builder should use guided sections with a persistent save state and a
preview, not a single dense form:

1. **Event basics:** title, summary, subject/topic/level, audience, outcomes and the concrete thing attendees should create.
2. **Schedule and host:** date, time, IANA timezone, duration, trainer and online format.
3. **Artwork and promotion:** event-page banner, event-card image, optional mobile card crop, accessible descriptions and optional YouTube/Vimeo or hosted promotion video. On phones the event card stays horizontal with a narrow portrait image at the left; the optional 2:3 asset controls that crop. The event-page banner uses a wide crop on desktop and a 4:3 crop on phones.
4. **Event resources:** add none, one or many. Each item may be a Wistudi Flow, PDF/Word file, video, external link or step-by-step instructions. Add an optional description, link or file, instructions, release stage and public-preview setting to each item.
5. **Room project:** pre-event question, live Q&A, challenge prompt, expected submission and feedback settings.
6. **Team:** scoped creator, trainer and moderator assignments.
7. **Preview and release:** public/mobile preview, review, schedule, publish, edit, unpublish/cancel or archive.

Use a standard layout and required event details, learning outcomes and participant
output; permit flexible event-specific copy and zero or more resources. Drafts
support autosave, explicit save, desktop/mobile preview and revision history.
Changes to time, meeting access or cancellation should create an audit entry and
notify registered participants through the existing event email service.

Do not store uploaded media in Git or leave production file bytes in the website
repository. A Pages Function can authorize an upload and issue a short-lived upload
URL for managed object storage. Use private, scoped delivery for participant-only
files; treat signed URLs as access credentials. PDF files can preview in the browser
where supported. Word files should open or download unless a derived PDF preview is
available. Verify content type and file size, scan uploads and keep asset IDs and
metadata portable.

Promotional videos can be embedded from allow-listed providers or uploaded through a
dedicated video service that supports transcoding, streaming, thumbnails, captions
and resumable uploads. Do not proxy large video files through a page handler. Keep
promotion video separate from instructional videos attached as Event resources.

## Roles, invitations and scope

Use the role catalogue, capability boundaries, appointing hierarchy and invitation
lifecycle in [`roles-and-permissions.md`](roles-and-permissions.md) as the
normative policy. A role is always assigned to a named user and explicit scope; do
not store one global `user.role` value. Event creation does not itself grant
ongoing event-management authority.

Launch defaults: Studio Admins appoint Event Leads and approve first publication;
Event Leads can invite only event-scoped Moderators; Platform Super Admins appoint
Studio Admins and govern all Studio scopes. Event and participant invitations are
separate flows. Staff invitations are named, email-bound, single-use, expiring and
revocable; server-side authorization is rechecked when accepted and for every later
request. The current prototype does not enforce any of these permissions.

## Registration and room access

Keep the current event booking service responsible for bookings and confirmations
until its registration API can consume a server-owned multi-event registry. Today,
the existing endpoint is configured around a specific event, and the Sheets
webhook is not the relational store for room membership or messages.

Target handoff:

1. Visitor submits to the existing booking path using the canonical event ID.
2. Event booking and confirmation succeed independently from optional Studio opt-in.
3. An opted-in attendee creates a pending enrollment intent with an idempotency reference.
4. Email ownership is verified before Studio membership is activated.
5. The verified member is granted access only to rooms for which they are registered, plus their own member permissions.

Do not pass a Zoom join/start link in the public event response, event share card,
OG metadata, sitemap, fixture data or email to non-registrants. Provide the join
button from the authorized room and allow assigned trainers/admins to retrieve the
host-side information securely. Registration change and cancellation flows should
revoke room membership or update it according to an approved retention policy.

## Zoom integration

**Initial live release:** builders can attach an existing Zoom participant join
link through a protected server operation. Store it outside public metadata and
expose it only to eligible registrants in the event room. For the safe prototype,
the builder shows a disabled Zoom connection control and warns against entering
real meeting links.

**Later managed connection:** an admin authorizes the Wistudi Zoom app for a
Wistudi-controlled account. A backend operation creates/updates the meeting for an
assigned host and stores meeting ID, join URL, host start URL, scopes and sync state
separately. Host start URLs are highly privileged; they never go to attendee APIs.
OAuth credentials and API secrets remain server-side. Permission to manage a Studio
event does not automatically give an event builder access to the Wistudi Zoom
account itself.

Zoom attendance webhooks, recordings and automatic participant reconciliation are
later decisions. The Studio room remains the place for workshop discussion and
creation even if the live meeting opens in the Zoom client/browser.

## Sharing and metadata

The Share action always shares the public event URL, never a registration token,
room authorization token or Zoom link. Provide:

- Copy link.
- Browser-native share where supported.
- WhatsApp/email and approved social destinations.
- A preview showing the actual event title, output, image and canonical link.
- Optional QR image after an approved QR implementation exists.

Event pages should return per-event metadata in the initial server HTML for social
crawlers: title, description, canonical URL, Open Graph image/alt and Event
structured data. For database-driven events on this static Cloudflare Pages site,
choose a delivery strategy that can supply event metadata before client JavaScript:
publish generated event HTML from the canonical data or render it through a
server-side Pages Function. A browser-only template that changes the title after
load is not a reliable social share page.

For Wistudi Flows, a native Studio card needs a trusted server-side metadata lookup
by approved Wistudi share URL or content ID. The card can show the canonical
content title, description, preview image, creator and access state. Cache results,
escape content, rate-limit the resolver, and reject arbitrary hostnames and
redirects to avoid server-side request forgery. A Flow's external Open Graph tags
help previews in social networks; the Studio still needs its own resolver to
present an inline card.

## Discussion, build and content context

Every question, discussion, resource reply, challenge submission and Wistudi link
maps to a stable context record. The event room may display a chat-shaped timeline,
but it is not an unstructured generic room. Context examples:

- This event's pre-workshop question.
- An Event resource, such as a template, worksheet or guide.
- A question to the assigned trainer.
- The event's build challenge/project.
- A participant submission.
- A Wistudi Flow, Page, Block, XP Video or template.

Context metadata (event ID, subject, topic, level, content type and origin content
ID) should be inherited from the object, not trusted from client-entered labels.
Use the `StudioContext` foreign key and stable external object mappings described
in `identity-and-storage.md`.

Room contribution state is separate from event schedule. Reaching the scheduled end
never closes a room. Authorized event staff close it explicitly; eligible
participants retain read-only access until it is reopened or archived under a
documented retention policy. Use the persistent Studio global navigation and the
participant's My events view to move between event workspaces.

## Prototype versus live service

The current preview implements:

- One shared Studio shell for Home, Discover events, My events, event overviews,
  event rooms and the Event Builder.
- Sample event discovery cards, local date rendering, share modal and static
  per-event share metadata.
- Public event overview and one event-specific room URL per sample event.
- A local-only preview registration appears in My events and can reopen its event room.
- Event Builder form with local draft save, preview and local image preview,
  reached from the persistent Studio navigation.
- Event-specific sample resources, challenges, questions, discussions and submissions.
- Inline replies, reactions, emoji, local link/file previews, contextual suggestions
  and event-room navigation fixtures.
- Event Builder drag/drop local image/video/resource-file previews.
- Light/dark theme toggle and sample trainer notifications.
- Fixed mobile global navigation, compact selected-event sections and a simple
  journey indicator.

It does not implement:

- Live event creation/storage, role assignment/invitations, event publishing or event-record-driven rendering.
- Live booking adapter, login/email verification, room authorization or shared messages.
- Zoom OAuth/meeting management, actual meeting link storage, direct video upload or video processing.
- Wistudi Flow metadata resolver/remix, attendance synchronization, live notifications,
  invitation/RBAC service, room lifecycle enforcement or public showcase moderation.

See `identity-and-storage.md` for the identity/database provider gate and
`development.md` for existing integrations and preview deployment constraints.
