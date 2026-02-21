import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationEntity } from '../entities/application.entity';
import { MediaAssetEntity, MediaAssetKind } from '../entities/media-asset.entity';
import { BaseUrlService } from './base-url.service';
import { PageResponseDto } from '../dto/page-response.dto';
import { MediaAssetResponseDto } from '../dto/responses/media-asset-response.dto';
import { ImageEntity } from '../entities/image.entity';
import { VideoEntity } from '../entities/video.entity';

type ListAssetsParams = {
  applicationId: string;
  kind?: MediaAssetKind;
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
      return await this.mediaAssetRepo.save(existing);
    }

    const entity = this.mediaAssetRepo.create({
      applicationId: params.applicationId,
      kind: params.kind,
      objectKey: params.objectKey,
      originalName: params.originalName?.trim() || null,
      contentType: params.contentType,
      sizeBytes: params.sizeBytes,
    });
    return await this.mediaAssetRepo.save(entity);
  }

  async listAssets(params: ListAssetsParams): Promise<PageResponseDto<MediaAssetResponseDto>> {
    await this.syncFromContent(params.applicationId);

    const page = Math.max(0, params.page);
    const size = Math.max(1, params.size);

    const query = this.mediaAssetRepo
      .createQueryBuilder('asset')
      .where('asset.application_id = :applicationId', { applicationId: params.applicationId });

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

  private mapAsset(asset: MediaAssetEntity, application: ApplicationEntity): MediaAssetResponseDto {
    const mediaUrl = this.baseUrl.buildMediaUrl(application, asset.objectKey);
    return new MediaAssetResponseDto(
      asset.id,
      asset.applicationId,
      asset.kind,
      asset.objectKey,
      asset.originalName ?? null,
      asset.contentType,
      asset.sizeBytes,
      mediaUrl,
      asset.createdAt.toISOString(),
      asset.updatedAt.toISOString(),
    );
  }
}
