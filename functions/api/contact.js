export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = { 'content-type': 'application/json; charset=utf-8' };
  try {
    const data = await request.json();
    if (data.company_fax) return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    const name = String(data.name || '').trim();
    const email = String(data.email || '').trim();
    const enquiry = String(data.enquiry || 'general').trim();
    const message = String(data.message || '').trim();
    if (!name || !email || !message) return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers });
    if (!env.RESEND_API_KEY) return new Response(JSON.stringify({ error: 'Email delivery is not configured yet.' }), { status: 503, headers });
    const to = env.CONTACT_TO_EMAIL || 'partnerships@wistudi.com';
    const from = env.CONTACT_FROM_EMAIL || 'Wistudi Website <website@wistudi.com>';
    const safe = (v) => String(v || '').replace(/[<>]/g, '');
    const text = [
      'New Wistudi website enquiry', '',
      `Type: ${safe(enquiry)}`, `Name: ${safe(name)}`, `Email: ${safe(email)}`,
      `Phone: ${safe(data.phone)}`, `Organisation: ${safe(data.organisation)}`,
      `Organisation email: ${safe(data.organisation_email)}`, `Website: ${safe(data.website)}`,
      '', 'Message:', safe(message)
    ].join('\n');
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], reply_to: email, subject: `Wistudi enquiry — ${enquiry}`, text })
    });
    if (!r.ok) return new Response(JSON.stringify({ error: 'Email provider rejected the request.' }), { status: 502, headers });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Unable to process enquiry.' }), { status: 500, headers });
  }
}
