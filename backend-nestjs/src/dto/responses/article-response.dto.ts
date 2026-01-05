import { ContentStatus } from '../../common/content-status.enum';

export class ArticleResponseDto {
  constructor(
    public id: string,
    public applicationId: string,
    public title: string,
    public slug: string,
    public content: string,
    public bannerUrl: string | null,
    public tags: string[] | null,
    public seo: Record<string, unknown> | null,
    public gallery: Record<string, unknown>[] | null,
    public status: ContentStatus,
    public publishedAt: string | null,
    public createdAt: string,
    public updatedAt: string,
  ) {}
}
