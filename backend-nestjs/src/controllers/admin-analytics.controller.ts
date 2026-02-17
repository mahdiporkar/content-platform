import { Controller, Get, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AdminAnalyticsService } from '../services/admin-analytics.service';
import { ContentType } from '../common/content-type.enum';
import { AdminAuthorizationService } from '../auth/admin-authorization.service';
import { ServicePermission } from '../auth/admin-permissions';

@Controller('/api/v1/admin/analytics')
export class AdminAnalyticsController {
  constructor(
    private readonly analytics: AdminAnalyticsService,
    private readonly access: AdminAuthorizationService,
  ) {}

  @Get('top')
  async topContent(
    @Req() request: Request,
    @Query('applicationId') applicationId: string,
    @Query('type') type?: ContentType,
    @Query('limit') limit = '10',
  ) {
    this.access.assertServiceAccess(request, ServicePermission.ANALYTICS_VIEW, applicationId);
    return await this.analytics.topContent(applicationId, type, Number(limit));
  }

  @Get('timeline')
  async timeline(
    @Req() request: Request,
    @Query('applicationId') applicationId: string,
    @Query('days') days = '30',
  ) {
    this.access.assertServiceAccess(request, ServicePermission.ANALYTICS_VIEW, applicationId);
    return await this.analytics.timeline(applicationId, Number(days));
  }
}
