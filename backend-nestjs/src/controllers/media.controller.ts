import { Controller, Delete, Get, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AdminAuthorizationService } from '../auth/admin-authorization.service';
import { ServicePermission } from '../auth/admin-permissions';
import { MediaLifecycleService } from '../services/media-lifecycle.service';
import { MediaAssetState } from '../entities/media-asset.entity';
import { MediaAssetResponseDto } from '../dto/responses/media-asset-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';

@Controller('/api/v1/media')
export class MediaController {
  constructor(
    private readonly lifecycle: MediaLifecycleService,
    private readonly access: AdminAuthorizationService,
  ) {}

  @Get()
  async list(
    @Req() request: Request,
    @Query('applicationId') applicationId: string,
    @Query('state') state: MediaAssetState = MediaAssetState.ACTIVE,
    @Query('page') page = '0',
    @Query('size') size = '30',
  ): Promise<PageResponseDto<MediaAssetResponseDto>> {
    this.access.assertAnyServicePermission(request, [
      ServicePermission.MEDIA_MANAGE,
      ServicePermission.POSTS_MANAGE,
      ServicePermission.ARTICLES_MANAGE,
      ServicePermission.IMAGES_MANAGE,
      ServicePermission.VIDEOS_MANAGE,
    ]);
    this.access.assertApplicationAccess(request, applicationId);
    return await this.lifecycle.listForTenant(applicationId, state, Number(page), Number(size));
  }

  @Delete(':id')
  async trash(
    @Req() request: Request,
    @Param('id') id: string,
    @Query('applicationId') applicationId: string,
  ): Promise<MediaAssetResponseDto> {
    this.access.assertAnyServicePermission(request, [
      ServicePermission.MEDIA_MANAGE,
      ServicePermission.POSTS_MANAGE,
      ServicePermission.ARTICLES_MANAGE,
      ServicePermission.IMAGES_MANAGE,
      ServicePermission.VIDEOS_MANAGE,
    ]);
    this.access.assertApplicationAccess(request, applicationId);
    const user = this.access.getUser(request);
    return await this.lifecycle.trash(applicationId, id, user.sub, user.email);
  }

  @Post(':id/restore')
  async restore(
    @Req() request: Request,
    @Param('id') id: string,
    @Query('applicationId') applicationId: string,
  ): Promise<MediaAssetResponseDto> {
    this.access.assertAnyServicePermission(request, [
      ServicePermission.MEDIA_MANAGE,
      ServicePermission.POSTS_MANAGE,
      ServicePermission.ARTICLES_MANAGE,
      ServicePermission.IMAGES_MANAGE,
      ServicePermission.VIDEOS_MANAGE,
    ]);
    this.access.assertApplicationAccess(request, applicationId);
    const user = this.access.getUser(request);
    return await this.lifecycle.restore(applicationId, id, user.sub, user.email);
  }
}
