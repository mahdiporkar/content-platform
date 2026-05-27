import { ContentType } from '../../common/content-type.enum';
import { ContentStatus } from '../../common/content-status.enum';
import {
  CollectionItemDisplay,
  CollectionItemLink,
  CollectionItemMetadata,
  CollectionItemType,
} from '../../common/collection-types';

export type DeliveryCollectionItemContext = {
  id: string;
  collectionId: string;
  type: CollectionItemType;
  position: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  display: CollectionItemDisplay | null;
  link: CollectionItemLink | null;
  metadata: CollectionItemMetadata | null;
};

export class DeliveryContentResponseDto {
  constructor(
    public contentId: string,
    public appId: string,
    public type: ContentType | 'custom',
    public title: string,
    public description: string | null,
    public locale: string | null,
    public tags: string[] | null,
    public status: ContentStatus,
    public slug: string | null,
    public publishedAt: string | null,
    public scheduledAt: string | null,
    public viewCount: number,
    public readingTimeMinutes: number | null,
    public mediaUrl: string | null,
    public posterUrl: string | null,
    public durationSeconds: number | null,
    public width: number | null,
    public height: number | null,
    public mimeType: string | null,
    public sizeBytes: number | null,
    public altText: string | null,
    public seo: Record<string, unknown> | null,
    public content: string | null,
    public collectionItem?: DeliveryCollectionItemContext | null,
  ) {}
}
