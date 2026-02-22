import { MediaReferenceType } from '../../entities/media-reference.entity';

export class MediaReferenceResponseDto {
  constructor(
    public id: string,
    public applicationId: string,
    public mediaAssetId: string,
    public refType: MediaReferenceType,
    public refId: string,
    public refField: string,
    public createdAt: string,
  ) {}
}
