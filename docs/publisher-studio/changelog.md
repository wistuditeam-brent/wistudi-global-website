# Publisher Studio Changelog

## 2026-09-20 / Role and Permission Architecture

### Changed

- Defined Platform Super Admin, Studio Admin, Event Builder, Event Lead, Co-trainer,
  Event Moderator, Participant and Visitor scopes, with explicit capability limits.
- Defined who can appoint each role and how named, email-bound, expiring and
  revocable event invitations become active assignments.
- Specified the staff management view, the presentation-only Participant preview,
  and a combined My events view for attendees, managers, drafts and invitations.
- Documented attendee-data, Zoom-secret, room-lifecycle, event-cancellation and
  role-revocation boundaries, plus launch acceptance criteria.

### Why

- Trainers need tools to run assigned events without inheriting Wistudi-wide admin
  powers. The prototype's role labels and local notifications do not provide real
  identity or authorization.

### Scope

- Architecture/documentation only. No login, database permissions, invitation
  endpoints, staff controls or production role enforcement were added.
- The permission model is proposed for review; confirm the remaining launch choices
  in `roles-and-permissions.md` before enabling live access.

## 2026-09-20 / In-Shell Navigation

### Changed

- Internal links between Studio Home, event discovery, My events, event details,
  event rooms and Event Builder now update the URL and render in the existing app
  instead of requesting another HTML page.
- Added browser back/forward support, direct-link routing and scroll restoration.
- Removed the animated View Transition from room section changes so the selected
  section appears immediately.

### Why

- Prevent the route-specific “Loading…” placeholder from flashing between screens.
- Keep navigation feeling like one continuous Studio application on desktop and
  mobile while preserving bookmarkable routes and room sections.

## 2026-09-20 / Unified Studio Navigation and App Shell

### Changed

- Added the persistent Studio destinations Home, Discover events, My events and
  Build an event to the left panel across Studio views.
- Moved event Overview, Room, Questions, Build, Chat and optional Event resources
  into the same event-aware navigation. Event context remains visible while
  participants move between those sections.
- Reworked the Studio Home into an orientation and continue-learning view; moved
  the full catalogue to Discover events and added a My events view.
- Added local preview-registration records so the My events screen can be reviewed
  without presenting the registration form as a live booking.
- Applied the same shell to public event overview and the Event Builder. Removed
  the detached “All Wistudi Events” exit link from the Studio views.
- Kept global Studio actions fixed on phones and placed event sections in a
  horizontal row beneath the event bar.
- Updated architecture, interaction and event-system documentation to match the
  corrected reference screens.

### Why

- The corrected references show one application shell, with global destinations
  and selected-event sections always available from the left panel.
- Participants should be able to return to Discover or My events from the Overview,
  room, chat or builder without losing the Studio context.

### Prototype boundary

- Local preview registrations are stored in `sessionStorage` only. There is no
  account, durable database, booking handoff or server-side room authorization.
- Studio routes remain directly addressable static HTML documents for refresh and
  deep links. Internal navigation now uses the History API to keep the Studio open
  and replace only its rendered view; production login and real-time presence are
  not part of this change.

## 2026-09-20 / Desktop Width and Type Scale Revision

### Changed

- Expanded the desktop workspace to the available browser width and widened the
  public event catalogue and event overview canvas.
- Kept the active workspace panel at a readable maximum width on very wide screens.
- Reduced the previous non-main-heading increase from 4 points to 2 points; main
  `h1` sizes remain unchanged.
- Removed the repeated event title and duplicate resource links from the context
  rail. The Event Resources area remains the complete resource list.
- Improved text contrast in the dark-theme event focus card.

### Why

- Desktop review showed excess outer margins, oversized supporting text and repeated
  event context. The updated layout follows the brief's full-width app-shell rule
  while keeping individual reading areas comfortable.

## 2026-09-20 / Inline Chat, Room Navigation and Readability

### Changed

- Replaced the modal Workbench conversation with an inline event chat timeline. Each
  message stays attached to its event/resource/challenge context; replies are
  threaded, two are visible by default, and more expand in place.
- Added message hearts, inline reply forms, trainer mention suggestions and accepted
  related links to events/resources, existing discussions, questions and creations.
  The suggestions use transparent title/body word matching and never link themselves.
- Added local file drops/previews and safe link/video cards.
- Added the test Wistudi Flow link to the sample conversation. Its card uses the
  generic Wistudi metadata currently exposed by the share page and clearly says the
  Flow-specific title is unavailable.
- Added an event-room directory on desktop and a horizontal room switcher on phones,
  room activity counts, open-state messaging and a room list for all sample events.
- Added a Studio light/dark toggle, sample trainer notifications, drag/drop media
  previews in the Event Builder and local theme persistence.
- Increased non-main-heading text declarations by 5.34 pixels (4 points), including
  the added room/chat/upload interface text. Main `h1` declarations remain unchanged.
- Added the scoped role, manual room closure, safe sharing, notification and
  metadata-provider decisions to the architecture documentation.

### Why

- People should be able to discuss, share files and follow replies without leaving
  the event room or encountering a chat modal.
- Event rooms need a clear route back to other events on both desktop and mobile.
- Larger interface text improves reading and tapping on phones.
- Public event invitations must not expose room messages, registrations or Zoom
  credentials. Participant work needs explicit consent and approval before public
  sharing.

