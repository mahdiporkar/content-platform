import { MediaAssetKind } from '../../entities/media-asset.entity';
import { MediaAssetState } from '../../entities/media-asset.entity';

export class MediaAssetResponseDto {
  constructor(
    public id: string,
    public applicationId: string,
    public kind: MediaAssetKind,
    public state: MediaAssetState,
    public objectKey: string,
    public originalName: string | null,
    public contentType: string,
    public sizeBytes: number,
    public mediaUrl: string,
    public trashedAt: string | null,
    public purgedAt: string | null,
    public pinned: boolean,
    public createdAt: string,
    public updatedAt: string,
    public refCount?: number,
    public canPurge?: boolean,
  ) {}
}
