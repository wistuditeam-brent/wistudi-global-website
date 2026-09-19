# Publisher Studio Development

Status: first development milestone, interactive local-data prototype.
Branch: `feature/publisher-studio-mvp`.

## What Works

- Studio overview, sample event/registration and separate participant workspace.
- Before, live and after-workshop preview states.
- Five mobile navigation destinations and full-height contextual conversations.
- Questions, reversible votes, answered filters and resource-specific context.
- Four Workbench contribution types, replies and filtering.
- Challenge participation, link submissions and pending-review display.
- Optional demo profile with a stable initials avatar; no email persistence.
- Resource outlines, search, contextual replies and explicit unavailable remix actions.
- Browser-tab persistence, corruption recovery, draft preservation during navigation and demo reset.

These are prototype interactions, not live services. There is no real registration,
login, verified identity, multi-user chat, trainer notification, upload, moderation
queue, meeting, recording or Wistudi account connection. Demo participant labels,
answers, vote counts and workshop dates are fixtures. Draft fields stay in memory;
submitted demo records use versioned `sessionStorage`, not a database. Tab storage
is not authorization and may be copied when a browser duplicates a tab.

## Routes

| Path | Current implementation |
| --- | --- |
| `/publisher-studio/` | Permanent Studio overview preview |
| `/publisher-studio/events/communicative-esl/` | Sample workshop and registration preview |
| `/publisher-studio/studio/` | Mobile-first workspace |
| `#week`, `#questions`, `#challenge`, `#workbench`, `#resources` | Bookmarkable workspace views |

Weekly archive, submission detail and admin routes remain planned. There are no
placeholder links to nonexistent routes. Every implemented HTML route is noindex;
global navigation, live event pages and the sitemap are unchanged.

## Local Preview

Run an HTTP server from the repository root, for example:

```sh
python -m http.server 4173
```

Open `http://localhost:4173/publisher-studio/`. Root-relative assets and JavaScript
modules require HTTP; opening the HTML with `file://` is not supported.

The static server tests UI only. It does not execute Cloudflare middleware.

## Preview Isolation

`functions/publisher-studio/_middleware.js` returns 404 unless
`PUBLISHER_STUDIO_PREVIEW_ENABLED` is exactly `true`. Leave it unset in production.
Only set it in the approved Cloudflare preview environment when a hosted review
is explicitly wanted. No hosting settings were changed for this milestone.

The gate adds no-store and noindex headers to enabled routes. It is a release
switch, not a login system. Neither an unlisted route, noindex nor a feature branch
is private access control. If previews must be private, configure deployment access
protection before exposing them. Assets and source are public in this public repo;
never put credentials, personal data or private meeting links in fixture files.

## File Boundaries

| Location | Responsibility |
| --- | --- |
| `publisher-studio/` | Three entry pages and no-JavaScript fallback |
| `assets/css/publisher-studio.css` | Isolated responsive Studio styles |
| `assets/js/publisher-studio/data.mjs` | Sample records and context resolution |
| `assets/js/publisher-studio/model.mjs` | Validation, local state and mutations |
| `assets/js/publisher-studio/app.mjs` | Rendering, navigation and form interactions |
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

## Integration Audit

Inspected source, not production configuration:

- The site is static HTML/CSS/JavaScript with Cloudflare Pages Functions.
- `functions/api/event-register.js` accepts registration data, writes through a
  Google Apps Script / Sheets webhook and uses Resend for confirmation emails.
- The current endpoint uses an event allowlist. Studio fixture IDs must never be
  posted to it or added just to make a demo appear connected.
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

1. Confirm a database and authentication provider compatible with existing hosting.
2. Use immutable Studio user IDs, private verified-email records and explicit
   identities mapping `(provider, provider_subject)` for future Wistudi accounts.
3. Reuse the existing registration integration through an idempotent adapter/outbox.
   Make workshop registration and Studio membership separate records. Repeated
   registrations must not create new members, avatars or duplicate emails.
4. Keep Studio membership opt-in visible and unchecked by default. Keep marketing
   consent separate. Record consent version/time and provide withdrawal/deletion.
5. Verify email before interactive access. Use expiring, single-use hashed tokens,
   secure HttpOnly sessions, server-side membership checks, CSRF protection, rate
   limits and recovery for expired links. Never grant access from a registration
   ID, a URL email or browser storage.
6. Add unique vote constraints, relational context integrity, server timestamps,
   pagination, retry handling, moderation roles, reporting and an audit trail.
7. Define upload limits, safe file processing, copyright/remix permissions and
   rules against sharing identifiable learner work without permission.
8. Test the failure paths: registration stored but email fails; webhook retry;
   returning attendee; declined Studio consent; account linking collision;
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
