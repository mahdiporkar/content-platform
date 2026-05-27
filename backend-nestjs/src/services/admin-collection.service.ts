import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, In, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CollectionEntity } from '../entities/collection.entity';
import { CollectionItemEntity } from '../entities/collection-item.entity';
import { CollectionUpsertRequestDto } from '../dto/requests/collection-upsert-request.dto';
import { CollectionItemAddRequestDto } from '../dto/requests/collection-item-add-request.dto';
import { CollectionItemRemoveRequestDto } from '../dto/requests/collection-item-remove-request.dto';
import { CollectionReorderRequestDto } from '../dto/requests/collection-reorder-request.dto';
import { CollectionResponseDto } from '../dto/responses/collection-response.dto';
import { CollectionItemResponseDto } from '../dto/responses/collection-item-response.dto';
import { ContentType } from '../common/content-type.enum';
import { ContentStatus } from '../common/content-status.enum';
import { AuditLogService } from './audit-log.service';
import { PageResponseDto } from '../dto/page-response.dto';
import { PostEntity } from '../entities/post.entity';
import { ArticleEntity } from '../entities/article.entity';
import { VideoEntity } from '../entities/video.entity';
import { ImageEntity } from '../entities/image.entity';
import { GalleryEntity } from '../entities/gallery.entity';
import { BaseUrlService } from './base-url.service';
import { ApplicationEntity } from '../entities/application.entity';
import { PublicMediaUrlService } from './public-media-url.service';
import {
  CollectionAudience,
  CollectionFallback,
  CollectionFallbackSource,
  CollectionItemDisplay,
  CollectionItemLink,
  CollectionItemLinkType,
  CollectionItemMetadata,
  CollectionItemType,
  CollectionMetadata,
  CollectionPlacement,
  CollectionPlacementDevice,
  CollectionPresentation,
  CollectionPresentationType,
  CollectionStatus,
} from '../common/collection-types';

type ContentSummary = {
  title: string | null;
  status: ContentStatus | null;
  locale: string | null;
  tags: string[] | null;
  slug: string | null;
  thumbnailUrl: string | null;
  publishedAt: string | null;
};

@Injectable()
export class AdminCollectionService {
  constructor(
    @InjectRepository(CollectionEntity)
    private readonly collectionRepo: Repository<CollectionEntity>,
    @InjectRepository(CollectionItemEntity)
    private readonly itemRepo: Repository<CollectionItemEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,
    @InjectRepository(ArticleEntity)
    private readonly articleRepo: Repository<ArticleEntity>,
    @InjectRepository(VideoEntity)
    private readonly videoRepo: Repository<VideoEntity>,
    @InjectRepository(GalleryEntity)
    private readonly galleryRepo: Repository<GalleryEntity>,
    @InjectRepository(ImageEntity)
    private readonly imageRepo: Repository<ImageEntity>,
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepo: Repository<ApplicationEntity>,
    private readonly baseUrl: BaseUrlService,
    private readonly publicMediaUrlService: PublicMediaUrlService,
    private readonly dataSource: DataSource,
    private readonly auditLog: AuditLogService,
  ) {}

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private normalizeAllowedTypes(allowedTypes?: ContentType[]): ContentType[] | null {
    if (!allowedTypes || allowedTypes.length === 0) {
      return null;
    }
    const normalized = Array.from(new Set(allowedTypes.map((type) => type.trim() as ContentType)));
    return normalized.length > 0 ? normalized : null;
  }

  private normalizePresentation(presentation?: CollectionPresentation | null): CollectionPresentation {
    if (!presentation) {
      return { type: CollectionPresentationType.LIST };
    }
    const type = Object.values(CollectionPresentationType).includes(presentation.type)
      ? presentation.type
      : CollectionPresentationType.LIST;
    return {
      type,
      config: presentation.config && typeof presentation.config === 'object' ? presentation.config : undefined,
    };
  }

  private normalizePlacement(placement?: CollectionPlacement | null): CollectionPlacement | null {
    if (!placement) {
      return null;
    }
    return {
      page: placement.page?.trim() || undefined,
      section: placement.section?.trim() || undefined,
      device: placement.device && Object.values(CollectionPlacementDevice).includes(placement.device)
        ? placement.device
        : CollectionPlacementDevice.ALL,
    };
  }

