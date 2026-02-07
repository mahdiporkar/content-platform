import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { AdminCollectionService } from '../services/admin-collection.service';
import { CollectionUpsertRequestDto } from '../dto/requests/collection-upsert-request.dto';
import { CollectionItemAddRequestDto } from '../dto/requests/collection-item-add-request.dto';
import { CollectionReorderRequestDto } from '../dto/requests/collection-reorder-request.dto';
import { CollectionResponseDto } from '../dto/responses/collection-response.dto';
import { CollectionItemResponseDto } from '../dto/responses/collection-item-response.dto';

@Controller('/api/v1/admin/collections')
export class AdminCollectionController {
  constructor(private readonly collectionService: AdminCollectionService) {}

  @Get()
  async list(@Query('applicationId') applicationId: string): Promise<CollectionResponseDto[]> {
    return await this.collectionService.list(applicationId);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<CollectionResponseDto> {
    return await this.collectionService.getById(id);
  }

  @Post()
  async create(@Body() request: CollectionUpsertRequestDto): Promise<CollectionResponseDto> {
    return await this.collectionService.create(request);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() request: CollectionUpsertRequestDto,
  ): Promise<CollectionResponseDto> {
    return await this.collectionService.update(id, request);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ id: string }> {
    await this.collectionService.remove(id);
    return { id };
  }

  @Get(':id/items')
  async listItems(@Param('id') id: string): Promise<CollectionItemResponseDto[]> {
    return await this.collectionService.listItems(id);
  }

  @Post(':id/items')
  async addItem(
    @Param('id') id: string,
    @Body() request: CollectionItemAddRequestDto,
  ): Promise<CollectionItemResponseDto> {
    return await this.collectionService.addItem(id, request);
  }

  @Delete(':id/items/:itemId')
  async removeItem(@Param('id') id: string, @Param('itemId') itemId: string): Promise<{ id: string }> {
    await this.collectionService.removeItem(id, itemId);
    return { id: itemId };
  }

  @Put(':id/items/reorder')
  async reorder(
    @Param('id') id: string,
    @Body() request: CollectionReorderRequestDto,
  ): Promise<CollectionItemResponseDto[]> {
    return await this.collectionService.reorder(id, request);
  }
}
