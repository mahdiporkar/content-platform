import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminVideoService } from '../services/admin-video.service';
import { ChangeStatusRequestDto } from '../dto/requests/change-status-request.dto';
import { ContentStatus } from '../common/content-status.enum';
import { VideoResponseDto } from '../dto/responses/video-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';
import { VideoUpdateRequestDto } from '../dto/requests/video-update-request.dto';
import { AdminAuthorizationService } from '../auth/admin-authorization.service';
import { ServicePermission } from '../auth/admin-permissions';
import { ContentUsageResponseDto } from '../dto/responses/content-usage-response.dto';
import { SitemapService } from '../services/sitemap.service';

@Controller('/api/v1/admin/videos')
export class AdminVideoController {
  constructor(
    private readonly videoService: AdminVideoService,
    private readonly access: AdminAuthorizationService,
    private readonly sitemapService: SitemapService,
  ) {}

  private parseJson<T>(value: string | undefined): T | undefined {
    if (!value) {
      return undefined;
    }
    try {
      return JSON.parse(value) as T;
    } catch {
      return undefined;
    }
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Req() request: Request,
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title: string,
    @Body('description') description: string | undefined,
    @Body('status') status: ContentStatus,
    @Body('tags') tagsRaw?: string,
    @Body('seo') seoRaw?: string,
    @Body('gallery') galleryRaw?: string,
    @Body('locale') locale?: string,
    @Body('scheduledAt') scheduledAt?: string,
  ): Promise<VideoResponseDto> {
    const applicationId = this.access.getApplicationId(request);
    this.access.assertServiceAccess(request, ServicePermission.VIDEOS_MANAGE, applicationId);
    const tags = this.parseJson<string[]>(tagsRaw);
    const seo = this.parseJson<Record<string, unknown>>(seoRaw);
    const gallery = this.parseJson<Record<string, unknown>[]>(galleryRaw);
    const created = await this.videoService.upload(
      file,
      title,
      description,
      applicationId,
      status,
      tags,
      seo,
      gallery,
      locale,
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
    @Body('tags') tagsRaw?: string,
    @Body('seo') seoRaw?: string,
    @Body('gallery') galleryRaw?: string,
    @Body('locale') locale?: string,
    @Body('scheduledAt') scheduledAt?: string,
  ): Promise<VideoResponseDto> {
    const applicationId = this.access.getApplicationId(request);
    this.access.assertServiceAccess(request, ServicePermission.VIDEOS_MANAGE, applicationId);
    const tags = this.parseJson<string[]>(tagsRaw);
    const seo = this.parseJson<Record<string, unknown>>(seoRaw);
    const gallery = this.parseJson<Record<string, unknown>[]>(galleryRaw);
    const created = await this.videoService.createFromAsset(
      assetId,
      title,
      description,
      applicationId,
      status,
      tags,
      seo,
      gallery,
      locale,
      scheduledAt,
    );
    await this.sitemapService.invalidateTenantCacheIfOnPublish(created.applicationId);
    return created;
  }

  @Patch(':id/status')
  async changeStatus(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() body: ChangeStatusRequestDto,
  ): Promise<VideoResponseDto> {
    const applicationId = this.access.getApplicationId(request);
    this.access.assertServiceAccess(request, ServicePermission.VIDEOS_MANAGE, applicationId);
    const updated = await this.videoService.changeStatus(id, { ...body, applicationId });
    await this.sitemapService.invalidateTenantCacheIfOnPublish(updated.applicationId);
    return updated;
  }

  @Get(':id/usages')
  async listUsages(@Req() request: Request, @Param('id') id: string): Promise<ContentUsageResponseDto[]> {
    const applicationId = await this.videoService.getApplicationIdById(id);
    this.access.assertServiceAccess(request, ServicePermission.VIDEOS_MANAGE, applicationId);
    return await this.videoService.listUsages(id);
  }

  @Get(':id')
  async getById(@Req() request: Request, @Param('id') id: string): Promise<VideoResponseDto> {
    const applicationId = await this.videoService.getApplicationIdById(id);
    this.access.assertServiceAccess(request, ServicePermission.VIDEOS_MANAGE, applicationId);
    return await this.videoService.getById(id);
  }

  @Delete(':id')
  async delete(@Req() request: Request, @Param('id') id: string): Promise<{ success: true }> {
    const applicationId = await this.videoService.getApplicationIdById(id);
    this.access.assertServiceAccess(request, ServicePermission.VIDEOS_MANAGE, applicationId);
    await this.videoService.delete(id);
    return { success: true };
  }

  @Post(':id/restore')
  async restore(@Req() request: Request, @Param('id') id: string): Promise<VideoResponseDto> {
    const applicationId = await this.videoService.getApplicationIdById(id);
    this.access.assertServiceAccess(request, ServicePermission.VIDEOS_MANAGE, applicationId);
    const restored = await this.videoService.restore(id);
    await this.sitemapService.invalidateTenantCacheIfOnPublish(restored.applicationId);
    return restored;
  }

  @Put(':id')
  async update(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() body: VideoUpdateRequestDto,
  ): Promise<VideoResponseDto> {
    const applicationId = await this.videoService.getApplicationIdById(id);
    this.access.assertServiceAccess(request, ServicePermission.VIDEOS_MANAGE, applicationId);
    const updated = await this.videoService.update(id, body);
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
  ): Promise<PageResponseDto<VideoResponseDto>> {
    const applicationId = this.access.getApplicationId(request);
    this.access.assertServiceAccess(request, ServicePermission.VIDEOS_MANAGE, applicationId);
    return await this.videoService.list(applicationId, status, Number(page), Number(size), deleted === 'true');
  }
}
