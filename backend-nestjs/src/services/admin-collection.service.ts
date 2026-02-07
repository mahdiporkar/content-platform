import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CollectionEntity } from '../entities/collection.entity';
import { CollectionItemEntity } from '../entities/collection-item.entity';
import { CollectionUpsertRequestDto } from '../dto/requests/collection-upsert-request.dto';
import { CollectionItemAddRequestDto } from '../dto/requests/collection-item-add-request.dto';
import { CollectionReorderRequestDto } from '../dto/requests/collection-reorder-request.dto';
import { CollectionResponseDto } from '../dto/responses/collection-response.dto';
import { CollectionItemResponseDto } from '../dto/responses/collection-item-response.dto';
import { ContentType } from '../common/content-type.enum';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class AdminCollectionService {
  constructor(
    @InjectRepository(CollectionEntity)
    private readonly collectionRepo: Repository<CollectionEntity>,
    @InjectRepository(CollectionItemEntity)
    private readonly itemRepo: Repository<CollectionItemEntity>,
    private readonly auditLog: AuditLogService,
  ) {}

  private mapCollection(collection: CollectionEntity): CollectionResponseDto {
    return new CollectionResponseDto(
      collection.id,
      collection.applicationId,
      collection.slug,
      collection.title,
      collection.description ?? null,
      collection.allowedTypes ?? null,
      collection.maxItems ?? null,
      collection.createdAt.toISOString(),
      collection.updatedAt.toISOString(),
    );
  }

  private mapItem(item: CollectionItemEntity): CollectionItemResponseDto {
    return new CollectionItemResponseDto(
      item.id,
      item.collectionId,
      item.contentType,
      item.contentId,
      item.position,
      item.createdAt.toISOString(),
      item.updatedAt.toISOString(),
    );
  }

  async list(applicationId: string): Promise<CollectionResponseDto[]> {
    const collections = await this.collectionRepo.find({ where: { applicationId }, order: { title: 'ASC' } });
    return collections.map((collection) => this.mapCollection(collection));
  }

  async getById(id: string): Promise<CollectionResponseDto> {
    const collection = await this.collectionRepo.findOne({ where: { id } });
    if (!collection) {
      throw new NotFoundException('Collection not found.');
    }
    return this.mapCollection(collection);
  }

  async create(request: CollectionUpsertRequestDto): Promise<CollectionResponseDto> {
    const collection = this.collectionRepo.create({
      id: uuidv4(),
      applicationId: request.applicationId.trim(),
      slug: request.slug.trim(),
      title: request.title.trim(),
      description: request.description?.trim() || null,
      allowedTypes: request.allowedTypes?.map((t) => t.trim()) || null,
      maxItems: request.maxItems ?? null,
    });
    const saved = await this.collectionRepo.save(collection);
    await this.auditLog.record({
      action: 'collection.create',
      entityType: 'collection',
      entityId: saved.id,
    });
    return this.mapCollection(saved);
  }

  async update(id: string, request: CollectionUpsertRequestDto): Promise<CollectionResponseDto> {
    const collection = await this.collectionRepo.findOne({ where: { id } });
    if (!collection) {
      throw new NotFoundException('Collection not found.');
    }
    collection.slug = request.slug.trim();
    collection.title = request.title.trim();
    collection.description = request.description?.trim() || null;
    collection.allowedTypes = request.allowedTypes?.map((t) => t.trim()) || null;
    collection.maxItems = request.maxItems ?? null;
    const saved = await this.collectionRepo.save(collection);
    await this.auditLog.record({
      action: 'collection.update',
      entityType: 'collection',
      entityId: saved.id,
    });
    return this.mapCollection(saved);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.collectionRepo.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Collection not found.');
    }
    await this.collectionRepo.remove(existing);
    await this.itemRepo.delete({ collectionId: id });
    await this.auditLog.record({
      action: 'collection.delete',
      entityType: 'collection',
      entityId: id,
    });
  }

  async listItems(collectionId: string): Promise<CollectionItemResponseDto[]> {
    const items = await this.itemRepo.find({ where: { collectionId }, order: { position: 'ASC' } });
    return items.map((item) => this.mapItem(item));
  }

  async addItem(collectionId: string, request: CollectionItemAddRequestDto): Promise<CollectionItemResponseDto> {
    const collection = await this.collectionRepo.findOne({ where: { id: collectionId } });
    if (!collection) {
      throw new NotFoundException('Collection not found.');
    }
    if (collection.allowedTypes && !collection.allowedTypes.includes(request.contentType)) {
      throw new BadRequestException('Content type not allowed for this collection.');
    }
    if (collection.maxItems) {
      const count = await this.itemRepo.count({ where: { collectionId } });
      if (count >= collection.maxItems) {
        throw new BadRequestException('Collection is full.');
      }
    }
    const position =
      request.position ??
      (await this.itemRepo
        .createQueryBuilder('item')
        .select('COALESCE(MAX(item.position), -1)', 'max')
        .where('item.collectionId = :collectionId', { collectionId })
        .getRawOne()
        .then((row) => Number(row?.max ?? -1) + 1));
    const item = this.itemRepo.create({
      id: uuidv4(),
      collectionId,
      contentType: request.contentType as ContentType,
      contentId: request.contentId,
      position,
    });
    const saved = await this.itemRepo.save(item);
    await this.auditLog.record({
      action: 'collection.item.add',
      entityType: 'collection',
      entityId: collectionId,
      metadata: { itemId: saved.id, contentId: saved.contentId, contentType: saved.contentType },
    });
    return this.mapItem(saved);
  }

  async removeItem(collectionId: string, itemId: string): Promise<void> {
    const item = await this.itemRepo.findOne({ where: { id: itemId, collectionId } });
    if (!item) {
      throw new NotFoundException('Collection item not found.');
    }
    await this.itemRepo.remove(item);
    await this.auditLog.record({
      action: 'collection.item.remove',
      entityType: 'collection',
      entityId: collectionId,
      metadata: { itemId },
    });
  }

  async reorder(collectionId: string, request: CollectionReorderRequestDto): Promise<CollectionItemResponseDto[]> {
    const items = await this.itemRepo.find({ where: { collectionId } });
    const existingIds = new Set(items.map((item) => item.id));
    const filtered = request.orderedItemIds.filter((id) => existingIds.has(id));
    if (filtered.length !== items.length) {
      throw new BadRequestException('Ordered list must include all items.');
    }
    for (let index = 0; index < filtered.length; index += 1) {
      const id = filtered[index];
      const item = items.find((entry) => entry.id === id);
      if (item) {
        item.position = index;
      }
    }
    const saved = await this.itemRepo.save(items);
    await this.auditLog.record({
      action: 'collection.item.reorder',
      entityType: 'collection',
      entityId: collectionId,
    });
    return saved.sort((a, b) => a.position - b.position).map((item) => this.mapItem(item));
  }
}
