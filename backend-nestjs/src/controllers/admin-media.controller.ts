import { Body, Controller, Logger, Post, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
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

@Controller('/api/v1/admin/media')
export class AdminMediaController {
  private readonly logger = new Logger(AdminMediaController.name);

  constructor(
    private readonly minioService: MinioService,
    private readonly baseUrl: BaseUrlService,
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepo: Repository<ApplicationEntity>,
    private readonly access: AdminAuthorizationService,
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
      const result = await this.minioService.upload(applicationId, kind, file);
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
}
