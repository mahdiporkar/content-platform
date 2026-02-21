import { MediaAssetKind } from '../../entities/media-asset.entity';

export class MediaAssetResponseDto {
  constructor(
    public id: string,
    public applicationId: string,
    public kind: MediaAssetKind,
    public objectKey: string,
    public originalName: string | null,
    public contentType: string,
    public sizeBytes: number,
    public mediaUrl: string,
    public createdAt: string,
    public updatedAt: string,
  ) {}
}
