export const locales = ['bn', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'bn';
export const LOCALE_COOKIE = 'NEXT_LOCALE';

export function isLocale(value: unknown): value is Locale {
  return locales.includes(value as Locale);
}

/** Intl locale tag used for number/date formatting */
export function intlLocale(locale: string) {
  return locale === 'en' ? 'en-US' : 'bn-BD';
}
