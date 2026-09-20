# Publisher Studio Product Specification

Status: implementation-ready design baseline
Last updated: 2026-09-21
Branch: `feature/publisher-studio-mvp`

## Purpose

This document is the master product/UX specification for Publisher Studio. It consolidates the complete design discussion that followed the first Studio prototype and explicitly records the approved direction where it differs from the current prototype.

Read this file together with:

- `roles-and-permissions.md` for authorization and role-specific UI.
- `build-challenges.md` for the full Build challenge system.
- `event-system.md` and `interaction-model.md` for the existing architecture baseline.
- `implementation-checklist.md` for the build sequence and acceptance criteria.
- `decisions.md` for durable architectural decisions.

When current prototype code conflicts with this document, this document is the approved UX direction unless a later dated decision supersedes it.

---

## 1. Product shell and navigation

Publisher Studio remains one application shell. Event discovery, event overview, room, Questions, Build, Chat, Event resources and event management do not open as separate products.

Desktop global navigation:

- Home
- Discover events
- My events
- Build an event (role-gated)

When an event is selected, add event-specific navigation:

- Overview
- Room
- Questions
- Build
- Chat
- Event resources, when the event has resources

Staff may additionally receive role-gated management destinations such as Participants, Event setup, Team & access and Room settings.

### 1.1 Second event header

The extra horizontal event header that repeated the selected event title, a back link, room state and Share action is not required on the public Event Overview.

Approved public Overview direction:

- keep the main Wistudi / Publisher Studio application header;
- keep persistent left navigation;
- remove the redundant second event header;
- place Share in the page heading area;
- use the left navigation to return to Discover events.

The room/staff shell may still use a compact event context bar where operationally useful, but it must not duplicate the Overview content hierarchy.

---

## 2. Discover events

The Discover events page should be a browsing surface, not a set of mini event detail pages.

### 2.1 Event cards

Cards should contain only the information required to choose an event:

- 16:9 listing thumbnail;
- lightweight status label such as Upcoming / Live / Past;
- subject / topic / level metadata;
- event title;
- short description, constrained to approximately two lines;
- date/time;
- duration.

Remove from discovery cards:

- View event button, because the entire card is clickable;
- permanent Share button;
- Room preview text/action;
- “You’ll make” / second descriptive block.

Share should appear as a small control over the thumbnail, bottom-right, on hover/focus. The icon should not use a heavy square container.

### 2.2 Discovery filters

Use a compact discovery filter row rather than administrative event filters.

Recommended controls:

- Search events
- Subject
- Event type
- Level
- Date
- More filters when needed

Use page-level state controls for:

- Upcoming
- Live
- Past

Do not use a generic Status dropdown for public discovery when the above states are clearer.

---

## 3. Event Builder

The current prototype visually exposes four stages but renders all setup sections on one long page. Replace this with a real four-step flow.

### 3.1 Step 1 — Details

Purpose: define the public-facing identity and learning proposition.

Fields:

- Event title
- Short description
- Subject
- Topic
- Level
- Audience
- Learning outcomes, one per line
- What will participants make? / participant output

Artwork and promotion:

- Event page banner image
- Event listing/card image
- Optional promotion video
- Media description / accessibility text
- Preview of uploaded/listing artwork

Removed from the revised design:

- optional mobile listing crop.

Media rules:

- promotion video uses 16:9;
- public event banner is intentionally much shallower than 16:9, approximately 32:9 on desktop;
- banner is a wide visual header, not a large hero that pushes content below the fold.

### 3.2 Step 2 — Schedule

Fields:

- Start date
- Start time
- IANA timezone
- Duration
- Trainer / host assignment
- Meeting provider
- Protected participant join link

Meeting links are never public metadata. They are shown only to authorized registrants and assigned staff.

### 3.3 Step 3 — Room and team

This step configures participant experience and staff assignment.

Event resources retain their own per-resource release schedule:

- Before event
- During event
- After event

Do not replace per-resource timing with one event-level resource switch.

Other room configuration:

- Discussion prompt
- Optional Wistudi creation/starter link where relevant
- Team and permissions
- Participant access timing
- Public activity preview

#### Participant access

Add a dedicated Participant access card.

Controls:

- Room opens: Before event / When event starts / Custom
- Questions available from: Before / During / After event
- Chat available from: Before / During / After event
- Build available from: Before / During / After event
- Keep room open after event: toggle, default direction ON

