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

@Controller('/delivery/v1')
@UseGuards(ApplicationTokenGuard)
export class DeliveryContentController {
  constructor(
    private readonly deliveryService: DeliveryContentService,
    private readonly domainPolicy: DomainPolicyService,
  ) {}

  @Get('content')
  async listContent(
    @Req() request: Request & { application?: ApplicationEntity },
    @Query() query: Record<string, string | string[]>,
  ): Promise<PageResponseDto<DeliveryContentResponseDto>> {
    const application = request.application as ApplicationEntity;
    this.domainPolicy.ensureAllowed(application, request);
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

  @Get('collections/:slug')
  async getCollection(
    @Req() request: Request & { application?: ApplicationEntity },
    @Param('slug') slug: string,
    @Query('locale') locale?: string,
  ): Promise<DeliveryCollectionResponseDto> {
    const application = request.application as ApplicationEntity;
    this.domainPolicy.ensureAllowed(application, request);
    return await this.deliveryService.getCollection(application, slug, locale);
  }

  @Post('events/view')
  async trackView(
    @Req() httpRequest: Request & { application?: ApplicationEntity },
    @Body() request: ViewEventRequestDto,
  ): Promise<{ ok: boolean }> {
    const application = httpRequest.application as ApplicationEntity;
    await this.deliveryService.incrementView(request.contentType, request.contentId, application.id);
    return { ok: true };
  }
}
