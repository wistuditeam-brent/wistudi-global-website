# Publisher Studio Implementation Plan

Phase: Architecture
Status: Draft for `feature/publisher-studio-mvp`
Last updated: 2026-09-19

## Recommended Git Workflow

Use the existing Wistudi global website repository.

Create a long-running feature branch:

```text
feature/publisher-studio-mvp
```

Open a draft pull request early. The PR should act as the working record for screenshots, questions, review notes and remaining tasks.

Do not merge into the live branch until the experience is hidden, reviewed and ready.

## Commit Pattern

Use small commits that describe each layer of work.

Examples:

```text
docs: add Publisher Studio architecture
docs: add Publisher Studio implementation plan
feat: add Publisher Studio route shells
feat: add static event page
feat: add mobile Studio shell
feat: add mock trainer questions UI
feat: add mock build challenge UI
```

## Phase 1: Architecture

Goal: create the implementation foundation before UI build-out.

Deliverables:

- Architecture document
- Implementation plan
- Decision log
- Changelog
- Route map
- Data object definitions
- Initial open questions

Acceptance criteria:

- Team agrees Publisher Studio will live in the existing website repository.
- The first routes are confirmed.
- Naming avoids hard-coding a single trainer.
- The identity model is lightweight but not anonymous.
- The project has a trackable decision log.

## Phase 2: Static Prototype

Goal: create the first visible page shells using mock data.

Deliverables:

- `/publisher-studio` page shell
- `/publisher-studio/events/[slug]` page shell
- `/publisher-studio/studio` mobile-first shell
- Mock Publisher Kit
- Mock Questions tab
- Mock Challenge tab
- Mock Workbench tab
- Mock Resources tab

Acceptance criteria:

- Desktop public pages feel like Wistudi website pages.
- Mobile Studio area feels like a focused app or chat workspace.
- No real database or auth is required yet.
- The Studio route is hidden from navigation until approved.

## Phase 3: Registration and Studio Identity

Goal: connect workshop registration to lightweight Studio participation.

Deliverables:

- Registration source audit
- Studio user creation/update logic
- Email as identity key
- Generated avatar seed
- Consent field for Studio participation
- Magic-link or equivalent access approach

Acceptance criteria:

- A registered participant can be identified without creating a full Wistudi account.
- Duplicate identities are reduced by using email as the unique key.
- Public email addresses are never displayed.
- Studio identity can later map to a Wistudi account.

## Phase 4: Contextual Discussion

Goal: implement the core discussion model around Studio objects.

Deliverables:

- Contextual thread model
- Questions model
- Voting model
- Comments model
- Trainer answer state
- Pinned or highlighted trainer responses

Acceptance criteria:

- Users post under a known context.
- Questions can be voted up through "I want this answered too."
- Trainer answers can be marked as answered.
- Threads can be filtered by workshop, template, challenge or resource.

## Phase 5: Build Challenge

Goal: turn workshop attendance into creation.

Deliverables:

- Challenge detail area
- Join challenge action
- Submission form
- Screenshot/link fields
- Help-needed state
- Moderation status
- Public approved showcase cards

Acceptance criteria:

- Participants can submit something they made.
- Submissions can be moderated before public showcase.
- Each submission keeps challenge and workshop context.

## Phase 6: Admin and Moderation

Goal: give the trainer and Wistudi team enough control to run the Studio.

Deliverables:

- View questions by votes and status
- Mark questions answered
- Hide inappropriate content
- Approve or reject submissions
- Pin resources
- Highlight Trainer Picks

Acceptance criteria:

- Trainers can prepare before the workshop.
- The Wistudi team can keep public areas clean.
- No public showcase item appears without approval.

## Phase 7: Wistudi Platform Connection

Goal: connect the Studio to Wistudi account and publishing actions.

Future deliverables:

- Connect Studio identity to Wistudi account
- Remix template in Wistudi
- Save to workspace
- Publish version
- Link Studio submission to real Wistudi Flow or template

Acceptance criteria:

- Studio participation becomes a bridge into Wistudi creation.
- Existing Studio data can migrate or map into the main platform.

## Tracking Rules

Every meaningful product decision should be added to `decisions.md`.

Every implementation milestone should be added to `changelog.md`.

Every visual or UX change round should include:

- What changed
- Why it changed
- What is still open

## Risks

| Risk | Mitigation |
| --- | --- |
| Feature becomes a generic social feed | Keep all discussion contextual |
| Trainer workload becomes too high | Use voting, filters and answered states |
| Anonymous posts create moderation problems | Require lightweight Studio identity |
| Prototype cannot migrate later | Use stable IDs and context metadata |
| Separate repo duplicates integrations | Build inside existing website repo |
| Mobile feels like a landing page | Use app-style Studio shell with bottom nav |