  private normalizeFallback(fallback?: CollectionFallback | null): CollectionFallback {
    if (!fallback) {
      return { enabled: false };
    }
    return {
      enabled: fallback.enabled === true,
      source: fallback.source && Object.values(CollectionFallbackSource).includes(fallback.source) ? fallback.source : undefined,
      limit: typeof fallback.limit === 'number' && fallback.limit > 0 ? Math.floor(fallback.limit) : undefined,
    };
  }

  private normalizeAudience(audience?: CollectionAudience | null): CollectionAudience | null {
    if (!audience) {
      return null;
    }
    return {
      locale: audience.locale?.trim() || undefined,
      segment: audience.segment?.trim() || undefined,
    };
  }

  private normalizeMetadata(metadata?: CollectionMetadata | null): CollectionMetadata | null {
    if (!metadata) {
      return null;
    }
    return {
      campaignKey: metadata.campaignKey?.trim() || undefined,
      analyticsKey: metadata.analyticsKey?.trim() || undefined,
    };
  }

  private normalizeDisplay(display?: CollectionItemDisplay | null): CollectionItemDisplay | null {
    if (!display) {
      return null;
    }
    return {
      titleOverride: display.titleOverride?.trim() || undefined,
      subtitleOverride: display.subtitleOverride?.trim() || undefined,
      descriptionOverride: display.descriptionOverride?.trim() || undefined,
      imageOverride: display.imageOverride?.trim() || undefined,
      mobileImageOverride: display.mobileImageOverride?.trim() || undefined,
      videoOverride: display.videoOverride?.trim() || undefined,
      badgeText: display.badgeText?.trim() || undefined,
      ctaLabel: display.ctaLabel?.trim() || undefined,
    };
  }

  private normalizeLink(link?: CollectionItemLink | null): CollectionItemLink {
    if (!link) {
      return { type: CollectionItemLinkType.NONE };
    }
    const type = Object.values(CollectionItemLinkType).includes(link.type) ? link.type : CollectionItemLinkType.NONE;
    return {
      type,
      contentId: link.contentId?.trim() || undefined,
      url: link.url?.trim() || undefined,
      target: link.target === '_blank' || link.target === '_self' ? link.target : undefined,
      rel: link.rel === 'nofollow' || link.rel === 'sponsored' || link.rel === 'noopener' ? link.rel : undefined,
      trackingKey: link.trackingKey?.trim() || undefined,
    };
  }

  private normalizeItemMetadata(metadata?: CollectionItemMetadata | null): CollectionItemMetadata | null {
    if (!metadata) {
      return null;
    }
    return {
      campaignKey: metadata.campaignKey?.trim() || undefined,
      analyticsKey: metadata.analyticsKey?.trim() || undefined,
    };
  }

  private parseOptionalDate(value?: string | null): Date | null {
    if (!value) {
      return null;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Invalid schedule date.');
    }
    return parsed;
  }

  private validateSchedule(startsAt: Date | null, endsAt: Date | null): void {
    if (startsAt && endsAt && startsAt >= endsAt) {
      throw new BadRequestException('startsAt must be before endsAt.');
    }
  }

  private validateCustomDisplay(display: CollectionItemDisplay | null): void {
    if (!display?.imageOverride && !display?.mobileImageOverride && !display?.titleOverride && !display?.videoOverride) {
      throw new BadRequestException('Custom items must include titleOverride, imageOverride, mobileImageOverride, or videoOverride.');
    }
  }

  private validateLink(link: CollectionItemLink): void {
    if (link.type === CollectionItemLinkType.INTERNAL) {
      if (!link.url?.startsWith('/')) {
        throw new BadRequestException('Internal links must use a relative URL.');
      }
      return;
    }
    if (link.type === CollectionItemLinkType.EXTERNAL) {
      if (!link.url || !/^https?:\/\//.test(link.url)) {
        throw new BadRequestException('External links must use an absolute http(s) URL.');
      }
      return;
    }
    if (link.type === CollectionItemLinkType.CONTENT && !link.contentId) {
      throw new BadRequestException('Content links must include contentId.');
    }
  }

