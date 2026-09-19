# Publisher Studio Changelog

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
