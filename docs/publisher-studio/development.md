# Publisher Studio Development

Status: local-data prototype for multi-event discovery, inline event chat and Event Builder review. Internal Studio navigation is client-side and keeps one app shell mounted.
Branch: `feature/publisher-studio-mvp`.

## What Works

- Three distinct Studio views (Home, Discover events, My events) inside a shared app shell.
- One persistent Studio navigation model across event overviews, rooms and the Event Builder.
- Selected-event navigation for Overview, Room, Questions, Build, Chat and optional Event resources.
- Event-specific room URLs using the same global shell and compact mobile event-section navigation.
- Before, live and after-workshop preview state per event.
- Event Builder with guided sections, local draft save, event preview and local image preview.
- A simple event-to-room-to-build-to-share/publish journey indicator.
- Fixed mobile navigation for Home, Discover, My events and Create; event sections remain in a horizontal row.
- Local preview registrations appear in My events so the end-to-end shell can be reviewed without a database.
- Questions, reversible votes, answered filters and resource-specific context.
- Four contextual contribution types, two-reply preview/expand, hearts and inline replies.
- Drag/drop local media/file previews, emoji picker, trainer mention suggestions and related-context prompts.
- Light/dark theme toggle and sample trainer-notification menu.
- Challenge participation, link submissions and pending-review display.
- Optional demo profile with a stable initials avatar; no email persistence.
- Resource outlines, search, contextual replies and explicit unavailable remix actions.
- Browser-tab persistence, corruption recovery, draft preservation during navigation and demo reset.

These are prototype interactions, not live services. There is no real registration,
login, verified identity, room authorization, shared multi-user chat, role invitation,
live trainer notification, secure media upload, moderation queue, Zoom connection,
recording or Wistudi account/content connection. Demo event names, participant
labels, answers, vote counts and schedules are fixtures. Event-builder drafts and
submitted demo records use `sessionStorage`, not a database. Tab storage is not
authorization and may be copied when a browser duplicates a tab. Do not enter real
attendee information or private Zoom links in the public-repository preview.

## Routes

Every listed route can still be opened directly or refreshed. Once the Studio is
loaded, links to these routes are handled with the History API, so the browser does
not replace the app with a route loading placeholder. Back and forward restore the
previous Studio view and its scroll position. Room-section hashes update the active
panel in place; deep links to a thread, question or submission still select and
scroll to that item.

| Path | Current implementation |
| --- | --- |
| `/publisher-studio/` | Studio Home |
| `/publisher-studio/?view=discover` | Discover events in the shared Studio shell |
| `/publisher-studio/?view=my-events` | Preview registrations in My events in the shared Studio shell |
| `/publisher-studio/events/communicative-esl/` | Sample event details, registration and sharing preview |
| `/publisher-studio/events/worksheet-to-flow/` | Second event details and sharing preview |
| `/publisher-studio/events/interactive-video/` | Third event details and sharing preview |
| `/publisher-studio/events/{slug}/room/` | Event-specific mobile-first room shell |
| `/publisher-studio/manage/events/` | Local-only Event Builder preview |
| `/publisher-studio/studio/` | Generic room-shell fallback for prototype review |
| `#week`, `#questions`, `#challenge`, `#workbench`, `#resources` | Bookmarkable workspace views |

Weekly archive, submission detail and live admin functions remain planned. Every
implemented HTML route is noindex. The exact feature-branch alias is allowed for
public prototype review; other hosts stay closed unless the preview environment
override is enabled. Event room routes do not authenticate or authorize participants
in this prototype.
The wider Wistudi website navigation, live Resources Events pages and sitemap are unchanged. Publisher Studio uses its own persistent in-shell navigation across all of its views.

## Local Preview

Run an HTTP server from the repository root, for example:

```sh
python -m http.server 4173
```

Open `http://localhost:4173/publisher-studio/`. Root-relative assets and JavaScript
modules require HTTP; opening the HTML with `file://` is not supported.

The static server tests UI only. It does not execute Cloudflare middleware.

## Preview Isolation

`functions/publisher-studio/_middleware.js` allows the exact feature-branch Pages
alias `feature-publisher-studio-mvp.wistudi-global-website.pages.dev` so the hosted
prototype can be reviewed. Other hostnames, including production, return 404 unless
`PUBLISHER_STUDIO_PREVIEW_ENABLED` is exactly `true`. Leave that variable unset
in production. Setting it in Cloudflare's Preview environment can open the routes
on other preview deployments too; the exact-host exception avoids requiring that
project-wide switch for this branch.

The feature alias is public to anyone with the URL. It contains demonstration
fixtures only: no real account data, registration processing or shared database.
The gate adds no-store and noindex headers, but neither an unlisted route, noindex
nor a feature branch is private access control. If previews must be private,
configure Cloudflare Access before exposing them. Assets and source are public in
this public repo; never put credentials, personal data or private meeting links
in fixture files. No Cloudflare dashboard settings were changed.

## File Boundaries

