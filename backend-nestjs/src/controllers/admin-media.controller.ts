import { Body, Controller, Delete, Get, Logger, Param, Post, Query, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { MinioService } from '../services/minio.service';
import { MediaUploadResponseDto } from '../dto/responses/media-upload-response.dto';
import { BaseUrlService } from '../services/base-url.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationEntity } from '../entities/application.entity';
import { AdminAuthorizationService } from '../auth/admin-authorization.service';
import { ServicePermission } from '../auth/admin-permissions';
import { MediaLibraryService } from '../services/media-library.service';
import { MediaAssetKind } from '../entities/media-asset.entity';
import { MediaAssetState } from '../entities/media-asset.entity';
import { MediaLifecycleService } from '../services/media-lifecycle.service';
import { MediaAssetResponseDto } from '../dto/responses/media-asset-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';
import { MediaReferenceResponseDto } from '../dto/responses/media-reference-response.dto';

@Controller('/api/v1/admin/media')
export class AdminMediaController {
  private readonly logger = new Logger(AdminMediaController.name);

  constructor(
    private readonly minioService: MinioService,
    private readonly baseUrl: BaseUrlService,
    private readonly mediaLibraryService: MediaLibraryService,
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepo: Repository<ApplicationEntity>,
    private readonly access: AdminAuthorizationService,
    private readonly lifecycle: MediaLifecycleService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Req() request: Request,
    @UploadedFile() file: Express.Multer.File,
    @Body('applicationId') applicationId: string,
    @Body('kind') kind?: string,
  ): Promise<MediaUploadResponseDto> {
    this.access.assertAnyServicePermission(request, [
      ServicePermission.POSTS_MANAGE,
      ServicePermission.ARTICLES_MANAGE,
      ServicePermission.IMAGES_MANAGE,
      ServicePermission.VIDEOS_MANAGE,
    ]);
    this.access.assertApplicationAccess(request, applicationId);
    this.logger.log(
      `Upload request: app=${applicationId || 'missing'} kind=${kind || 'file'} file=${file?.originalname || 'none'}`,
    );
    try {
      const user = this.access.getUser(request);
      const result = await this.minioService.upload(applicationId, kind, file);
      const normalizedKind: MediaAssetKind =
        kind === 'image'
          ? MediaAssetKind.IMAGE
          : kind === 'video'
            ? MediaAssetKind.VIDEO
            : MediaAssetKind.OTHER;
      await this.mediaLibraryService.registerAsset({
        applicationId,
        ownerUserId: user.sub,
        kind: normalizedKind,
        bucket: this.minioService.getDefaultBucket(),
        objectKey: result.objectKey,
        contentType: result.contentType,
        sizeBytes: result.sizeBytes,
        originalName: file.originalname,
      });
      const application = await this.applicationRepo.findOne({ where: { id: applicationId } });
      const mediaUrl = application
        ? this.baseUrl.buildMediaUrl(application, result.objectKey)
        : result.objectKey;
      return new MediaUploadResponseDto(result.objectKey, result.contentType, result.sizeBytes, mediaUrl, mediaUrl);
    } catch (error) {
      this.logger.error('Upload failed', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  @Get()
  async listForAdmin(
    @Req() request: Request,
    @Query('applicationId') applicationId: string,
    @Query('state') state: MediaAssetState = MediaAssetState.TRASH,
    @Query('page') page = '0',
    @Query('size') size = '30',
  ): Promise<PageResponseDto<MediaAssetResponseDto>> {
    this.access.assertSuperAdmin(request);
    this.access.assertApplicationAccess(request, applicationId);
    return await this.lifecycle.listForAdmin(applicationId, state, Number(page), Number(size));
  }

  @Get(':id/references')
  async references(
    @Req() request: Request,
    @Param('id') id: string,
    @Query('applicationId') applicationId: string,
  ): Promise<MediaReferenceResponseDto[]> {
    this.access.assertSuperAdmin(request);
    this.access.assertApplicationAccess(request, applicationId);
    return await this.lifecycle.getReferences(applicationId, id);
  }

  @Delete(':id/purge')
  async purge(
    @Req() request: Request,
    @Param('id') id: string,
    @Query('applicationId') applicationId: string,
  ): Promise<MediaAssetResponseDto> {
    this.access.assertSuperAdmin(request);
    this.access.assertApplicationAccess(request, applicationId);
    const user = this.access.getUser(request);
    return await this.lifecycle.purgeAsSuperAdmin(applicationId, id, user.sub, user.email);
  }
}
