# Publisher Studio Implementation Checklist

Status: ready to queue for implementation
Last updated: 2026-09-21
Branch: `feature/publisher-studio-mvp`

This checklist translates the approved product specification into implementation work. Do not treat completion of a visual mockup as completion of the feature.

## Phase 0 — Read and protect current architecture

- [ ] Read `product-spec.md`, `build-challenges.md`, `roles-and-permissions.md`, `event-system.md`, `interaction-model.md`, `identity-and-storage.md` and `decisions.md`.
- [ ] Preserve the current production event-registration integration unless an explicit migration task says otherwise.
- [ ] Keep preview work isolated from production.
- [ ] Keep server authorization as the future source of truth; QA role switching is presentation-only.
- [ ] Add/maintain responsive QA at 320, 390, 768 and 1440 widths.

## Phase 1 — Studio role/permission foundation

- [ ] Implement temporary development role switcher for QA.
- [ ] Supported QA roles: Visitor, Participant, Moderator, Co-trainer, Event Lead, Event Builder, Studio Admin, Platform Super Admin.
- [ ] Role switcher must not be represented as real authentication.
- [ ] Centralize capability checks so production auth can replace the development switcher.
- [ ] Separate question-answer permission from moderation permission.
- [ ] Event Moderator alone cannot answer trainer Questions.
- [ ] Event Lead and Co-trainer can answer Questions.
- [ ] Build management visible only to authorized staff.
- [ ] Participant Build view contains no trainer management controls.

## Phase 2 — Event Builder restructure

- [ ] Replace decorative step headings with real four-step navigation.
- [ ] Step 1 Details.
- [ ] Step 2 Schedule.
- [ ] Step 3 Room and team.
- [ ] Step 4 Review and publish.
- [ ] Preserve draft state while navigating between steps.
- [ ] Remove optional mobile listing crop.
- [ ] Move/remove challenge authoring fields from Event Builder.
- [ ] Add Participant access controls.
- [ ] Add Public activity preview controls.
- [ ] Keep resource release timing per resource.
- [ ] Build dedicated Review and publish screen.
- [ ] Add validation summary and preview states.

## Phase 3 — Discover events

- [ ] Simplify discovery card data density.
- [ ] Make whole card clickable.
- [ ] Remove View event button.
- [ ] Remove Room preview action.
- [ ] Remove card-level “You’ll make”.
- [ ] Use 16:9 listing thumbnails.
- [ ] Add hover/focus Share icon bottom-right of thumbnail.
- [ ] Add Upcoming / Live / Past page states.
- [ ] Add Search, Subject, Event type, Level, Date filters.

## Phase 4 — Public Event Overview

- [ ] Remove redundant second event header.
- [ ] Place Share in heading area.
- [ ] Use ~32:9 desktop event banner.
- [ ] Convert event metadata to compact grid.
- [ ] Render optional 16:9 video + About two-column layout.
- [ ] About becomes full-width when no video.
- [ ] Render only creator-entered learning outcomes.
- [ ] Remove “What happens next”.
- [ ] Remove public room-preview card.
- [ ] Keep public resources subject to resource timing/publicPreview rules.

## Phase 5 — Registration/status card

- [ ] Logged-out/visitor state: Full name + Email + Register.
- [ ] Do not require Wistudi account to register.
- [ ] Registered upcoming state: confirmation, date/time, countdown, Open room, Add calendar, Cancel registration.
- [ ] Starting soon state.
- [ ] Live state with Join live workshop.
- [ ] Completed state.
- [ ] Cancelled event state.
- [ ] Protect meeting credentials behind room authorization.

## Phase 6 — Public Event activity preview

- [ ] Host setting Off / Questions / Chat / Both.
- [ ] Read-only preview widget on public Overview.
- [ ] Questions/Chat counts when useful.
- [ ] Join the conversation CTA.
- [ ] Gate CTA through registration/access modal when required.
- [ ] Never expose private room content or credentials.

## Phase 7 — Event Room redesign

- [ ] Remove generic subtitle under Event room.
- [ ] Keep compact publisher journey.
- [ ] Remove duplicate main-column countdown card.
- [ ] Keep Your event card top-right.
- [ ] Add Available now resource preview.
- [ ] Add compact Build challenge state.
- [ ] Add Recent activity.
- [ ] Remove Share this event block.
- [ ] Remove View event details CTA.
- [ ] Right rail: event status, room activity, trainer/host identity.
- [ ] Remove fabricated trainer biography until profile feature exists.
- [ ] Remove production-facing Preview stage selector.

## Phase 8 — Questions

