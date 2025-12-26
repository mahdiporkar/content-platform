import { ContentStatus } from '../../common/content-status.enum';

export class PostResponseDto {
  constructor(
    public id: string,
    public applicationId: string,
    public title: string,
    public slug: string,
    public content: string,
    public status: ContentStatus,
    public publishedAt: string | null,
    public createdAt: string,
    public updatedAt: string,
  ) {}
}