  private mapCollection(collection: CollectionEntity, itemsCount = 0): CollectionResponseDto {
    return new CollectionResponseDto(
      collection.id,
      collection.applicationId,
      collection.slug,
      collection.title,
      collection.description ?? null,
      collection.allowedTypes ?? null,
      collection.maxItems ?? null,
      collection.isPublic,
      collection.status ?? CollectionStatus.DRAFT,
      collection.priority ?? 0,
      collection.presentation ?? { type: CollectionPresentationType.LIST },
      collection.placement ?? null,
      collection.fallback ?? { enabled: false },
      collection.audience ?? null,
      collection.metadata ?? null,
      collection.createdBy ?? null,
      collection.updatedBy ?? null,
      itemsCount,
      collection.createdAt.toISOString(),
      collection.updatedAt.toISOString(),
    );
  }

  private mapItem(item: CollectionItemEntity, summary?: ContentSummary): CollectionItemResponseDto {
    return new CollectionItemResponseDto(
      item.id,
      item.collectionId,
      item.contentType,
      item.contentId,
      item.type ?? CollectionItemType.CONTENT,
      item.position,
      item.isActive ?? true,
      item.startsAt ? item.startsAt.toISOString() : null,
      item.endsAt ? item.endsAt.toISOString() : null,
      item.display ?? null,
      item.link ?? { type: CollectionItemLinkType.NONE },
      item.metadata ?? null,
      summary?.title ?? null,
      summary?.status ?? null,
      summary?.locale ?? null,
      summary?.tags ?? null,
      summary?.slug ?? null,
      summary?.thumbnailUrl ?? null,
      summary?.publishedAt ?? null,
      item.createdBy ?? null,
      item.updatedBy ?? null,
      item.createdAt.toISOString(),
      item.updatedAt.toISOString(),
    );
  }

  private async getCollectionForApplication(applicationId: string, collectionId: string): Promise<CollectionEntity> {
    const collection = await this.collectionRepo.findOne({ where: { id: collectionId, applicationId } });
    if (!collection) {
      throw new NotFoundException('Collection not found.');
    }
    return collection;
  }

  private async resolveSummary(
    application: ApplicationEntity,
    item: Pick<CollectionItemEntity, 'contentType' | 'contentId'>,
  ): Promise<ContentSummary> {
    if (!item.contentType || !item.contentId) {
      return {
        title: null,
        status: null,
        locale: null,
        tags: null,
        slug: null,
        thumbnailUrl: null,
        publishedAt: null,
      };
    }
    if (item.contentType === ContentType.POST) {
      const post = await this.postRepo.findOne({ where: { id: item.contentId, applicationId: application.id } });
      return {
        title: post?.title ?? null,
        status: post?.status ?? null,
        locale: post?.locale ?? null,
        tags: post?.tags ?? null,
        slug: post?.slug ?? null,
        thumbnailUrl: post?.bannerKey
          ? this.baseUrl.buildMediaUrl(application, post.bannerKey)
          : this.publicMediaUrlService.toPublicMediaUrl(application, post?.bannerUrl ?? null),
        publishedAt: post?.publishedAt ? post.publishedAt.toISOString() : null,
      };
    }
    if (item.contentType === ContentType.ARTICLE) {
      const article = await this.articleRepo.findOne({ where: { id: item.contentId, applicationId: application.id } });
      return {
        title: article?.title ?? null,
        status: article?.status ?? null,
        locale: article?.locale ?? null,
        tags: article?.tags ?? null,
        slug: article?.slug ?? null,
        thumbnailUrl: article?.bannerKey
          ? this.baseUrl.buildMediaUrl(application, article.bannerKey)
          : this.publicMediaUrlService.toPublicMediaUrl(application, article?.bannerUrl ?? null),
        publishedAt: article?.publishedAt ? article.publishedAt.toISOString() : null,
      };
    }
    if (item.contentType === ContentType.VIDEO) {
      const video = await this.videoRepo.findOne({ where: { id: item.contentId, applicationId: application.id } });
      return {
        title: video?.title ?? null,
        status: video?.status ?? null,
        locale: video?.locale ?? null,
        tags: video?.tags ?? null,
        slug: null,
        thumbnailUrl: video?.posterKey
          ? this.baseUrl.buildMediaUrl(application, video.posterKey)
          : (video ? this.baseUrl.buildMediaUrl(application, video.objectKey) : null),
        publishedAt: video?.publishedAt ? video.publishedAt.toISOString() : null,
      };
    }
    if (item.contentType === ContentType.GALLERY) {
      const gallery = await this.galleryRepo.findOne({ where: { id: item.contentId, applicationId: application.id } });
      const firstImage = (gallery?.gallery || []).find((entry) => typeof entry.url === 'string' && entry.url.trim());
      return {
        title: gallery?.title ?? null,
        status: gallery?.status ?? null,
        locale: gallery?.locale ?? null,
        tags: gallery?.tags ?? null,
        slug: gallery?.slug ?? null,
        thumbnailUrl:
          firstImage && typeof firstImage.url === 'string'
            ? this.publicMediaUrlService.toPublicMediaUrl(application, firstImage.url)
            : null,
        publishedAt: gallery?.publishedAt ? gallery.publishedAt.toISOString() : null,
      };
    }
    const image = await this.imageRepo.findOne({ where: { id: item.contentId, applicationId: application.id } });
    return {
      title: image?.title ?? null,
      status: image?.status ?? null,
      locale: image?.locale ?? null,
      tags: image?.tags ?? null,
      slug: null,
      thumbnailUrl: image ? this.baseUrl.buildMediaUrl(application, image.objectKey) : null,
      publishedAt: image?.publishedAt ? image.publishedAt.toISOString() : null,
    };
  }

