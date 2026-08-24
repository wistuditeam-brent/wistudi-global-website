import { LOCALES, COMMON } from './common.js';
import { PLATFORM } from './platform.js';
import { BLOCKS } from './blocks.js';
import { ORGANISATIONS } from './organisations.js';
import { CONTACT } from './contact.js';

const PAGE_MAP = {
  platform: PLATFORM,
  blocks: BLOCKS,
  organisations: ORGANISATIONS,
  contact: CONTACT
};

export { LOCALES };

export function getTranslations(locale, page) {
  if (!locale || locale === 'en') return {};
  return {
    ...(COMMON[locale] || {}),
    ...((PAGE_MAP[page] && PAGE_MAP[page][locale]) || {})
  };
}
