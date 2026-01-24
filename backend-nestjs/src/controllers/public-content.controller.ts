import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { PublicContentService } from '../services/public-content.service';
import { ContentStatus } from '../common/content-status.enum';
import { PostResponseDto } from '../dto/responses/post-response.dto';
import { ArticleResponseDto } from '../dto/responses/article-response.dto';
import { VideoResponseDto } from '../dto/responses/video-response.dto';
import { GalleryImageResponseDto } from '../dto/responses/gallery-image-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';
import { ApplicationTokenGuard } from '../auth/application-token.guard';

@Controller('/api/v1/public')
@UseGuards(ApplicationTokenGuard)
export class PublicContentController {
  constructor(private readonly publicContent: PublicContentService) {}

  @Get(':applicationId/posts')
  async listPosts(
    @Param('applicationId') applicationId: string,
    @Query('status') status: ContentStatus = ContentStatus.PUBLISHED,
    @Query('page') page = '0',
    @Query('size') size = '10',
  ): Promise<PageResponseDto<PostResponseDto>> {
    return await this.publicContent.listPosts(applicationId, status, Number(page), Number(size));
  }

  @Get(':applicationId/posts/:slug')
  async getPost(
    @Param('applicationId') applicationId: string,
    @Param('slug') slug: string,
  ): Promise<PostResponseDto> {
    return await this.publicContent.getPost(applicationId, slug);
  }

  @Get(':applicationId/articles')
  async listArticles(
    @Param('applicationId') applicationId: string,
    @Query('status') status: ContentStatus = ContentStatus.PUBLISHED,
    @Query('page') page = '0',
    @Query('size') size = '10',
  ): Promise<PageResponseDto<ArticleResponseDto>> {
    return await this.publicContent.listArticles(applicationId, status, Number(page), Number(size));
  }

  @Get(':applicationId/articles/:slug')
  async getArticle(
    @Param('applicationId') applicationId: string,
    @Param('slug') slug: string,
  ): Promise<ArticleResponseDto> {
    return await this.publicContent.getArticle(applicationId, slug);
  }

  @Get(':applicationId/videos')
  async listVideos(
    @Param('applicationId') applicationId: string,
    @Query('status') status: ContentStatus = ContentStatus.PUBLISHED,
    @Query('page') page = '0',
    @Query('size') size = '10',
  ): Promise<PageResponseDto<VideoResponseDto>> {
    return await this.publicContent.listVideos(applicationId, status, Number(page), Number(size));
  }

  @Get(':applicationId/videos/:id')
  async getVideo(
    @Param('applicationId') applicationId: string,
    @Param('id') id: string,
  ): Promise<VideoResponseDto> {
    return await this.publicContent.getVideo(applicationId, id);
  }

  @Get(':applicationId/gallery')
  async listGallery(
    @Param('applicationId') applicationId: string,
    @Query('page') page = '0',
    @Query('size') size = '10',
  ): Promise<PageResponseDto<GalleryImageResponseDto>> {
    return await this.publicContent.listGallery(applicationId, Number(page), Number(size));
  }

  @Get(':applicationId/gallery/:index')
  async getGalleryItem(
    @Param('applicationId') applicationId: string,
    @Param('index') index: string,
  ): Promise<GalleryImageResponseDto> {
    return await this.publicContent.getGalleryItem(applicationId, Number(index));
  }
}
