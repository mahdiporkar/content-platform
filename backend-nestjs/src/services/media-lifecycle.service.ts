import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ApplicationEntity } from '../entities/application.entity';
import { MediaAssetEntity, MediaAssetState } from '../entities/media-asset.entity';
import { MediaVariantEntity } from '../entities/media-variant.entity';
import { MediaReferenceEntity } from '../entities/media-reference.entity';
import { BaseUrlService } from './base-url.service';
import { PageResponseDto } from '../dto/page-response.dto';
import { MediaAssetResponseDto } from '../dto/responses/media-asset-response.dto';
import { MediaReferenceResponseDto } from '../dto/responses/media-reference-response.dto';
import { StorageProvider } from './storage-provider';
import { AuditLogService } from './audit-log.service';
import { MediaReferenceService } from './media-reference.service';

@Injectable()
export class MediaLifecycleService {
  constructor(
    @InjectRepository(MediaAssetEntity)
    private readonly mediaAssetRepo: Repository<MediaAssetEntity>,
    @InjectRepository(MediaVariantEntity)
    private readonly mediaVariantRepo: Repository<MediaVariantEntity>,
    @InjectRepository(MediaReferenceEntity)
    private readonly mediaRefRepo: Repository<MediaReferenceEntity>,
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepo: Repository<ApplicationEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly baseUrl: BaseUrlService,
    @Inject('STORAGE_PROVIDER')
    private readonly storage: StorageProvider,
    private readonly auditLog: AuditLogService,
    private readonly mediaReferenceService: MediaReferenceService,
  ) {}

  async listForTenant(
    applicationId: string,
    state: MediaAssetState,
    page: number,
    size: number,
  ): Promise<PageResponseDto<MediaAssetResponseDto>> {
    const pageNumber = Math.max(0, page);
    const pageSize = Math.max(1, size);
    const [items, total] = await this.mediaAssetRepo.findAndCount({
      where: { applicationId, state },
      order: { createdAt: 'DESC' },
      skip: pageNumber * pageSize,
      take: pageSize,
    });
    const application = await this.applicationRepo.findOne({ where: { id: applicationId } });
    if (!application) {
      throw new NotFoundException('Application not found.');
    }
    const mapped = await Promise.all(items.map((asset) => this.mapAsset(asset, application, false)));
    return new PageResponseDto(mapped, total, Math.ceil(total / pageSize), pageNumber, pageSize);
  }

  async trash(
    applicationId: string,
    id: string,
    actorId?: string | null,
    actorEmail?: string | null,
  ): Promise<MediaAssetResponseDto> {
    const asset = await this.mediaAssetRepo.findOne({ where: { id, applicationId } });
    if (!asset) {
      throw new NotFoundException('Media asset not found.');
    }
    if (asset.state === MediaAssetState.PURGED) {
      throw new ConflictException('Purged asset cannot be moved to trash.');
    }
    await this.mediaReferenceService.ensureReferencesForAsset(applicationId, id);
    const refCount = await this.mediaRefRepo.count({ where: { applicationId, mediaAssetId: id } });
    if (refCount > 0) {
      throw new ConflictException('Referenced media cannot be moved to trash.');
    }
    asset.state = MediaAssetState.TRASH;
    asset.trashedAt = new Date();
    asset.deletedByUserId = actorId ?? null;
    const saved = await this.mediaAssetRepo.save(asset);
    await this.auditLog.record({
      actorId: actorId ?? null,
      actorEmail: actorEmail ?? null,
      action: 'MEDIA_TRASH',
      entityType: 'media_asset',
      entityId: saved.id,
      metadata: { applicationId: saved.applicationId },
    });
    const application = await this.applicationRepo.findOne({ where: { id: applicationId } });
    if (!application) {
      throw new NotFoundException('Application not found.');
    }
    return await this.mapAsset(saved, application, false);
  }

  async restore(
    applicationId: string,
    id: string,
    actorId?: string | null,
    actorEmail?: string | null,
  ): Promise<MediaAssetResponseDto> {
    const asset = await this.mediaAssetRepo.findOne({ where: { id, applicationId } });
    if (!asset) {
      throw new NotFoundException('Media asset not found.');
    }
    if (asset.state !== MediaAssetState.TRASH) {
      throw new ConflictException('Only trashed assets can be restored.');
    }
    asset.state = MediaAssetState.ACTIVE;
    asset.trashedAt = null;
    asset.deletedByUserId = null;
    const saved = await this.mediaAssetRepo.save(asset);
    await this.auditLog.record({
      actorId: actorId ?? null,
      actorEmail: actorEmail ?? null,
      action: 'MEDIA_RESTORE',
      entityType: 'media_asset',
      entityId: saved.id,
      metadata: { applicationId: saved.applicationId },
    });
    const application = await this.applicationRepo.findOne({ where: { id: applicationId } });
    if (!application) {
      throw new NotFoundException('Application not found.');
    }
    return await this.mapAsset(saved, application, false);
  }

  async listForAdmin(
    applicationId: string,
    state: MediaAssetState,
    page: number,
    size: number,
  ): Promise<PageResponseDto<MediaAssetResponseDto>> {
    return await this.listForTenant(applicationId, state, page, size);
  }

