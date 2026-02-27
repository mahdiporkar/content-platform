import { SitemapLastmodMode } from '../../entities/sitemap-custom-url.entity';

export class SitemapCustomUrlResponseDto {
  constructor(
    public id: string,
    public tenantId: string,
    public pathOrUrl: string,
    public enabled: boolean,
    public lastmodMode: SitemapLastmodMode,
    public lastmodValue: string | null,
    public changefreq: string | null,
    public priority: number | null,
    public notes: string | null,
    public createdAt: string,
    public updatedAt: string,
  ) {}
}

