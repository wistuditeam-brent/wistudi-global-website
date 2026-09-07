# Wistudi event registration setup

This registration flow is built for Cloudflare Pages preview/production and Google Sheets storage.

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

The webhook still requires the shared secret, so anonymous callers cannot submit a valid registration payload without it.

## Cloudflare preview environment variables

Set these on the **preview environment first**, not production:

- `EVENTS_SHEETS_WEBHOOK_URL` = Apps Script `/exec` URL
- `EVENTS_SHEETS_WEBHOOK_SECRET` = the same script property secret
- `EVENTS_NOTIFY_EMAIL` = optional internal notification address
- `EVENTS_FROM_EMAIL` = optional Resend sender; defaults to `Wistudi Events <website@send.wistudi.com>`

`RESEND_API_KEY` is reused if already configured. The event registration itself remains successful if the internal notification email fails after the Sheet row is stored.

## API endpoint

`POST /api/event-register`

The endpoint validates required fields, checks the honeypot, writes through the protected Apps Script webhook, treats duplicate event/email registrations as success, and optionally sends an internal Resend notification.

## Production rule

Do not add these event changes to `main` or production Cloudflare environment variables until the event flow has been reviewed and explicitly approved for publishing.
