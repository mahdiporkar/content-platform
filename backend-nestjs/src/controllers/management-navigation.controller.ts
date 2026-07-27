import { Body, Controller, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ManagementTokenGuard } from '../auth/management-token.guard';
import { TenantRouteSyncRequestDto } from '../dto/requests/tenant-route-sync-request.dto';
import { SitemapRoutesSyncDto } from '../dto/requests/sitemap-routes-sync.dto';
import { ApplicationEntity } from '../entities/application.entity';
import { TenantRouteService } from '../services/tenant-route.service';
import { SitemapService } from '../services/sitemap.service';
import { AdminMenuService } from '../services/admin-menu.service';
import { MenuFromRoutesRequestDto } from '../dto/requests/menu-from-routes-request.dto';

@Controller('/api/v1/management/navigation')
@UseGuards(ManagementTokenGuard)
export class ManagementNavigationController {
  constructor(
    private readonly routeService: TenantRouteService,
    private readonly sitemapService: SitemapService,
    private readonly menuService: AdminMenuService,
  ) {}

  @Put('routes')
  async sync(@Req() request: Request, @Body() body: TenantRouteSyncRequestDto) {
    const application = (request as Request & { application: ApplicationEntity }).application;
    return this.routeService.sync(application, body);
  }

  @Put('sitemap-routes')
  async syncSitemap(
    @Req() request: Request,
    @Body() body: SitemapRoutesSyncDto,
  ) {
    const application = (request as Request & { application: ApplicationEntity }).application;
    return this.sitemapService.syncConsumerRoutes(application.id, body);
  }

  @Put('menu')
  async ensureMenu(
    @Req() request: Request,
    @Body() body: MenuFromRoutesRequestDto,
  ) {
    const application = (request as Request & { application: ApplicationEntity }).application;
    return this.menuService.ensureFromTenantRoutes(application.id, body);
  }
}
