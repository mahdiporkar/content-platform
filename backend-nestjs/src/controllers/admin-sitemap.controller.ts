import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AdminAuthorizationService } from '../auth/admin-authorization.service';
import { ServicePermission } from '../auth/admin-permissions';
import { SitemapService } from '../services/sitemap.service';
import { SitemapSettingsUpsertRequestDto } from '../dto/requests/sitemap-settings-upsert.dto';
import { SitemapSettingsResponseDto } from '../dto/responses/sitemap-settings-response.dto';
import { SitemapTemplateResponseDto } from '../dto/responses/sitemap-template-response.dto';
import { SitemapTemplateUpsertRequestDto } from '../dto/requests/sitemap-template-upsert.dto';
import { SitemapPreviewEntryResponseDto } from '../dto/responses/sitemap-preview-entry-response.dto';
import { SitemapTestUrlRequestDto } from '../dto/requests/sitemap-test-url.dto';
import { SitemapTestUrlResponseDto } from '../dto/responses/sitemap-test-url-response.dto';
import { SitemapOverrideUpsertRequestDto } from '../dto/requests/sitemap-override-upsert.dto';
import { SitemapCustomUrlResponseDto } from '../dto/responses/sitemap-custom-url-response.dto';
import { SitemapCustomUrlUpsertRequestDto } from '../dto/requests/sitemap-custom-url-upsert.dto';

@Controller('/api/v1/admin/sitemap')
export class AdminSitemapController {
  constructor(
    private readonly sitemapService: SitemapService,
    private readonly access: AdminAuthorizationService,
  ) {}

  private assertAccess(request: Request, applicationId: string): void {
    this.access.assertAnyServicePermission(request, [
      ServicePermission.POSTS_MANAGE,
      ServicePermission.ARTICLES_MANAGE,
      ServicePermission.IMAGES_MANAGE,
      ServicePermission.VIDEOS_MANAGE,
      ServicePermission.COLLECTIONS_MANAGE,
    ]);
    this.access.assertApplicationAccess(request, applicationId);
  }

  @Get('settings')
  async getSettings(
    @Req() request: Request,
    @Query('applicationId') applicationId: string,
  ): Promise<SitemapSettingsResponseDto> {
    this.assertAccess(request, applicationId);
    return await this.sitemapService.getSettings(applicationId);
  }

  @Put('settings')
  async putSettings(
    @Req() request: Request,
    @Query('applicationId') applicationId: string,
    @Body() body: SitemapSettingsUpsertRequestDto,
  ): Promise<SitemapSettingsResponseDto> {
    this.assertAccess(request, applicationId);
    return await this.sitemapService.putSettings(applicationId, body);
  }

  @Get('templates')
  async listTemplates(
    @Req() request: Request,
    @Query('applicationId') applicationId: string,
  ): Promise<SitemapTemplateResponseDto[]> {
    this.assertAccess(request, applicationId);
    return await this.sitemapService.listTemplates(applicationId);
  }

  @Put('templates/:contentType')
  async putTemplate(
    @Req() request: Request,
    @Query('applicationId') applicationId: string,
    @Param('contentType') contentType: string,
    @Body() body: SitemapTemplateUpsertRequestDto,
  ): Promise<SitemapTemplateResponseDto> {
    this.assertAccess(request, applicationId);
    return await this.sitemapService.putTemplate(applicationId, contentType, body);
  }

  @Get('preview')
  async preview(
    @Req() request: Request,
    @Query('applicationId') applicationId: string,
    @Query('contentType') contentType?: string,
    @Query('limit') limit = '50',
    @Query('offset') offset = '0',
  ): Promise<{ total: number; items: SitemapPreviewEntryResponseDto[] }> {
    this.assertAccess(request, applicationId);
    return await this.sitemapService.preview(applicationId, contentType, Number(limit), Number(offset));
  }

  @Post('test-url')
  async testUrl(
    @Req() request: Request,
    @Query('applicationId') applicationId: string,
    @Body() body: SitemapTestUrlRequestDto,
  ): Promise<SitemapTestUrlResponseDto> {
    this.assertAccess(request, applicationId);
    return await this.sitemapService.testUrl(applicationId, body.url);
  }

  @Put('override/:contentType/:contentId')
  async putOverride(
    @Req() request: Request,
    @Query('applicationId') applicationId: string,
    @Param('contentType') contentType: string,
    @Param('contentId') contentId: string,
    @Body() body: SitemapOverrideUpsertRequestDto,
  ): Promise<{ ok: true }> {
    this.assertAccess(request, applicationId);
    await this.sitemapService.putOverride(applicationId, contentType, contentId, body);
    return { ok: true };
  }

  @Get('custom-urls')
  async listCustomUrls(
    @Req() request: Request,
    @Query('applicationId') applicationId: string,
  ): Promise<SitemapCustomUrlResponseDto[]> {
    this.assertAccess(request, applicationId);
    return await this.sitemapService.listCustomUrls(applicationId);
  }

  @Post('custom-urls')
  async createCustomUrl(
    @Req() request: Request,
    @Query('applicationId') applicationId: string,
    @Body() body: SitemapCustomUrlUpsertRequestDto,
  ): Promise<SitemapCustomUrlResponseDto> {
    this.assertAccess(request, applicationId);
    return await this.sitemapService.createCustomUrl(applicationId, body);
  }

  @Put('custom-urls/:id')
  async updateCustomUrl(
    @Req() request: Request,
    @Query('applicationId') applicationId: string,
    @Param('id') id: string,
    @Body() body: SitemapCustomUrlUpsertRequestDto,
  ): Promise<SitemapCustomUrlResponseDto> {
    this.assertAccess(request, applicationId);
    return await this.sitemapService.updateCustomUrl(applicationId, id, body);
  }

  @Delete('custom-urls/:id')
  async deleteCustomUrl(
    @Req() request: Request,
    @Query('applicationId') applicationId: string,
    @Param('id') id: string,
  ): Promise<{ ok: true }> {
    this.assertAccess(request, applicationId);
    await this.sitemapService.deleteCustomUrl(applicationId, id);
    return { ok: true };
  }
}

