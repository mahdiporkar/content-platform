import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';
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
import { ViewRateLimitService } from '../services/view-rate-limit.service';
import { getClientIp } from '../common/client-ip';
import { MediaAccessRequestDto } from '../dto/requests/media-access-request.dto';
import { MediaAccessResponseDto } from '../dto/responses/media-access-response.dto';
import { MediaVariantService } from '../services/media-variant.service';

@Controller('/api/v1/content')
@UseGuards(ApplicationTokenGuard)
@ApiSecurity({ 'application-id': [], 'application-token': [] })
export class DeliveryContentController {
  constructor(
    private readonly deliveryService: DeliveryContentService,
    private readonly domainPolicy: DomainPolicyService,
    private readonly viewRateLimit: ViewRateLimitService,
    private readonly mediaVariantService: MediaVariantService,
  ) {}

  @Get()
  async listContentFromHeaders(
    @Req() request: Request & { application?: ApplicationEntity },
    @Query() query: Record<string, string | string[]>,
  ): Promise<PageResponseDto<DeliveryContentResponseDto>> {
    return await this.listContentForApplication(request, query);
  }

  @Get('posts')
  async listPostsFromHeaders(
    @Req() request: Request & { application?: ApplicationEntity },
    @Query('page') page = '0',
    @Query('size') size = '10',
    @Query('locale') locale?: string,
  ): Promise<PageResponseDto<DeliveryContentResponseDto>> {
    return this.listByType(request, ContentType.POST, page, size, locale);
  }

  @Get('articles')
  async listArticlesFromHeaders(
    @Req() request: Request & { application?: ApplicationEntity },
    @Query('page') page = '0',
    @Query('size') size = '10',
    @Query('locale') locale?: string,
  ): Promise<PageResponseDto<DeliveryContentResponseDto>> {
    return this.listByType(request, ContentType.ARTICLE, page, size, locale);
  }

  @Get('videos')
  async listVideosFromHeaders(
    @Req() request: Request & { application?: ApplicationEntity },
    @Query('page') page = '0',
    @Query('size') size = '10',
    @Query('locale') locale?: string,
  ): Promise<PageResponseDto<DeliveryContentResponseDto>> {
    return this.listByType(request, ContentType.VIDEO, page, size, locale);
  }

  @Get('posts/:slug')
  async getPostBySlugFromHeaders(
    @Req() request: Request & { application?: ApplicationEntity },
    @Param('slug') slug: string,
  ): Promise<DeliveryContentResponseDto> {
    const application = this.getApplication(request);
    this.enforceDeliveryDomainPolicy(application, request);
    return await this.deliveryService.getPostBySlug(application, slug);
  }

  @Get('articles/:slug')
  async getArticleBySlugFromHeaders(
    @Req() request: Request & { application?: ApplicationEntity },
    @Param('slug') slug: string,
  ): Promise<DeliveryContentResponseDto> {
    const application = this.getApplication(request);
    this.enforceDeliveryDomainPolicy(application, request);
    return await this.deliveryService.getArticleBySlug(application, slug);
  }

  @Get('videos/:id')
  async getVideoByIdFromHeaders(
    @Req() request: Request & { application?: ApplicationEntity },
    @Param('id') id: string,
  ): Promise<DeliveryContentResponseDto> {
    const application = this.getApplication(request);
    this.enforceDeliveryDomainPolicy(application, request);
    return await this.deliveryService.getVideoById(application, id);
  }

  @Get('gallery')
  async listGalleryFromHeaders(
    @Req() request: Request & { application?: ApplicationEntity },
    @Query('page') page = '0',
    @Query('size') size = '10',
    @Query('locale') locale?: string,
  ): Promise<PageResponseDto<DeliveryContentResponseDto>> {
    const application = this.getApplication(request);
    this.enforceDeliveryDomainPolicy(application, request);
    return await this.deliveryService.listGallery(application, locale, Number(page), Number(size));
  }

  @Get('gallery/:slug')
  async getGalleryItemFromHeaders(
    @Req() request: Request & { application?: ApplicationEntity },
    @Param('slug') slug: string,
  ): Promise<DeliveryContentResponseDto> {
    const application = this.getApplication(request);
    this.enforceDeliveryDomainPolicy(application, request);
    return await this.deliveryService.getGalleryBySlug(application, slug);
  }

  @Get('collections/:slug')
  async getCollectionFromHeaders(
    @Req() request: Request & { application?: ApplicationEntity },
    @Param('slug') slug: string,
    @Query('locale') locale?: string,
  ): Promise<DeliveryCollectionResponseDto> {
    const application = this.getApplication(request);
    this.enforceDeliveryDomainPolicy(application, request);
    return await this.deliveryService.getCollection(application, slug, locale);
  }

  @Post('events/view')
  async trackViewFromHeaders(
    @Req() httpRequest: Request & { application?: ApplicationEntity },
    @Body() request: ViewEventRequestDto,
  ): Promise<{ ok: boolean }> {
    return await this.trackViewForApplication(httpRequest, request);
  }

  @Post('media/:mediaId/access')
  async requestMediaAccessFromHeaders(
    @Req() request: Request & { application?: ApplicationEntity },
    @Param('mediaId') mediaId: string,
    @Body() body: MediaAccessRequestDto,
  ): Promise<MediaAccessResponseDto> {
    return await this.requestMediaAccessForApplication(request, mediaId, body);
  }

  private async listContentForApplication(
    request: Request & { application?: ApplicationEntity },
    query: Record<string, string | string[]>,
  ): Promise<PageResponseDto<DeliveryContentResponseDto>> {
    const application = this.getApplication(request);
    this.enforceDeliveryDomainPolicy(application, request);
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

  private async trackViewForApplication(
    httpRequest: Request & { application?: ApplicationEntity },
    request: ViewEventRequestDto,
  ): Promise<{ ok: boolean }> {
    const application = this.getApplication(httpRequest);
    this.enforceDeliveryDomainPolicy(application, httpRequest);
    this.viewRateLimit.assertAllowed(application.id, getClientIp(httpRequest), request.contentId);
    await this.deliveryService.incrementView(request.contentType, request.contentId, application.id);
    return { ok: true };
  }

  private async requestMediaAccessForApplication(
    request: Request & { application?: ApplicationEntity },
    mediaId: string,
    body: MediaAccessRequestDto,
  ): Promise<MediaAccessResponseDto> {
    const application = this.getApplication(request);
    this.enforceDeliveryDomainPolicy(application, request);
    // TODO: layer user-level purchase/entitlement checks here before issuing signed media URLs.
    void body;
    const media = await this.mediaVariantService.getMediaWithVariants(application.id, mediaId);
    return new MediaAccessResponseDto(mediaId, media.media.mediaUrl, false, null);
  }

  private async listByType(
    request: Request & { application?: ApplicationEntity },
    type: ContentType,
    page: string,
    size: string,
    locale?: string,
  ): Promise<PageResponseDto<DeliveryContentResponseDto>> {
    const application = this.getApplication(request);
    this.enforceDeliveryDomainPolicy(application, request);
    return await this.deliveryService.listContent({
      application,
      type,
      locale,
      page: Number(page),
      size: Number(size),
    });
  }

  private getApplication(request: Request & { application?: ApplicationEntity }): ApplicationEntity {
    return request.application as ApplicationEntity;
  }

  private enforceDeliveryDomainPolicy(application: ApplicationEntity, request: Request): void {
    if (!this.domainPolicy.hasOriginSignal(request)) {
      return;
    }
    this.domainPolicy.ensureAllowed(application, request);
  }
}
