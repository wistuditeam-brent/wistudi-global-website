export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = {
    'content-type': 'application/json; charset=utf-8'
  };

  try {
    const data = await request.json();

    // Honeypot spam protection
    if (data.company_fax) {
      return new Response(
        JSON.stringify({ ok: true }),
        { status: 200, headers }
      );
    }

    const name = String(data.name || '').trim();
    const email = String(data.email || '').trim();

    // Contact form sends "enquiry_type"
    const enquiry = String(
      data.enquiry_type || data.enquiry || 'general'
    ).trim();

    const message = String(data.message || '').trim();

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers }
      );
    }

    if (!env.RESEND_API_KEY) {
      return new Response(
        JSON.stringify({
          error: 'Email delivery is not configured yet.'
        }),
        { status: 503, headers }
      );
    }

    /*
     * Wistudi enquiry routing
     */
    const routing = {
      'organisation': 'support@wistudi.com',
      'school-university': 'support@wistudi.com',
      'partnership': 'partnerships@wistudi.com',
      'publishing': 'support@wistudi.com',
      'sales': 'partnerships@wistudi.com',
      'support': 'support@wistudi.com',
      'media': 'support@wistudi.com',
      'general': 'support@wistudi.com'
    };

    // Unknown enquiry types safely fall back to Support
    const to = routing[enquiry] || 'support@wistudi.com';

    const from =
      env.CONTACT_FROM_EMAIL ||
      'Wistudi Website <website@wistudi.com>';

    const safe = (v) =>
      String(v || '').replace(/[<>]/g, '');

    const text = [
      'New Wistudi website enquiry',
      '',
      `Type: ${safe(enquiry)}`,
      `Name: ${safe(name)}`,
      `Email: ${safe(email)}`,
      `Phone: ${safe(data.phone)}`,
      `Organisation: ${safe(data.organisation)}`,
      `Organisation email: ${safe(data.organisation_email)}`,
      `Website: ${safe(data.website)}`,
      '',
      'Message:',
      safe(message)
    ].join('\n');

    const response = await fetch(
      'https://api.resend.com/emails',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from,
          to: [to],
          reply_to: email,
          subject: `Wistudi enquiry — ${enquiry}`,
          text
        })
      }
    );

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: 'Email provider rejected the request.'
        }),
        { status: 502, headers }
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Unable to process enquiry.'
      }),
      { status: 500, headers }
    );
  }
}
