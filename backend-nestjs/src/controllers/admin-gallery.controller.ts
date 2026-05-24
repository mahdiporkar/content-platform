import { Body, Controller, Get, Param, Patch, Post, Put, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AdminGalleryService } from '../services/admin-gallery.service';
import { GalleryUpsertRequestDto } from '../dto/requests/gallery-upsert-request.dto';
import { ChangeStatusRequestDto } from '../dto/requests/change-status-request.dto';
import { ContentStatus } from '../common/content-status.enum';
import { GalleryResponseDto } from '../dto/responses/gallery-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';
import { AdminAuthorizationService } from '../auth/admin-authorization.service';
import { ServicePermission } from '../auth/admin-permissions';
import { SitemapService } from '../services/sitemap.service';

@Controller('/api/v1/admin/galleries')
export class AdminGalleryController {
  constructor(
    private readonly galleryService: AdminGalleryService,
    private readonly access: AdminAuthorizationService,
    private readonly sitemapService: SitemapService,
  ) {}

  private assertGalleryAccess(request: Request, applicationId: string): void {
    this.access.assertAnyServicePermission(request, [
      ServicePermission.GALLERIES_MANAGE,
      ServicePermission.IMAGES_MANAGE,
    ]);
    this.access.assertApplicationAccess(request, applicationId);
  }

  @Post()
  async create(@Req() request: Request, @Body() body: GalleryUpsertRequestDto): Promise<GalleryResponseDto> {
    this.assertGalleryAccess(request, body.applicationId);
    const created = await this.galleryService.create(body);
    await this.sitemapService.invalidateTenantCacheIfOnPublish(created.applicationId);
    return created;
  }

  @Put(':id')
  async update(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() body: GalleryUpsertRequestDto,
  ): Promise<GalleryResponseDto> {
    const applicationId = await this.galleryService.getApplicationIdById(id);
    this.assertGalleryAccess(request, applicationId);
    const updated = await this.galleryService.update(id, body);
    await this.sitemapService.invalidateTenantCacheIfOnPublish(updated.applicationId);
    return updated;
  }

  @Patch(':id/status')
  async changeStatus(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() body: ChangeStatusRequestDto,
  ): Promise<GalleryResponseDto> {
    const applicationId = await this.galleryService.getApplicationIdById(id);
    this.assertGalleryAccess(request, applicationId);
    const updated = await this.galleryService.changeStatus(id, body);
    await this.sitemapService.invalidateTenantCacheIfOnPublish(updated.applicationId);
    return updated;
  }

  @Get()
  async list(
    @Req() request: Request,
    @Query('applicationId') applicationId: string,
    @Query('status') status?: ContentStatus,
    @Query('page') page = '0',
    @Query('size') size = '10',
  ): Promise<PageResponseDto<GalleryResponseDto>> {
    this.assertGalleryAccess(request, applicationId);
    return await this.galleryService.list(applicationId, status, Number(page), Number(size));
  }
}
