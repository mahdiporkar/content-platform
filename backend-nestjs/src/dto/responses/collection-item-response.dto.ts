import { ContentStatus } from '../../common/content-status.enum';
import { ContentType } from '../../common/content-type.enum';
import {
  CollectionItemDisplay,
  CollectionItemLink,
  CollectionItemMetadata,
  CollectionItemType,
} from '../../common/collection-types';

export class CollectionItemResponseDto {
  constructor(
    public id: string,
    public collectionId: string,
    public contentType: ContentType | null,
    public contentId: string | null,
    public type: CollectionItemType,
    public position: number,
    public isActive: boolean,
    public startsAt: string | null,
    public endsAt: string | null,
    public display: CollectionItemDisplay | null,
    public link: CollectionItemLink | null,
    public metadata: CollectionItemMetadata | null,
    public title: string | null,
    public status: ContentStatus | null,
    public locale: string | null,
    public tags: string[] | null,
    public slug: string | null,
    public thumbnailUrl: string | null,
    public publishedAt: string | null,
    public createdBy: string | null,
    public updatedBy: string | null,
    public createdAt: string,
    public updatedAt: string,
  ) {}
}
