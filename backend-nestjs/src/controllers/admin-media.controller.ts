import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MinioService } from '../services/minio.service';
import { MediaUploadResponseDto } from '../dto/responses/media-upload-response.dto';

@Controller('/api/v1/admin/media')
export class AdminMediaController {
  constructor(private readonly minioService: MinioService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('applicationId') applicationId: string,
    @Body('kind') kind?: string,
  ): Promise<MediaUploadResponseDto> {
    const result = await this.minioService.upload(applicationId, kind, file);
    return new MediaUploadResponseDto(result.objectKey, result.contentType, result.sizeBytes, result.url);
  }
}
