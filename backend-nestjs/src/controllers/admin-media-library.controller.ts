import { Controller, Get, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AdminAuthorizationService } from '../auth/admin-authorization.service';
import { ServicePermission } from '../auth/admin-permissions';
import { PageResponseDto } from '../dto/page-response.dto';
import { MediaAssetResponseDto } from '../dto/responses/media-asset-response.dto';
import { MediaAssetKind } from '../entities/media-asset.entity';
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
    @Query('applicationId') applicationId: string,
    @Query('kind') kind?: MediaAssetKind,
    @Query('search') search?: string,
    @Query('page') page = '0',
    @Query('size') size = '30',
  ): Promise<PageResponseDto<MediaAssetResponseDto>> {
    this.access.assertAnyServicePermission(request, [
      ServicePermission.POSTS_MANAGE,
      ServicePermission.ARTICLES_MANAGE,
      ServicePermission.IMAGES_MANAGE,
      ServicePermission.VIDEOS_MANAGE,
    ]);
    this.access.assertApplicationAccess(request, applicationId);
    const kindValue = kind && Object.values(MediaAssetKind).includes(kind) ? kind : undefined;
    return await this.mediaLibraryService.listAssets({
      applicationId,
      kind: kindValue,
      search,
      page: Number(page),
      size: Number(size),
    });
  }
}
