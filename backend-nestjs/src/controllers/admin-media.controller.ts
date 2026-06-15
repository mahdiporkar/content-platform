import { BadRequestException, Body, Controller, Delete, Get, Logger, Param, Post, Put, Query, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
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
import { MediaVariantService } from '../services/media-variant.service';
import { MediaVariantResponseDto } from '../dto/responses/media-variant-response.dto';

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
    private readonly mediaVariantService: MediaVariantService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Req() request: Request,
    @UploadedFile() file: Express.Multer.File,
    @Body('kind') kind?: string,
  ): Promise<MediaUploadResponseDto> {
    const applicationId = this.access.getApplicationId(request);
    this.access.assertAnyServicePermission(request, [
      ServicePermission.MEDIA_MANAGE,
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
    @Query('state') state: MediaAssetState = MediaAssetState.TRASH,
    @Query('page') page = '0',
    @Query('size') size = '30',
  ): Promise<PageResponseDto<MediaAssetResponseDto>> {
    const applicationId = this.access.getApplicationId(request);
    this.access.assertSuperAdmin(request);
    this.access.assertApplicationAccess(request, applicationId);
    return await this.lifecycle.listForAdmin(applicationId, state, Number(page), Number(size));
  }

  @Get(':id/references')
  async references(
    @Req() request: Request,
    @Param('id') id: string,
  ): Promise<MediaReferenceResponseDto[]> {
    const applicationId = this.access.getApplicationId(request);
    this.access.assertSuperAdmin(request);
    this.access.assertApplicationAccess(request, applicationId);
    return await this.lifecycle.getReferences(applicationId, id);
  }

  @Get(':id/variants')
  async listVariants(
    @Req() request: Request,
    @Param('id') id: string,
  ): Promise<MediaVariantResponseDto[]> {
    const applicationId = this.access.getApplicationId(request);
    this.access.assertAnyServicePermission(request, [
      ServicePermission.MEDIA_MANAGE,
      ServicePermission.POSTS_MANAGE,
      ServicePermission.ARTICLES_MANAGE,
      ServicePermission.IMAGES_MANAGE,
      ServicePermission.VIDEOS_MANAGE,
    ]);
    this.access.assertApplicationAccess(request, applicationId);
    return await this.mediaVariantService.listVariants(applicationId, id);
  }

  @Post(':id/variants')
  @UseInterceptors(FileInterceptor('file'))
  async addVariant(
    @Req() request: Request,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Record<string, string | undefined>,
  ): Promise<MediaVariantResponseDto> {
    const applicationId = this.access.getApplicationId(request);
    this.access.assertAnyServicePermission(request, [
      ServicePermission.MEDIA_MANAGE,
      ServicePermission.POSTS_MANAGE,
      ServicePermission.ARTICLES_MANAGE,
      ServicePermission.IMAGES_MANAGE,
      ServicePermission.VIDEOS_MANAGE,
    ]);
    this.access.assertApplicationAccess(request, applicationId);
    if (!file) {
      throw new BadRequestException('file is required.');
    }
    const kindHint = body.kind?.trim().toLowerCase() || undefined;
    const upload = await this.minioService.upload(applicationId, kindHint, file);
    return await this.mediaVariantService.addVariant(applicationId, id, {
      purpose: body.purpose,
      sizeKey: body.sizeKey,
      device: body.device,
      minWidth: this.toOptionalNumber(body.minWidth),
      maxWidth: this.toOptionalNumber(body.maxWidth),
      format: body.format,
      objectKey: upload.objectKey,
      bucket: this.minioService.getDefaultBucket(),
      fileUrl: null,
      isDefault: this.toOptionalBoolean(body.isDefault),
      sortOrder: this.toOptionalNumber(body.sortOrder),
      width: this.toOptionalNumber(body.width),
      height: this.toOptionalNumber(body.height),
      duration: this.toOptionalNumber(body.duration),
      bitrate: this.toOptionalNumber(body.bitrate),
      sizeBytes: upload.sizeBytes,
      contentType: upload.contentType,
    });
  }

  @Put(':id/variants/:variantId')
  @UseInterceptors(FileInterceptor('file'))
  async replaceVariant(
    @Req() request: Request,
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: Record<string, string | undefined>,
  ): Promise<MediaVariantResponseDto> {
    const applicationId = this.access.getApplicationId(request);
    this.access.assertAnyServicePermission(request, [
      ServicePermission.MEDIA_MANAGE,
      ServicePermission.POSTS_MANAGE,
      ServicePermission.ARTICLES_MANAGE,
      ServicePermission.IMAGES_MANAGE,
      ServicePermission.VIDEOS_MANAGE,
    ]);
    this.access.assertApplicationAccess(request, applicationId);

    let objectKey: string | undefined;
    let contentType: string | undefined;
    let sizeBytes: number | undefined;
    if (file) {
      const upload = await this.minioService.upload(applicationId, body.kind?.trim().toLowerCase() || undefined, file);
      objectKey = upload.objectKey;
      contentType = upload.contentType;
      sizeBytes = upload.sizeBytes;
    }

    return await this.mediaVariantService.replaceVariant(applicationId, id, variantId, {
      purpose: body.purpose,
      sizeKey: body.sizeKey,
      device: body.device,
      minWidth: this.toOptionalNumber(body.minWidth),
      maxWidth: this.toOptionalNumber(body.maxWidth),
      format: body.format,
      objectKey,
      bucket: this.minioService.getDefaultBucket(),
      fileUrl: body.fileUrl ?? undefined,
      isDefault: this.toOptionalBoolean(body.isDefault),
      sortOrder: this.toOptionalNumber(body.sortOrder),
      width: this.toOptionalNumber(body.width),
      height: this.toOptionalNumber(body.height),
      duration: this.toOptionalNumber(body.duration),
      bitrate: this.toOptionalNumber(body.bitrate),
      sizeBytes,
      contentType,
    });
  }

  @Delete(':id/variants/:variantId')
  async deleteVariant(
    @Req() request: Request,
    @Param('id') id: string,
    @Param('variantId') variantId: string,
  ): Promise<{ ok: boolean }> {
    const applicationId = this.access.getApplicationId(request);
    this.access.assertAnyServicePermission(request, [
      ServicePermission.MEDIA_MANAGE,
      ServicePermission.POSTS_MANAGE,
      ServicePermission.ARTICLES_MANAGE,
      ServicePermission.IMAGES_MANAGE,
      ServicePermission.VIDEOS_MANAGE,
    ]);
    this.access.assertApplicationAccess(request, applicationId);
    await this.mediaVariantService.deleteVariant(applicationId, id, variantId);
    return { ok: true };
  }

  @Delete(':id/purge')
  async purge(
    @Req() request: Request,
    @Param('id') id: string,
  ): Promise<MediaAssetResponseDto> {
    const applicationId = this.access.getApplicationId(request);
    this.access.assertSuperAdmin(request);
    this.access.assertApplicationAccess(request, applicationId);
    const user = this.access.getUser(request);
    return await this.lifecycle.purgeAsSuperAdmin(applicationId, id, user.sub, user.email);
  }

  private toOptionalNumber(value?: string): number | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (value === null || value.trim() === '') {
      return null;
    }
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      throw new BadRequestException(`Invalid number: ${value}`);
    }
    return numeric;
  }

  private toOptionalBoolean(value?: string): boolean | undefined {
    if (value === undefined) {
      return undefined;
    }
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }
    if (normalized === 'false' || normalized === '0') {
      return false;
    }
    throw new BadRequestException(`Invalid boolean: ${value}`);
  }
}
