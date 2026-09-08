# Wistudi event registration setup

This registration flow is built for Cloudflare Pages production/preview, Google Sheets storage and Resend confirmation emails.

## Google Sheet

Spreadsheet: `Wistudi Event Registrations`

Spreadsheet ID: `1qd7wd7nxkW4DymbsAv8Cc73L1chbS7xnqgKAARQDfGk`

Tab: `Registrations`

The sheet uses one row per attendee and rejects duplicate registrations for the same event ID + email address.

## Google Apps Script webhook

1. Open the `Wistudi Event Registrations` Google Sheet.
2. Open **Extensions → Apps Script**.
3. Replace the default script with `docs/events/google-sheets-registration-webhook.gs` from this repository.
4. In Apps Script, open **Project Settings → Script properties** and create:
   - `EVENTS_WEBHOOK_SECRET` = a long random secret.
5. Deploy as a **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy the `/exec` deployment URL.

The webhook still requires the shared secret, so anonymous callers cannot submit a valid storage payload directly without it.

## Cloudflare environment variables

The event API uses the same verified Resend configuration as the rest of the Wistudi website.

Required:

- `EVENTS_SHEETS_WEBHOOK_URL` = Apps Script `/exec` URL
- `EVENTS_SHEETS_WEBHOOK_SECRET` = the same Apps Script property secret
- `RESEND_API_KEY` = Resend API key available to Cloudflare Pages Functions

Optional:

- `EVENTS_FROM_EMAIL` = confirmation sender. Defaults to `Wistudi Events <events@send.wistudi.com>`
- `EVENTS_REPLY_TO_EMAIL` = confirmation reply-to. Defaults to `support@wistudi.com`

The registration is stored before the confirmation email is attempted. If storage succeeds but Resend temporarily fails, the registration remains valid and the API returns `confirmation_email_sent: false` so the page can tell the registrant the email could not be sent.

## API endpoint

`POST /api/event-register`

The endpoint:

- validates the honeypot and all required fields;
- accepts only a server-known event ID and derives the event name server-side;
- writes the registration through the protected Google Apps Script webhook;
- treats duplicate event/email registrations as a successful existing registration;
- sends the confirmation directly to the registrant through Resend;
- includes the event's exact Zoom joining URL in both the HTML and plain-text confirmation email.

For `communicative-esl-flow-2026-09-15`, the canonical event configuration is maintained in `functions/api/event-register.js`. Do not accept an event name supplied by the browser as authoritative.

## Release rule

Before merging an event branch to `main`:

1. Confirm the Cloudflare preview deployment succeeds.
2. Run the Resources/event static QA.
3. Run `scripts/event_registration_email_qa.mjs` to verify the recipient, canonical event identity, Resend payload and exact Zoom URL in HTML/plain text.
4. Run the browser QA to verify the centered live-session module and live Zoom CTA.
5. Merge only the latest reviewed event branch head.
