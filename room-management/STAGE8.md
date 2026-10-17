# Stage 8 — Security hardening and staging preparation

## Implemented
- Removed every legacy copied Client Room blob except the new CMS entry pages and cms.js. This removes distributor/commercial/investor copied files from the branch's deployable Client Room paths.
- Added login throttling: five failed attempts in a 15-minute window causes a 15-minute block. The throttle key is SHA-256(email + Cloudflare connecting IP); raw IP is not stored.
- Added management audit records for login, bootstrap, account creation, permission changes, logout and password changes.
- Added one-time bootstrap endpoint for the first manager, protected by ROOM_BOOTSTRAP_TOKEN and permanently refusing bootstrap after any manager exists.
- Added admin-only manager creation/listing and room-permission grant/update endpoints.
- Added authenticated self-service password change; changing a password revokes all sessions.
- Added Client Room security headers and no-store caching.

## Required staging configuration
1. Apply migrations 0001, 0002 and 0003 to ROOM_DB.
2. Bind private R2 bucket as ROOM_MEDIA.
3. Set ROOM_BOOTSTRAP_TOKEN to a long random secret only for initial provisioning, then remove/rotate it after bootstrap.
4. The old ROOM_MANAGER_TOKEN is no longer used by active Stage 7/8 auth and should not be relied upon.
5. Provision the first manager by POSTing JSON to /api/room-management/bootstrap with Bearer ROOM_BOOTSTRAP_TOKEN. Password minimum: 12 characters.
6. Browser-test login, content CRUD, upload, publish/unpublish, EN/VI Client Room display, manager creation and access denial across rooms.

## Not yet completed
- No email invitation or forgotten-password flow.
- No admin UI for manager-account administration yet; APIs are present.
- No automatic orphan R2 cleanup.
- No staging deployment or runtime verification has been performed in this commit.