| Location | Responsibility |
| --- | --- |
| `publisher-studio/` | Catalogue, sample event pages/rooms and Event Builder page |
| `assets/css/publisher-studio.css` | Isolated responsive Studio styles |
| `assets/js/publisher-studio/data.mjs` | Sample event catalogue, resources, challenges and contexts |
| `assets/js/publisher-studio/model.mjs` | Validation, local state and mutations |
| `assets/js/publisher-studio/app.mjs` | Rendering, client-side route handling, sharing, builder preview and local interactions |
| `functions/publisher-studio/_middleware.js` | Default-off release gate |
| `scripts/publisher_studio_test.mjs` | Model, escaping, persistence and gate tests |
| `scripts/publisher_studio_browser_qa.mjs` | Responsive and workflow regression tests |

No new application framework, package manifest, global CSS, production API or
database migration is introduced. Existing Wistudi logos and typography fallbacks
are reused without external font or avatar requests.

## Checks

```sh
node --test scripts/publisher_studio_test.mjs
node scripts/publisher_studio_browser_qa.mjs
```

Browser QA needs Playwright with Chromium installed, matching the existing repo's
browser QA convention. It starts and stops its own loopback static server. It tests
320, 390, 768 and 1440px widths and saves screenshots under
`qa-artifacts/publisher-studio/`. `PLAYWRIGHT_MODULE_PATH` may point to an existing
Playwright module; `QA_ARTIFACT_DIR` may select a separate output directory.

The `Publisher Studio QA` workflow runs on relevant branch pushes and pull
requests. Screenshot artifacts expire after 14 days. It does not deploy anything.

The test Wistudi Flow card uses generic page metadata because the supplied share URL
does not currently expose per-Flow Open Graph tags. Other URLs use a safe host/link
card; no arbitrary Open Graph fetch runs from the browser.

## Integration Audit

Inspected source, not production configuration:

- The site is static HTML/CSS/JavaScript with Cloudflare Pages Functions.
- `functions/api/event-register.js` accepts registration data, writes through a
  Google Apps Script / Sheets webhook and uses Resend for confirmation emails.
- The production event endpoint accepts booking privacy and marketing consent; it
  does not accept Studio membership consent or verify email ownership.
- The Sheets webhook checks existing rows before appending without an explicit
  lock/unique constraint. Concurrent duplicate requests can race; the fallback email
  is a manual recovery path, not a durable retry queue. This phase documents the gap
  but does not alter the live registration flow.
- The current endpoint uses an event allowlist. Studio fixture IDs must never be
  posted to it or added just to make a demo appear connected.
- The registration API currently does not provide a general event-builder data
  store or per-event room permissions. Do not treat the new sample event pages as
  booked events. A reviewed event registry and adapter are required before launch.
- `assets/js/event-registration-component.js` and the live bridge belong to the
  existing event experience; this prototype does not load or edit them.
- This audit did not establish a reusable participant authentication service or
  transactional Studio database. Do not treat a Sheets row or registration ID as
  a verified session. Provider credentials and Cloudflare settings were not read.

Observed baseline issue: `node scripts/event_registration_email_qa.mjs` fails its
fallback-email lookup. The test searches the subject for `storage fallback`, while
the existing endpoint emits `Event registration fallback`. Both files are unchanged
in this milestone. Provider calls in this test are mocked; the failure is not
evidence that production email delivery failed. Track that separately.

## Next Development Gate: Identity and Storage

The reviewable design baseline is in [`identity-and-storage.md`](identity-and-storage.md).
The provider choice remains open until the Wistudi platform's canonical account
provider and the deployed site's bindings are confirmed.

1. Confirm a database and authentication provider compatible with existing hosting.
2. Use immutable Studio user IDs, private verified-email records and explicit
   identities mapping `(provider, provider_subject)` for future Wistudi accounts.
3. Keep workshop registration, Studio membership and verified sign-in separate.
   Repeated registrations must not create new members, avatars or duplicate emails.
4. Keep Studio opt-in visible and unchecked by default. Keep booking privacy and
   marketing consent separate. Record consent version/time and define withdrawal
   and deletion behavior.
5. Verify email before interactive access. Use expiring, single-use hashed tokens,
   secure HttpOnly sessions, server-side membership checks, CSRF protection, rate
   limits and recovery for expired links. Never grant access from a registration
   ID, a URL email or browser storage.
6. Add unique vote constraints, relational context integrity, server timestamps,
   pagination, retry handling, scoped moderation roles, reporting and an audit trail.
7. Define upload limits, safe file processing, copyright/remix permissions and
   rules against sharing identifiable learner work before enabling uploads.
8. Cover failure paths before release: registration stored but email fails; webhook
   retry; returning attendee; declined Studio consent; account-link collision;
   removed member; deleted parent content; unavailable live session.

Remix, avatars and discussion records must use opaque IDs, not email-derived public
identifiers. The later Wistudi connection should be a verified account-linking flow,
not an automatic merge based only on matching email strings.

## Iteration Rules

- Continue on the same feature branch and draft PR; do not recreate the feature.
- Read current branch state and decisions before each change.
- Commit bounded milestones; append changes and reasons to the changelog.
- Keep main updates via normal reviewed merges, never force-push shared history.
- Run Studio QA for each interaction change. Review mobile screenshots and keyboard
  behavior. Device keyboard and safe-area checks are still required before launch.
- Do not merge or enable production routes until the launch checklist is approved.