  private async validateContentOwnership(
    applicationId: string,
    contentType: ContentType,
    contentId: string,
  ): Promise<void> {
    if (contentType === ContentType.POST) {
      const post = await this.postRepo.findOne({ where: { id: contentId, applicationId } });
      if (!post) {
        throw new BadRequestException('Selected post does not exist for this application.');
      }
      return;
    }
    if (contentType === ContentType.ARTICLE) {
      const article = await this.articleRepo.findOne({ where: { id: contentId, applicationId } });
      if (!article) {
        throw new BadRequestException('Selected article does not exist for this application.');
      }
      return;
    }
    if (contentType === ContentType.VIDEO) {
      const video = await this.videoRepo.findOne({ where: { id: contentId, applicationId } });
      if (!video) {
        throw new BadRequestException('Selected video does not exist for this application.');
      }
      return;
    }
    if (contentType === ContentType.GALLERY) {
      const gallery = await this.galleryRepo.findOne({ where: { id: contentId, applicationId } });
      if (!gallery) {
        throw new BadRequestException('Selected gallery does not exist for this application.');
      }
      return;
    }
    const image = await this.imageRepo.findOne({ where: { id: contentId, applicationId } });
    if (!image) {
      throw new BadRequestException('Selected image does not exist for this application.');
    }
  }

  private async compactPositions(collectionId: string): Promise<void> {
    const items = await this.itemRepo.find({ where: { collectionId }, order: { position: 'ASC' } });
    for (let index = 0; index < items.length; index += 1) {
      items[index].position = index + 1;
    }
    if (items.length > 0) {
      await this.itemRepo.save(items);
    }
  }

  async listByApplication(
    applicationId: string,
    search: string | undefined,
    page: number,
    size: number,
  ): Promise<PageResponseDto<CollectionResponseDto>> {
    const pageNumber = Math.max(0, page);
    const pageSize = Math.max(1, size);
    const where = search?.trim()
      ? [
          { applicationId, title: ILike(`%${search.trim()}%`) },
          { applicationId, slug: ILike(`%${search.trim()}%`) },
        ]
      : { applicationId };
    const [collections, total] = await this.collectionRepo.findAndCount({
      where,
      order: { updatedAt: 'DESC', createdAt: 'DESC' },
      skip: pageNumber * pageSize,
      take: pageSize,
    });
    const ids = collections.map((collection) => collection.id);
    const counts = ids.length
      ? await this.itemRepo
          .createQueryBuilder('item')
          .select('item.collectionId', 'collectionId')
          .addSelect('COUNT(*)', 'count')
          .where('item.collectionId IN (:...ids)', { ids })
          .groupBy('item.collectionId')
          .getRawMany<{ collectionId: string; count: string }>()
      : [];
    const countMap = new Map(counts.map((row) => [row.collectionId, Number(row.count)]));
    const mapped = collections.map((collection) => this.mapCollection(collection, countMap.get(collection.id) ?? 0));
    return new PageResponseDto(mapped, total, Math.ceil(total / pageSize), pageNumber, pageSize);
  }

