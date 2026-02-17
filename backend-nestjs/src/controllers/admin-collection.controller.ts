import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AdminCollectionService } from '../services/admin-collection.service';
import { CollectionUpsertRequestDto } from '../dto/requests/collection-upsert-request.dto';
import { CollectionItemAddRequestDto } from '../dto/requests/collection-item-add-request.dto';
import { CollectionReorderRequestDto } from '../dto/requests/collection-reorder-request.dto';
import { CollectionResponseDto } from '../dto/responses/collection-response.dto';
import { CollectionItemResponseDto } from '../dto/responses/collection-item-response.dto';
import { AdminAuthorizationService } from '../auth/admin-authorization.service';
import { ServicePermission } from '../auth/admin-permissions';

@Controller('/api/v1/admin/collections')
export class AdminCollectionController {
  constructor(
    private readonly collectionService: AdminCollectionService,
    private readonly access: AdminAuthorizationService,
  ) {}

  @Get()
  async list(
    @Req() request: Request,
    @Query('applicationId') applicationId: string,
  ): Promise<CollectionResponseDto[]> {
    this.access.assertServiceAccess(request, ServicePermission.COLLECTIONS_MANAGE, applicationId);
    return await this.collectionService.list(applicationId);
  }

  @Get(':id')
  async getById(@Req() request: Request, @Param('id') id: string): Promise<CollectionResponseDto> {
    this.access.assertSuperAdmin(request);
    return await this.collectionService.getById(id);
  }

  @Post()
  async create(@Req() request: Request, @Body() body: CollectionUpsertRequestDto): Promise<CollectionResponseDto> {
    this.access.assertSuperAdmin(request);
    return await this.collectionService.create(body);
  }

  @Put(':id')
  async update(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() body: CollectionUpsertRequestDto,
  ): Promise<CollectionResponseDto> {
    this.access.assertSuperAdmin(request);
    return await this.collectionService.update(id, body);
  }

  @Delete(':id')
  async remove(@Req() request: Request, @Param('id') id: string): Promise<{ id: string }> {
    this.access.assertSuperAdmin(request);
    await this.collectionService.remove(id);
    return { id };
  }

  @Get(':id/items')
  async listItems(@Req() request: Request, @Param('id') id: string): Promise<CollectionItemResponseDto[]> {
    this.access.assertSuperAdmin(request);
    return await this.collectionService.listItems(id);
  }

  @Post(':id/items')
  async addItem(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() body: CollectionItemAddRequestDto,
  ): Promise<CollectionItemResponseDto> {
    this.access.assertSuperAdmin(request);
    return await this.collectionService.addItem(id, body);
  }

  @Delete(':id/items/:itemId')
  async removeItem(
    @Req() request: Request,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ): Promise<{ id: string }> {
    this.access.assertSuperAdmin(request);
    await this.collectionService.removeItem(id, itemId);
    return { id: itemId };
  }

  @Put(':id/items/reorder')
  async reorder(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() body: CollectionReorderRequestDto,
  ): Promise<CollectionItemResponseDto[]> {
    this.access.assertSuperAdmin(request);
    return await this.collectionService.reorder(id, body);
  }
}
