# Stage 6 — Client Room CMS integration

The EN and VI Client Room landing pages now fetch only published records from the stage 5 published API. Presentation, video, gallery and document categories are rendered dynamically; empty and unavailable states are explicit. The previous distributor-oriented static landing-page UI is no longer rendered.

The old copied gallery, release pages, and binary assets still exist at their static paths and remain directly accessible. **This is not a confidentiality or access-control boundary.** Do not deploy until sensitive distributor materials have been removed or access-restricted.

PDF presentations open in the browser; this stage does not replicate the old page-by-page PDF viewer. Multiple presentations are supported as separate cards. The manager must upload content, save its record, and set status to published.

Requires D1 migration and ROOM_DB, ROOM_MEDIA, ROOM_MANAGER_TOKEN environment bindings. No staging or production deployment has been performed; runtime tests are still required.
