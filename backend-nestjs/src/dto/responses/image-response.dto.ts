import { ContentStatus } from '../../common/content-status.enum';

export class ImageResponseDto {
  constructor(
    public id: string,
    public applicationId: string,
    public title: string,
    public description: string | null,
    public locale: string | null,
    public tags: string[] | null,
    public seo: Record<string, unknown> | null,
    public gallery: Record<string, unknown>[] | null,
    public status: ContentStatus,
    public publishedAt: string | null,
    public scheduledAt: string | null,
    public viewCount: number,
    public objectKey: string,
    public contentType: string,
    public sizeBytes: number,
    public width: number | null,
    public height: number | null,
    public altText: string | null,
    public createdAt: string,
    public updatedAt: string,
    public mediaUrl: string | null,
  ) {}
}
