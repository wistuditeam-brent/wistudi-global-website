export async function onRequestPost(context) {
  const { request, env } = context;

  const headers = {
    'content-type': 'application/json; charset=utf-8'
  };

  try {
    const data = await request.json();

    // Honeypot spam protection.
    // This field is hidden in the contact form.
    if (data.contact_extra_field) {
      return new Response(
        JSON.stringify({ ok: true }),
        { status: 200, headers }
      );
    }

    const name = String(data.name || '').trim();
    const email = String(data.email || '').trim();
    const message = String(data.message || '').trim();

    // The contact form sends "enquiry_type".
    // Keep "enquiry" as a fallback for compatibility.
    const enquiry = String(
      data.enquiry_type || data.enquiry || 'general'
    ).trim();

    // Required fields
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields'
        }),
        { status: 400, headers }
      );
    }

    // Resend must be configured in Cloudflare
    if (!env.RESEND_API_KEY) {
      return new Response(
        JSON.stringify({
          error: 'Email delivery is not configured yet.'
        }),
        { status: 503, headers }
      );
    }

    /*
     * Contact routing
     *
     * Organisation / team      -> support
     * School / university      -> support
     * Partnership / integration-> partnerships
     * Publishing / content     -> support
     * Plans / commercial       -> partnerships
     * Platform support         -> support
     * Media / events           -> support
     * General                  -> support
     */
    const routing = {
      organisation: 'support@wistudi.com',
      'school-university': 'support@wistudi.com',
      partnership: 'partnerships@wistudi.com',
      publishing: 'support@wistudi.com',
      sales: 'partnerships@wistudi.com',
      support: 'support@wistudi.com',
      media: 'support@wistudi.com',
      general: 'support@wistudi.com'
    };

    // Unknown enquiry types safely fall back to support
    const to =
      routing[enquiry] ||
      'support@wistudi.com';

    // Cloudflare environment variable takes priority.
    // Fallback uses the verified Resend sending subdomain.
    const from =
      env.CONTACT_FROM_EMAIL ||
      'Wistudi Website <website@send.wistudi.com>';

    // Strip angle brackets from user-controlled values
    const safe = (value) =>
      String(value || '').replace(/[<>]/g, '');

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

          // Makes Reply go directly to the person
          // who submitted the contact form.
          reply_to: email,

          subject: `Wistudi enquiry — ${enquiry}`,
          text
        })
      }
    );

    if (!response.ok) {
      const providerError = await response.text();

      console.error(
        'Resend rejected contact enquiry:',
        providerError
      );

      return new Response(
        JSON.stringify({
          error: 'Email provider rejected the request.'
        }),
        { status: 502, headers }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error(
      'Contact form processing error:',
      error
    );

    return new Response(
      JSON.stringify({
        error: 'Unable to process enquiry.'
      }),
      { status: 500, headers }
    );
  }
}