- [ ] Rename/position page as Ask the trainer.
- [ ] Explicit new-question composer.
- [ ] All / Open / Answered filters.
- [ ] Sort default by vote count descending.
- [ ] Vote control reversible.
- [ ] Active vote state green.
- [ ] Per-question answer action for authorized staff.
- [ ] Remove global trainer answer field.
- [ ] Answer composer supports text + compact attachment menu.
- [ ] Attachments: image, video, document, link, Wistudi content.
- [ ] Answered state attached to question.
- [ ] Helpful and Need more clarification feedback.
- [ ] Bounded clarification follow-up.
- [ ] Discuss in chat action.
- [ ] Participants cannot answer trainer Questions directly.

## Phase 9 — Chat

- [ ] Keep open participant conversation separate from Questions.
- [ ] Preserve replies/reactions/context.
- [ ] Optional “Post as a question” suggestion; never automatic semantic relocation.
- [ ] Support pinned challenge system cards.

## Phase 10 — Build challenges data model

- [ ] Replace one-challenge lookup with event challenge collection.
- [ ] Add challenge statuses.
- [ ] Add availability timing.
- [ ] Add custom release time.
- [ ] Add participation policy.
- [ ] Add submission type.
- [ ] Add success criteria.
- [ ] Add support resources.
- [ ] Add Wistudi starter content reference.
- [ ] Add chat-pin setting.
- [ ] Add event-page visibility setting.

## Phase 11 — Trainer Build

- [ ] Trainer Build dashboard.
- [ ] Create challenge.
- [ ] Edit challenge.
- [ ] Draft/Scheduled/Published filters.
- [ ] Participation/submission counts.
- [ ] Release controls.
- [ ] Archive/duplicate actions as approved.
- [ ] Same route renders learner view when user lacks management capability.

## Phase 12 — Learner Build

- [ ] Multiple-challenge overview.
- [ ] Participation rule banner.
- [ ] Availability states.
- [ ] Not started / Taking part / Submitted.
- [ ] Single challenge detail before joining.
- [ ] Full instructions and checklist.
- [ ] I’ll take part.
- [ ] Hide submission form before joining.
- [ ] Reveal submission area after joining.

## Phase 13 — Wistudi creation handoff

- [ ] Build a Flow in Wistudi action.
- [ ] Create XP Video action where allowed.
- [ ] Use starter template action where supplied.
- [ ] I already created something fallback.
- [ ] Preserve challenge/event return context.
- [ ] Do not change underlying Wistudi publishing state when attaching/submitting.
- [ ] Plan automatic return/attachment integration after platform identity/content APIs are available.

## Phase 14 — Submission/community creations

- [ ] Default submission visibility: Event only.
- [ ] Optional creator choice: Public in Studio.
- [ ] Do not use submission as automatic public-web publish.
- [ ] Submitted creation appears in challenge Community creations for eligible event members.
- [ ] Trainer sees same challenge with management/filter controls.
- [ ] Feedback inline; no separate mandatory trainer submission room.
- [ ] Moderation/reporting remains available.
- [ ] Design future Community creations search surface.

## Phase 15 — Trainer/host profiles

- [ ] Do not hard-code “Wistudi Trainer”.
- [ ] Support external hosts.
- [ ] Until profile system exists, show name + role only.
- [ ] Future profile record: avatar, display name, short bio, organisation, role/title, expertise, links, hosted events.
- [ ] Event references profile instead of copying bio.

## Phase 16 — QA acceptance

- [ ] Visitor cannot access protected room by direct URL.
- [ ] Registration does not grant staff capabilities.
- [ ] QA role switch never alters real authorization.
- [ ] Meeting link never appears in public DOM/data payload.
- [ ] Resource timing still works independently from room/challenge timing.
- [ ] Questions and Chat remain behaviorally distinct.
- [ ] Moderator cannot answer unless also Co-trainer/Event Lead.
- [ ] Multiple challenge release states render correctly.
- [ ] Submission does not silently publish publicly.
- [ ] No invented event/trainer content generated by UI.
- [ ] Keyboard/focus/hover alternatives work for all hover-revealed actions.
- [ ] Mobile event navigation remains usable and content does not overflow.

## Mockups still required before final implementation polish

- [ ] Learner single challenge — before joining
- [ ] Learner single challenge — after joining/submission
- [ ] Chat with pinned challenge
- [ ] Community creations/post-submission
- [ ] Wistudi creation handoff/return state if not covered by learner submission mockup
- [ ] Review and publish Event Builder step
- [ ] Mobile variants for key event and Build states
