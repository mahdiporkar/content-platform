import { ContentStatus } from '../../common/content-status.enum';

export class VideoResponseDto {
  constructor(
    public id: string,
    public applicationId: string,
    public title: string,
    public slug: string | null,
    public description: string | null,
    public locale: string | null,
    public tags: string[] | null,
    public displayScopes: string[] | null,
    public seo: Record<string, unknown> | null,
    public gallery: Record<string, unknown>[] | null,
    public status: ContentStatus,
    public publishedAt: string | null,
    public scheduledAt: string | null,
    public viewCount: number,
    public objectKey: string,
    public posterKey: string | null,
    public durationSeconds: number | null,
    public width: number | null,
    public height: number | null,
    public contentType: string,
    public sizeBytes: number,
    public altText: string | null,
    public createdAt: string,
    public updatedAt: string,
    public deletedAt: string | null,
    public mediaUrl: string | null,
    public presignedUrl: string | null,
  ) {}
}
