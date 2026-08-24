import { localeRedirect } from './_shared/locale-redirect.js';

export function onRequest(context) {
  return localeRedirect(context.request, '/');
}
