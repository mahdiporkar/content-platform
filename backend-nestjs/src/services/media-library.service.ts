import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationEntity } from '../entities/application.entity';
import { MediaAssetEntity, MediaAssetKind, MediaAssetState } from '../entities/media-asset.entity';
import { BaseUrlService } from './base-url.service';
import { PageResponseDto } from '../dto/page-response.dto';
import { MediaAssetResponseDto } from '../dto/responses/media-asset-response.dto';
import { ImageEntity } from '../entities/image.entity';
import { VideoEntity } from '../entities/video.entity';
import { MediaVariantService } from './media-variant.service';

type ListAssetsParams = {
  applicationId: string;
  kind?: MediaAssetKind;
  state?: MediaAssetState;
  search?: string;
  page: number;
  size: number;
};

type RegisterAssetParams = {
  applicationId: string;
  kind: MediaAssetKind;
  objectKey: string;
  contentType: string;
  sizeBytes: number;
  originalName?: string | null;
  ownerUserId?: string | null;
  bucket?: string;
};

@Injectable()
export class MediaLibraryService {
  constructor(
    @InjectRepository(MediaAssetEntity)
    private readonly mediaAssetRepo: Repository<MediaAssetEntity>,
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepo: Repository<ApplicationEntity>,
    @InjectRepository(ImageEntity)
    private readonly imageRepo: Repository<ImageEntity>,
    @InjectRepository(VideoEntity)
    private readonly videoRepo: Repository<VideoEntity>,
    private readonly baseUrl: BaseUrlService,
    private readonly mediaVariantService: MediaVariantService,
  ) {}

  async registerAsset(params: RegisterAssetParams): Promise<MediaAssetEntity> {
    const existing = await this.mediaAssetRepo.findOne({
      where: { applicationId: params.applicationId, objectKey: params.objectKey },
    });
    if (existing) {
      existing.kind = params.kind;
      existing.contentType = params.contentType;
      existing.sizeBytes = params.sizeBytes;
      existing.originalName = params.originalName?.trim() || existing.originalName || null;
      existing.ownerUserId = params.ownerUserId ?? existing.ownerUserId ?? null;
      existing.state = existing.state || MediaAssetState.ACTIVE;
      existing.bucket = params.bucket || existing.bucket || 'media';
      const saved = await this.mediaAssetRepo.save(existing);
      await this.mediaVariantService.ensureDefaultVariantForAsset(saved);
      return saved;
    }

    const entity = this.mediaAssetRepo.create({
      applicationId: params.applicationId,
      ownerUserId: params.ownerUserId ?? null,
      kind: params.kind,
      state: MediaAssetState.ACTIVE,
      bucket: params.bucket || 'media',
      objectKey: params.objectKey,
      originalName: params.originalName?.trim() || null,
      contentType: params.contentType,
      sizeBytes: params.sizeBytes,
      pinned: false,
      metadata: null,
    });
    const saved = await this.mediaAssetRepo.save(entity);
    await this.mediaVariantService.ensureDefaultVariantForAsset(saved);
    return saved;
  }

  async listAssets(params: ListAssetsParams): Promise<PageResponseDto<MediaAssetResponseDto>> {
    await this.syncFromContent(params.applicationId);

    const page = Math.max(0, params.page);
    const size = Math.max(1, params.size);

    const query = this.mediaAssetRepo
      .createQueryBuilder('asset')
      .where('asset.application_id = :applicationId', { applicationId: params.applicationId });

    const state = params.state ?? MediaAssetState.ACTIVE;
    query.andWhere('asset.state = :state', { state });

    if (params.kind) {
      query.andWhere('asset.kind = :kind', { kind: params.kind });
    }

    if (params.search?.trim()) {
      const term = `%${params.search.trim().toLowerCase()}%`;
      query.andWhere(
        '(LOWER(asset.object_key) LIKE :term OR LOWER(COALESCE(asset.original_name, \'\')) LIKE :term)',
        { term },
      );
    }

    const [items, total] = await query
      .orderBy('asset.created_at', 'DESC')
      .offset(page * size)
      .limit(size)
      .getManyAndCount();

    const application = await this.applicationRepo.findOne({ where: { id: params.applicationId } });
    if (!application) {
      throw new NotFoundException('Application not found.');
    }

    const mapped = items.map((asset) => this.mapAsset(asset, application));
    return new PageResponseDto(mapped, total, Math.ceil(total / size), page, size);
  }

  private async syncFromContent(applicationId: string): Promise<void> {
    const [images, videos] = await Promise.all([
      this.imageRepo.find({
        where: { applicationId },
        select: ['applicationId', 'objectKey', 'contentType', 'sizeBytes'],
      }),
      this.videoRepo.find({
        where: { applicationId },
        select: ['applicationId', 'objectKey', 'contentType', 'sizeBytes'],
      }),
    ]);

    const jobs = [
      ...images.map((image) =>
        this.registerAsset({
          applicationId: image.applicationId,
          kind: MediaAssetKind.IMAGE,
          objectKey: image.objectKey,
          contentType: image.contentType,
          sizeBytes: image.sizeBytes,
        }),
      ),
      ...videos.map((video) =>
        this.registerAsset({
          applicationId: video.applicationId,
          kind: MediaAssetKind.VIDEO,
          objectKey: video.objectKey,
          contentType: video.contentType,
          sizeBytes: video.sizeBytes,
        }),
      ),
    ];

    if (jobs.length > 0) {
      await Promise.all(jobs);
    }
  }

  async getAssetForApplication(assetId: string, applicationId: string): Promise<MediaAssetEntity> {
    const asset = await this.mediaAssetRepo.findOne({ where: { id: assetId, applicationId } });
    if (!asset) {
      throw new NotFoundException('Media asset not found.');
    }
    return asset;
  }

  async getAssetByObjectKeyForApplication(objectKey: string, applicationId: string): Promise<MediaAssetEntity> {
    const normalized = objectKey.trim();
    if (!normalized) {
      throw new NotFoundException('Media asset not found.');
    }
    await this.syncFromContent(applicationId);
    const asset = await this.mediaAssetRepo.findOne({
      where: { applicationId, objectKey: normalized },
    });
    if (!asset) {
      throw new NotFoundException('Media asset not found.');
    }
    return asset;
  }

  async getAssetResponseByObjectKeyForApplication(objectKey: string, applicationId: string): Promise<MediaAssetResponseDto> {
    const asset = await this.getAssetByObjectKeyForApplication(objectKey, applicationId);
    const application = await this.applicationRepo.findOne({ where: { id: applicationId } });
    if (!application) {
      throw new NotFoundException('Application not found.');
    }
    return this.mapAsset(asset, application);
  }

  private mapAsset(asset: MediaAssetEntity, application: ApplicationEntity): MediaAssetResponseDto {
    const mediaUrl = this.baseUrl.buildMediaUrl(application, asset.objectKey);
    return new MediaAssetResponseDto(
      asset.id,
      asset.applicationId,
      asset.kind,
      asset.state,
      asset.objectKey,
      asset.originalName ?? null,
      asset.contentType,
      asset.sizeBytes,
      mediaUrl,
      asset.trashedAt ? asset.trashedAt.toISOString() : null,
      asset.purgedAt ? asset.purgedAt.toISOString() : null,
      asset.pinned ?? false,
      asset.createdAt.toISOString(),
      asset.updatedAt.toISOString(),
      undefined,
      undefined,
    );
  }
}
