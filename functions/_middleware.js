export async function onRequest(context) {
  const response = await context.next();
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  return new HTMLRewriter()
    .on('head', {
      element(element) {
        element.append('<script src="/assets/js/i18n.js" defer></script>', { html: true });
      }
    })
    .transform(response);
}
