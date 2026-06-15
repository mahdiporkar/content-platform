import { Controller, Get, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AdminAuthorizationService } from '../auth/admin-authorization.service';
import { ServicePermission } from '../auth/admin-permissions';
import { PageResponseDto } from '../dto/page-response.dto';
import { MediaAssetResponseDto } from '../dto/responses/media-asset-response.dto';
import { MediaAssetKind, MediaAssetState } from '../entities/media-asset.entity';
import { MediaLibraryService } from '../services/media-library.service';

@Controller('/api/v1/admin/media/library')
export class AdminMediaLibraryController {
  constructor(
    private readonly mediaLibraryService: MediaLibraryService,
    private readonly access: AdminAuthorizationService,
  ) {}

  @Get()
  async list(
    @Req() request: Request,
    @Query('kind') kind?: string,
    @Query('state') state: MediaAssetState = MediaAssetState.ACTIVE,
    @Query('search') search?: string,
    @Query('page') page = '0',
    @Query('size') size = '30',
  ): Promise<PageResponseDto<MediaAssetResponseDto>> {
    const applicationId = this.access.getApplicationId(request);
    this.access.assertAnyServicePermission(request, [
      ServicePermission.MEDIA_MANAGE,
      ServicePermission.POSTS_MANAGE,
      ServicePermission.ARTICLES_MANAGE,
      ServicePermission.IMAGES_MANAGE,
      ServicePermission.VIDEOS_MANAGE,
    ]);
    this.access.assertApplicationAccess(request, applicationId);
    const normalizedKind = kind?.trim().toUpperCase();
    const kindValue =
      normalizedKind && Object.values(MediaAssetKind).includes(normalizedKind as MediaAssetKind)
        ? (normalizedKind as MediaAssetKind)
        : undefined;
    return await this.mediaLibraryService.listAssets({
      applicationId,
      kind: kindValue,
      state,
      search,
      page: Number(page),
      size: Number(size),
    });
  }

  @Get('resolve')
  async resolveByObjectKey(
    @Req() request: Request,
    @Query('objectKey') objectKey: string,
  ): Promise<MediaAssetResponseDto> {
    const applicationId = this.access.getApplicationId(request);
    this.access.assertAnyServicePermission(request, [
      ServicePermission.MEDIA_MANAGE,
      ServicePermission.POSTS_MANAGE,
      ServicePermission.ARTICLES_MANAGE,
      ServicePermission.IMAGES_MANAGE,
      ServicePermission.VIDEOS_MANAGE,
    ]);
    this.access.assertApplicationAccess(request, applicationId);
    return await this.mediaLibraryService.getAssetResponseByObjectKeyForApplication(objectKey, applicationId);
  }
}