Event schedule and room open/closed lifecycle are separate. Event completion does not automatically close the room.

#### Public activity preview

Creator-controlled setting:

- Off
- Questions only
- Chat only
- Questions + Chat

Public preview is read-only and may be used on the public Event Overview to show that the event has activity.

Never expose through public preview:

- attendee emails;
- meeting links;
- protected files;
- private attachments;
- room-only resources;
- content not approved for preview.

### 3.4 Build challenges removed from Event Builder

The current prototype contains `challengeTitle` and `challengeBrief` inside Event Builder.

Approved direction: remove full challenge authoring from Event Builder.

Build challenges are managed after event creation through the role-aware Build destination. Event Builder stays focused on event setup.

### 3.5 Step 4 — Review and publish

A dedicated final screen is required.

It should include:

- consolidated summary;
- required-field validation;
- missing-item warnings;
- public event page preview;
- desktop listing preview;
- mobile listing preview;
- participant room preview;
- save draft;
- submit for review;
- schedule / publish controls.

Event lifecycle remains:

Draft → Review → Scheduled → Live → Completed → Archived

---

## 4. Public Event Overview

The public Event Overview should answer:

1. What is this event?
2. When is it?
3. Why should I attend?
4. How do I register or enter?

### 4.1 Approved layout order

1. Metadata: Subject · Topic · Level
2. Event title
3. Short description
4. Share action aligned to heading
5. Wide shallow banner, approximately 32:9 desktop
6. Compact event facts grid
7. Optional two-column video/About row
8. Learning outcomes
9. Participant output / “You’ll make”
10. Publicly eligible Event resources

Remove:

- redundant second event header;
- “What happens next” section;
- separate “Your event room / Preview this room” card.

During prototype review, Room may carry a small Preview badge in event navigation instead.

### 4.2 Event facts grid

Do not vertically stack each fact.

Use a compact multi-column grid for:

- Date & time
- Duration
- Format
- Trainer / host
- Audience
- Level

Display local-time context clearly.

### 4.3 About + video

Promotion video is optional.

When video exists:

- 16:9 video on the left;
- About this event text on the right.

When no video exists:

- About this event expands to full width.

Do not render an empty video placeholder.

### 4.4 Event data integrity

Do not invent event-specific content in UI mockups or production.

Learning outcomes are creator-entered and vary per event.

Do not automatically introduce fixed icons or labels such as “Adapt”, “Design” or “Plan” unless those were actually configured.

Similarly, do not invent:

- trainer biographies;
- recordings;
- challenge outputs;
- resources;
- credentials;
- event claims.

---

## 5. Registration and event access card

The top-right card on Event Overview is stateful.

### 5.1 Before registration

Title: Reserve your place

Fields:

- Full name
- Email address

Primary action:

- Register for event

Support copy:

- A Wistudi account is not required to register.

Do not label the name field “Display name”.

### 5.2 Registration does not equal Wistudi account creation

Approved flow:

Public event link → Name + email → Register → confirmation / verification → protected event access.

Do not force a full Wistudi account before booking.

Wistudi account connection becomes relevant when the participant wants platform capabilities such as saving, creating, remixing or publishing.

### 5.3 Registered + upcoming state

Replace the registration form with an event status/access card.

Show:

- You’re registered
- confirmed date/time
- countdown
- Open event room
- Add to calendar
- Cancel registration

Countdown should be subdued when the event is still far away and become more prominent near start time.

### 5.4 Starting soon / live

Starting soon:

- stronger countdown
- Enter event room

Live:

- Live now
- Join live workshop
- Open event room as secondary action

The protected meeting link remains behind authorization.

### 5.5 Completed

Show:

- Event completed
- Open event room

Only show recording/resources/build actions if those assets actually exist.

### 5.6 Organiser-cancelled event

Show clear cancelled state and remove registration/join actions.

---

## 6. Public Event activity preview

A second right-side widget may appear if enabled by the creator.

Purpose: demonstrate current event activity and encourage registration without granting room access.

Recommended widget:

- Questions / Chat tabs
- counts when useful
- 2–3 recent preview items
- no composer
- no replies from unregistered visitors

Primary action:

- Join the conversation

