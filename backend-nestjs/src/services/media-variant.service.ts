import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationEntity } from '../entities/application.entity';
import { MediaAssetEntity, MediaAssetKind } from '../entities/media-asset.entity';
import {
  MEDIA_VARIANT_DEVICES,
  MEDIA_VARIANT_PURPOSES,
  MEDIA_VARIANT_SIZE_KEYS,
  MediaVariantDevice,
  MediaVariantEntity,
  MediaVariantPurpose,
  MediaVariantSizeKey,
} from '../entities/media-variant.entity';
import { BaseUrlService } from './base-url.service';
import { MediaVariantResponseDto } from '../dto/responses/media-variant-response.dto';
import { MediaResolveResponseDto } from '../dto/responses/media-resolve-response.dto';
import { MediaAssetResponseDto } from '../dto/responses/media-asset-response.dto';
import { MediaWithVariantsResponseDto } from '../dto/responses/media-with-variants-response.dto';

export type MediaVariantUpsertPayload = {
  purpose?: string;
  sizeKey?: string | null;
  minWidth?: number | null;
  maxWidth?: number | null;
  device?: string | null;
  format?: string | null;
  objectKey?: string;
  bucket?: string | null;
  fileUrl?: string | null;
  sizeBytes?: number;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  bitrate?: number | null;
  isDefault?: boolean;
  sortOrder?: number | null;
  contentType?: string | null;
};

type ResolveCriteria = {
  purpose?: string;
  size?: string;
  viewportWidth?: number;
  device?: string;
  format?: string;
};

@Injectable()
export class MediaVariantService {
  constructor(
    @InjectRepository(MediaVariantEntity)
    private readonly variantRepo: Repository<MediaVariantEntity>,
    @InjectRepository(MediaAssetEntity)
    private readonly mediaAssetRepo: Repository<MediaAssetEntity>,
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepo: Repository<ApplicationEntity>,
    private readonly baseUrl: BaseUrlService,
  ) {}

  async listVariants(applicationId: string, mediaId: string): Promise<MediaVariantResponseDto[]> {
    const { application } = await this.getMediaAndApplication(applicationId, mediaId);
    const variants = await this.variantRepo.find({
      where: { mediaAssetId: mediaId },
      order: { isDefault: 'DESC', sortOrder: 'DESC', updatedAt: 'DESC', createdAt: 'DESC' },
    });
    return variants.map((entry) => this.mapVariant(entry, application));
  }

  async getMediaWithVariants(applicationId: string, mediaId: string): Promise<MediaWithVariantsResponseDto> {
    const { media, application } = await this.getMediaAndApplication(applicationId, mediaId);
    await this.ensureDefaultVariantForAsset(media);
    const variants = await this.variantRepo.find({
      where: { mediaAssetId: mediaId },
      order: { isDefault: 'DESC', sortOrder: 'DESC', updatedAt: 'DESC', createdAt: 'DESC' },
    });
    return new MediaWithVariantsResponseDto(
      this.mapMedia(media, application),
      variants.map((entry) => this.mapVariant(entry, application)),
    );
  }

  async createVariants(
    applicationId: string,
    mediaId: string,
    payloads: MediaVariantUpsertPayload[],
  ): Promise<MediaVariantResponseDto[]> {
    if (payloads.length === 0) {
      throw new BadRequestException('At least one variant is required.');
    }
    const created: MediaVariantEntity[] = [];
    for (const payload of payloads) {
      const variant = await this.addVariant(applicationId, mediaId, payload);
      const entity = await this.variantRepo.findOne({ where: { id: variant.id } });
      if (entity) {
        created.push(entity);
      }
    }
    const { application } = await this.getMediaAndApplication(applicationId, mediaId);
    return created.map((entry) => this.mapVariant(entry, application));
  }

