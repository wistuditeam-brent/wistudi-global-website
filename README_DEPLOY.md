# Wistudi Complete Website

This package contains the four linked Wistudi pages:

- `/` — The Platform (home)
- `/blocks-activities/` — Blocks & Activities
- `/organisations/` — Organisations
- `/contact/` — Contact

## Included final-site changes

- Unified Wistudi header and footer across all four pages.
- Wistudi wordmark links to the Platform home page.
- English / Tiếng Việt language switcher; Vietnamese is marked **Coming soon** and does not create a dead link.
- Wi circle favicon.
- Shared Be Vietnam Pro / Inter typography shell.
- Mobile navigation and responsive shell.
- Blocks & Activities demo video runs at 1.3× playback speed.
- Blocks & Activities carousel previews use a square/block-like shape.
- Carousel enforcement ensures only the centred active block video plays, including mobile.
- Embedded base64 images/videos extracted into `/assets/media/` so HTML files stay well below Cloudflare Pages' per-file limit.
- Contact form endpoint included as a Cloudflare Pages Function.

## Contact form setup on Cloudflare

The form posts to `/api/contact`. The included `functions/api/contact.js` sends through Resend when these Cloudflare environment variables are configured:

- `RESEND_API_KEY` — required
- `CONTACT_TO_EMAIL` — optional; defaults to `partnerships@wistudi.com`
- `CONTACT_FROM_EMAIL` — optional; defaults to `Wistudi Website <website@wistudi.com>`

The sender domain used by `CONTACT_FROM_EMAIL` must be verified with your email provider. If email delivery is not yet configured, the Contact page falls back with a visible message telling the visitor to email Wistudi directly.

## Cloudflare deployment

Deploy the **contents of this folder** as one Cloudflare Pages project. If using Git, keep the `functions/` directory at the project root.

For local testing, run a local HTTP server from this folder rather than double-clicking the HTML files, because production links use root-relative URLs.
