export const SUPPORTED_CONTENT_LOCALES = ['fa', 'en', 'ar', 'zh', 'ru'] as const;
export type ContentLocale = (typeof SUPPORTED_CONTENT_LOCALES)[number];
export const DEFAULT_CONTENT_LOCALE: ContentLocale = 'fa';

export const normalizeContentLocale = (value?: string | null): ContentLocale => {
  const normalized = (value || '').trim().toLowerCase();
  if (!normalized) {
    return DEFAULT_CONTENT_LOCALE;
  }
  return SUPPORTED_CONTENT_LOCALES.includes(normalized as ContentLocale)
    ? (normalized as ContentLocale)
    : DEFAULT_CONTENT_LOCALE;
};

export const isSupportedContentLocale = (value?: string | null): boolean => {
  const normalized = (value || '').trim().toLowerCase();
  return SUPPORTED_CONTENT_LOCALES.includes(normalized as ContentLocale);
};