  async addVariant(
    applicationId: string,
    mediaId: string,
    payload: MediaVariantUpsertPayload,
  ): Promise<MediaVariantResponseDto> {
    const { media, application } = await this.getMediaAndApplication(applicationId, mediaId);
    this.assertMediaTypeCompatibility(media.kind, payload.contentType || null);

    const normalized = this.normalizePayload(payload);
    await this.assertNoDuplicate(
      mediaId,
      normalized.purpose,
      normalized.sizeKey ?? null,
      normalized.device ?? null,
    );

    const existing = await this.variantRepo.find({ where: { mediaAssetId: mediaId } });
    const isFirstVariant = existing.length === 0;
    const makeDefault = Boolean(normalized.isDefault) || isFirstVariant || normalized.purpose === 'default';

    if (makeDefault) {
      await this.clearDefault(mediaId);
    }

    const entity = this.variantRepo.create({
      mediaAssetId: mediaId,
      applicationId,
      purpose: normalized.purpose,
      sizeKey: normalized.sizeKey,
      minWidth: normalized.minWidth,
      maxWidth: normalized.maxWidth,
      device: normalized.device,
      format: normalized.format,
      bucket: normalized.bucket || media.bucket || 'media',
      objectKey: normalized.objectKey,
      fileUrl: normalized.fileUrl,
      isDefault: makeDefault,
      sortOrder: normalized.sortOrder ?? 0,
      width: normalized.width,
      height: normalized.height,
      duration: normalized.duration,
      bitrate: normalized.bitrate,
      sizeBytes: normalized.sizeBytes,
    });
    const saved = await this.variantRepo.save(entity);
    return this.mapVariant(saved, application);
  }

  async replaceVariant(
    applicationId: string,
    mediaId: string,
    variantId: string,
    payload: MediaVariantUpsertPayload,
  ): Promise<MediaVariantResponseDto> {
    const { media, application } = await this.getMediaAndApplication(applicationId, mediaId);
    this.assertMediaTypeCompatibility(media.kind, payload.contentType || null);

    const variant = await this.variantRepo.findOne({ where: { id: variantId, mediaAssetId: mediaId } });
    if (!variant) {
      throw new NotFoundException('Variant not found.');
    }

    const normalized = this.normalizePayload(payload, true);
    const nextPurpose = normalized.purpose ?? variant.purpose;
    const nextSizeKey = normalized.sizeKey !== undefined ? normalized.sizeKey : variant.sizeKey;
    const nextDevice = normalized.device !== undefined ? normalized.device : variant.device;
    await this.assertNoDuplicate(mediaId, nextPurpose, nextSizeKey, nextDevice, variantId);

    const nextDefault = normalized.isDefault === true || nextPurpose === 'default';
    if (nextDefault) {
      await this.clearDefault(mediaId);
    }

    variant.purpose = nextPurpose;
    variant.sizeKey = nextSizeKey;
    variant.minWidth = normalized.minWidth !== undefined ? normalized.minWidth : variant.minWidth;
    variant.maxWidth = normalized.maxWidth !== undefined ? normalized.maxWidth : variant.maxWidth;
    variant.device = nextDevice;
    variant.format = normalized.format !== undefined ? normalized.format : variant.format;
    variant.bucket = normalized.bucket || variant.bucket;
    variant.objectKey = normalized.objectKey || variant.objectKey;
    variant.fileUrl = normalized.fileUrl !== undefined ? normalized.fileUrl : variant.fileUrl;
    variant.isDefault = nextDefault ? true : variant.isDefault;
    variant.sortOrder = normalized.sortOrder ?? variant.sortOrder;
    variant.width = normalized.width !== undefined ? normalized.width : variant.width;
    variant.height = normalized.height !== undefined ? normalized.height : variant.height;
    variant.duration = normalized.duration !== undefined ? normalized.duration : variant.duration;
    variant.bitrate = normalized.bitrate !== undefined ? normalized.bitrate : variant.bitrate;
    variant.sizeBytes = normalized.sizeBytes ?? variant.sizeBytes;

    const saved = await this.variantRepo.save(variant);
    await this.ensureSingleDefault(mediaId);
    return this.mapVariant(saved, application);
  }

  async deleteVariant(applicationId: string, mediaId: string, variantId: string): Promise<void> {
    await this.getMediaAndApplication(applicationId, mediaId);
    const variant = await this.variantRepo.findOne({ where: { id: variantId, mediaAssetId: mediaId } });
    if (!variant) {
      throw new NotFoundException('Variant not found.');
    }
    if (variant.isDefault) {
      const defaultCount = await this.variantRepo.count({ where: { mediaAssetId: mediaId, isDefault: true } });
      if (defaultCount <= 1) {
        throw new ConflictException('Cannot delete the only default variant.');
      }
    }
    await this.variantRepo.delete({ id: variantId, mediaAssetId: mediaId });
    await this.ensureSingleDefault(mediaId);
  }

