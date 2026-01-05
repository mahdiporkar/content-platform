import { Body, Controller, Get, Param, Patch, Post, Put, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminVideoService } from '../services/admin-video.service';
import { ChangeStatusRequestDto } from '../dto/requests/change-status-request.dto';
import { ContentStatus } from '../common/content-status.enum';
import { VideoResponseDto } from '../dto/responses/video-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';
import { VideoUpdateRequestDto } from '../dto/requests/video-update-request.dto';

@Controller('/api/v1/admin/videos')
export class AdminVideoController {
  constructor(private readonly videoService: AdminVideoService) {}

  private parseJson<T>(value: string | undefined): T | undefined {
    if (!value) {
      return undefined;
    }
    try {
      return JSON.parse(value) as T;
    } catch {
      return undefined;
    }
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title: string,
    @Body('description') description: string | undefined,
    @Body('applicationId') applicationId: string,
    @Body('status') status: ContentStatus,
    @Body('tags') tagsRaw?: string,
    @Body('seo') seoRaw?: string,
    @Body('gallery') galleryRaw?: string,
  ): Promise<VideoResponseDto> {
    const tags = this.parseJson<string[]>(tagsRaw);
    const seo = this.parseJson<Record<string, unknown>>(seoRaw);
    const gallery = this.parseJson<Record<string, unknown>[]>(galleryRaw);
    return await this.videoService.upload(file, title, description, applicationId, status, tags, seo, gallery);
  }

  @Patch(':id/status')
  async changeStatus(
    @Param('id') id: string,
    @Body() request: ChangeStatusRequestDto,
  ): Promise<VideoResponseDto> {
    return await this.videoService.changeStatus(id, request);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<VideoResponseDto> {
    return await this.videoService.getById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() request: VideoUpdateRequestDto,
  ): Promise<VideoResponseDto> {
    return await this.videoService.update(id, request);
  }

  @Get()
  async list(
    @Query('applicationId') applicationId: string,
    @Query('status') status?: ContentStatus,
    @Query('page') page = '0',
    @Query('size') size = '10',
  ): Promise<PageResponseDto<VideoResponseDto>> {
    return await this.videoService.list(applicationId, status, Number(page), Number(size));
  }
}
