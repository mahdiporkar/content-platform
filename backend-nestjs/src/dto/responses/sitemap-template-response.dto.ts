import { SitemapLastmodPolicy, SitemapValidateStatus } from '../../entities/sitemap-template.entity';

export class SitemapTemplateResponseDto {
  constructor(
    public id: string,
    public tenantId: string,
    public contentType: string,
    public enabled: boolean,
    public template: string | null,
    public lastmodPolicy: SitemapLastmodPolicy,
    public defaultChangefreq: string | null,
    public defaultPriority: number | null,
    public validateStatus: SitemapValidateStatus,
    public validateErrors: string[] | null,
    public createdAt: string,
    public updatedAt: string,
  ) {}
}

