import { DeliveryContentResponseDto } from './delivery-content-response.dto';
import {
  CollectionAudience,
  CollectionFallback,
  CollectionMetadata,
  CollectionPlacement,
  CollectionPresentation,
} from '../../common/collection-types';

export class DeliveryCollectionResponseDto {
  constructor(
    public id: string,
    public appId: string,
    public slug: string,
    public title: string,
    public description: string | null,
    public isPublic: boolean,
    public allowedTypes: string[] | null,
    public maxItems: number | null,
    public priority: number,
    public presentation: CollectionPresentation | null,
    public placement: CollectionPlacement | null,
    public fallback: CollectionFallback | null,
    public audience: CollectionAudience | null,
    public metadata: CollectionMetadata | null,
    public items: DeliveryContentResponseDto[],
  ) {}
}
