# Private documents and PDF signing

Entry point: `/room-manager/documents/`. Managers authenticate with the existing
Room Manager account and must have Client Room permission. The manager navigation
links to this area; no signing documents are published in the public Client Room.
An unauthenticated manager entry returns through `/room-manager/?next=documents`.

## Workflow

1. One centered **Upload PDF to Sign** action opens the file picker and uploads
   immediately. The filename supplies the initial title; no second upload page.
2. The editor places the PDF on the left and details/controls on the right. Choose
   **Prepare only** (the default) or **I am signing**. Add each party's full name.
3. Draw a real handwritten signature in the modal, or upload a transparent PNG,
   JPG or WebP. Click the PDF to place it, then drag or resize before submitting.
   Administrators can also prepare unsigned areas for recipients. Recipients may
   place their own areas without administrator preparation.
4. Use **Add text**, click the PDF and type a name, position, date or other plain
   single-line text. Create multiple fields; drag their move handle and resize them
   on the page. The administrator can assign blank text fields before sharing.
5. Save editable drafts, or submit your own signature and text together with
   consent. Only the assigned signer can change their fields after sharing; all
   of their fields lock on submission. Empty text fields must be filled or removed.
6. Create a separate private link and six-digit code for each recipient. The
   administrator copies and sends them; recipients do not need accounts. Existing
   links remain copyable. Legacy links created without codes continue to work.
7. All authorized parties see the shared signing history, including per-party
   link creation and confirmed signature dates/times. Recipient snapshots hide
   private emails, token material and other parties' editable drafts.
8. Download the PDF with every confirmed signature. Export fetches the latest
   server record; draft signatures and unsubmitted text are excluded.

### Preparer text and approvals

The manager's **Add text** control remains available before and after any party
signs, including when all signatures are complete. These document text fields
are separate from each signer's own submitted fields. The preparer can type,
move, resize, remove and save multiple document text fields with **Save changes**.
Preparing text never changes a signature, signature position, signing timestamp
or private signing link. Signature image controls apply only to the current
signing party's unsigned signature.

Each save appends a text version with the before/after values and positions,
editor and timestamp. Every signing party sees this record in **Document
history**, alongside each party's approval time. Each party approves the latest
version with one **Approve text changes** button, through their existing private
link and code. Approvals become available after sharing or the first signature,
when the party details are fixed. A preparing manager who is also a signer approves only for their
own party; a preparing manager who is not signing cannot approve for others.
Subsequent edits require fresh approvals from every current party. Removing text
also requires approval. Identical saves retain existing approvals.

The viewer shows the proposed text and approval progress. PDF downloads include
the latest text version approved by all parties; pending changes never replace
the last approved text in a download. Existing signed records keep their original
signatures and signing dates, and need no re-signing. The export worker retrieves
the authoritative snapshot itself, including for older open editor sessions.
Visible idle editors refresh approval and document state on focus and every
20 seconds without interrupting unsaved edits.

The original PDF and preparation become immutable once a signature is confirmed
or a signing link is created. Each unsigned signer can still add, move and resize
only their own signature areas. Only the creating manager can submit the owner's
signature; other Client Room managers can prepare and manage the agreement.

Unsigned, unshared drafts have an icon-only trash action. Once a link exists or a
party signs, the action becomes archive. Completed MOUs cannot be deleted or
cancelled; the archive tooltip explains why. These rules are enforced by the API.
Archiving moves a document into the Archived list, preserves original workflow,
signatures, history and recipient access, and can be reversed with Restore. Draft
trash uses a tombstone so deleted records and files are inaccessible through the
signing APIs while internal audit and stored originals are retained.

The interface uses the existing full-color Wistudi logo, the supplied PDF icon
with a transparent exterior, self-hosted Be Vietnam Pro headings and Inter body.

## Page fidelity and large files

PDF.js 4.10.38 renders each page at its own CropBox and rotation, including A4
portrait, A4 landscape, mixed paper sizes and rotated pages. Normalized viewer
positions are converted back through the stored PDF viewport transformation for
export. PDF-LIB 1.17.1 embeds transparent PNG signature images into the original
page content. Typed text is embedded as searchable text using the self-hosted
complete static Inter Regular 4.1 font and @pdf-lib/fontkit 1.1.1, including Vietnamese and other supported
accented characters. Shared font metrics keep field baselines and sizes aligned
in the editor and PDF, including rotated pages and CropBoxes. Original text and
page dimensions remain in the PDF.

