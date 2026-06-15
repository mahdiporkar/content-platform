import { Body, Controller, Get, Param, Patch, Post, Put, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AdminPostService } from '../services/admin-post.service';
import { PostUpsertRequestDto } from '../dto/requests/post-upsert-request.dto';
import { ChangeStatusRequestDto } from '../dto/requests/change-status-request.dto';
import { ContentStatus } from '../common/content-status.enum';
import { PostResponseDto } from '../dto/responses/post-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';
import { AdminAuthorizationService } from '../auth/admin-authorization.service';
import { ServicePermission } from '../auth/admin-permissions';
import { SitemapService } from '../services/sitemap.service';

@Controller('/api/v1/admin/posts')
export class AdminPostController {
  constructor(
    private readonly postService: AdminPostService,
    private readonly access: AdminAuthorizationService,
    private readonly sitemapService: SitemapService,
  ) {}

  @Post()
  async create(@Req() request: Request, @Body() body: PostUpsertRequestDto): Promise<PostResponseDto> {
    const applicationId = this.access.getApplicationId(request);
    this.access.assertServiceAccess(request, ServicePermission.POSTS_MANAGE, applicationId);
    const created = await this.postService.create({ ...body, applicationId });
    await this.sitemapService.invalidateTenantCacheIfOnPublish(created.applicationId);
    return created;
  }

  @Put(':id')
  async update(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() body: PostUpsertRequestDto,
  ): Promise<PostResponseDto> {
    const applicationId = await this.postService.getApplicationIdById(id);
    this.access.assertServiceAccess(request, ServicePermission.POSTS_MANAGE, applicationId);
    const updated = await this.postService.update(id, body);
    await this.sitemapService.invalidateTenantCacheIfOnPublish(updated.applicationId);
    return updated;
  }

  @Patch(':id/status')
  async changeStatus(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() body: ChangeStatusRequestDto,
  ): Promise<PostResponseDto> {
    const applicationId = await this.postService.getApplicationIdById(id);
    this.access.assertServiceAccess(request, ServicePermission.POSTS_MANAGE, applicationId);
    const updated = await this.postService.changeStatus(id, body);
    await this.sitemapService.invalidateTenantCacheIfOnPublish(updated.applicationId);
    return updated;
  }

  @Get()
  async list(
    @Req() request: Request,
    @Query('status') status?: ContentStatus,
    @Query('page') page = '0',
    @Query('size') size = '10',
  ): Promise<PageResponseDto<PostResponseDto>> {
    const applicationId = this.access.getApplicationId(request);
    this.access.assertServiceAccess(request, ServicePermission.POSTS_MANAGE, applicationId);
    return await this.postService.list(applicationId, status, Number(page), Number(size));
  }
}
