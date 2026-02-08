import { ContentStatus } from '../../common/content-status.enum';
import { ContentType } from '../../common/content-type.enum';

export class CollectionItemResponseDto {
  constructor(
    public id: string,
    public collectionId: string,
    public contentType: ContentType,
    public contentId: string,
    public position: number,
    public title: string | null,
    public status: ContentStatus | null,
    public locale: string | null,
    public tags: string[] | null,
    public slug: string | null,
    public thumbnailUrl: string | null,
    public publishedAt: string | null,
    public createdAt: string,
    public updatedAt: string,
  ) {}
}
