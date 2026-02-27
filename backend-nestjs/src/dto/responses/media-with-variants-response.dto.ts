import { MediaAssetResponseDto } from './media-asset-response.dto';
import { MediaVariantResponseDto } from './media-variant-response.dto';

export class MediaWithVariantsResponseDto {
  constructor(
    public media: MediaAssetResponseDto,
    public variants: MediaVariantResponseDto[],
  ) {}
}
