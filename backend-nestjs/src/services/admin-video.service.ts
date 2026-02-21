import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ChangeStatusRequestDto } from '../dto/requests/change-status-request.dto';
import { VideoUpdateRequestDto } from '../dto/requests/video-update-request.dto';
import { ContentStatus } from '../common/content-status.enum';
import { VideoResponseDto } from '../dto/responses/video-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';
import { VideoEntity } from '../entities/video.entity';
import { MinioService } from './minio.service';
import { BaseUrlService } from './base-url.service';
import { ApplicationEntity } from '../entities/application.entity';
import { isSupportedContentLocale, normalizeContentLocale } from '../common/content-locale.constants';
import { resolvePublicationFields } from '../common/publishing';
import { MediaLibraryService } from './media-library.service';
import { MediaAssetKind } from '../entities/media-asset.entity';

@Injectable()
export class AdminVideoService {
  constructor(
    @InjectRepository(VideoEntity)
    private readonly videoRepo: Repository<VideoEntity>,
    private readonly minioService: MinioService,
    private readonly baseUrl: BaseUrlService,
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepo: Repository<ApplicationEntity>,
    private readonly mediaLibraryService: MediaLibraryService,
  ) {}

  private mapVideo(video: VideoEntity, application?: ApplicationEntity | null): VideoResponseDto {
    const app = application || (video.applicationId ? this.applicationRepo.create({ id: video.applicationId }) : null);
    const mediaUrl = app ? this.baseUrl.buildMediaUrl(app, video.objectKey) : null;
    return new VideoResponseDto(
      video.id,
      video.applicationId,
      video.title,
      video.description,
      video.locale ?? null,
      video.tags ?? null,
      video.seo ?? null,
      video.gallery ?? null,
      video.status,
      video.publishedAt ? video.publishedAt.toISOString() : null,
      video.scheduledAt ? video.scheduledAt.toISOString() : null,
      video.viewCount ?? 0,
      video.objectKey,
      video.posterKey ?? null,
      video.durationSeconds ?? null,
      video.width ?? null,
      video.height ?? null,
      video.contentType,
      video.sizeBytes,
      video.altText ?? null,
      video.createdAt.toISOString(),
      video.updatedAt.toISOString(),
      mediaUrl,
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
    scheduledAt?: string,
  ): Promise<VideoResponseDto> {
    if (!title?.trim()) {
      throw new BadRequestException('Title is required.');
    }
    if (locale && !isSupportedContentLocale(locale)) {
      throw new BadRequestException('Locale is not supported.');
    }
    const publication = resolvePublicationFields(status, scheduledAt);
    const upload = await this.minioService.upload(applicationId, 'video', file);
    await this.mediaLibraryService.registerAsset({
      applicationId,
      kind: MediaAssetKind.VIDEO,
      objectKey: upload.objectKey,
      contentType: upload.contentType,
      sizeBytes: upload.sizeBytes,
      originalName: file.originalname,
    });
    const video = this.videoRepo.create({
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
    });
    const saved = await this.videoRepo.save(video);
    const application = await this.applicationRepo.findOne({ where: { id: saved.applicationId } });
    return this.mapVideo(saved, application);
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
    scheduledAt?: string,
  ): Promise<VideoResponseDto> {
    if (!title?.trim()) {
      throw new BadRequestException('Title is required.');
    }
    if (locale && !isSupportedContentLocale(locale)) {
      throw new BadRequestException('Locale is not supported.');
    }

    const asset = await this.mediaLibraryService.getAssetForApplication(assetId, applicationId);
    if (asset.kind !== MediaAssetKind.VIDEO) {
      throw new BadRequestException('Selected asset is not a video.');
    }

    const publication = resolvePublicationFields(status, scheduledAt);
    const video = this.videoRepo.create({
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
    });
    const saved = await this.videoRepo.save(video);
    const application = await this.applicationRepo.findOne({ where: { id: saved.applicationId } });
    return this.mapVideo(saved, application);
  }

  async changeStatus(id: string, request: ChangeStatusRequestDto): Promise<VideoResponseDto> {
    const video = await this.videoRepo.findOne({ where: { id } });
    if (!video) {
      throw new NotFoundException('Video not found.');
    }
    video.status = request.status;
    video.publishedAt = request.status === ContentStatus.PUBLISHED ? new Date() : null;
    video.scheduledAt = null;
    const saved = await this.videoRepo.save(video);
    const application = await this.applicationRepo.findOne({ where: { id: saved.applicationId } });
    return this.mapVideo(saved, application);
  }

  async getApplicationIdById(id: string): Promise<string> {
    const video = await this.videoRepo.findOne({ where: { id } });
    if (!video) {
      throw new NotFoundException('Video not found.');
    }
    return video.applicationId;
  }

  async getById(id: string): Promise<VideoResponseDto> {
    const video = await this.videoRepo.findOne({ where: { id } });
    if (!video) {
      throw new NotFoundException('Video not found.');
    }
    const application = await this.applicationRepo.findOne({ where: { id: video.applicationId } });
    return this.mapVideo(video, application);
  }

  async update(id: string, request: VideoUpdateRequestDto): Promise<VideoResponseDto> {
    const video = await this.videoRepo.findOne({ where: { id } });
    if (!video) {
      throw new NotFoundException('Video not found.');
    }
    const publication = resolvePublicationFields(request.status, request.scheduledAt, video.publishedAt);
    video.title = request.title.trim();
    video.description = request.description?.trim() || null;
    video.locale = normalizeContentLocale(request.locale);
    video.posterKey = request.posterKey?.trim() || null;
    video.durationSeconds = request.durationSeconds ?? null;
    video.width = request.width ?? null;
    video.height = request.height ?? null;
    video.altText = request.altText?.trim() || null;
    video.tags = this.normalizeTags(request.tags);
    video.seo = request.seo ? (request.seo as Record<string, unknown>) : null;
    video.gallery = request.gallery
      ? (request.gallery as unknown as Record<string, unknown>[])
      : null;
    video.status = request.status;
    video.publishedAt = publication.publishedAt;
    video.scheduledAt = publication.scheduledAt;
    const saved = await this.videoRepo.save(video);
    const application = await this.applicationRepo.findOne({ where: { id: saved.applicationId } });
    return this.mapVideo(saved, application);
  }

  async list(
    applicationId: string,
    status: ContentStatus | undefined,
    page: number,
    size: number,
  ): Promise<PageResponseDto<VideoResponseDto>> {
    const pageNumber = Math.max(0, page);
    const pageSize = Math.max(1, size);
    const where = status ? { applicationId, status } : { applicationId };
    const [items, total] = await this.videoRepo.findAndCount({
      where,
      order: { publishedAt: 'DESC', createdAt: 'DESC' },
      skip: pageNumber * pageSize,
      take: pageSize,
    });

    const application = await this.applicationRepo.findOne({ where: { id: applicationId } });
    const mapped = items.map((video) => this.mapVideo(video, application));
    return new PageResponseDto(mapped, total, Math.ceil(total / pageSize), pageNumber, pageSize);
  }
}
