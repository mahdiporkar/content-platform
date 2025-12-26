import { Controller, Get, Param, Query } from '@nestjs/common';
import { PublicContentService } from '../services/public-content.service';
import { ContentStatus } from '../common/content-status.enum';
import { PostResponseDto } from '../dto/responses/post-response.dto';
import { ArticleResponseDto } from '../dto/responses/article-response.dto';
import { VideoResponseDto } from '../dto/responses/video-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';

@Controller('/api/v1/public')
export class PublicContentController {
  constructor(private readonly publicContent: PublicContentService) {}

  @Get(':applicationId/posts')
  listPosts(
    @Param('applicationId') applicationId: string,
    @Query('status') status: ContentStatus = ContentStatus.PUBLISHED,
    @Query('page') page = '0',
    @Query('size') size = '10',
  ): PageResponseDto<PostResponseDto> {
    return this.publicContent.listPosts(applicationId, status, Number(page), Number(size));
  }

  @Get(':applicationId/posts/:slug')
  getPost(@Param('applicationId') applicationId: string, @Param('slug') slug: string): PostResponseDto {
    return this.publicContent.getPost(applicationId, slug);
  }

  @Get(':applicationId/articles')
  listArticles(
    @Param('applicationId') applicationId: string,
    @Query('status') status: ContentStatus = ContentStatus.PUBLISHED,
    @Query('page') page = '0',
    @Query('size') size = '10',
  ): PageResponseDto<ArticleResponseDto> {
    return this.publicContent.listArticles(applicationId, status, Number(page), Number(size));
  }

  @Get(':applicationId/articles/:slug')
  getArticle(@Param('applicationId') applicationId: string, @Param('slug') slug: string): ArticleResponseDto {
    return this.publicContent.getArticle(applicationId, slug);
  }

  @Get(':applicationId/videos')
  listVideos(
    @Param('applicationId') applicationId: string,
    @Query('status') status: ContentStatus = ContentStatus.PUBLISHED,
    @Query('page') page = '0',
    @Query('size') size = '10',
  ): PageResponseDto<VideoResponseDto> {
    return this.publicContent.listVideos(applicationId, status, Number(page), Number(size));
  }
}