  async getByIdForApplication(applicationId: string, collectionId: string): Promise<CollectionResponseDto> {
    const collection = await this.getCollectionForApplication(applicationId, collectionId);
    const count = await this.itemRepo.count({ where: { collectionId: collection.id } });
    return this.mapCollection(collection, count);
  }

  async createForApplication(applicationId: string, request: CollectionUpsertRequestDto): Promise<CollectionResponseDto> {
    const title = request.title?.trim();
    if (!title) {
      throw new BadRequestException('Title is required.');
    }
    const slugValue = request.slug?.trim() || this.slugify(title);
    if (!slugValue) {
      throw new BadRequestException('Slug is required.');
    }
    const collection = this.collectionRepo.create({
      id: uuidv4(),
      applicationId,
      slug: slugValue,
      title,
      description: request.description?.trim() || null,
      allowedTypes: this.normalizeAllowedTypes(request.allowedTypes),
      maxItems: request.maxItems ?? null,
      isPublic: request.isPublic ?? true,
      status: request.status ?? CollectionStatus.DRAFT,
      priority: request.priority ?? 0,
      presentation: this.normalizePresentation(request.presentation),
      placement: this.normalizePlacement(request.placement),
      fallback: this.normalizeFallback(request.fallback),
      audience: this.normalizeAudience(request.audience),
      metadata: this.normalizeMetadata(request.metadata),
      createdBy: null,
      updatedBy: null,
    });
    try {
      const saved = await this.collectionRepo.save(collection);
      await this.auditLog.record({
        action: 'collection.create',
        entityType: 'collection',
        entityId: saved.id,
      });
      return this.mapCollection(saved, 0);
    } catch (error: unknown) {
      if ((error as { code?: string })?.code === '23505') {
        throw new BadRequestException('Collection slug must be unique per application.');
      }
      throw error;
    }
  }

  async updateForApplication(
    applicationId: string,
    collectionId: string,
    request: CollectionUpsertRequestDto,
  ): Promise<CollectionResponseDto> {
    const collection = await this.getCollectionForApplication(applicationId, collectionId);
    const title = request.title?.trim();
    if (!title) {
      throw new BadRequestException('Title is required.');
    }
    const slugValue = request.slug?.trim() || this.slugify(title);
    if (!slugValue) {
      throw new BadRequestException('Slug is required.');
    }
    collection.slug = slugValue;
    collection.title = title;
    collection.description = request.description?.trim() || null;
    collection.allowedTypes = this.normalizeAllowedTypes(request.allowedTypes);
    collection.maxItems = request.maxItems ?? null;
    collection.isPublic = request.isPublic ?? collection.isPublic;
    collection.status = request.status ?? collection.status ?? CollectionStatus.DRAFT;
    collection.priority = request.priority ?? collection.priority ?? 0;
    collection.presentation = this.normalizePresentation(request.presentation ?? collection.presentation);
    collection.placement = request.placement === undefined ? collection.placement ?? null : this.normalizePlacement(request.placement);
    collection.fallback = this.normalizeFallback(request.fallback ?? collection.fallback);
    collection.audience = request.audience === undefined ? collection.audience ?? null : this.normalizeAudience(request.audience);
    collection.metadata = request.metadata === undefined ? collection.metadata ?? null : this.normalizeMetadata(request.metadata);
    try {
      const saved = await this.collectionRepo.save(collection);
      const count = await this.itemRepo.count({ where: { collectionId: saved.id } });
      await this.auditLog.record({
        action: 'collection.update',
        entityType: 'collection',
        entityId: saved.id,
      });
      return this.mapCollection(saved, count);
    } catch (error: unknown) {
      if ((error as { code?: string })?.code === '23505') {
        throw new BadRequestException('Collection slug must be unique per application.');
      }
      throw error;
    }
  }

