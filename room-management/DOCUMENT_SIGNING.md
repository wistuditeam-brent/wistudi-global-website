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
4. Save editable drafts, or submit your own signature with consent to lock it.
5. Create a separate private link and six-digit code for each recipient. The
   administrator copies and sends them; recipients do not need accounts. Existing
   links remain copyable. Legacy links created without codes continue to work.
6. All authorized parties see the shared signing history, including per-party
   link creation and confirmed signature dates/times. Recipient snapshots hide
   private emails, token material and other parties' editable drafts.
7. Download the PDF with every confirmed signature. Export fetches the latest
   server record; draft signatures are excluded.

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
page content. Text and original page dimensions remain in the PDF.

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
`0009_document_signing.sql` and `0010_document_signing_archive.sql` add only new tables. The signing API applies these
same idempotent statements on first use, matching the existing room CMS's schema
initialization pattern. There is no modification to existing content or accounts.

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
node --test tests/document-signing.test.mjs
node --test tests/client-room-locale.test.mjs tests/room-video-thumbnails.test.mjs
```

The integration suite uses local Miniflare D1 and R2. It covers a real PDF over
30 MB, interrupted upload state, cross-part byte ranges, owner drafts and locking,
six-digit codes, throttling, account-free sessions, cross-party permissions,
concurrent submissions, signature-preserving export, A4 geometry, rotation,
CropBox preservation, revocation, preparer-only agreements, recipient-created and
movable areas, shared history, draft deletion, completed-document protection,
archiving and restoration. `tests/signing-runtime/worker.mjs`
and `preview-server.mjs` are local-only fixture runners, not production routes.

Browser checks can run with `tests/signing-runtime/browser-qa.mjs` when Playwright
and a compatible browser are available. The refreshed interface was also checked
in the managed browser, including direct upload, the drawing modal, click-to-place,
drag adjustment, draft saving, signature submission and per-party link generation. The local preview runner also accepts
`--host` and `--port`. No fixture login route is included in production Functions.