  async resolveVariant(
    applicationId: string,
    mediaId: string,
    criteria: ResolveCriteria,
  ): Promise<MediaResolveResponseDto> {
    const { media, application } = await this.getMediaAndApplication(applicationId, mediaId);
    await this.ensureDefaultVariantForAsset(media);
    const variants = await this.variantRepo.find({ where: { mediaAssetId: mediaId } });
    if (variants.length === 0) {
      throw new NotFoundException('No media variants found.');
    }
    const defaultVariant = this.pickDefaultVariant(variants);

    let candidates = [...variants];
    const desiredPurpose = this.normalizePurpose(criteria.purpose, true);
    const desiredSize = this.resolveDesiredSize(criteria.size, criteria.viewportWidth);
    const desiredDevice = this.normalizeDevice(criteria.device, true);
    const desiredFormat = this.normalizeFormat(criteria.format);
    let fallbackUsed = false;

    if (desiredPurpose) {
      const matched = candidates.filter((entry) => entry.purpose === desiredPurpose);
      if (matched.length === 0) {
        fallbackUsed = true;
        return this.toResolveResponse(mediaId, defaultVariant, application, true);
      }
      candidates = matched;
    }
    if (desiredSize) {
      const matched = candidates.filter((entry) => entry.sizeKey === desiredSize);
      if (matched.length === 0) {
        fallbackUsed = true;
        return this.toResolveResponse(mediaId, defaultVariant, application, true);
      }
      candidates = matched;
    }
    if (desiredDevice) {
      const matched = candidates.filter((entry) => entry.device === desiredDevice);
      if (matched.length === 0) {
        fallbackUsed = true;
        return this.toResolveResponse(mediaId, defaultVariant, application, true);
      }
      candidates = matched;
    }
    if (desiredFormat) {
      const matched = candidates.filter((entry) => this.resolveVariantFormat(entry) === desiredFormat);
      if (matched.length === 0) {
        fallbackUsed = true;
        return this.toResolveResponse(mediaId, defaultVariant, application, true);
      }
      candidates = matched;
    }

    if (candidates.length === 0) {
      fallbackUsed = true;
      return this.toResolveResponse(mediaId, defaultVariant, application, true);
    }

    const sorted = [...candidates].sort((a, b) => {
      const purposeDelta =
        Number(b.purpose === desiredPurpose) - Number(a.purpose === desiredPurpose);
      if (purposeDelta !== 0) return purposeDelta;
      const sizeDelta = Number(b.sizeKey === desiredSize) - Number(a.sizeKey === desiredSize);
      if (sizeDelta !== 0) return sizeDelta;
      const deviceDelta = Number(b.device === desiredDevice) - Number(a.device === desiredDevice);
      if (deviceDelta !== 0) return deviceDelta;
      const sortDelta = (b.sortOrder || 0) - (a.sortOrder || 0);
      if (sortDelta !== 0) return sortDelta;
      const updatedA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const updatedB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return updatedB - updatedA;
    });

    const picked = sorted[0];
    if (!picked) {
      fallbackUsed = true;
      return this.toResolveResponse(mediaId, defaultVariant, application, true);
    }

    return this.toResolveResponse(mediaId, picked, application, fallbackUsed);
  }

  async ensureDefaultVariantForAsset(media: MediaAssetEntity): Promise<MediaVariantEntity> {
    const existingDefault = await this.variantRepo.findOne({
      where: { mediaAssetId: media.id, isDefault: true },
    });
    if (existingDefault) {
      return existingDefault;
    }

    const anyVariant = await this.variantRepo.findOne({ where: { mediaAssetId: media.id } });
    if (anyVariant) {
      anyVariant.isDefault = true;
      anyVariant.purpose = 'default';
      return await this.variantRepo.save(anyVariant);
    }

    const created = this.variantRepo.create({
      mediaAssetId: media.id,
      applicationId: media.applicationId,
      purpose: 'default',
      sizeKey: null,
      minWidth: null,
      maxWidth: null,
      device: null,
      format: this.normalizeFormat(media.contentType?.split('/')?.[1] || null),
      bucket: media.bucket || 'media',
      objectKey: media.objectKey,
      fileUrl: null,
      isDefault: true,
      sortOrder: 0,
      width: null,
      height: null,
      duration: null,
      bitrate: null,
      sizeBytes: media.sizeBytes,
    });
    return await this.variantRepo.save(created);
  }