  async removeForApplication(applicationId: string, collectionId: string): Promise<void> {
    const collection = await this.getCollectionForApplication(applicationId, collectionId);
    const count = await this.itemRepo.count({ where: { collectionId } });
    if (count > 0) {
      throw new BadRequestException('Collection has items. Remove all items before deleting collection.');
    }
    await this.collectionRepo.remove(collection);
    await this.auditLog.record({
      action: 'collection.delete',
      entityType: 'collection',
      entityId: collectionId,
    });
  }

  async listItemsForApplication(applicationId: string, collectionId: string): Promise<CollectionItemResponseDto[]> {
    const collection = await this.getCollectionForApplication(applicationId, collectionId);
    const application = await this.applicationRepo.findOne({ where: { id: applicationId } });
    if (!application) {
      throw new NotFoundException('Application not found.');
    }
    const items = await this.itemRepo.find({ where: { collectionId: collection.id }, order: { position: 'ASC' } });
    const summaries = await Promise.all(items.map((item) => this.resolveSummary(application, item)));
    return items.map((item, index) => this.mapItem(item, summaries[index]));
  }

  async addItemForApplication(
    applicationId: string,
    collectionId: string,
    request: CollectionItemAddRequestDto,
  ): Promise<CollectionItemResponseDto> {
    const collection = await this.getCollectionForApplication(applicationId, collectionId);
    const itemType = request.type ?? CollectionItemType.CONTENT;
    const contentType = request.contentType ?? null;
    const contentId = request.contentId?.trim() || null;
    const display = this.normalizeDisplay(request.display);
    const link = this.normalizeLink(request.link);
    const metadata = this.normalizeItemMetadata(request.metadata);
    const startsAt = this.parseOptionalDate(request.startsAt);
    const endsAt = this.parseOptionalDate(request.endsAt);
    this.validateSchedule(startsAt, endsAt);
    this.validateLink(link);

    if (itemType === CollectionItemType.CONTENT) {
      if (!contentType || !contentId) {
        throw new BadRequestException('Content items require contentType and contentId.');
      }
      if (collection.allowedTypes && !collection.allowedTypes.includes(contentType)) {
        throw new BadRequestException('Content type is not allowed for this collection.');
      }
      await this.validateContentOwnership(applicationId, contentType, contentId);
    } else {
      this.validateCustomDisplay(display);
    }
    const maxItems = collection.maxItems ?? null;
    const created = await this.dataSource.transaction(async (manager) => {
      const transactionalRepo = manager.getRepository(CollectionItemEntity);
      const count = await transactionalRepo.count({ where: { collectionId } });
      if (maxItems && count >= maxItems) {
        throw new BadRequestException('Collection is full.');
      }
      const newPosition = request.position ? Math.max(1, request.position) : count + 1;
      if (newPosition <= count) {
        await manager
          .createQueryBuilder()
          .update(CollectionItemEntity)
          .set({ position: () => '"position" + 1' })
          .where('"collection_id" = :collectionId AND "position" >= :newPosition', { collectionId, newPosition })
          .execute();
      }
      const item = transactionalRepo.create({
        id: uuidv4(),
        collectionId,
        contentType,
        contentId,
        type: itemType,
        position: newPosition,
        isActive: request.isActive ?? true,
        startsAt,
        endsAt,
        display,
        link,
        metadata,
        createdBy: null,
        updatedBy: null,
      });
      try {
        return await transactionalRepo.save(item);
      } catch (error: unknown) {
        if ((error as { code?: string })?.code === '23505') {
          throw new BadRequestException('This content already exists in the collection.');
        }
        throw error;
      }
    });
    await this.auditLog.record({
      action: 'collection.item.add',
      entityType: 'collection',
      entityId: collectionId,
      metadata: {
        itemId: created.id,
        contentType: created.contentType,
        contentId: created.contentId,
        type: created.type,
      },
    });
    const application = await this.applicationRepo.findOne({ where: { id: applicationId } });
    if (!application) {
      throw new NotFoundException('Application not found.');
    }
    const summary = await this.resolveSummary(application, created);
    return this.mapItem(created, summary);
  }

