import { SitemapRegenStrategy } from '../../entities/sitemap-settings.entity';

export class SitemapSettingsResponseDto {
  constructor(
    public tenantId: string,
    public enabled: boolean,
    public baseUrl: string | null,
    public sitemapPath: string,
    public cacheTtlSeconds: number,
    public regenStrategy: SitemapRegenStrategy,
    public createdAt: string,
    public updatedAt: string,
  ) {}
}