Do not make the primary CTA “Register to join chat”. The visitor’s intent is to join the conversation; registration/access gating occurs after the click.

If an unregistered visitor selects Join the conversation:

- open the registration/access modal;
- do not show the modal permanently in the page mockup.

---

## 7. Event Room

Room is not a second Event Overview. It is the participant’s operational dashboard for the current event stage.

### 7.1 Room purpose

Room should surface:

- current event stage;
- what is available now;
- what requires attention;
- quick routes into Questions, Build, Chat and resources;
- meeting/recording entry when eligible.

### 7.2 Remove duplicate content

Remove from the Room landing page:

- View event details CTA;
- Share this event block;
- large duplicate event timing/countdown card in the main column when the right rail already provides it;
- long repeated build challenge description.

### 7.3 Main column

Recommended order:

- Event room heading only; remove generic subtitle “what’s available now, what’s coming next…”
- compact Publisher journey indicator
- Available now resources
- compact Build challenge status
- Recent activity

Publisher journey:

Discover → Learn → Build → Share → Publish

It remains a guide, not a score and not a blocker.

### 7.4 Right rail

Keep event status consistently in the top-right, matching the Overview pattern.

Right rail:

1. Your event
   - date/time
   - countdown / live state
   - Add to calendar
   - Join/Enter when eligible
2. Room activity
   - Questions count
   - Chat count
   - Resources available now
3. Trainer / host
   - avatar
   - display name
   - role label such as Event host / Assigned trainer

Do not fabricate a trainer bio until a profile/bio feature exists.

Subject/topic/level tags are optional context, not required in this rail.

Developer-only Preview stage controls must not appear in the production participant UI.

---

## 8. Trainer / host profile direction

Current code stores trainer identity largely as an assignment/name. It does not have a proper public trainer biography system.

Approved future direction:

- support hosts who are not Wistudi employees;
- do not label all hosts “Wistudi Trainer”;
- introduce a reusable person/profile record later;
- potential fields: avatar/photo, display name, short bio, organisation, role/title, expertise, links and hosted events;
- event should reference a profile rather than duplicate biography text.

Until then, display name + role only.

---

## 9. Questions

Questions and Chat are intentionally different communication models.

### 9.1 Questions purpose

Questions = structured host/trainer-facing Q&A.

A question is identified because the participant explicitly creates it through the Questions composer. Do not rely on punctuation or AI to infer whether text is a question.

Page heading direction:

- Ask the trainer

Supporting copy:

- Ask a question you want the event host or trainer to answer. Others can upvote questions they also want answered.

### 9.2 Question lifecycle

Open question:

- author
- question body
- Open state
- vote count
- “I have this question too” control

Questions sort by vote count, highest first, with optional filters:

- All
- Open
- Answered

When a user has upvoted:

- control changes to a clear active state;
- approved visual direction is green;
- clicking again removes the vote.

Poor/non-question posts such as “hello” may technically be submitted, but they receive no votes and naturally sink. Light minimum-length validation is acceptable; do not attempt opaque semantic policing.

### 9.3 Who can answer

Answer privileges:

- Event Lead / Host: yes
- Co-trainer: yes
- Moderator alone: no
- Participant: no

Moderator may hide/manage questions within scope but may answer only if also assigned an answering role.

### 9.4 Answer composer

Do not use one global trainer reply composer at the bottom of the page.

Each question card gets its own trainer answer action/composer.

The compact answer composer may support:

- text
- emoji
- link
- image
- video
- document
- Wistudi Flow/content attachment

Keep attachment actions compact behind a plus/attachment control.

### 9.5 After an answer

Answered question shows:

- Answered status
- trainer answer attached directly to the question
- original vote total retained as context

After answering, shift interaction away from more upvoting toward answer feedback:

- Helpful
- I need more clarification

If clarification is requested, allow a bounded follow-up attached to the same Q&A thread.

Do not turn each question into an unrestricted participant chat thread.

Provide an optional:

- Discuss in chat

action to move broader conversation to Chat.

### 9.6 New-question composer

The bottom composer exists only to create a new question.

Label clearly:

- Ask the trainer a new question
- What would you like to ask the trainer?
- Ask question

It must not look like a general chat composer.

---

## 10. Chat

Chat = open event conversation among eligible room members.

Use for:

- discussion;
- ideas;
- informal questions;
- feedback;
- examples;
- sharing work-in-progress;
- reactions and replies.