  async getReferences(applicationId: string, id: string): Promise<MediaReferenceResponseDto[]> {
    const asset = await this.mediaAssetRepo.findOne({ where: { id, applicationId }, select: ['id'] });
    if (!asset) {
      throw new NotFoundException('Media asset not found.');
    }
    await this.mediaReferenceService.ensureReferencesForAsset(applicationId, id);
    const refs = await this.mediaRefRepo.find({
      where: { applicationId, mediaAssetId: id },
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return refs.map(
      (entry) =>
        new MediaReferenceResponseDto(
          entry.id,
          entry.applicationId,
          entry.mediaAssetId,
          entry.refType,
          entry.refId,
          entry.refField,
          entry.createdAt.toISOString(),
        ),
    );
  }

  async purgeAsSuperAdmin(
    applicationId: string,
    id: string,
    actorId?: string | null,
    actorEmail?: string | null,
  ): Promise<MediaAssetResponseDto> {
    await this.auditLog.record({
      actorId: actorId ?? null,
      actorEmail: actorEmail ?? null,
      action: 'MEDIA_PURGE_ATTEMPT',
      entityType: 'media_asset',
      entityId: id,
      metadata: { applicationId },
    });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const assetRepo = queryRunner.manager.getRepository(MediaAssetEntity);
      const variantRepo = queryRunner.manager.getRepository(MediaVariantEntity);
      const refRepo = queryRunner.manager.getRepository(MediaReferenceEntity);

      const asset = await assetRepo.findOne({
        where: { id, applicationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!asset) {
        throw new NotFoundException('Media asset not found.');
      }
      if (asset.state !== MediaAssetState.TRASH) {
        throw new ConflictException('Only assets in TRASH can be purged.');
      }
      if (asset.pinned) {
        throw new ForbiddenException('Pinned assets cannot be purged.');
      }

      await this.mediaReferenceService.ensureReferencesForAsset(applicationId, id);
      const preCount = await refRepo.count({ where: { applicationId, mediaAssetId: id } });
      if (preCount > 0) {
        const sampleRefs = await refRepo.find({
          where: { applicationId, mediaAssetId: id },
          take: 5,
          order: { createdAt: 'DESC' },
        });
        await queryRunner.rollbackTransaction();
        await this.auditLog.record({
          actorId: actorId ?? null,
          actorEmail: actorEmail ?? null,
          action: 'MEDIA_PURGE_BLOCKED_REFERENCED',
          entityType: 'media_asset',
          entityId: id,
          metadata: {
            applicationId,
            refCount: preCount,
            sampleRefs: sampleRefs.map((entry) => ({
              refType: entry.refType,
              refId: entry.refId,
              refField: entry.refField,
            })),
          },
        });
        throw new ConflictException({
          message: 'Media is referenced and cannot be purged.',
          refCount: preCount,
          sampleRefs: sampleRefs.map((entry) => ({
            refType: entry.refType,
            refId: entry.refId,
            refField: entry.refField,
          })),
        });
      }

      const variants = await variantRepo.find({ where: { mediaAssetId: id } });
      const latestRefCount = await refRepo.count({ where: { applicationId, mediaAssetId: id } });
      if (latestRefCount > 0) {
        throw new ConflictException('Media got new references during purge attempt.');
      }

      const objects = [
        { bucket: asset.bucket || 'media', key: asset.objectKey },
        ...variants.map((entry) => ({ bucket: entry.bucket || 'media', key: entry.objectKey })),
      ];

      await this.storage.deleteMany(objects);

      asset.state = MediaAssetState.PURGED;
      asset.purgedAt = new Date();
      await assetRepo.save(asset);
      if (variants.length > 0) {
        await variantRepo.delete({ mediaAssetId: id });
      }

      await queryRunner.commitTransaction();

      await this.auditLog.record({
        actorId: actorId ?? null,
        actorEmail: actorEmail ?? null,
        action: 'MEDIA_PURGE_SUCCESS',
        entityType: 'media_asset',
        entityId: id,
        metadata: { applicationId, objectCount: objects.length },
      });

      const application = await this.applicationRepo.findOne({ where: { id: applicationId } });
      if (!application) {
        throw new NotFoundException('Application not found.');
      }
      return await this.mapAsset(asset, application, true);
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      if (!(error instanceof ConflictException)) {
        await this.auditLog.record({
          actorId: actorId ?? null,
          actorEmail: actorEmail ?? null,
          action: 'MEDIA_PURGE_FAILED',
          entityType: 'media_asset',
          entityId: id,
          metadata: {
            applicationId,
            error: error instanceof Error ? error.message : String(error),
          },
        });
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async mapAsset(
    asset: MediaAssetEntity,
    application: ApplicationEntity,
    includePurgeFields: boolean,
  ): Promise<MediaAssetResponseDto> {
    const mediaUrl = this.baseUrl.buildMediaUrl(application, asset.objectKey);
    await this.mediaReferenceService.ensureReferencesForAsset(asset.applicationId, asset.id);
    const refCount = await this.mediaRefRepo.count({
      where: { applicationId: asset.applicationId, mediaAssetId: asset.id },
    });
    const canPurge = asset.state === MediaAssetState.TRASH && refCount === 0 && !asset.pinned;
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
      includePurgeFields && asset.purgedAt ? asset.purgedAt.toISOString() : null,
      asset.pinned,
      asset.createdAt.toISOString(),
      asset.updatedAt.toISOString(),
      refCount,
      canPurge,
    );
  }
}
