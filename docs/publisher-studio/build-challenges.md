# Publisher Studio Build Challenges

Status: implementation-ready product specification
Last updated: 2026-09-21
Branch: `feature/publisher-studio-mvp`

## 1. Purpose

Build challenges turn an event from passive attendance into creation. They are event-scoped learning tasks that may be released before, during or after an event.

Challenge creation is not part of the main Event Builder. Challenges are created and managed from the role-aware **Build** destination after the event exists.

The same Build navigation item is used by staff and participants:

- Trainer/Event Lead view: create, edit, schedule, release and monitor challenges.
- Participant view: discover, join, build, submit and view community creations.

---

## 2. Data model direction

An event may own zero, one or many challenges.

Replace the prototype assumption `challengeFor(eventId) -> one challenge` with a collection such as:

`challengesFor(eventId) -> Challenge[]`

Suggested challenge fields:

- id
- event_id
- title
- short_intro
- detailed_instructions
- status: draft / scheduled / published / archived
- available_from: before_event / during_event / after_event / custom
- available_at_utc when custom
- due_at_utc optional
- participation_policy
- submission_type
- success_criteria[]
- support_resource_ids[]
- starter_wistudi_content_id/url optional
- pin_to_chat boolean
- show_on_event_page boolean
- created_by
- timestamps

Challenge submission fields should reference challenge + author and use opaque IDs.

---

## 3. Trainer Build dashboard

Page title:

- Build challenges

Primary action:

- Create challenge

Challenge cards show:

- challenge number/order
- title
- short description
- Draft / Scheduled / Published
- release timing
- participation policy
- number taking part
- number submitted
- Edit
- overflow actions

Useful filters:

- All
- Draft
- Scheduled
- Published

No learner submission form appears in trainer dashboard.

---

## 4. Create/Edit Challenge

Required configuration:

### Challenge details

- Challenge title
- Short introduction
- Detailed instructions, formatted text

### What participants should submit

Supported initial types:

- Wistudi Flow
- XP Video
- Link
- Document
- Reflection / written response

Challenge can constrain acceptable submission types rather than showing irrelevant creation actions.

### Success checklist

Creator can add/reorder/remove criteria.

Purpose: tell participants what a successful submission should contain.

Example only:

- clear learning goal
- useful learner prompt
- appropriate support
- reflection step

These are event-specific content, not fixed product criteria.

### Support resources

Allow challenge author to attach:

- event resource
- Wistudi Flow/template
- external supporting link

### Timing

- Before event
- During event
- After event
- Custom date/time

Optional due date may be introduced where useful.

### Participation policy

Event/challenge group needs explicit policy.

Initial supported policies:

- Optional: participant may complete any challenge or none.
- Choose one: participant is expected to complete at least one challenge from the group.
- Required: this challenge is required.
- Complete all: every challenge in the group is expected.

Avoid more complex X-of-Y logic until product need is demonstrated.

### Visibility/announcement

Options:

- appear in Build tab when released;
- pin announcement to Chat when released;
- optionally surface on event page when appropriate and authorized.

---

## 5. Challenge release

When a challenge becomes available:

- it appears in participant Build;
- Room may show a compact challenge card;
- Chat may receive a pinned system challenge card;
- Recent activity may show “New challenge released”;
- event/public Overview shows it only when configured and compatible with visitor access.

The pinned Chat card is a system/event object, not a normal user message.

Example structure:

New Build Challenge
[Challenge title]
[short introduction]
Available now
Open challenge

It remains visually distinct from participant messages.

---

## 6. Learner Build overview

If one challenge exists, the UI may open it directly.

If multiple exist, show a challenge overview.

Page should clearly state the participation rule:

- Challenges are optional
- Complete one challenge
- Complete all challenges
- Required challenge

Each challenge card shows:

- number
- title
- short introduction
- Available now / Opens during event / Opens after event / scheduled date
- Optional / Choose one / Required
- learner status: Not started / Taking part / Submitted
- taking-part count
- submission count where useful
- Open challenge

Locked/unreleased challenges may be previewed minimally without exposing restricted instructions/resources if the creator does not want them visible yet.

---

## 7. Learner single challenge — before joining

Show enough information to make the task unambiguous before commitment:

- challenge number
- title
- availability
- participation requirement
- About this challenge
- full instructions
- success checklist
- support resources
- what to submit

Primary participation action:

