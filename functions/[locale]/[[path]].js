import { renderLocalizedPage } from '../_shared/localized-page.js';

export function onRequest(context) {
  return renderLocalizedPage(context);
}