### Prototype boundary

- Accounts, database sync, server-side room authorization, uploads, live mentions,
  notifications, role invitations and external object-share pages are not connected.
- The supplied Flow page currently exposes only generic Wistudi Open Graph metadata;
  individual Flow previews need a Wistudi metadata endpoint or server-rendered tags.
- Attachment bytes remain local to the browser and are not visible to other users.

## 2026-09-20 / Mobile Navigation and Event Browsing

### Changed

- Keep the event-room bar visible while scrolling, with direct links back to all
  events and to the current event details.
- Keep all five room areas in the bottom navigation while using shorter visible
  labels on mobile and retaining the full accessible names.
- Make mobile event cards easier to scan, with one primary details action and an
  icon share action. Room preview remains available from the event details page.
- Add brief same-room and route transitions, disabled for reduced-motion settings.

### Why

- People should never lose their route back to the event catalogue after entering
  a room. A persistent event bar and thumb-reachable section navigation make the
  Studio feel more like one connected mobile experience.
- The event card should help someone choose quickly; the event page can carry the
  fuller description, outcome and registration details.

### Follow-up

- Confirm the layout at narrow phone widths and with screen readers during human
  review. This prototype still has no live registration, accounts or room data.

## 2026-09-19 / Closed Preview Gate Fallback

### Changed

- Treat a missing request URL as a non-preview host, so middleware checks without a
  request fail closed instead of throwing.

### Why

- The repository's automatic gate check invokes middleware with an environment
  binding but no Request object. Cloudflare requests still use their exact hostname.

## 2026-09-19 / Hosted Feature Preview Access

### Changed

- Allow the exact `feature-publisher-studio-mvp.wistudi-global-website.pages.dev`
  alias through the Publisher Studio middleware.
- Keep production and every other hostname default-off unless the explicit
  `PUBLISHER_STUDIO_PREVIEW_ENABLED=true` override is configured.

### Why

- The Cloudflare deployment completed, but the intentional default-off middleware
  returned 404 on the branch alias. The exact-host exception makes this one hosted
  demo reviewable without enabling the route across all preview deployments.

### Access

- The branch preview is public to anyone with its URL and contains fixture data
  only. Keep private information out of its pages and assets.

## 2026-09-19 / Event System Architecture and Experience Revamp

### Added

- Event-system architecture covering a canonical event record, catalogue, public
  event page, event-specific room, project contexts and optional Wistudi publishing.
- Three sample event detail pages and event-specific mobile room routes.
- Event cards with output-led summaries, local time, room preview and a share hub
  offering copy, native sharing, email, WhatsApp, LinkedIn and Facebook.
- Event-specific Open Graph metadata fixtures for share preview review.
- Guided Event Builder preview with date/timezone, trainer, test Zoom field,
  thumbnail selection, video URL, Publisher Kit, project challenge, team roles,
  local draft saving and public-page preview.
- Separate event operation state and participant journey language.
- Documentation for reusable event IDs, scoped builder invitations, registration
  boundaries, meeting-link protection, media storage and Wistudi Flow previews.

### Why

- Make Publisher Studio an event-to-creation ecosystem rather than a single-event
  landing page with a detached discussion area.
- Standardize event structure for multiple event creators without duplicating the
  broader Resources Events directory.
- Give event owners a repeatable workflow while keeping the public share URL
  separate from private room and Zoom access.

### Still Open

- Real event registry, database/auth provider and platform identity.
- Multi-event registration adapter that preserves the existing Sheets/Resend booking path.
- Role assignment/invitation service, moderation backend and participant room authorization.
- Zoom OAuth/meeting creation, private credential storage and join-button release rules.
- Managed asset/video storage, Wistudi link metadata resolver and generated event HTML.
- Final product approval of catalogue ownership: Publisher Studio's workshop view
  versus the broader `/resources/events/` directory.

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

## 2026-09-20 / Event Resources and Event Promotion Media

### Added

- Replaced the participant-facing Publisher Kit label with Event resources.
- Added an optional repeatable resource editor with resource type, title, optional
  description, link or local file preview, optional step instructions, release stage
  and public-page visibility.
- Public event pages show only creator-approved resources available before the event;
  the section is omitted when there are none. Room resources follow the configured
  before/live/after stage and the resource tab is omitted when an event has no items.
- Added PDF, Word, image, audio and video attachment selection for local previews;
  YouTube/Vimeo links can appear in an embedded player, while other URLs use an
  external-link card.
- Added required learning outcomes, an event-page banner, distinct event-card art,
  an optional 2:3 crop for the narrow left-side mobile card image and an optional
  promotional video link or local video preview.
- Added a creator preview showing the event page, resource visibility and the actual
  horizontal mobile event-card layout.
- Clarified that the event-page banner is wide on desktop and crops to 4:3 on phones.
- Updated the event architecture and decisions to use event-owned resources rather
  than a separate Publisher Kit record.

### Prototype Boundary

- Files, images and uploaded videos are previewed locally in the current browser tab;
  they are not uploaded or retained in the event draft.
- Draft event publishing, persistent resource storage, secure participant-file
  delivery, external-link metadata resolution and video processing remain unconnected.
- The preview embeds only recognized YouTube/Vimeo URLs. Google Drive and other
  external links use their supplied title and description because access and preview
  metadata depend on the source's sharing settings.
