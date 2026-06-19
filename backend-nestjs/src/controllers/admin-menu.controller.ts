import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AdminAuthorizationService } from '../auth/admin-authorization.service';
import { ServicePermission } from '../auth/admin-permissions';
import { MenuStatus } from '../common/menu-types';
import { MenuItemUpsertRequestDto } from '../dto/requests/menu-item-upsert-request.dto';
import { MenuItemsLayoutRequestDto } from '../dto/requests/menu-items-layout-request.dto';
import { MenuStatusRequestDto } from '../dto/requests/menu-status-request.dto';
import { MenuUpsertRequestDto } from '../dto/requests/menu-upsert-request.dto';
import { MenuResponseDto } from '../dto/responses/menu-response.dto';
import { AdminMenuService, MenuContentCandidateDto } from '../services/admin-menu.service';
import { TenantRouteSyncRequestDto } from '../dto/requests/tenant-route-sync-request.dto';
import { TenantRouteService } from '../services/tenant-route.service';

@Controller('/api/v1/admin/menus')
export class AdminMenuController {
  constructor(
    private readonly menuService: AdminMenuService,
    private readonly access: AdminAuthorizationService,
    private readonly tenantRouteService: TenantRouteService,
  ) {}

  @Put('routes/sync')
  async syncTenantRoutes(
    @Req() request: Request,
    @Body() body: TenantRouteSyncRequestDto,
  ) {
    const applicationId = this.access.getApplicationId(request);
    this.access.assertServiceAccess(request, ServicePermission.MENUS_MANAGE, applicationId);
    return this.tenantRouteService.syncByApplicationId(applicationId, body);
  }

  @Post()
  async create(@Req() request: Request, @Body() body: MenuUpsertRequestDto): Promise<MenuResponseDto> {
    const applicationId = this.access.getApplicationId(request);
    this.access.assertServiceAccess(request, ServicePermission.MENUS_MANAGE, applicationId);
    return this.menuService.create({ ...body, applicationId });
  }

  @Put(':id')
  async update(@Req() request: Request, @Param('id') id: string, @Body() body: MenuUpsertRequestDto): Promise<MenuResponseDto> {
    const applicationId = await this.menuService.getApplicationIdById(id);
    this.access.assertServiceAccess(request, ServicePermission.MENUS_MANAGE, applicationId);
    return this.menuService.update(id, body);
  }

  @Patch(':id/status')
  async changeStatus(@Req() request: Request, @Param('id') id: string, @Body() body: MenuStatusRequestDto): Promise<MenuResponseDto> {
    const applicationId = await this.menuService.getApplicationIdById(id);
    this.access.assertServiceAccess(request, ServicePermission.MENUS_MANAGE, applicationId);
    return this.menuService.changeStatus(id, body.status);
  }

  @Delete(':id')
  async delete(@Req() request: Request, @Param('id') id: string): Promise<{ ok: boolean }> {
    const applicationId = await this.menuService.getApplicationIdById(id);
    this.access.assertServiceAccess(request, ServicePermission.MENUS_MANAGE, applicationId);
    await this.menuService.delete(id);
    return { ok: true };
  }

  @Get(':id')
  async get(@Req() request: Request, @Param('id') id: string): Promise<MenuResponseDto> {
    const applicationId = await this.menuService.getApplicationIdById(id);
    this.access.assertServiceAccess(request, ServicePermission.MENUS_MANAGE, applicationId);
    return this.menuService.get(id);
  }

  @Get(':id/published-content')
  async publishedContent(@Req() request: Request, @Param('id') id: string): Promise<MenuContentCandidateDto[]> {
    const applicationId = await this.menuService.getApplicationIdById(id);
    this.access.assertServiceAccess(request, ServicePermission.MENUS_MANAGE, applicationId);
    return this.menuService.listPublishedContentCandidates(id);
  }

  @Post(':id/sync-published')
  async syncPublished(@Req() request: Request, @Param('id') id: string): Promise<MenuResponseDto> {
    const applicationId = await this.menuService.getApplicationIdById(id);
    this.access.assertServiceAccess(request, ServicePermission.MENUS_MANAGE, applicationId);
    return this.menuService.syncPublishedContent(id);
  }

  @Get()
  async list(
    @Req() request: Request,
    @Query('languageCode') languageCode?: string,
    @Query('status') status?: MenuStatus,
  ): Promise<MenuResponseDto[]> {
    const applicationId = this.access.getApplicationId(request);
    this.access.assertServiceAccess(request, ServicePermission.MENUS_MANAGE, applicationId);
    return this.menuService.list(applicationId, languageCode, status);
  }

  @Post(':id/items')
  async addItem(@Req() request: Request, @Param('id') id: string, @Body() body: MenuItemUpsertRequestDto): Promise<MenuResponseDto> {
    const applicationId = await this.menuService.getApplicationIdById(id);
    this.access.assertServiceAccess(request, ServicePermission.MENUS_MANAGE, applicationId);
    return this.menuService.addItem(id, body);
  }

  @Put(':id/items/layout')
  async updateItemsLayout(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() body: MenuItemsLayoutRequestDto,
  ): Promise<MenuResponseDto> {
    const applicationId = await this.menuService.getApplicationIdById(id);
    this.access.assertServiceAccess(request, ServicePermission.MENUS_MANAGE, applicationId);
    return this.menuService.updateItemsLayout(id, body.items ?? []);
  }

  @Put(':id/items/:itemId')
  async updateItem(
    @Req() request: Request,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: MenuItemUpsertRequestDto,
  ): Promise<MenuResponseDto> {
    const applicationId = await this.menuService.getApplicationIdById(id);
    this.access.assertServiceAccess(request, ServicePermission.MENUS_MANAGE, applicationId);
    return this.menuService.updateItem(id, itemId, body);
  }

  @Delete(':id/items/:itemId')
  async deleteItem(@Req() request: Request, @Param('id') id: string, @Param('itemId') itemId: string): Promise<MenuResponseDto> {
    const applicationId = await this.menuService.getApplicationIdById(id);
    this.access.assertServiceAccess(request, ServicePermission.MENUS_MANAGE, applicationId);
    return this.menuService.deleteItem(id, itemId);
  }
}