  async updateItemForApplication(
    applicationId: string,
    collectionId: string,
    itemId: string,
    request: CollectionItemAddRequestDto,
  ): Promise<CollectionItemResponseDto> {
    await this.getCollectionForApplication(applicationId, collectionId);
    const item = await this.itemRepo.findOne({ where: { id: itemId, collectionId } });
    if (!item) {
      throw new NotFoundException('Collection item not found.');
    }
    const display = request.display === undefined ? item.display : this.normalizeDisplay(request.display);
    const link = request.link === undefined ? item.link ?? { type: CollectionItemLinkType.NONE } : this.normalizeLink(request.link);
    const startsAt = request.startsAt === undefined ? item.startsAt : this.parseOptionalDate(request.startsAt);
    const endsAt = request.endsAt === undefined ? item.endsAt : this.parseOptionalDate(request.endsAt);
    this.validateSchedule(startsAt, endsAt);
    this.validateLink(link);
    if ((item.type ?? CollectionItemType.CONTENT) === CollectionItemType.CUSTOM) {
      this.validateCustomDisplay(display);
    }
    item.isActive = request.isActive ?? item.isActive;
    item.startsAt = startsAt;
    item.endsAt = endsAt;
    item.display = display;
    item.link = link;
    item.metadata = request.metadata === undefined ? item.metadata : this.normalizeItemMetadata(request.metadata);
    item.updatedBy = null;
    const saved = await this.itemRepo.save(item);
    const application = await this.applicationRepo.findOne({ where: { id: applicationId } });
    if (!application) {
      throw new NotFoundException('Application not found.');
    }
    const summary = await this.resolveSummary(application, saved);
    return this.mapItem(saved, summary);
  }

  async removeItemByContentForApplication(
    applicationId: string,
    collectionId: string,
    request: CollectionItemRemoveRequestDto,
  ): Promise<void> {
    await this.getCollectionForApplication(applicationId, collectionId);
    const existing = request.itemId
      ? await this.itemRepo.findOne({ where: { id: request.itemId, collectionId } })
      : request.contentId && request.contentType
        ? await this.itemRepo.findOne({
            where: { collectionId, contentId: request.contentId, contentType: request.contentType },
          })
        : null;
    if (!existing) {
      throw new NotFoundException('Collection item not found.');
    }
    await this.itemRepo.remove(existing);
    await this.compactPositions(collectionId);
    await this.auditLog.record({
      action: 'collection.item.remove',
      entityType: 'collection',
      entityId: collectionId,
      metadata: { itemId: existing.id, contentType: existing.contentType, contentId: existing.contentId },
    });
  }

