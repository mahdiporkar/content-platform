import { Body, Controller, Logger, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MinioService } from '../services/minio.service';
import { MediaUploadResponseDto } from '../dto/responses/media-upload-response.dto';
import { BaseUrlService } from '../services/base-url.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationEntity } from '../entities/application.entity';

@Controller('/api/v1/admin/media')
export class AdminMediaController {
  private readonly logger = new Logger(AdminMediaController.name);

  constructor(
    private readonly minioService: MinioService,
    private readonly baseUrl: BaseUrlService,
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepo: Repository<ApplicationEntity>,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('applicationId') applicationId: string,
    @Body('kind') kind?: string,
  ): Promise<MediaUploadResponseDto> {
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
