import {
  CollectionAudience,
  CollectionFallback,
  CollectionMetadata,
  CollectionPlacement,
  CollectionPresentation,
  CollectionStatus,
} from '../../common/collection-types';

export class CollectionResponseDto {
  constructor(
    public id: string,
    public applicationId: string,
    public slug: string,
    public title: string,
    public description: string | null,
    public allowedTypes: string[] | null,
    public maxItems: number | null,
    public isPublic: boolean,
    public status: CollectionStatus,
    public priority: number,
    public presentation: CollectionPresentation | null,
    public placement: CollectionPlacement | null,
    public fallback: CollectionFallback | null,
    public audience: CollectionAudience | null,
    public metadata: CollectionMetadata | null,
    public createdBy: string | null,
    public updatedBy: string | null,
    public itemsCount: number,
    public createdAt: string,
    public updatedAt: string,
  ) {}
}
