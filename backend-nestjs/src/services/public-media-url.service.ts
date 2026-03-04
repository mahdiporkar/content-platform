import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApplicationEntity } from '../entities/application.entity';

@Injectable()
export class PublicMediaUrlService {
  private readonly contentPlatformBaseUrl: string;
  private readonly minioPublicBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.contentPlatformBaseUrl = this.normalizeBaseUrl(
      this.config.get<string>('CONTENT_PLATFORM_BASE_URL') ||
      this.config.get<string>('PUBLIC_BASE_URL') ||
      'http://localhost:3000',
    );
    this.minioPublicBaseUrl = this.normalizeBaseUrl(
      this.config.get<string>('MINIO_PUBLIC_BASE_URL') || 'http://localhost:9000',
    );
  }

  getPublicBaseUrl(application: ApplicationEntity): string {
    return this.normalizeBaseUrl(application.publicBaseUrlOverride || this.contentPlatformBaseUrl);
  }

  toPublicMediaUrl(application: ApplicationEntity, inputUrlOrPath: string | null): string | null {
    const value = inputUrlOrPath?.trim();
    if (!value) {
      return null;
    }

    const publicBaseUrl = this.getPublicBaseUrl(application);
    const mediaPath = this.extractMediaPath(value);
    if (mediaPath) {
      return `${publicBaseUrl}${mediaPath}`;
    }

    if (this.isAbsoluteUrl(value)) {
      return value.replace(/\/$/, '');
    }

    if (value.startsWith('/')) {
      return `${publicBaseUrl}${value}`;
    }

    return `${publicBaseUrl}/${value}`;
  }

  rewriteHtmlMediaUrls(application: ApplicationEntity, html: string | null): string | null {
    if (!html) {
      return html;
    }

    return html.replace(/\b(src|href)\s*=\s*(["'])([^"']+)\2/gi, (_match, attribute: string, quote: string, url: string) => {
      const mediaPath = this.extractMediaPath(url);
      if (!mediaPath) {
        return `${attribute}=${quote}${url}${quote}`;
      }
      return `${attribute}=${quote}${this.getPublicBaseUrl(application)}${mediaPath}${quote}`;
    });
  }

  private extractMediaPath(value: string): string | null {
    const normalized = value.trim();
    if (!normalized) {
      return null;
    }

    if (normalized.startsWith('/media/')) {
      return normalized;
    }
    if (normalized.startsWith('media/')) {
      return `/${normalized}`;
    }

    const mediaIndex = normalized.indexOf('/media/');
    if (mediaIndex >= 0) {
      return normalized.slice(mediaIndex);
    }

    if (this.startsWithBaseUrl(normalized, this.minioPublicBaseUrl)) {
      return this.extractFromBase(normalized, this.minioPublicBaseUrl);
    }
    if (this.startsWithBaseUrl(normalized, this.contentPlatformBaseUrl)) {
      return this.extractFromBase(normalized, this.contentPlatformBaseUrl);
    }

    if (this.isAbsoluteUrl(normalized)) {
      try {
        const parsed = new URL(normalized);
        if (parsed.pathname.startsWith('/media/')) {
          return `${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
      } catch {
        return null;
      }
    }

    return null;
  }

  private extractFromBase(value: string, baseUrl: string): string | null {
    const withoutBase = value.slice(baseUrl.length);
    if (!withoutBase.startsWith('/media/')) {
      return null;
    }
    return withoutBase;
  }

  private normalizeBaseUrl(url: string): string {
    return url.trim().replace(/\/+$/, '');
  }

  private isAbsoluteUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
  }

  private startsWithBaseUrl(value: string, baseUrl: string): boolean {
    return value.toLowerCase().startsWith(baseUrl.toLowerCase());
  }
}
