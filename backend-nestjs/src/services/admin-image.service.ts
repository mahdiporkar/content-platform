import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

@Injectable()
export class AdminImageService {
  constructor(
    @InjectRepository(ImageEntity)
    private readonly imageRepo: Repository<ImageEntity>,
    private readonly minioService: MinioService,
    private readonly baseUrl: BaseUrlService,
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepo: Repository<ApplicationEntity>,
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
    altText?: string,
  ): Promise<ImageResponseDto> {
    if (!title?.trim()) {
      throw new BadRequestException('Title is required.');
    }
    if (locale && !isSupportedContentLocale(locale)) {
      throw new BadRequestException('Locale is not supported.');
    }
    const upload = await this.minioService.upload(applicationId, 'image', file);
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
      publishedAt: status === ContentStatus.PUBLISHED ? new Date() : null,
      objectKey: upload.objectKey,
      contentType: upload.contentType,
      sizeBytes: upload.sizeBytes,
      altText: altText?.trim() || null,
    });
    const saved = await this.imageRepo.save(image);
    const application = await this.applicationRepo.findOne({ where: { id: saved.applicationId } });
    return this.mapImage(saved, application);
  }

  async changeStatus(id: string, request: ChangeStatusRequestDto): Promise<ImageResponseDto> {
    const image = await this.imageRepo.findOne({ where: { id } });
    if (!image) {
      throw new NotFoundException('Image not found.');
    }
    image.status = request.status;
    image.publishedAt = request.status === ContentStatus.PUBLISHED ? new Date() : null;
    const saved = await this.imageRepo.save(image);
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

  async update(id: string, request: ImageUpdateRequestDto): Promise<ImageResponseDto> {
    const image = await this.imageRepo.findOne({ where: { id } });
    if (!image) {
      throw new NotFoundException('Image not found.');
    }
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
    image.publishedAt = request.status === ContentStatus.PUBLISHED ? image.publishedAt ?? new Date() : null;
    image.scheduledAt = request.scheduledAt ? new Date(request.scheduledAt) : null;
    const saved = await this.imageRepo.save(image);
    const application = await this.applicationRepo.findOne({ where: { id: saved.applicationId } });
    return this.mapImage(saved, application);
  }

  async list(
    applicationId: string,
    status: ContentStatus | undefined,
    page: number,
    size: number,
  ): Promise<PageResponseDto<ImageResponseDto>> {
    const pageNumber = Math.max(0, page);
    const pageSize = Math.max(1, size);
    const where = status ? { applicationId, status } : { applicationId };
    const [items, total] = await this.imageRepo.findAndCount({
      where,
      order: { publishedAt: 'DESC', createdAt: 'DESC' },
      skip: pageNumber * pageSize,
      take: pageSize,
    });
    const application = await this.applicationRepo.findOne({ where: { id: applicationId } });
    const mapped = items.map((image) => this.mapImage(image, application));
    return new PageResponseDto(mapped, total, Math.ceil(total / pageSize), pageNumber, pageSize);
  }
}
