const AVERAGE_WORDS_PER_MINUTE = 200;

export function calculateReadingTimeMinutes(content: string): number {
  if (!content?.trim()) {
    return 0;
  }

  const plainText = content
    .replace(/<[^>]*>/g, ' ')
    .replace(/[`*_#>\-\[\]()!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!plainText) {
    return 0;
  }

  const words = plainText.match(/[A-Za-z0-9\u0600-\u06FF]+/g)?.length ?? 0;
  if (words === 0) {
    return 0;
  }

  return Math.max(1, Math.ceil(words / AVERAGE_WORDS_PER_MINUTE));
}
