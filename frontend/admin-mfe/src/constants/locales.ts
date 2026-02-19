export type ContentLocale = "fa" | "en" | "ar" | "zh" | "ru";

export const DEFAULT_CONTENT_LOCALE: ContentLocale = "fa";

export const CONTENT_LOCALE_OPTIONS: { value: ContentLocale; label: string }[] = [
  { value: "fa", label: "فارسی (fa)" },
  { value: "en", label: "English (en)" },
  { value: "ar", label: "العربية (ar)" },
  { value: "zh", label: "中文 (zh)" },
  { value: "ru", label: "Русский (ru)" }
];
