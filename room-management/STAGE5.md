# Stage 5: Media storage and published metadata

Configure private Cloudflare R2 bucket binding ROOM_MEDIA, D1 binding ROOM_DB and secret ROOM_MANAGER_TOKEN. Apply the existing D1 migration.

Authenticated manager upload: POST /api/room-management/media?room=client&category=gallery with raw file body and Content-Type. Supported PDFs, MP4/WebM, JPEG/PNG/WebP, plain text. Video maximum 100 MB, subject to Cloudflare request size limits. Uploaded files use random R2 keys.

Published metadata: GET /api/room-management/published?room=client&locale=en. Media GET checks whether the file is referenced by a published room record, or requires manager authentication.

Existing room pages are not yet wired to the new metadata endpoint. The current manager login remains a shared credential without per-user roles. Do not deploy for multiple managers. Existing copied distributor files are not private. No automatic deletion of replaced or orphaned media. Requires staging migration, bindings and browser tests.
