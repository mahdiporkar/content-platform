import { Body, Controller, Logger, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MinioService } from '../services/minio.service';
import { MediaUploadResponseDto } from '../dto/responses/media-upload-response.dto';

@Controller('/api/v1/admin/media')
export class AdminMediaController {
  private readonly logger = new Logger(AdminMediaController.name);

  constructor(private readonly minioService: MinioService) {}

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
      return new MediaUploadResponseDto(result.objectKey, result.contentType, result.sizeBytes, result.url);
    } catch (error) {
      this.logger.error('Upload failed', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
}