  private async ensureSingleDefault(mediaId: string): Promise<void> {
    const variants = await this.variantRepo.find({ where: { mediaAssetId: mediaId } });
    if (variants.length === 0) {
      return;
    }
    const defaults = variants.filter((entry) => entry.isDefault);
    if (defaults.length === 1) {
      return;
    }
    const target = defaults[0] || variants.find((entry) => entry.purpose === 'default') || variants[0];
    if (!target) {
      return;
    }
    for (const variant of variants) {
      variant.isDefault = variant.id === target.id;
      if (variant.id === target.id && variant.purpose !== 'default') {
        variant.purpose = 'default';
      }
    }
    await this.variantRepo.save(variants);
  }

  private async clearDefault(mediaId: string): Promise<void> {
    await this.variantRepo
      .createQueryBuilder()
      .update(MediaVariantEntity)
      .set({ isDefault: false })
      .where('media_asset_id = :mediaId', { mediaId })
      .execute();
  }

  private pickDefaultVariant(variants: MediaVariantEntity[]): MediaVariantEntity {
    return (
      variants.find((entry) => entry.isDefault) ||
      variants.find((entry) => entry.purpose === 'default') ||
      variants[0]
    );
  }

  private resolveDesiredSize(size?: string, viewportWidth?: number): MediaVariantSizeKey | null {
    const normalizedSize = this.normalizeSizeKey(size, true);
    if (normalizedSize) {
      return normalizedSize;
    }
    if (!Number.isFinite(viewportWidth)) {
      return null;
    }
    const width = Number(viewportWidth);
    if (width <= 480) return 'xs';
    if (width <= 768) return 'sm';
    if (width <= 1024) return 'md';
    if (width <= 1440) return 'lg';
    return 'xl';
  }

  private resolveVariantFormat(variant: MediaVariantEntity): string | null {
    if (variant.format) {
      return this.normalizeFormat(variant.format);
    }
    const parts = variant.objectKey.split('.');
    if (parts.length < 2) {
      return null;
    }
    return this.normalizeFormat(parts[parts.length - 1]);
  }

  private toResolveResponse(
    mediaId: string,
    variant: MediaVariantEntity,
    application: ApplicationEntity,
    fallbackUsed: boolean,
  ): MediaResolveResponseDto {
    return new MediaResolveResponseDto(
      mediaId,
      variant.id,
      variant.purpose,
      variant.sizeKey ?? null,
      variant.device ?? null,
      this.baseUrl.buildMediaUrl(application, variant.objectKey),
      variant.width ?? null,
      variant.height ?? null,
      variant.duration ?? null,
      fallbackUsed,
    );
  }

  private async assertNoDuplicate(
    mediaId: string,
    purpose: MediaVariantPurpose,
    sizeKey: MediaVariantSizeKey | null,
    device: MediaVariantDevice | null,
    ignoreVariantId?: string,
  ): Promise<void> {
    const variants = await this.variantRepo.find({ where: { mediaAssetId: mediaId } });
    const duplicate = variants.find((entry) => {
      if (ignoreVariantId && entry.id === ignoreVariantId) {
        return false;
      }
      return (
        entry.purpose === purpose &&
        (entry.sizeKey || null) === (sizeKey || null) &&
        (entry.device || null) === (device || null)
      );
    });
    if (duplicate) {
      throw new ConflictException('Duplicate variant for purpose/size/device is not allowed.');
    }
  }

  private assertMediaTypeCompatibility(kind: MediaAssetKind, contentType: string | null): void {
    if (!contentType) {
      return;
    }
    const normalized = contentType.toLowerCase();
    if (kind === MediaAssetKind.IMAGE && !normalized.startsWith('image/')) {
      throw new BadRequestException('Variant file type must be image/* for image media.');
    }
    if (kind === MediaAssetKind.VIDEO && !normalized.startsWith('video/')) {
      throw new BadRequestException('Variant file type must be video/* for video media.');
    }
  }

  private normalizePayload(
    payload: MediaVariantUpsertPayload,
    allowMissing = false,
  ): Omit<MediaVariantUpsertPayload, 'purpose' | 'sizeKey' | 'device' | 'format'> & {
    purpose: MediaVariantPurpose;
    sizeKey: MediaVariantSizeKey | null | undefined;
    device: MediaVariantDevice | null | undefined;
    format: string | null | undefined;
  } {
    const purpose = this.normalizePurpose(payload.purpose, allowMissing);
    if (!purpose && !allowMissing) {
      throw new BadRequestException('purpose is required.');
    }
    const sizeKey = this.normalizeSizeKey(payload.sizeKey, allowMissing);
    const device = this.normalizeDevice(payload.device, allowMissing);
    const format = this.normalizeFormat(payload.format);

    if (!allowMissing && (!payload.objectKey || payload.sizeBytes === undefined || payload.sizeBytes === null)) {
      throw new BadRequestException('objectKey and sizeBytes are required.');
    }
    if (
      payload.minWidth !== undefined &&
      payload.maxWidth !== undefined &&
      payload.minWidth !== null &&
      payload.maxWidth !== null &&
      payload.minWidth > payload.maxWidth
    ) {
      throw new BadRequestException('minWidth must be <= maxWidth.');
    }
    return {
      ...payload,
      purpose: (purpose || 'default') as MediaVariantPurpose,
      sizeKey,
      device,
      format,
    };
  }

