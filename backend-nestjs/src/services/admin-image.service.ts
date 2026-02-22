import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ChangeStatusRequestDto } from '../dto/requests/change-status-request.dto';
import { ImageUpdateRequestDto } from '../dto/requests/image-update-request.dto';
import { ContentStatus } from '../common/content-status.enum';
import { ImageResponseDto } from '../dto/responses/image-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';
import { ImageEntity } from '../entities/image.entity';
import { MinioService } from './minio.service';
import { BaseUrlService } from './base-url.service';
import { ApplicationEntity } from '../entities/application.entity';
import { isSupportedContentLocale, normalizeContentLocale } from '../common/content-locale.constants';
import { resolvePublicationFields } from '../common/publishing';
import { MediaLibraryService } from './media-library.service';
import { MediaAssetKind, MediaAssetState } from '../entities/media-asset.entity';
import { MediaReferenceService } from './media-reference.service';
import { MediaReferenceType } from '../entities/media-reference.entity';
import { ContentUsageResponseDto } from '../dto/responses/content-usage-response.dto';

@Injectable()
export class AdminImageService {
  constructor(
    @InjectRepository(ImageEntity)
    private readonly imageRepo: Repository<ImageEntity>,
    private readonly minioService: MinioService,
    private readonly baseUrl: BaseUrlService,
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepo: Repository<ApplicationEntity>,
    private readonly mediaLibraryService: MediaLibraryService,
    private readonly mediaReferenceService: MediaReferenceService,
  ) {}

  private mapImage(image: ImageEntity, application?: ApplicationEntity | null): ImageResponseDto {
    const app = application || (image.applicationId ? this.applicationRepo.create({ id: image.applicationId }) : null);
    const mediaUrl = app ? this.baseUrl.buildMediaUrl(app, image.objectKey) : null;
    return new ImageResponseDto(
      image.id,
      image.applicationId,
      image.title,
      image.description ?? null,
      image.locale ?? null,
      image.tags ?? null,
      image.seo ?? null,
      image.gallery ?? null,
      image.status,
      image.publishedAt ? image.publishedAt.toISOString() : null,
      image.scheduledAt ? image.scheduledAt.toISOString() : null,
      image.viewCount ?? 0,
      image.objectKey,
      image.contentType,
      image.sizeBytes,
      image.width ?? null,
      image.height ?? null,
      image.altText ?? null,
      image.createdAt.toISOString(),
      image.updatedAt.toISOString(),
      image.deletedAt ? image.deletedAt.toISOString() : null,
      mediaUrl,
    );
  }

  private normalizeTags(tags?: string[]): string[] | null {
    if (!tags) {
      return null;
    }
    const normalized = tags.map((tag) => tag.trim()).filter(Boolean);
    return normalized.length > 0 ? normalized : null;
  }

  private async syncImageMediaReference(image: ImageEntity): Promise<void> {
    await this.mediaReferenceService.syncContentReferences({
      applicationId: image.applicationId,
      refType: MediaReferenceType.IMAGE,
      refId: image.id,
      bannerKey: null,
      bannerUrl: null,
      galleryUrls: [],
      content: image.objectKey,
    });
  }

  async upload(
    file: Express.Multer.File,
    title: string,
    description: string | undefined,
    applicationId: string,
    status: ContentStatus,
    tags?: string[],
    seo?: Record<string, unknown>,
    gallery?: Record<string, unknown>[],
    locale?: string,
    altText?: string,
    scheduledAt?: string,
  ): Promise<ImageResponseDto> {
    if (!title?.trim()) {
      throw new BadRequestException('Title is required.');
    }
    if (locale && !isSupportedContentLocale(locale)) {
      throw new BadRequestException('Locale is not supported.');
    }
    const publication = resolvePublicationFields(status, scheduledAt);
    const upload = await this.minioService.upload(applicationId, 'image', file);
    await this.mediaLibraryService.registerAsset({
      applicationId,
      kind: MediaAssetKind.IMAGE,
      objectKey: upload.objectKey,
      contentType: upload.contentType,
      sizeBytes: upload.sizeBytes,
      originalName: file.originalname,
    });
    const image = this.imageRepo.create({
      id: uuidv4(),
      applicationId,
      title: title.trim(),
      description: description?.trim() || null,
      locale: normalizeContentLocale(locale),
      tags: this.normalizeTags(tags),
      seo: seo ?? null,
      gallery: gallery ?? null,
      status,
      publishedAt: publication.publishedAt,
      scheduledAt: publication.scheduledAt,
      objectKey: upload.objectKey,
      contentType: upload.contentType,
      sizeBytes: upload.sizeBytes,
      altText: altText?.trim() || null,
    });
    const saved = await this.imageRepo.save(image);
    await this.syncImageMediaReference(saved);
    const application = await this.applicationRepo.findOne({ where: { id: saved.applicationId } });
    return this.mapImage(saved, application);
  }

