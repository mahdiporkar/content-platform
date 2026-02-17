import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AdminCollectionService } from '../services/admin-collection.service';
import { CollectionUpsertRequestDto } from '../dto/requests/collection-upsert-request.dto';
import { CollectionItemAddRequestDto } from '../dto/requests/collection-item-add-request.dto';
import { CollectionItemRemoveRequestDto } from '../dto/requests/collection-item-remove-request.dto';
import { CollectionReorderRequestDto } from '../dto/requests/collection-reorder-request.dto';
import { CollectionResponseDto } from '../dto/responses/collection-response.dto';
import { CollectionItemResponseDto } from '../dto/responses/collection-item-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';
import { AdminAuthorizationService } from '../auth/admin-authorization.service';
import { ServicePermission } from '../auth/admin-permissions';

@Controller('/api/v1/admin/apps/:appId/collections')
export class AdminAppCollectionController {
  constructor(
    private readonly collectionService: AdminCollectionService,
    private readonly access: AdminAuthorizationService,
  ) {}

  @Get()
  async list(
    @Req() request: Request,
    @Param('appId') appId: string,
    @Query('search') search?: string,
    @Query('page') page = '0',
    @Query('size') size = '10',
  ): Promise<PageResponseDto<CollectionResponseDto>> {
    this.access.assertServiceAccess(request, ServicePermission.COLLECTIONS_MANAGE, appId);
    return await this.collectionService.listByApplication(appId, search, Number(page), Number(size));
  }

  @Get(':collectionId')
  async getById(
    @Req() request: Request,
    @Param('appId') appId: string,
    @Param('collectionId') collectionId: string,
  ): Promise<CollectionResponseDto> {
    this.access.assertServiceAccess(request, ServicePermission.COLLECTIONS_MANAGE, appId);
    return await this.collectionService.getByIdForApplication(appId, collectionId);
  }

  @Post()
  async create(
    @Req() request: Request,
    @Param('appId') appId: string,
    @Body() body: CollectionUpsertRequestDto,
  ): Promise<CollectionResponseDto> {
    this.access.assertServiceAccess(request, ServicePermission.COLLECTIONS_MANAGE, appId);
    return await this.collectionService.createForApplication(appId, body);
  }

  @Patch(':collectionId')
  async update(
    @Req() request: Request,
    @Param('appId') appId: string,
    @Param('collectionId') collectionId: string,
    @Body() body: CollectionUpsertRequestDto,
  ): Promise<CollectionResponseDto> {
    this.access.assertServiceAccess(request, ServicePermission.COLLECTIONS_MANAGE, appId);
    return await this.collectionService.updateForApplication(appId, collectionId, body);
  }

  @Delete(':collectionId')
  async remove(
    @Req() request: Request,
    @Param('appId') appId: string,
    @Param('collectionId') collectionId: string,
  ): Promise<{ id: string }> {
    this.access.assertServiceAccess(request, ServicePermission.COLLECTIONS_MANAGE, appId);
    await this.collectionService.removeForApplication(appId, collectionId);
    return { id: collectionId };
  }

  @Get(':collectionId/items')
  async listItems(
    @Req() request: Request,
    @Param('appId') appId: string,
    @Param('collectionId') collectionId: string,
  ): Promise<CollectionItemResponseDto[]> {
    this.access.assertServiceAccess(request, ServicePermission.COLLECTIONS_MANAGE, appId);
    return await this.collectionService.listItemsForApplication(appId, collectionId);
  }

  @Post(':collectionId/items')
  async addItem(
    @Req() request: Request,
    @Param('appId') appId: string,
    @Param('collectionId') collectionId: string,
    @Body() body: CollectionItemAddRequestDto,
  ): Promise<CollectionItemResponseDto> {
    this.access.assertServiceAccess(request, ServicePermission.COLLECTIONS_MANAGE, appId);
    return await this.collectionService.addItemForApplication(appId, collectionId, body);
  }

  @Delete(':collectionId/items')
  async removeItemByContent(
    @Req() request: Request,
    @Param('appId') appId: string,
    @Param('collectionId') collectionId: string,
    @Body() body: CollectionItemRemoveRequestDto,
  ): Promise<{ ok: boolean }> {
    this.access.assertServiceAccess(request, ServicePermission.COLLECTIONS_MANAGE, appId);
    await this.collectionService.removeItemByContentForApplication(appId, collectionId, body);
    return { ok: true };
  }

  @Patch(':collectionId/items/reorder')
  async reorder(
    @Req() request: Request,
    @Param('appId') appId: string,
    @Param('collectionId') collectionId: string,
    @Body() body: CollectionReorderRequestDto,
  ): Promise<CollectionItemResponseDto[]> {
    this.access.assertServiceAccess(request, ServicePermission.COLLECTIONS_MANAGE, appId);
    return await this.collectionService.reorderForApplication(appId, collectionId, body);
  }
}
