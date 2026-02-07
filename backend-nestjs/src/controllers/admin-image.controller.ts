import { Body, Controller, Get, Param, Post, Put, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminImageService } from '../services/admin-image.service';
import { ContentStatus } from '../common/content-status.enum';
import { ImageUpdateRequestDto } from '../dto/requests/image-update-request.dto';
import { ChangeStatusRequestDto } from '../dto/requests/change-status-request.dto';
import { ImageResponseDto } from '../dto/responses/image-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';

@Controller('/api/v1/admin/images')
export class AdminImageController {
  constructor(private readonly imageService: AdminImageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title: string,
    @Body('description') description: string | undefined,
    @Body('applicationId') applicationId: string,
    @Body('status') status: ContentStatus,
    @Body('tags') tags?: string[],
    @Body('seo') seo?: Record<string, unknown>,
    @Body('gallery') gallery?: Record<string, unknown>[],
    @Body('locale') locale?: string,
    @Body('altText') altText?: string,
  ): Promise<ImageResponseDto> {
    return await this.imageService.upload(
      file,
      title,
      description,
      applicationId,
      status,
      tags,
      seo,
      gallery,
      locale,
      altText,
    );
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<ImageResponseDto> {
    return await this.imageService.getById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() request: ImageUpdateRequestDto): Promise<ImageResponseDto> {
    return await this.imageService.update(id, request);
  }

  @Put(':id/status')
  async changeStatus(
    @Param('id') id: string,
    @Body() request: ChangeStatusRequestDto,
  ): Promise<ImageResponseDto> {
    return await this.imageService.changeStatus(id, request);
  }

  @Get()
  async list(
    @Query('applicationId') applicationId: string,
    @Query('status') status?: ContentStatus,
    @Query('page') page = '0',
    @Query('size') size = '10',
  ): Promise<PageResponseDto<ImageResponseDto>> {
    return await this.imageService.list(applicationId, status, Number(page), Number(size));
  }
}