  async createFromAsset(
    assetId: string,
    title: string,
    description: string | undefined,
    applicationId: string,
    status: ContentStatus,
    tags?: string[],
    seo?: Record<string, unknown>,
    gallery?: Record<string, unknown>[],
    locale?: string,
    altText?: string,
    scheduledAt?: string,
  ): Promise<ImageResponseDto> {
    if (!title?.trim()) {
      throw new BadRequestException('Title is required.');
    }
    if (locale && !isSupportedContentLocale(locale)) {
      throw new BadRequestException('Locale is not supported.');
    }

    const asset = await this.mediaLibraryService.getAssetForApplication(assetId, applicationId);
    if (asset.kind !== MediaAssetKind.IMAGE) {
      throw new BadRequestException('Selected asset is not an image.');
    }

    const publication = resolvePublicationFields(status, scheduledAt);
    const image = this.imageRepo.create({
      id: uuidv4(),
      applicationId,
      title: title.trim(),
      description: description?.trim() || null,
      locale: normalizeContentLocale(locale),
      tags: this.normalizeTags(tags),
      seo: seo ?? null,
      gallery: gallery ?? null,
      status,
      publishedAt: publication.publishedAt,
      scheduledAt: publication.scheduledAt,
      objectKey: asset.objectKey,
      contentType: asset.contentType,
      sizeBytes: asset.sizeBytes,
      altText: altText?.trim() || null,
    });
    const saved = await this.imageRepo.save(image);
    await this.syncImageMediaReference(saved);
    const application = await this.applicationRepo.findOne({ where: { id: saved.applicationId } });
    return this.mapImage(saved, application);
  }

  async changeStatus(id: string, request: ChangeStatusRequestDto): Promise<ImageResponseDto> {
    const image = await this.imageRepo.findOne({ where: { id } });
    if (!image) {
      throw new NotFoundException('Image not found.');
    }
    if (image.deletedAt) {
      throw new ConflictException('Deleted image cannot change status. Restore it first.');
    }
    image.status = request.status;
    image.publishedAt = request.status === ContentStatus.PUBLISHED ? new Date() : null;
    image.scheduledAt = null;
    const saved = await this.imageRepo.save(image);
    await this.syncImageMediaReference(saved);
    const application = await this.applicationRepo.findOne({ where: { id: saved.applicationId } });
    return this.mapImage(saved, application);
  }

  async getApplicationIdById(id: string): Promise<string> {
    const image = await this.imageRepo.findOne({ where: { id } });
    if (!image) {
      throw new NotFoundException('Image not found.');
    }
    return image.applicationId;
  }

  async getById(id: string): Promise<ImageResponseDto> {
    const image = await this.imageRepo.findOne({ where: { id } });
    if (!image) {
      throw new NotFoundException('Image not found.');
    }
    const application = await this.applicationRepo.findOne({ where: { id: image.applicationId } });
    return this.mapImage(image, application);
  }

  async restore(id: string): Promise<ImageResponseDto> {
    const image = await this.imageRepo.findOne({ where: { id } });
    if (!image) {
      throw new NotFoundException('Image not found.');
    }
    if (!image.deletedAt) {
      throw new ConflictException('Image is not in trash.');
    }
    const asset = await this.mediaReferenceService.findAssetByObjectKey(image.applicationId, image.objectKey);
    if (asset?.state === MediaAssetState.PURGED) {
      throw new ConflictException('Cannot restore image because the file has been physically deleted.');
    }
    image.deletedAt = null;
    const saved = await this.imageRepo.save(image);
    await this.syncImageMediaReference(saved);
    const application = await this.applicationRepo.findOne({ where: { id: saved.applicationId } });
    return this.mapImage(saved, application);
  }

