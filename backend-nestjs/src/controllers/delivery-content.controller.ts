import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { DeliveryContentService } from '../services/delivery-content.service';
import { ApplicationTokenGuard } from '../auth/application-token.guard';
import { DomainPolicyService } from '../services/domain-policy.service';
import { ContentType } from '../common/content-type.enum';
import { ViewEventRequestDto } from '../dto/requests/view-event-request.dto';
import { DeliveryContentResponseDto } from '../dto/responses/delivery-content-response.dto';
import { DeliveryCollectionResponseDto } from '../dto/responses/delivery-collection-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';
import { ApplicationEntity } from '../entities/application.entity';
import { GalleryImageResponseDto } from '../dto/responses/gallery-image-response.dto';

@Controller('/api/v1/content')
@UseGuards(ApplicationTokenGuard)
export class DeliveryContentController {
  constructor(
    private readonly deliveryService: DeliveryContentService,
    private readonly domainPolicy: DomainPolicyService,
  ) {}

  @Get(':applicationId/posts')
  async listPosts(
    @Req() request: Request & { application?: ApplicationEntity },
    @Query('page') page = '0',
    @Query('size') size = '10',
    @Query('locale') locale?: string,
  ): Promise<PageResponseDto<DeliveryContentResponseDto>> {
    return this.listByType(request, ContentType.POST, page, size, locale);
  }

  @Get(':applicationId/articles')
  async listArticles(
    @Req() request: Request & { application?: ApplicationEntity },
    @Query('page') page = '0',
    @Query('size') size = '10',
    @Query('locale') locale?: string,
  ): Promise<PageResponseDto<DeliveryContentResponseDto>> {
    return this.listByType(request, ContentType.ARTICLE, page, size, locale);
  }

  @Get(':applicationId/videos')
  async listVideos(
    @Req() request: Request & { application?: ApplicationEntity },
    @Query('page') page = '0',
    @Query('size') size = '10',
    @Query('locale') locale?: string,
  ): Promise<PageResponseDto<DeliveryContentResponseDto>> {
    return this.listByType(request, ContentType.VIDEO, page, size, locale);
  }

  @Get(':applicationId')
  async listContent(
    @Req() request: Request & { application?: ApplicationEntity },
    @Query() query: Record<string, string | string[]>,
  ): Promise<PageResponseDto<DeliveryContentResponseDto>> {
    const application = request.application as ApplicationEntity;
    this.domainPolicy.ensureAllowed(application, request, { allowMissing: true });
    const type = (query.type as ContentType | undefined) ?? undefined;
    const collectionSlug = query.collection as string | undefined;
    const locale = query.locale as string | undefined;
    const page = (query.page as string | undefined) ?? '0';
    const size = (query.size as string | undefined) ?? '10';
    const tagsQuery = (query.tags ?? query['tags[]']) as string | string[] | undefined;
    const normalizedTags = Array.isArray(tagsQuery) ? tagsQuery : tagsQuery ? [tagsQuery] : [];
    return await this.deliveryService.listContent({
      application,
      type,
      tags: normalizedTags,
      collectionSlug,
      locale,
      page: Number(page),
      size: Number(size),
    });
  }

  @Get(':applicationId/posts/:slug')
  async getPostBySlug(
    @Req() request: Request & { application?: ApplicationEntity },
    @Param('slug') slug: string,
  ): Promise<DeliveryContentResponseDto> {
    const application = request.application as ApplicationEntity;
    this.domainPolicy.ensureAllowed(application, request, { allowMissing: true });
    return await this.deliveryService.getPostBySlug(application, slug);
  }

  @Get(':applicationId/articles/:slug')
  async getArticleBySlug(
    @Req() request: Request & { application?: ApplicationEntity },
    @Param('slug') slug: string,
  ): Promise<DeliveryContentResponseDto> {
    const application = request.application as ApplicationEntity;
    this.domainPolicy.ensureAllowed(application, request, { allowMissing: true });
    return await this.deliveryService.getArticleBySlug(application, slug);
  }

  @Get(':applicationId/videos/:id')
  async getVideoById(
    @Req() request: Request & { application?: ApplicationEntity },
    @Param('id') id: string,
  ): Promise<DeliveryContentResponseDto> {
    const application = request.application as ApplicationEntity;
    this.domainPolicy.ensureAllowed(application, request, { allowMissing: true });
    return await this.deliveryService.getVideoById(application, id);
  }

  @Get(':applicationId/gallery')
  async listGallery(
    @Req() request: Request & { application?: ApplicationEntity },
    @Query('page') page = '0',
    @Query('size') size = '10',
  ): Promise<PageResponseDto<GalleryImageResponseDto>> {
    const application = request.application as ApplicationEntity;
    this.domainPolicy.ensureAllowed(application, request, { allowMissing: true });
    return await this.deliveryService.listGallery(application, Number(page), Number(size));
  }

  @Get(':applicationId/gallery/:index')
  async getGalleryItem(
    @Req() request: Request & { application?: ApplicationEntity },
    @Param('index') index: string,
  ): Promise<GalleryImageResponseDto> {
    const application = request.application as ApplicationEntity;
    this.domainPolicy.ensureAllowed(application, request, { allowMissing: true });
    return await this.deliveryService.getGalleryItem(application, Number(index));
  }

  @Get(':applicationId/collections/:slug')
  async getCollection(
    @Req() request: Request & { application?: ApplicationEntity },
    @Param('slug') slug: string,
    @Query('locale') locale?: string,
  ): Promise<DeliveryCollectionResponseDto> {
    const application = request.application as ApplicationEntity;
    this.domainPolicy.ensureAllowed(application, request, { allowMissing: true });
    return await this.deliveryService.getCollection(application, slug, locale);
  }

  @Post(':applicationId/events/view')
  async trackView(
    @Req() httpRequest: Request & { application?: ApplicationEntity },
    @Body() request: ViewEventRequestDto,
  ): Promise<{ ok: boolean }> {
    const application = httpRequest.application as ApplicationEntity;
    await this.deliveryService.incrementView(request.contentType, request.contentId, application.id);
    return { ok: true };
  }

  private async listByType(
    request: Request & { application?: ApplicationEntity },
    type: ContentType,
    page: string,
    size: string,
    locale?: string,
  ): Promise<PageResponseDto<DeliveryContentResponseDto>> {
    const application = request.application as ApplicationEntity;
    this.domainPolicy.ensureAllowed(application, request, { allowMissing: true });
    return await this.deliveryService.listContent({
      application,
      type,
      locale,
      page: Number(page),
      size: Number(size),
    });
  }
}