- I’ll take part

Do not show the full submission form before the participant joins.

---

## 8. Wistudi creation handoff

After joining, provide an explicit route into the Wistudi platform.

Creation area should adapt to allowed submission type.

Examples:

- Build a Flow in Wistudi
- Create an XP Video in Wistudi
- Use starter template
- Open assigned Wistudi Flow/template
- I already created something

Long-term ideal:

Build in Wistudi → create content → return to Studio → creation automatically attached to challenge.

Manual link paste is an acceptable interim integration but should not be the final experience.

Submitting to a Studio challenge must not silently change the underlying Wistudi content publication state.

---

## 9. Learner single challenge — after joining

After I’ll take part:

- participation state changes to Taking part;
- reveal Share your version / Your submission;
- retain challenge instructions and success criteria.

Submission fields may include:

- creation title
- what did you create?
- Wistudi content / creation attachment or link
- optional feedback request
- allowed document/image/video attachment where challenge permits

Actions:

- Save draft
- Submit creation

---

## 10. Submission visibility

Do not equate submission with open-web publishing.

Approved conceptual levels:

### Event only

Default community submission state.

Visible to eligible members of this event/challenge.

May appear:

- challenge Community creations;
- learner’s work;
- Recent activity;
- contextual Chat references.

### Public in Studio

Creator explicitly opts to allow wider Publisher Studio discovery/search.

This is separate from event-only submission.

### Wistudi platform publication state

The underlying Flow/XP Video has its own visibility/share/publishing state in Wistudi.

Studio submission never silently changes that state.

Avoid a simplistic “Private/Public” label when event-only work is visible to event members. Prefer:

- Event only
- Public in Studio

A future “Only me / trainer” state may be added if private assignment use cases require it.

---

## 11. What happens after submission

Default direction:

- submission appears immediately inside the challenge for eligible event participants;
- trainer does not need a separate mandatory room just to see submissions;
- moderation is exception handling, not a compulsory approval queue for every event submission.

Challenge page can include:

### Community creations

Each item may show:

- creator
- title
- Flow / XP Video / Link / Document type
- short description
- Open creation
- Helpful reaction
- feedback count

Trainer sees the same challenge with additional management/filter controls, for example:

- All creations
- Needs feedback
- Newest

Trainer may give feedback inline.

Moderation/reporting remains available for inappropriate content.

---

## 12. Public Studio discovery of creations

Public-in-Studio submissions should remain useful after the event.

Future Publisher Studio Community creations surface may support search/filter by:

- Event
- Challenge
- Subject
- Topic
- Level
- Flow / XP Video
- Creator
- Recent
- Useful / engagement

A creation detail view may include:

- creator
- source event/challenge
- description
- preview
- Open in Wistudi
- Remix when permissions allow

This turns event output into a reusable learning/creator library without making every unfinished event submission public.

---

## 13. Trainer/participant role split

Same Build route, different authorized presentation.

Event Lead / permitted Co-trainer:

- create challenge
- edit challenge
- schedule/release
- archive
- inspect participation
- view submissions
- give feedback
- moderate/report as authorized

Participant:

- browse eligible challenges
- join
- open support resources
- create in Wistudi
- save draft
- submit
- view event-visible community creations
- request feedback

Event Moderator:

- moderation actions within assigned scope;
- no challenge authoring unless separately granted.

Event Builder:

- main event draft creation only;
- challenge authoring is not implied by Event Builder once the event is running.

---

## 14. Mockup implementation sequence

1. Trainer Build dashboard — completed design direction.
2. Trainer Create/Edit Challenge — completed design direction.
3. Learner Build overview with multiple challenges — completed design direction.
4. Learner single challenge before joining — next required design.
5. Learner single challenge after joining / submission — required.
6. Chat with pinned Build Challenge — required.
7. Community creations / post-submission state — additional required mockup after the six core flows.
8. Wistudi creation handoff state — additional required mockup if not sufficiently represented in mockup 5.

---

## 15. Superseded prototype assumptions

- One challenge per event → multiple challenges.
- Challenge authoring inside Event Builder → challenge authoring in Build.
- Submission form always visible → reveal after joining.
- Challenge title + short brief only → richer instructions, checklist, support and submission type.
- Pending review as default experience → event-visible contribution first; moderation is separate.
- Link-only submission as final UX → explicit Wistudi creation handoff and typed submissions.
