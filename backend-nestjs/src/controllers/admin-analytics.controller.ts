import { Controller, Get, Query } from '@nestjs/common';
import { AdminAnalyticsService } from '../services/admin-analytics.service';
import { ContentType } from '../common/content-type.enum';

@Controller('/api/v1/admin/analytics')
export class AdminAnalyticsController {
  constructor(private readonly analytics: AdminAnalyticsService) {}

  @Get('top')
  async topContent(
    @Query('applicationId') applicationId: string,
    @Query('type') type?: ContentType,
    @Query('limit') limit = '10',
  ) {
    return await this.analytics.topContent(applicationId, type, Number(limit));
  }

  @Get('timeline')
  async timeline(
    @Query('applicationId') applicationId: string,
    @Query('days') days = '30',
  ) {
    return await this.analytics.timeline(applicationId, Number(days));
  }
}
