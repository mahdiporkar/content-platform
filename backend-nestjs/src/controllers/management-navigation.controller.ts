import { Body, Controller, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ManagementTokenGuard } from '../auth/management-token.guard';
import { TenantRouteSyncRequestDto } from '../dto/requests/tenant-route-sync-request.dto';
import { ApplicationEntity } from '../entities/application.entity';
import { TenantRouteService } from '../services/tenant-route.service';

@Controller('/api/v1/management/navigation')
@UseGuards(ManagementTokenGuard)
export class ManagementNavigationController {
  constructor(private readonly routeService: TenantRouteService) {}

  @Put('routes')
  async sync(@Req() request: Request, @Body() body: TenantRouteSyncRequestDto) {
    const application = (request as Request & { application: ApplicationEntity }).application;
    return this.routeService.sync(application, body);
  }
}
