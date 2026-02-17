import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminVideoService } from '../services/admin-video.service';
import { ChangeStatusRequestDto } from '../dto/requests/change-status-request.dto';
import { ContentStatus } from '../common/content-status.enum';
import { VideoResponseDto } from '../dto/responses/video-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';
import { VideoUpdateRequestDto } from '../dto/requests/video-update-request.dto';
import { AdminAuthorizationService } from '../auth/admin-authorization.service';
import { ServicePermission } from '../auth/admin-permissions';

@Controller('/api/v1/admin/videos')
export class AdminVideoController {
  constructor(
    private readonly videoService: AdminVideoService,
    private readonly access: AdminAuthorizationService,
  ) {}

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
    @Req() request: Request,
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title: string,
    @Body('description') description: string | undefined,
    @Body('applicationId') applicationId: string,
    @Body('status') status: ContentStatus,
    @Body('tags') tagsRaw?: string,
    @Body('seo') seoRaw?: string,
    @Body('gallery') galleryRaw?: string,
  ): Promise<VideoResponseDto> {
    this.access.assertServiceAccess(request, ServicePermission.VIDEOS_MANAGE, applicationId);
    const tags = this.parseJson<string[]>(tagsRaw);
    const seo = this.parseJson<Record<string, unknown>>(seoRaw);
    const gallery = this.parseJson<Record<string, unknown>[]>(galleryRaw);
    return await this.videoService.upload(file, title, description, applicationId, status, tags, seo, gallery);
  }

  @Patch(':id/status')
  async changeStatus(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() body: ChangeStatusRequestDto,
  ): Promise<VideoResponseDto> {
    this.access.assertServiceAccess(request, ServicePermission.VIDEOS_MANAGE, body.applicationId);
    return await this.videoService.changeStatus(id, body);
  }

  @Get(':id')
  async getById(@Req() request: Request, @Param('id') id: string): Promise<VideoResponseDto> {
    const applicationId = await this.videoService.getApplicationIdById(id);
    this.access.assertServiceAccess(request, ServicePermission.VIDEOS_MANAGE, applicationId);
    return await this.videoService.getById(id);
  }

  @Put(':id')
  async update(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() body: VideoUpdateRequestDto,
  ): Promise<VideoResponseDto> {
    const applicationId = await this.videoService.getApplicationIdById(id);
    this.access.assertServiceAccess(request, ServicePermission.VIDEOS_MANAGE, applicationId);
    return await this.videoService.update(id, body);
  }

  @Get()
  async list(
    @Req() request: Request,
    @Query('applicationId') applicationId: string,
    @Query('status') status?: ContentStatus,
    @Query('page') page = '0',
    @Query('size') size = '10',
  ): Promise<PageResponseDto<VideoResponseDto>> {
    this.access.assertServiceAccess(request, ServicePermission.VIDEOS_MANAGE, applicationId);
    return await this.videoService.list(applicationId, status, Number(page), Number(size));
  }
}
