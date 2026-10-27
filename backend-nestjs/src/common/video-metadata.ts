import { BadRequestException } from '@nestjs/common';

export type VideoMediaFields = {
  posterKey?: string | null;
  durationSeconds?: number | string | null;
  width?: number | string | null;
  height?: number | string | null;
  altText?: string | null;
};

export function videoSlug(value: string): string {
  const slug = value.normalize('NFKC').toLowerCase().trim()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, '-').replace(/^-+|-+$/g, '')
    .slice(0, 180).replace(/-+$/g, '');
  if (!slug) throw new BadRequestException('Video slug must contain letters or numbers.');
  return slug;
}

export function videoSeo(seo?: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!seo) return null;
  if (typeof seo !== 'object' || Array.isArray(seo)) throw new BadRequestException('Invalid SEO fields.');
  const result = { ...seo };
  for (const key of ['metaTitle', 'metaDescription', 'canonicalUrl', 'ogTitle', 'ogDescription', 'ogImage', 'ogImageUrl', 'twitterTitle', 'twitterDescription', 'twitterImage', 'schemaJsonLd']) {
    if (result[key] !== undefined && result[key] !== null && typeof result[key] !== 'string') {
      throw new BadRequestException(`${key} must be text.`);
    }
  }
  if (result.metaKeywords !== undefined && (!Array.isArray(result.metaKeywords) || !result.metaKeywords.every(value => typeof value === 'string'))) {
    throw new BadRequestException('metaKeywords must be a list of text values.');
  }
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string') result[key] = value.trim();
  }
  for (const key of ['canonicalUrl', 'ogImage', 'ogImageUrl', 'twitterImage']) {
    if (!result[key]) continue;
    try {
      const url = new URL(String(result[key]));
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    } catch { throw new BadRequestException(`${key} must be an absolute HTTP or HTTPS URL.`); }
  }
  for (const key of ['noIndex', 'noFollow']) {
    if (result[key] !== undefined && typeof result[key] !== 'boolean') {
      throw new BadRequestException(`${key} must be a boolean.`);
    }
  }
  if (result.schemaJsonLd) {
    try {
      const parsed = JSON.parse(String(result.schemaJsonLd));
      if (!parsed || typeof parsed !== 'object') throw new Error();
    } catch { throw new BadRequestException('Structured data must be valid JSON-LD.'); }
  }
  return result;
}

export function videoMedia(fields: VideoMediaFields) {
  const positiveInteger = (key: 'durationSeconds' | 'width' | 'height') => {
    const value = fields[key];
    if (value === undefined || value === null || value === '') return null;
    const number = Number(value);
    if (!Number.isSafeInteger(number) || number < 1) throw new BadRequestException(`${key} must be a positive integer.`);
    return number;
  };
  return {
    posterKey: fields.posterKey?.trim() || null,
    altText: fields.altText?.trim() || null,
    durationSeconds: positiveInteger('durationSeconds'),
    width: positiveInteger('width'),
    height: positiveInteger('height'),
  };
}
