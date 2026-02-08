import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AdminCollectionService } from '../services/admin-collection.service';
import { CollectionUpsertRequestDto } from '../dto/requests/collection-upsert-request.dto';
import { CollectionItemAddRequestDto } from '../dto/requests/collection-item-add-request.dto';
import { CollectionItemRemoveRequestDto } from '../dto/requests/collection-item-remove-request.dto';
import { CollectionReorderRequestDto } from '../dto/requests/collection-reorder-request.dto';
import { CollectionResponseDto } from '../dto/responses/collection-response.dto';
import { CollectionItemResponseDto } from '../dto/responses/collection-item-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';

@Controller('/api/v1/admin/apps/:appId/collections')
export class AdminAppCollectionController {
  constructor(private readonly collectionService: AdminCollectionService) {}

  @Get()
  async list(
    @Param('appId') appId: string,
    @Query('search') search?: string,
    @Query('page') page = '0',
    @Query('size') size = '10',
  ): Promise<PageResponseDto<CollectionResponseDto>> {
    return await this.collectionService.listByApplication(appId, search, Number(page), Number(size));
  }

  @Get(':collectionId')
  async getById(
    @Param('appId') appId: string,
    @Param('collectionId') collectionId: string,
  ): Promise<CollectionResponseDto> {
    return await this.collectionService.getByIdForApplication(appId, collectionId);
  }

  @Post()
  async create(
    @Param('appId') appId: string,
    @Body() request: CollectionUpsertRequestDto,
  ): Promise<CollectionResponseDto> {
    return await this.collectionService.createForApplication(appId, request);
  }

  @Patch(':collectionId')
  async update(
    @Param('appId') appId: string,
    @Param('collectionId') collectionId: string,
    @Body() request: CollectionUpsertRequestDto,
  ): Promise<CollectionResponseDto> {
    return await this.collectionService.updateForApplication(appId, collectionId, request);
  }

  @Delete(':collectionId')
  async remove(@Param('appId') appId: string, @Param('collectionId') collectionId: string): Promise<{ id: string }> {
    await this.collectionService.removeForApplication(appId, collectionId);
    return { id: collectionId };
  }

  @Get(':collectionId/items')
  async listItems(
    @Param('appId') appId: string,
    @Param('collectionId') collectionId: string,
  ): Promise<CollectionItemResponseDto[]> {
    return await this.collectionService.listItemsForApplication(appId, collectionId);
  }

  @Post(':collectionId/items')
  async addItem(
    @Param('appId') appId: string,
    @Param('collectionId') collectionId: string,
    @Body() request: CollectionItemAddRequestDto,
  ): Promise<CollectionItemResponseDto> {
    return await this.collectionService.addItemForApplication(appId, collectionId, request);
  }

  @Delete(':collectionId/items')
  async removeItemByContent(
    @Param('appId') appId: string,
    @Param('collectionId') collectionId: string,
    @Body() request: CollectionItemRemoveRequestDto,
  ): Promise<{ ok: boolean }> {
    await this.collectionService.removeItemByContentForApplication(appId, collectionId, request);
    return { ok: true };
  }

  @Patch(':collectionId/items/reorder')
  async reorder(
    @Param('appId') appId: string,
    @Param('collectionId') collectionId: string,
    @Body() request: CollectionReorderRequestDto,
  ): Promise<CollectionItemResponseDto[]> {
    return await this.collectionService.reorderForApplication(appId, collectionId, request);
  }
}
