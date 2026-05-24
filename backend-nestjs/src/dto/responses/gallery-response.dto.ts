import { ContentStatus } from '../../common/content-status.enum';

export class GalleryResponseDto {
  constructor(
    public id: string,
    public applicationId: string,
    public title: string,
    public description: string | null,
    public slug: string,
    public locale: string | null,
    public tags: string[] | null,
    public seo: Record<string, unknown> | null,
    public gallery: Record<string, unknown>[] | null,
    public status: ContentStatus,
    public publishedAt: string | null,
    public scheduledAt: string | null,
    public viewCount: number,
    public createdAt: string,
    public updatedAt: string,
  ) {}
}
