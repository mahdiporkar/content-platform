import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { AdminArticleService } from '../services/admin-article.service';
import { ArticleUpsertRequestDto } from '../dto/requests/article-upsert-request.dto';
import { ChangeStatusRequestDto } from '../dto/requests/change-status-request.dto';
import { ContentStatus } from '../common/content-status.enum';
import { ArticleResponseDto } from '../dto/responses/article-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';

@Controller('/api/v1/admin/articles')
export class AdminArticleController {
  constructor(private readonly articleService: AdminArticleService) {}

  @Post()
  async create(@Body() request: ArticleUpsertRequestDto): Promise<ArticleResponseDto> {
    return await this.articleService.create(request);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() request: ArticleUpsertRequestDto,
  ): Promise<ArticleResponseDto> {
    return await this.articleService.update(id, request);
  }

  @Patch(':id/status')
  async changeStatus(
    @Param('id') id: string,
    @Body() request: ChangeStatusRequestDto,
  ): Promise<ArticleResponseDto> {
    return await this.articleService.changeStatus(id, request);
  }

  @Get()
  async list(
    @Query('applicationId') applicationId: string,
    @Query('status') status?: ContentStatus,
    @Query('page') page = '0',
    @Query('size') size = '10',
  ): Promise<PageResponseDto<ArticleResponseDto>> {
    return await this.articleService.list(applicationId, status, Number(page), Number(size));
  }
}
