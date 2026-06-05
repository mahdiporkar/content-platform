import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';
import type { Request } from 'express';
import { ApplicationTokenGuard } from '../auth/application-token.guard';
import { MenuLocation } from '../common/menu-types';
import { PageContentResponseDto } from '../dto/responses/page-response.dto';
import { MenuResponseDto } from '../dto/responses/menu-response.dto';
import { ApplicationEntity } from '../entities/application.entity';
import { DomainPolicyService } from '../services/domain-policy.service';
import { AdminMenuService } from '../services/admin-menu.service';
import { AdminPageService } from '../services/admin-page.service';

@Controller('/api/v1/content')
@UseGuards(ApplicationTokenGuard)
@ApiSecurity({ 'application-id': [], 'application-token': [] })
export class PublicPageMenuController {
  constructor(
    private readonly pageService: AdminPageService,
    private readonly menuService: AdminMenuService,
    private readonly domainPolicy: DomainPolicyService,
  ) {}

  @Get('pages')
  async listPages(@Req() request: Request & { application?: ApplicationEntity }, @Query('languageCode') languageCode?: string): Promise<PageContentResponseDto[]> {
    const application = this.getApplication(request);
    this.enforceDeliveryDomainPolicy(application, request);
    return this.pageService.listPublished(application, languageCode);
  }

  @Get('pages/slugs')
  async listPageSlugs(@Req() request: Request & { application?: ApplicationEntity }, @Query('languageCode') languageCode?: string): Promise<Array<{ slug: string; languageCode: string }>> {
    const pages = await this.listPages(request, languageCode);
    return pages.map((page) => ({ slug: page.slug, languageCode: page.languageCode }));
  }

  @Get('pages/:languageCode/:slug')
  async getPage(@Req() request: Request & { application?: ApplicationEntity }, @Param('languageCode') languageCode: string, @Param('slug') slug: string): Promise<PageContentResponseDto> {
    const application = this.getApplication(request);
    this.enforceDeliveryDomainPolicy(application, request);
    return this.pageService.getPublished(application, languageCode, slug);
  }

  @Get('menus/location/:languageCode/:location')
  async getMenusByLocation(
    @Req() request: Request & { application?: ApplicationEntity },
    @Param('languageCode') languageCode: string,
    @Param('location') location: MenuLocation,
  ): Promise<MenuResponseDto[]> {
    const application = this.getApplication(request);
    this.enforceDeliveryDomainPolicy(application, request);
    return this.menuService.getPublicByLocation(application, languageCode, location);
  }

  @Get('menus/:languageCode/:code')
  async getMenu(@Req() request: Request & { application?: ApplicationEntity }, @Param('languageCode') languageCode: string, @Param('code') code: string): Promise<MenuResponseDto> {
    const application = this.getApplication(request);
    this.enforceDeliveryDomainPolicy(application, request);
    return this.menuService.getPublicByCode(application, languageCode, code);
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
