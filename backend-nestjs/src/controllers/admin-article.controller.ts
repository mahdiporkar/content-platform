import { Body, Controller, Get, Param, Patch, Post, Put, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AdminArticleService } from '../services/admin-article.service';
import { ArticleUpsertRequestDto } from '../dto/requests/article-upsert-request.dto';
import { ChangeStatusRequestDto } from '../dto/requests/change-status-request.dto';
import { ContentStatus } from '../common/content-status.enum';
import { ArticleResponseDto } from '../dto/responses/article-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';
import { AdminAuthorizationService } from '../auth/admin-authorization.service';
import { ServicePermission } from '../auth/admin-permissions';

@Controller('/api/v1/admin/articles')
export class AdminArticleController {
  constructor(
    private readonly articleService: AdminArticleService,
    private readonly access: AdminAuthorizationService,
  ) {}

  @Post()
  async create(@Req() request: Request, @Body() body: ArticleUpsertRequestDto): Promise<ArticleResponseDto> {
    this.access.assertServiceAccess(request, ServicePermission.ARTICLES_MANAGE, body.applicationId);
    return await this.articleService.create(body);
  }

  @Put(':id')
  async update(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() body: ArticleUpsertRequestDto,
  ): Promise<ArticleResponseDto> {
    const applicationId = await this.articleService.getApplicationIdById(id);
    this.access.assertServiceAccess(request, ServicePermission.ARTICLES_MANAGE, applicationId);
    return await this.articleService.update(id, body);
  }

  @Patch(':id/status')
  async changeStatus(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() body: ChangeStatusRequestDto,
  ): Promise<ArticleResponseDto> {
    const applicationId = await this.articleService.getApplicationIdById(id);
    this.access.assertServiceAccess(request, ServicePermission.ARTICLES_MANAGE, applicationId);
    return await this.articleService.changeStatus(id, body);
  }

  @Get()
  async list(
    @Req() request: Request,
    @Query('applicationId') applicationId: string,
    @Query('status') status?: ContentStatus,
    @Query('page') page = '0',
    @Query('size') size = '10',
  ): Promise<PageResponseDto<ArticleResponseDto>> {
    this.access.assertServiceAccess(request, ServicePermission.ARTICLES_MANAGE, applicationId);
    return await this.articleService.list(applicationId, status, Number(page), Number(size));
  }
}
