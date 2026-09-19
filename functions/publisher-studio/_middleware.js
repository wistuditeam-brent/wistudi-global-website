// Disabled by default, including after an accidental merge. This is not authentication.
export async function onRequest(context) {
  if (context.env.PUBLISHER_STUDIO_PREVIEW_ENABLED !== 'true') {
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
