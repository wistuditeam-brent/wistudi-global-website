# Publisher Studio Changelog

## 2026-09-19 / Identity and Storage Architecture

### Added

- Identity and storage design covering enrollment, verification, membership,
  contextual data, moderation, access control and future Wistudi linking.
- A logical relational model with stable context foreign keys and scoped staff roles.
- A provider decision gate that distinguishes findings from the website source audit
  from uninspected Wistudi platform and Cloudflare account configuration.
- Explicit cross-system retry requirements for the existing Sheets/Resend event flow.

### Why

- Make the next implementation step concrete while preserving the live booking path.
- Avoid treating workshop registration, Studio membership consent and verified login
  as one event or reusing a registration ID as authentication.
- Keep identity/content portable for a future Wistudi account connection.

### Still Open

- Wistudi's current auth provider and canonical user ID.
- Owned Studio database/auth provider and production/preview operations.
- Approved consent wording, retention, deletion/recovery, moderation and public-read
  policies.
- A durable retry adapter between the existing event registration system and Studio.
- A decision on the existing Sheets check-then-append duplicate race and manual
  storage-fallback process before using it as the basis for opt-in provisioning.

## 2026-09-19 / First Development Milestone

### Added

- Three isolated preview routes: Studio overview, workshop registration and workspace.
- Mobile bottom navigation, contextual conversations and before/live/after preview states.
- Local demo questions, voting, replies, Workbench contributions and challenge submissions.
- Explicit Studio membership opt-in and stable initials avatars, without storing email.
- Resource previews/search and disabled, clearly unconnected Wistudi remix actions.
- Versioned tab-local state, safe URL validation, escaped user text and reset/recovery.
- Default-off Cloudflare preview gate and noindex entry pages.
- Model and browser QA, a branch-only test workflow and the development handoff guide.

### Why

- Make the architecture usable enough to review before connecting accounts or data.
- Preserve existing registration and email services while keeping future integration boundaries clear.
- Give repeated UI edits a consistent test and decision history.

### Still Open

- Responsive browser QA and human visual approval must pass before this milestone is approved.
- Real auth/database/provider selection, registration synchronization and verified membership.
- Moderation, uploads, live sessions, recordings, weekly archives and Wistudi linking.
- Existing event-email QA has a subject-matching failure unrelated to Studio; see `development.md`.

## 2026-09-19

### Added

- Created initial Publisher Studio architecture package.
- Added route architecture proposal.
- Added lightweight Studio identity model.
- Added contextual discussion model.
- Added implementation phases.
- Added decision log.

### Confirmed

- Use existing Wistudi global website repository.
- Use a dedicated feature branch.
- Keep routes hidden until ready.
- Use "Ask the Trainer" rather than "Ask Nadia."
- Avoid anonymous posting for interactive Studio features.
- Avoid AI-generated participant faces.

### Open

- Need current website framework and route structure.
- Need current registration method details.
- Need existing database/auth integration details.
- Need decision on whether Studio participation is automatic or opt-in during event registration.
