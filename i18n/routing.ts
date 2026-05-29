import { defineRouting } from 'next-intl/routing';

// Locale-prefixed routing (/pl/...). Polish-only at launch; add new locales
// here (and a matching messages/<locale>.json) to enable them — nothing else changes.
export const routing = defineRouting({
  locales: ['pl'],
  defaultLocale: 'pl',
  localePrefix: 'always',
});
