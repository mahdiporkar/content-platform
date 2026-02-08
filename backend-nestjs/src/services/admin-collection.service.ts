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
import { BaseUrlService } from './base-url.service';
import { ApplicationEntity } from '../entities/application.entity';

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
    @InjectRepository(ImageEntity)
    private readonly imageRepo: Repository<ImageEntity>,
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepo: Repository<ApplicationEntity>,
    private readonly baseUrl: BaseUrlService,
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
      item.position,
      summary?.title ?? null,
      summary?.status ?? null,
      summary?.locale ?? null,
      summary?.tags ?? null,
      summary?.slug ?? null,
      summary?.thumbnailUrl ?? null,
      summary?.publishedAt ?? null,
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
          : (post?.bannerUrl ?? null),
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
          : (article?.bannerUrl ?? null),
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
    if (collection.allowedTypes && !collection.allowedTypes.includes(request.contentType)) {
      throw new BadRequestException('Content type is not allowed for this collection.');
    }
    await this.validateContentOwnership(applicationId, request.contentType, request.contentId);
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
        contentType: request.contentType,
        contentId: request.contentId.trim(),
        position: newPosition,
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
      },
    });
    const application = await this.applicationRepo.findOne({ where: { id: applicationId } });
    if (!application) {
      throw new NotFoundException('Application not found.');
    }
    const summary = await this.resolveSummary(application, created);
    return this.mapItem(created, summary);
  }

  async removeItemByContentForApplication(
    applicationId: string,
    collectionId: string,
    request: CollectionItemRemoveRequestDto,
  ): Promise<void> {
    await this.getCollectionForApplication(applicationId, collectionId);
    const existing = await this.itemRepo.findOne({
      where: { collectionId, contentId: request.contentId, contentType: request.contentType },
    });
    if (!existing) {
      throw new NotFoundException('Collection item not found.');
    }
    await this.itemRepo.remove(existing);
    await this.compactPositions(collectionId);
    await this.auditLog.record({
      action: 'collection.item.remove',
      entityType: 'collection',
      entityId: collectionId,
      metadata: { contentType: request.contentType, contentId: request.contentId },
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
          const key = `${entry.contentType}:${entry.contentId}`;
          const found = keyed.get(key);
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
      contentType: existing.contentType,
      contentId: existing.contentId,
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
