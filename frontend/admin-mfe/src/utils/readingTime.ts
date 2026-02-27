const AVERAGE_WORDS_PER_MINUTE = 200;

export const estimateReadingTimeMinutes = (content?: string | null): number => {
  if (!content?.trim()) {
    return 0;
  }

  const plainText = content
    .replace(/<[^>]*>/g, " ")
    .replace(/[`*_#>\-\[\]()!]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!plainText) {
    return 0;
  }

  const words = plainText.match(/[A-Za-z0-9\u0600-\u06FF]+/g)?.length ?? 0;
  if (words === 0) {
    return 0;
  }

  return Math.max(1, Math.ceil(words / AVERAGE_WORDS_PER_MINUTE));
};

export const resolveReadingTimeMinutes = (
  content?: string | null,
  readingTimeMinutes?: number | null
): number => {
  if (typeof readingTimeMinutes === "number" && Number.isFinite(readingTimeMinutes)) {
    return Math.max(0, Math.floor(readingTimeMinutes));
  }
  return estimateReadingTimeMinutes(content);
};

export const formatReadingTime = (minutes: number): string => {
  if (minutes <= 0) {
    return "-";
  }
  return `${minutes} min`;
};
