const SCRIPT_TAG_PATTERN = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const EVENT_HANDLER_PATTERN = /\son[a-z]+\s*=\s*(['"]).*?\1/gi;
const JAVASCRIPT_URL_PATTERN = /\s(href|src)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi;

export function sanitizeHtml(html: string | null | undefined): string | null {
  if (!html) {
    return null;
  }
  return html
    .replace(SCRIPT_TAG_PATTERN, '')
    .replace(EVENT_HANDLER_PATTERN, '')
    .replace(JAVASCRIPT_URL_PATTERN, ' $1="#"');
}
