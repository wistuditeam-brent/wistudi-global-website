const SPREADSHEET_ID = '1qd7wd7nxkW4DymbsAv8Cc73L1chbS7xnqgKAARQDfGk';
const SHEET_NAME = 'Registrations';

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const expectedSecret = PropertiesService.getScriptProperties().getProperty('EVENTS_WEBHOOK_SECRET');

    if (!expectedSecret || body.secret !== expectedSecret) {
      return json_({ ok: false, error: 'Unauthorized' });
    }
    if (body.action !== 'register') {
      return json_({ ok: false, error: 'Unsupported action' });
    }

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) return json_({ ok: false, error: 'Registrations sheet not found' });

    const email = String(body.email || '').trim().toLowerCase();
    const eventId = String(body.event_id || '').trim();
    if (!email || !eventId) return json_({ ok: false, error: 'Missing email or event ID' });

    // Duplicate rule: one registration per email address per event.
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const rows = sheet.getRange(2, 1, lastRow - 1, 23).getValues();
      for (let i = 0; i < rows.length; i++) {
        const existingEventId = String(rows[i][1] || '').trim();
        const existingEmail = String(rows[i][5] || '').trim().toLowerCase();
        if (existingEventId === eventId && existingEmail === email) {
          return json_({ ok: true, duplicate: true, registration_id: rows[i][0] || '' });
        }
      }
    }

    sheet.appendRow([
      body.registration_id || '',
      eventId,
      body.event_name || '',
      body.first_name || '',
      body.last_name || '',
      email,
      body.country || '',
      body.organisation_type || '',
      body.organisation_name || '',
      body.role || '',
      body.timezone || '',
      body.privacy_consent ? 'Yes' : 'No',
      body.marketing_consent ? 'Yes' : 'No',
      body.registered_at || new Date().toISOString(),
      body.utm_source || '',
      body.utm_medium || '',
      body.utm_campaign || '',
      body.utm_content || '',
      body.outreach_token || '',
      'No',
      'No',
      '',
      ''
    ]);

    return json_({ ok: true, duplicate: false, registration_id: body.registration_id || '' });
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: 'Registration storage error' });
  }
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