  async reorderForApplication(
    applicationId: string,
    collectionId: string,
    request: CollectionReorderRequestDto,
  ): Promise<CollectionItemResponseDto[]> {
    await this.getCollectionForApplication(applicationId, collectionId);
    const items = await this.itemRepo.find({ where: { collectionId } });
    if (items.length === 0) {
      return [];
    }
    const keyed = new Map(items.map((item) => [`${item.contentType}:${item.contentId}`, item]));
    const byId = new Map(items.map((item) => [item.id, item]));
    const requestedByItem = request.items ?? [];
    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(CollectionItemEntity);
      if (requestedByItem.length > 0) {
        if (requestedByItem.length !== items.length) {
          throw new BadRequestException('Reorder request must include every collection item.');
        }
        const positions = new Set<number>();
        for (const entry of requestedByItem) {
          const found = entry.itemId ? byId.get(entry.itemId) : keyed.get(`${entry.contentType}:${entry.contentId}`);
          if (!found) {
            throw new BadRequestException('Reorder request contains unknown content.');
          }
          if (positions.has(entry.position)) {
            throw new BadRequestException('Reorder request has duplicate positions.');
          }
          positions.add(entry.position);
          found.position = entry.position;
        }
        await repo.save(Array.from(keyed.values()));
        return;
      }
      const orderedItemIds = request.orderedItemIds ?? [];
      if (orderedItemIds.length !== items.length) {
        throw new BadRequestException('Ordered list must include all collection items.');
      }
      for (let index = 0; index < orderedItemIds.length; index += 1) {
        const id = orderedItemIds[index];
        const found = byId.get(id);
        if (!found) {
          throw new BadRequestException('Ordered list contains unknown item.');
        }
        found.position = index + 1;
      }
      await repo.save(Array.from(byId.values()));
    });
    await this.compactPositions(collectionId);
    await this.auditLog.record({
      action: 'collection.item.reorder',
      entityType: 'collection',
      entityId: collectionId,
    });
    return await this.listItemsForApplication(applicationId, collectionId);
  }

  async list(applicationId: string): Promise<CollectionResponseDto[]> {
    const page = await this.listByApplication(applicationId, undefined, 0, 1000);
    return page.items;
  }

  async getById(id: string): Promise<CollectionResponseDto> {
    const collection = await this.collectionRepo.findOne({ where: { id } });
    if (!collection) {
      throw new NotFoundException('Collection not found.');
    }
    return this.getByIdForApplication(collection.applicationId, id);
  }

  async create(request: CollectionUpsertRequestDto): Promise<CollectionResponseDto> {
    if (!request.applicationId) {
      throw new BadRequestException('applicationId is required.');
    }
    return this.createForApplication(request.applicationId, request);
  }

  async update(id: string, request: CollectionUpsertRequestDto): Promise<CollectionResponseDto> {
    const collection = await this.collectionRepo.findOne({ where: { id } });
    if (!collection) {
      throw new NotFoundException('Collection not found.');
    }
    return this.updateForApplication(collection.applicationId, id, request);
  }

  async remove(id: string): Promise<void> {
    const collection = await this.collectionRepo.findOne({ where: { id } });
    if (!collection) {
      throw new NotFoundException('Collection not found.');
    }
    await this.removeForApplication(collection.applicationId, id);
  }

  async listItems(collectionId: string): Promise<CollectionItemResponseDto[]> {
    const collection = await this.collectionRepo.findOne({ where: { id: collectionId } });
    if (!collection) {
      throw new NotFoundException('Collection not found.');
    }
    return this.listItemsForApplication(collection.applicationId, collectionId);
  }

  async addItem(collectionId: string, request: CollectionItemAddRequestDto): Promise<CollectionItemResponseDto> {
    const collection = await this.collectionRepo.findOne({ where: { id: collectionId } });
    if (!collection) {
      throw new NotFoundException('Collection not found.');
    }
    return this.addItemForApplication(collection.applicationId, collectionId, request);
  }

  async removeItem(collectionId: string, itemId: string): Promise<void> {
    const collection = await this.collectionRepo.findOne({ where: { id: collectionId } });
    if (!collection) {
      throw new NotFoundException('Collection not found.');
    }
    const existing = await this.itemRepo.findOne({ where: { id: itemId, collectionId } });
    if (!existing) {
      throw new NotFoundException('Collection item not found.');
    }
    await this.removeItemByContentForApplication(collection.applicationId, collectionId, {
      itemId: existing.id,
    });
  }

  async reorder(collectionId: string, request: CollectionReorderRequestDto): Promise<CollectionItemResponseDto[]> {
    const collection = await this.collectionRepo.findOne({ where: { id: collectionId } });
    if (!collection) {
      throw new NotFoundException('Collection not found.');
    }
    return this.reorderForApplication(collection.applicationId, collectionId, request);
  }

  async collectionsForContent(
    applicationId: string,
    contentType: ContentType,
    contentId: string,
  ): Promise<CollectionItemResponseDto[]> {
    const application = await this.applicationRepo.findOne({ where: { id: applicationId } });
    if (!application) {
      throw new NotFoundException('Application not found.');
    }
    const collectionItems = await this.itemRepo.find({ where: { contentType, contentId }, order: { position: 'ASC' } });
    const collectionIds = collectionItems.map((item) => item.collectionId);
    const collections = collectionIds.length
      ? await this.collectionRepo.find({ where: { id: In(collectionIds), applicationId } })
      : [];
    const allowedCollectionIds = new Set(collections.map((collection) => collection.id));
    const filtered = collectionItems.filter((item) => allowedCollectionIds.has(item.collectionId));
    const summary = await this.resolveSummary(application, { contentType, contentId });
    return filtered.map((item) => this.mapItem(item, summary));
  }
}