  async listUsages(id: string): Promise<ContentUsageResponseDto[]> {
    const image = await this.imageRepo.findOne({ where: { id }, select: ['id', 'applicationId', 'objectKey'] });
    if (!image) {
      throw new NotFoundException('Image not found.');
    }
    return await this.mediaReferenceService.listUsagesForObjectKey(image.applicationId, image.objectKey, {
      refType: MediaReferenceType.IMAGE,
      refId: image.id,
    });
  }

  async update(id: string, request: ImageUpdateRequestDto): Promise<ImageResponseDto> {
    const image = await this.imageRepo.findOne({ where: { id } });
    if (!image) {
      throw new NotFoundException('Image not found.');
    }
    if (image.deletedAt) {
      throw new ConflictException('Deleted image cannot be edited. Restore it first.');
    }
    const publication = resolvePublicationFields(request.status, request.scheduledAt, image.publishedAt);
    image.title = request.title.trim();
    image.description = request.description?.trim() || null;
    image.locale = normalizeContentLocale(request.locale);
    image.width = request.width ?? null;
    image.height = request.height ?? null;
    image.altText = request.altText?.trim() || null;
    image.tags = this.normalizeTags(request.tags);
    image.seo = request.seo ? (request.seo as Record<string, unknown>) : null;
    image.gallery = request.gallery
      ? (request.gallery as unknown as Record<string, unknown>[])
      : null;
    image.status = request.status;
    image.publishedAt = publication.publishedAt;
    image.scheduledAt = publication.scheduledAt;
    const saved = await this.imageRepo.save(image);
    await this.syncImageMediaReference(saved);
    const application = await this.applicationRepo.findOne({ where: { id: saved.applicationId } });
    return this.mapImage(saved, application);
  }

  async delete(id: string): Promise<void> {
    const image = await this.imageRepo.findOne({ where: { id }, select: ['id', 'applicationId', 'objectKey', 'deletedAt'] });
    if (!image) {
      throw new NotFoundException('Image not found.');
    }
    if (image.deletedAt) {
      return;
    }
    const usages = await this.mediaReferenceService.listUsagesForObjectKey(image.applicationId, image.objectKey, {
      refType: MediaReferenceType.IMAGE,
      refId: image.id,
    });
    if (usages.length > 0) {
      throw new ConflictException({
        message: 'Image cannot be deleted because its file is used in other content.',
        usageCount: usages.length,
        usages: usages.slice(0, 10),
      });
    }
    await this.mediaReferenceService.removeAllForRef(image.applicationId, MediaReferenceType.IMAGE, image.id);
    await this.imageRepo.update({ id: image.id }, { deletedAt: new Date() });
  }

  async list(
    applicationId: string,
    status: ContentStatus | undefined,
    page: number,
    size: number,
    deleted = false,
  ): Promise<PageResponseDto<ImageResponseDto>> {
    const pageNumber = Math.max(0, page);
    const pageSize = Math.max(1, size);
    const [items, total] = await this.imageRepo.findAndCount({
      where: deleted
        ? (status ? { applicationId, status, deletedAt: Not(IsNull()) } : { applicationId, deletedAt: Not(IsNull()) })
        : (status ? { applicationId, status, deletedAt: IsNull() } : { applicationId, deletedAt: IsNull() }),
      order: { publishedAt: 'DESC', createdAt: 'DESC' },
      skip: pageNumber * pageSize,
      take: pageSize,
    });
    const application = await this.applicationRepo.findOne({ where: { id: applicationId } });
    if (!application) {
      throw new NotFoundException('Application not found.');
    }
    let visibleItems = items;
    if (deleted) {
      const filtered: ImageEntity[] = [];
      for (const image of items) {
        const asset = await this.mediaReferenceService.findAssetByObjectKey(image.applicationId, image.objectKey);
        if (asset?.state === MediaAssetState.PURGED) {
          continue;
        }
        filtered.push(image);
      }
      visibleItems = filtered;
    }
    const mapped = visibleItems.map((image) => this.mapImage(image, application));
    return new PageResponseDto(mapped, deleted ? mapped.length : total, Math.ceil((deleted ? mapped.length : total) / pageSize), pageNumber, pageSize);
  }
}
