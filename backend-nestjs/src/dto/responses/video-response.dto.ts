import { ContentStatus } from '../../common/content-status.enum';

export class VideoResponseDto {
  constructor(
    public id: string,
    public applicationId: string,
    public title: string,
    public description: string | null,
    public status: ContentStatus,
    public publishedAt: string | null,
    public objectKey: string,
    public contentType: string,
    public sizeBytes: number,
    public createdAt: string,
    public updatedAt: string,
    public presignedUrl: string | null,
  ) {}
}