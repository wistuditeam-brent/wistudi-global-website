// Keep production and unapproved hosts disabled by default.
// The exact feature-branch alias is a public demo preview, not authentication.
const PUBLIC_PREVIEW_HOST = 'feature-publisher-studio-mvp.wistudi-global-website.pages.dev';

export async function onRequest(context) {
  const requestUrl = context.request?.url;
  const host = requestUrl ? new URL(requestUrl).hostname.toLowerCase() : '';
  const exactPreviewHost = host === PUBLIC_PREVIEW_HOST;
  const explicitlyEnabled = context.env.PUBLISHER_STUDIO_PREVIEW_ENABLED === 'true';

  if (!exactPreviewHost && !explicitlyEnabled) {
    return new Response('Not found', {
      status: 404,
      headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow, noarchive' },
    });
  }
  const original = await context.next();
  const response = new Response(original.body, original);
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  return response;
}