Anyone with the relevant room participation access may reply, subject to moderation.

If a participant types a trainer-oriented question in Chat, the UI may suggest:

- Post as a question

but must not automatically move/classify it.

Page heading direction:

- Room chat / Event chat

Questions remain the place for prioritized host answers.

---

## 11. Build

Build is role-aware. Use one Build navigation destination, not separate learner/trainer Build menu items.

Trainer/Event Lead sees challenge management.
Learner sees available challenges and their participation/submission state.

Full specification is in `build-challenges.md`.

Key approved direction:

- challenge authoring moves out of Event Builder;
- multiple challenges per event are supported;
- challenges can release Before / During / After / Custom;
- challenge announcements can be pinned to Chat;
- the same challenge record appears in Build, Room, Chat and appropriate event surfaces;
- participant submission is distinct from public publishing.

---

## 12. Event resources

Event resources remain independently scheduled records.

Each resource can have:

- type;
- title;
- description;
- source/file/link;
- instructions;
- availability stage;
- public preview setting.

Availability:

- Before event
- During event
- After event

Only eligible pre-event resources explicitly marked for public preview appear on the public Event Overview.

The Room can show a small Available now preview, while Event resources remains the full resource library.

---

## 13. Roles, permissions and QA role switching

Authorization is server-owned and scoped.

The development prototype may use a temporary role switcher to allow QA to inspect:

- Visitor
- Participant
- Event Moderator
- Co-trainer
- Event Lead
- Event Builder
- Studio Admin
- Platform Super Admin

This switcher changes presentation only. It must be architected so production authorization can later replace it without rewriting every view.

Do not infer permissions from:

- browser toggles;
- email domain;
- registration alone;
- display name;
- event creation alone.

See `roles-and-permissions.md`.

---

## 14. Mockup set and design references

The design process established separate mockups rather than one composite implementation screen.

Event/event-builder mockups:

- Discover event cards
- Event Builder Step 1 Details
- Event Builder Step 2 Schedule
- Event Builder Step 3 Room and team
- Event Overview visitor state
- Event Overview registered/upcoming state
- Event Room redesign
- Questions redesign

Build challenge mockups:

1. Trainer Build dashboard
2. Trainer Create/Edit Challenge
3. Learner Build overview
4. Learner single challenge before joining
5. Learner single challenge after joining/submission
6. Chat with pinned challenge

Do not treat generated sample names, bios, dates or counts as product data requirements. Layout/state decisions are authoritative; invented sample content is not.

---

## 15. Superseded prototype behaviour

The following current prototype behaviours are specifically superseded:

| Prototype behaviour | Approved direction |
| --- | --- |
| Four Event Builder headings but all setup sections rendered on one page | Four real steps |
| Build challenge title/brief authored in Event Builder | Challenge authoring moves to role-aware Build |
| Optional mobile listing crop | Removed |
| Public Overview second horizontal event header | Removed |
| Tall 16:9-style event banner | Wide shallow ~32:9 banner |
| Event metadata stacked vertically | Compact grid |
| Video standalone | 16:9 video + About two-column; About full-width without video |
| Invented learning-outcome icons | Render creator-entered outcomes only |
| Static registration card | Stateful access/status card |
| Room page repeats event details/share | Operational dashboard |
| Room main column duplicates countdown | Keep primary event status top-right |
| Fabricated trainer bio | Name/role only until profile exists |
| Questions accepts a generic global answer/composer model | Per-question trainer answer composer + structured Q&A |
| Question votes remain visually neutral | Active vote state turns green |
| Single challenge per event | Multiple challenges supported |
| Submission form visible before joining challenge | Reveal after participant joins |
| Submission automatically implies moderation queue/public showcase | Event-visible submission first; public Studio visibility is a separate creator choice |

---

## 16. Non-negotiable implementation principles

- One canonical event record, not duplicated event copies.
- One protected room per event instance.
- No public meeting credentials.
- No invented product data.
- No client-side UI state used as authorization.
- Booking, Studio membership and Wistudi platform account remain distinct concepts.
- Event resources, room access and challenge timing are separate state machines.
- Participant submissions do not automatically equal public Wistudi publishing.
- Build/Questions/Chat remain distinct interaction models.
- Staff and learner views may differ inside the same route based on authorized capability.
