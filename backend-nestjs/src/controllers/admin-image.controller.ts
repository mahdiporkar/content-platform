import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminImageService } from '../services/admin-image.service';
import { ContentStatus } from '../common/content-status.enum';
import { ImageUpdateRequestDto } from '../dto/requests/image-update-request.dto';
import { ChangeStatusRequestDto } from '../dto/requests/change-status-request.dto';
import { ImageResponseDto } from '../dto/responses/image-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';
import { AdminAuthorizationService } from '../auth/admin-authorization.service';
import { ServicePermission } from '../auth/admin-permissions';
import { ContentUsageResponseDto } from '../dto/responses/content-usage-response.dto';
import { SitemapService } from '../services/sitemap.service';

@Controller('/api/v1/admin/images')
export class AdminImageController {
  constructor(
    private readonly imageService: AdminImageService,
    private readonly access: AdminAuthorizationService,
    private readonly sitemapService: SitemapService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Req() request: Request,
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title: string,
    @Body('description') description: string | undefined,
    @Body('status') status: ContentStatus,
    @Body('tags') tags?: string[],
    @Body('seo') seo?: Record<string, unknown>,
    @Body('gallery') gallery?: Record<string, unknown>[],
    @Body('locale') locale?: string,
    @Body('altText') altText?: string,
    @Body('scheduledAt') scheduledAt?: string,
  ): Promise<ImageResponseDto> {
    const applicationId = this.access.getApplicationId(request);
    this.access.assertServiceAccess(request, ServicePermission.IMAGES_MANAGE, applicationId);
    const created = await this.imageService.upload(
      file,
      title,
      description,
      applicationId,
      status,
      tags,
      seo,
      gallery,
      locale,
      altText,
      scheduledAt,
    );
    await this.sitemapService.invalidateTenantCacheIfOnPublish(created.applicationId);
    return created;
  }

  @Post('create-from-asset')
  async createFromAsset(
    @Req() request: Request,
    @Body('assetId') assetId: string,
    @Body('title') title: string,
    @Body('description') description: string | undefined,
    @Body('status') status: ContentStatus,
    @Body('tags') tags?: string[],
    @Body('seo') seo?: Record<string, unknown>,
    @Body('gallery') gallery?: Record<string, unknown>[],
    @Body('locale') locale?: string,
    @Body('altText') altText?: string,
    @Body('scheduledAt') scheduledAt?: string,
  ): Promise<ImageResponseDto> {
    const applicationId = this.access.getApplicationId(request);
    this.access.assertServiceAccess(request, ServicePermission.IMAGES_MANAGE, applicationId);
    const created = await this.imageService.createFromAsset(
      assetId,
      title,
      description,
      applicationId,
      status,
      tags,
      seo,
      gallery,
      locale,
      altText,
      scheduledAt,
    );
    await this.sitemapService.invalidateTenantCacheIfOnPublish(created.applicationId);
    return created;
  }

  @Get(':id/usages')
  async listUsages(@Req() request: Request, @Param('id') id: string): Promise<ContentUsageResponseDto[]> {
    const applicationId = await this.imageService.getApplicationIdById(id);
    this.access.assertServiceAccess(request, ServicePermission.IMAGES_MANAGE, applicationId);
    return await this.imageService.listUsages(id);
  }

  @Get(':id')
  async getById(@Req() request: Request, @Param('id') id: string): Promise<ImageResponseDto> {
    const applicationId = await this.imageService.getApplicationIdById(id);
    this.access.assertServiceAccess(request, ServicePermission.IMAGES_MANAGE, applicationId);
    return await this.imageService.getById(id);
  }

  @Delete(':id')
  async delete(@Req() request: Request, @Param('id') id: string): Promise<{ success: true }> {
    const applicationId = await this.imageService.getApplicationIdById(id);
    this.access.assertServiceAccess(request, ServicePermission.IMAGES_MANAGE, applicationId);
    await this.imageService.delete(id);
    return { success: true };
  }

  @Post(':id/restore')
  async restore(@Req() request: Request, @Param('id') id: string): Promise<ImageResponseDto> {
    const applicationId = await this.imageService.getApplicationIdById(id);
    this.access.assertServiceAccess(request, ServicePermission.IMAGES_MANAGE, applicationId);
    const restored = await this.imageService.restore(id);
    await this.sitemapService.invalidateTenantCacheIfOnPublish(restored.applicationId);
    return restored;
  }

  @Put(':id')
  async update(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() body: ImageUpdateRequestDto,
  ): Promise<ImageResponseDto> {
    const applicationId = await this.imageService.getApplicationIdById(id);
    this.access.assertServiceAccess(request, ServicePermission.IMAGES_MANAGE, applicationId);
    const updated = await this.imageService.update(id, body);
    await this.sitemapService.invalidateTenantCacheIfOnPublish(updated.applicationId);
    return updated;
  }

  @Put(':id/status')
  async changeStatus(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() body: ChangeStatusRequestDto,
  ): Promise<ImageResponseDto> {
    const applicationId = this.access.getApplicationId(request);
    this.access.assertServiceAccess(request, ServicePermission.IMAGES_MANAGE, applicationId);
    const updated = await this.imageService.changeStatus(id, { ...body, applicationId });
    await this.sitemapService.invalidateTenantCacheIfOnPublish(updated.applicationId);
    return updated;
  }

  @Get()
  async list(
    @Req() request: Request,
    @Query('status') status?: ContentStatus,
    @Query('deleted') deleted = 'false',
    @Query('page') page = '0',
    @Query('size') size = '10',
  ): Promise<PageResponseDto<ImageResponseDto>> {
    const applicationId = this.access.getApplicationId(request);
    this.access.assertServiceAccess(request, ServicePermission.IMAGES_MANAGE, applicationId);
    return await this.imageService.list(applicationId, status, Number(page), Number(size), deleted === 'true');
  }
}
