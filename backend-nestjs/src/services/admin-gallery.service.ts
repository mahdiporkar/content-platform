import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { GalleryUpsertRequestDto } from '../dto/requests/gallery-upsert-request.dto';
import { ChangeStatusRequestDto } from '../dto/requests/change-status-request.dto';
import { ContentStatus } from '../common/content-status.enum';
import { GalleryResponseDto } from '../dto/responses/gallery-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';
import { GalleryEntity } from '../entities/gallery.entity';
import { normalizeContentLocale } from '../common/content-locale.constants';
import { resolvePublicationFields } from '../common/publishing';
import { MediaReferenceService } from './media-reference.service';
import { MediaReferenceType } from '../entities/media-reference.entity';
import { PublicMediaUrlService } from './public-media-url.service';
import { ApplicationEntity } from '../entities/application.entity';

@Injectable()
export class AdminGalleryService {
  constructor(
    @InjectRepository(GalleryEntity)
    private readonly galleryRepo: Repository<GalleryEntity>,
    private readonly mediaReferenceService: MediaReferenceService,
    private readonly publicMediaUrlService: PublicMediaUrlService,
  ) {}

  private normalizeTags(tags?: string[]): string[] | null {
    if (!tags) {
      return null;
    }
    const normalized = tags.map((tag) => tag.trim()).filter(Boolean);
    return normalized.length > 0 ? normalized : null;
  }

  private normalizeGalleryUrls(gallery: Record<string, unknown>[] | null, applicationId: string): Record<string, unknown>[] | null {
    if (!gallery) {
      return null;
    }
    return gallery.map((item) => {
      const record = { ...item };
      if (typeof record.url === 'string') {
        record.url = this.publicMediaUrlService.toPublicMediaUrl(
          { id: applicationId, publicBaseUrlOverride: null } as ApplicationEntity,
          record.url,
        );
      }
      return record;
    });
  }

  private mapGallery(gallery: GalleryEntity): GalleryResponseDto {
    return new GalleryResponseDto(
      gallery.id,
      gallery.applicationId,
      gallery.title,
      gallery.description ?? null,
      gallery.slug,
      gallery.locale ?? null,
      gallery.tags ?? null,
      gallery.seo ?? null,
      this.normalizeGalleryUrls(gallery.gallery ?? null, gallery.applicationId),
      gallery.status,
      gallery.publishedAt ? gallery.publishedAt.toISOString() : null,
      gallery.scheduledAt ? gallery.scheduledAt.toISOString() : null,
      gallery.viewCount ?? 0,
      gallery.createdAt.toISOString(),
      gallery.updatedAt.toISOString(),
    );
  }

  async create(request: GalleryUpsertRequestDto): Promise<GalleryResponseDto> {
    const publication = resolvePublicationFields(request.status, request.scheduledAt);
    const gallery = this.galleryRepo.create({
      id: uuidv4(),
      applicationId: request.applicationId,
      title: request.title.trim(),
      description: request.description?.trim() || null,
      slug: request.slug.trim(),
      locale: normalizeContentLocale(request.locale),
      tags: this.normalizeTags(request.tags),
      seo: request.seo ? (request.seo as Record<string, unknown>) : null,
      gallery: request.gallery ? (request.gallery as unknown as Record<string, unknown>[]) : null,
      status: request.status,
      publishedAt: publication.publishedAt,
      scheduledAt: publication.scheduledAt,
    });
    const saved = await this.galleryRepo.save(gallery);
    await this.syncMediaReferences(saved);
    return this.mapGallery(saved);
  }

  async update(id: string, request: GalleryUpsertRequestDto): Promise<GalleryResponseDto> {
    const gallery = await this.galleryRepo.findOne({ where: { id } });
    if (!gallery) {
      throw new NotFoundException('Gallery not found.');
    }
    const publication = resolvePublicationFields(request.status, request.scheduledAt, gallery.publishedAt);
    gallery.title = request.title.trim();
    gallery.description = request.description?.trim() || null;
    gallery.slug = request.slug.trim();
    gallery.locale = normalizeContentLocale(request.locale);
    gallery.tags = this.normalizeTags(request.tags);
    gallery.seo = request.seo ? (request.seo as Record<string, unknown>) : null;
    gallery.gallery = request.gallery ? (request.gallery as unknown as Record<string, unknown>[]) : null;
    gallery.status = request.status;
    gallery.publishedAt = publication.publishedAt;
    gallery.scheduledAt = publication.scheduledAt;
    const saved = await this.galleryRepo.save(gallery);
    await this.syncMediaReferences(saved);
    return this.mapGallery(saved);
  }

  async changeStatus(id: string, request: ChangeStatusRequestDto): Promise<GalleryResponseDto> {
    const gallery = await this.galleryRepo.findOne({ where: { id } });
    if (!gallery) {
      throw new NotFoundException('Gallery not found.');
    }
    gallery.status = request.status;
    gallery.publishedAt = request.status === ContentStatus.PUBLISHED ? new Date() : null;
    gallery.scheduledAt = null;
    const saved = await this.galleryRepo.save(gallery);
    return this.mapGallery(saved);
  }

  async getApplicationIdById(id: string): Promise<string> {
    const gallery = await this.galleryRepo.findOne({ where: { id } });
    if (!gallery) {
      throw new NotFoundException('Gallery not found.');
    }
    return gallery.applicationId;
  }

  async list(
    applicationId: string,
    status: ContentStatus | undefined,
    page: number,
    size: number,
  ): Promise<PageResponseDto<GalleryResponseDto>> {
    const pageNumber = Math.max(0, page);
    const pageSize = Math.max(1, size);
    const where = status ? { applicationId, status } : { applicationId };
    const [items, total] = await this.galleryRepo.findAndCount({
      where,
      order: { publishedAt: 'DESC', createdAt: 'DESC' },
      skip: pageNumber * pageSize,
      take: pageSize,
    });

    return new PageResponseDto(
      items.map((gallery) => this.mapGallery(gallery)),
      total,
      Math.ceil(total / pageSize),
      pageNumber,
      pageSize,
    );
  }

  private async syncMediaReferences(gallery: GalleryEntity): Promise<void> {
    await this.mediaReferenceService.syncContentReferences({
      applicationId: gallery.applicationId,
      refType: MediaReferenceType.GALLERY,
      refId: gallery.id,
      galleryUrls: (gallery.gallery || []).map((entry) => String((entry as Record<string, unknown>).url || '')).filter(Boolean),
      content: '',
    });
  }
}
