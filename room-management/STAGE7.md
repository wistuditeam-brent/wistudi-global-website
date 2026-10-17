# Stage 7 — Per-manager authentication foundation

Migration: room-management/migrations/0002_room_managers.sql. Individual manager credentials use PBKDF2-SHA256 (100000 iterations, random 16+ byte salt stored as hex). Provision accounts and permissions through an **administrative server-side process**, not the public UI. No public sign-up or role assignment endpoint exists.

Session cookie is opaque, HttpOnly, Secure, SameSite=Strict, scoped to /api/room-management. Session rows expire after 1 hour; sign-out revokes the session. Manager metadata, upload and private media reads check the manager's room permission.

**Deployment blocker:** copied legacy client-room static assets and gallery/feature-release pages still exist, and may contain distributor-specific material. Do not publish this branch until a full asset audit and cleanup. Existing distributor/investor rooms are not modified.

No user-invite/reset UI, login rate limiting, audit log, or storage cleanup. Admin/editor roles are stored but currently share content edit capability; admin-only operations must be implemented before exposing account administration. Migration, account provisioning and staging tests are required.
