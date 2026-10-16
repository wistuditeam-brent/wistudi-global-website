# Wistudi Room Management — Stage 3

This is the **metadata and authorization foundation**, not yet a complete manager interface.

- D1 migration: `room-management/migrations/0001_room_content.sql`
- Manager-only API: `/api/room-management/content?room=client`
- Supported room IDs: client, distributor, investor.
- Supported content types: presentation, video, gallery, document.
- Status: draft, published, archived. English and Vietnamese entries.
- GET, POST, PATCH and DELETE require a Bearer token matching `ROOM_MANAGER_TOKEN`.
- Configure Cloudflare D1 binding `ROOM_DB` and a long random secret `ROOM_MANAGER_TOKEN` through environment secrets.
- Apply migration to the correct D1 environment **before** using the API.
- This API is deliberately fail-closed until both bindings exist. Do not put the secret in browser JavaScript.
- Existing static rooms remain unchanged. No client-side manager login, uploads, public content wiring, per-manager roles, or publishing workflow yet.
- Before a browser-based manager is enabled, replace the server-to-server token model with verified identity and scoped room roles.
- Deleting an entry removes only its metadata, not a referenced media file.

Validation checklist: missing secret => 401; wrong token => 401; no D1 => 503; invalid category => 400; client-scoped queries cannot edit distributor entries; draft/published filtering and uploads are future work.
