import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApplicationEntity } from '../entities/application.entity';
import { PublicMediaUrlService } from './public-media-url.service';

@Injectable()
export class BaseUrlService {
  private readonly publicBaseUrl: string;
  private readonly mediaBasePath: string;
  private readonly deliveryBasePath: string;

  constructor(
    private readonly config: ConfigService,
    private readonly publicMediaUrlService: PublicMediaUrlService,
  ) {
    this.publicBaseUrl = this.normalizeBaseUrl(
      this.config.get<string>('CONTENT_PLATFORM_BASE_URL') ||
      this.config.get<string>('PUBLIC_BASE_URL') ||
      'http://localhost:3000',
    );
    this.mediaBasePath = this.normalizePath(this.config.get<string>('MEDIA_BASE_PATH') || '/media');
    this.deliveryBasePath = this.normalizePath(
      this.config.get<string>('CONTENT_BASE_PATH') ||
      this.config.get<string>('DELIVERY_BASE_PATH') ||
      '/api/v1/content',
    );
  }

  buildMediaUrl(application: ApplicationEntity, objectKey: string): string {
    const objectPath = this.stripApplicationPrefix(application.id, objectKey);
    return this.publicMediaUrlService.toPublicMediaUrl(
      application,
      `${this.mediaBasePath}/${application.id}/${objectPath}`,
    ) as string;
  }

  buildDeliveryUrl(application: ApplicationEntity, path: string): string {
    const baseUrl = this.normalizeBaseUrl(
      application.publicBaseUrlOverride || this.publicBaseUrl,
    );
    const trimmedPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${this.deliveryBasePath}${trimmedPath}`;
  }

  private stripApplicationPrefix(applicationId: string, objectKey: string): string {
    const prefix = `${applicationId}/`;
    if (objectKey.startsWith(prefix)) {
      return objectKey.slice(prefix.length);
    }
    return objectKey;
  }

  private normalizeBaseUrl(url: string): string {
    return url.replace(/\/$/, '');
  }

  private normalizePath(path: string): string {
    if (!path.startsWith('/')) {
      return `/${path}`;
    }
    return path.replace(/\/$/, '');
  }

}