  private normalizePurpose(value?: string, allowMissing = false): MediaVariantPurpose | null {
    if (value === undefined || value === null || value === '') {
      return allowMissing ? null : 'default';
    }
    const normalized = value.trim().toLowerCase() as MediaVariantPurpose;
    if (!MEDIA_VARIANT_PURPOSES.includes(normalized)) {
      throw new BadRequestException(`Invalid purpose: ${value}`);
    }
    return normalized;
  }

  private normalizeSizeKey(value?: string | null, allowMissing = false): MediaVariantSizeKey | null | undefined {
    if (value === undefined) {
      return allowMissing ? undefined : null;
    }
    if (value === null || value === '') {
      return null;
    }
    const normalized = value.trim().toLowerCase() as MediaVariantSizeKey;
    if (!MEDIA_VARIANT_SIZE_KEYS.includes(normalized)) {
      throw new BadRequestException(`Invalid sizeKey: ${value}`);
    }
    return normalized;
  }

  private normalizeDevice(value?: string | null, allowMissing = false): MediaVariantDevice | null | undefined {
    if (value === undefined) {
      return allowMissing ? undefined : null;
    }
    if (value === null || value === '') {
      return null;
    }
    const normalized = value.trim().toLowerCase() as MediaVariantDevice;
    if (!MEDIA_VARIANT_DEVICES.includes(normalized)) {
      throw new BadRequestException(`Invalid device: ${value}`);
    }
    return normalized;
  }

  private normalizeFormat(value?: string | null): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    const normalized = value.trim().toLowerCase();
    return normalized.length > 0 ? normalized : null;
  }

  private mapVariant(variant: MediaVariantEntity, application: ApplicationEntity): MediaVariantResponseDto {
    const url = this.baseUrl.buildMediaUrl(application, variant.objectKey);
    return new MediaVariantResponseDto(
      variant.id,
      variant.mediaAssetId,
      variant.applicationId || application.id,
      variant.purpose,
      variant.sizeKey ?? null,
      variant.minWidth ?? null,
      variant.maxWidth ?? null,
      variant.device ?? null,
      variant.format ?? null,
      variant.objectKey,
      variant.fileUrl ?? null,
      url,
      variant.isDefault ?? false,
      variant.sortOrder ?? 0,
      variant.width ?? null,
      variant.height ?? null,
      variant.duration ?? null,
      variant.bitrate ?? null,
      variant.sizeBytes ?? 0,
      variant.createdAt.toISOString(),
      variant.updatedAt ? variant.updatedAt.toISOString() : null,
    );
  }

  private mapMedia(media: MediaAssetEntity, application: ApplicationEntity): MediaAssetResponseDto {
    const mediaUrl = this.baseUrl.buildMediaUrl(application, media.objectKey);
    return new MediaAssetResponseDto(
      media.id,
      media.applicationId,
      media.kind,
      media.state,
      media.objectKey,
      media.originalName ?? null,
      media.contentType,
      media.sizeBytes,
      mediaUrl,
      media.trashedAt ? media.trashedAt.toISOString() : null,
      media.purgedAt ? media.purgedAt.toISOString() : null,
      media.pinned ?? false,
      media.createdAt.toISOString(),
      media.updatedAt.toISOString(),
      undefined,
      undefined,
    );
  }

  private async getMediaAndApplication(applicationId: string, mediaId: string): Promise<{
    media: MediaAssetEntity;
    application: ApplicationEntity;
  }> {
    const media = await this.mediaAssetRepo.findOne({ where: { id: mediaId, applicationId } });
    if (!media) {
      throw new NotFoundException('Media not found.');
    }
    const application = await this.applicationRepo.findOne({ where: { id: applicationId } });
    if (!application) {
      throw new NotFoundException('Application not found.');
    }
    return { media, application };
  }
}
