import { Body, Controller, Get, Param, Patch, Post, Put, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AdminAuthorizationService } from '../auth/admin-authorization.service';
import { ServicePermission } from '../auth/admin-permissions';
import { ContentStatus } from '../common/content-status.enum';
import { ChangeStatusRequestDto } from '../dto/requests/change-status-request.dto';
import { PageUpsertRequestDto } from '../dto/requests/page-upsert-request.dto';
import { PageResponseDto } from '../dto/page-response.dto';
import { PageContentResponseDto } from '../dto/responses/page-response.dto';
import { AdminPageService } from '../services/admin-page.service';
import { SitemapService } from '../services/sitemap.service';

@Controller('/api/v1/admin/pages')
export class AdminPageController {
  constructor(
    private readonly pageService: AdminPageService,
    private readonly access: AdminAuthorizationService,
    private readonly sitemapService: SitemapService,
  ) {}

  @Post()
  async create(@Req() request: Request, @Body() body: PageUpsertRequestDto): Promise<PageContentResponseDto> {
    this.access.assertServiceAccess(request, ServicePermission.PAGES_MANAGE, body.applicationId);
    const created = await this.pageService.create(body, this.access.getUser(request).sub);
    await this.sitemapService.invalidateTenantCacheIfOnPublish(created.applicationId);
    return created;
  }

  @Put(':id')
  async update(@Req() request: Request, @Param('id') id: string, @Body() body: PageUpsertRequestDto): Promise<PageContentResponseDto> {
    const applicationId = await this.pageService.getApplicationIdById(id);
    this.access.assertServiceAccess(request, ServicePermission.PAGES_MANAGE, applicationId);
    const updated = await this.pageService.update(id, body, this.access.getUser(request).sub);
    await this.sitemapService.invalidateTenantCacheIfOnPublish(updated.applicationId);
    return updated;
  }

  @Patch(':id/status')
  async changeStatus(@Req() request: Request, @Param('id') id: string, @Body() body: ChangeStatusRequestDto): Promise<PageContentResponseDto> {
    const applicationId = await this.pageService.getApplicationIdById(id);
    this.access.assertServiceAccess(request, ServicePermission.PAGES_MANAGE, applicationId);
    const updated = await this.pageService.changeStatus(id, body.status, this.access.getUser(request).sub);
    await this.sitemapService.invalidateTenantCacheIfOnPublish(updated.applicationId);
    return updated;
  }

  @Get(':id')
  async get(@Req() request: Request, @Param('id') id: string): Promise<PageContentResponseDto> {
    const applicationId = await this.pageService.getApplicationIdById(id);
    this.access.assertServiceAccess(request, ServicePermission.PAGES_MANAGE, applicationId);
    return this.pageService.get(id);
  }

  @Get()
  async list(
    @Req() request: Request,
    @Query('applicationId') applicationId: string,
    @Query('status') status?: ContentStatus,
    @Query('languageCode') languageCode?: string,
    @Query('page') page = '0',
    @Query('size') size = '10',
  ): Promise<PageResponseDto<PageContentResponseDto>> {
    this.access.assertServiceAccess(request, ServicePermission.PAGES_MANAGE, applicationId);
    return this.pageService.list(applicationId, status, languageCode, Number(page), Number(size));
  }
}
