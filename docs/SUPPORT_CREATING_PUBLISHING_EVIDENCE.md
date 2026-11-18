# Creating & Publishing guide evidence

Reviewed 18 November 2026.

## Product source

- Public deployed application shell: https://wistudi.com/sign-up
- Its current frontend bundle: https://wistudi.com/assets/index-BBaNIS4I.js
- Bundle SHA-256: `2489cfbfa2e39877ee22598ddf793faeb0dae29d29f8af505b6ddc08f603f59a`
- Current global website Support Centre, existing guide shell, current Terms, Credit Usage Policy and Template Publishing & Remix Terms routes.
- Wistudi Editorial & Publishing Standards v1: practical language, no fabricated UI or capabilities, images only when useful.

## Claims checked against the deployed frontend

| Guide | Current source evidence |
| --- | --- |
| XP Videos | videoUploadPanel, videoWorkspace, editorTopHeader, editor, timestampSelector, publishingRequirements, checkpointConfigForm and lessonRules strings/control references: upload/external URL, Create Interactive Lesson/Make Interactive, timestamp checkpoints, completion checks, playback rules, preview, Save Draft, Publish/Update and Share. |
| Flows | Flow Workspace/Create a New Flow dialog: Flow Name, category/topic, Single Flow versus Structured Flow; Single Flow coming-soon condition. Builder structure controls Add Collection/Add Page. Flow Settings required sections and Save & Exit. |
| Blocks | Current block labels and block configuration: matching, sorting, sequencing, polls, written response, images/media and learner instructions; availability is conditional. No fixed activity counts, word limits, scoring formulas or unsupported block guarantees. |
| Media | Upload and external URL fields, source metadata restriction, validation for unsupported formats and account-dependent size limits. MP4/WebM examples only; no fixed upload cap or earning promise. |
| Publishing | Publish Flow/Confirm & Publish, credit summary, Workspace/Discover/Template distinction, Review Status/Recall Submission, Manage Flow Versions, no-learners direct editing and restrictions for existing draft, review or Discover state. Draft preparation is distinguished from release; no unsupported promise about learner migration after publishing. |
| Sharing | Share with Learners current Flow Temporary Link, Generate Link, expiry/access limit, current regeneration warning and private-link controls. Guest and recorded-progress availability described conditionally. |

## Verification boundaries

These are support-content changes, not product feature changes. Public frontend code establishes interface labels and client conditions, not a guarantee of backend entitlements. No account creation, publish transaction, purchase, link generation, access-slot consumption or learner submission was performed on production. No screenshot of an unverified authenticated product state is presented as real UI. Administrative restrictions are not bypassed.

Support-page checks cover article links/anchors, metadata/schema, existing guide preservation, search data, no specific credit amounts, responsive layout, navigation and JavaScript errors. Production pages and index are checked after deployment.

## Checks completed before release

- Static checks passed for all six new article routes, local support links and anchors, unique IDs, structured data, date metadata, sitemap entries and absence of numeric credit amounts.
- Hub and article index validated: 12 available guides, 15 planned topics, 12 unique indexed articles.
- Shared Chrome rendered all six guides at desktop width 1348px and in mobile frames 320px and 390px wide. No document overflow; mobile contents controls appeared and desktop sidebars were hidden on mobile. Desktop and mobile screenshots inspected.
- Browser interaction checks passed: full-article search for MP4 returns the media guide; empty search and reset; Creating category shows eight topics; legacy sharing topic anchor opens its new full guide.
- Local standalone Chromium could not start because the command sandbox denied its singleton socket; installing the SDK headless shell failed with a truncated/non-ZIP response. Visual and interaction checks were completed in shared Chrome instead.
