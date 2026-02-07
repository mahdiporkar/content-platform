import { ContentType } from '../../common/content-type.enum';

export class CollectionItemResponseDto {
  constructor(
    public id: string,
    public collectionId: string,
    public contentType: ContentType,
    public contentId: string,
    public position: number,
    public createdAt: string,
    public updatedAt: string,
  ) {}
}