The font is the official `extras/ttf/Inter-Regular.ttf` from the
[Inter 4.1 release](https://github.com/rsms/inter/releases/tag/v4.1), covered by
`document-signing/fonts/INTER-LICENSE.txt`. Embed it without subsetting. The
previous variable-font subset produced malformed glyph outlines: text extraction
still returned the correct names while PDF viewers omitted visible letters.
Every download regenerates from the original PDF and saved confirmed fields, so
this repair applies to existing shared and signed documents without changing
their text, signatures, confirmation times or links. No data migration is needed;
previously downloaded attachments must be downloaded again.

Original PDFs upload as immutable 16 MiB R2 objects. The application imposes no
total file-size or page-count cap. An interrupted upload resumes from missing
parts; the same original filename and size are required. Private byte-range
responses stream across the chunk objects for the viewer. No whole PDF is
buffered in a Pages Function, and R2 multipart part-count limits do not apply.

Export runs in a browser Web Worker. This keeps the interface responsive, but
PDF-LIB must load the document into that worker's memory: the practical export
ceiling depends on the browser and device. An upload larger than available
browser memory may therefore be storable and viewable but not exportable on
that device. This implementation does not provision an external background PDF
processing service. Visible image signatures are supported, not certified
cryptographic PDF signatures or preservation of pre-existing certificate validity.

## Storage and security

The existing `ROOM_DB` D1 and private `ROOM_MEDIA` R2 bindings are reused. Migration
`0009_document_signing.sql` through `0012_document_text_approval.sql` add only new
tables. Text is stored separately and shares the party revision and submission
lock used by signatures. Older layout clients preserve text fields they omit. The signing API applies these
same idempotent statements on first use, matching the existing room CMS's schema
initialization pattern. There is no modification to existing content or accounts.
The two new preparer-text tables are append-only versions and per-party approval
records. Document revision checks serialize competing edits; approval writes
check the latest text revision and the guest link's current version atomically.

- Link tokens use 256 random bits and are hashed for lookup in D1. An active link
  can be copied again by an authorized manager; its token is retained only in
  private R2 storage. Codes are salted and PBKDF2 hashed, never stored in plaintext.
- Link tokens stay in URL fragments, outside HTTP request URLs and referrers.
- Guest sessions expire after 12 hours. Revoking or replacing a link increments
  its version and invalidates all its sessions. Replacing is an explicit action;
  copying an existing link does not invalidate it.
- Code guesses are limited per link and source IP, with a 15-minute lockout.
- Guests can sign only their own fields. Compare-and-swap revisions and atomic
  D1 batches prevent stale saves and simultaneous signers from losing signatures.
- The PDF and signature APIs enforce document-level authorization and private,
  no-store caching. Sensitive records are excluded from the published CMS API.
- Signing records retain confirmation times and an activity history. Cancellation
  closes recipient access while keeping the manager's document and signatures.

## Validation

```sh
npm ci --prefix tests/signing-runtime
# Install poppler-utils if pdftoppm is unavailable.
node --test tests/document-signing.test.mjs
node --test tests/client-room-locale.test.mjs tests/room-video-thumbnails.test.mjs
```

The integration suite uses local Miniflare D1 and R2. It covers a real PDF over
30 MB, interrupted upload state, cross-part byte ranges, owner drafts and locking,
six-digit codes, throttling, account-free sessions, cross-party permissions,
concurrent submissions, signature-preserving export, A4 geometry, rotation,
CropBox preservation, revocation, preparer-only agreements, recipient-created and
movable areas, shared history, draft deletion, completed-document protection,
archiving and restoration, multiple text fields, text ownership/privacy,
concurrent text submissions, Unicode text extraction and export positions. A
Poppler rendering check requires visible ink for every letter, digit and accented
character, including the previously broken name on an already signed, shared
Letter document. It also verifies that exporting leaves the record unchanged.
This catches malformed fonts that extraction-only assertions miss.
Preparer-text tests cover pre-signing edits, completed agreements, two-party
approvals, approval resets, stale and simultaneous requests, empty revisions,
archive/link continuity, shared before/after history, unchanged signature records,
approved-only downloads and visible text rendering. Browser QA also checks
typing, movement, saving on a completed agreement, both recipient approvals,
an actual PDF download and reapproval after another edit.
`tests/signing-runtime/worker.mjs`
and `preview-server.mjs` are local-only fixture runners, not production routes.

Browser checks can run with `tests/signing-runtime/browser-qa.mjs` when Playwright
and a compatible browser are available. The refreshed interface was also checked
in the managed browser, including direct upload, the drawing modal, click-to-place,
drag adjustment, draft saving, signature submission and per-party link generation.
Text-field browser checks also cover direct typing, multiple fields, movement,
resizing, reload persistence, locking and an actual downloaded PDF containing
the typed Unicode names, position and date. The local preview runner also accepts
`--host` and `--port`. No fixture login route is included in production Functions.
