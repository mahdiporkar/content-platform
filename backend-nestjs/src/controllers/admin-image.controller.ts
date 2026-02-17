import { Body, Controller, Get, Param, Post, Put, Query, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminImageService } from '../services/admin-image.service';
import { ContentStatus } from '../common/content-status.enum';
import { ImageUpdateRequestDto } from '../dto/requests/image-update-request.dto';
import { ChangeStatusRequestDto } from '../dto/requests/change-status-request.dto';
import { ImageResponseDto } from '../dto/responses/image-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';
import { AdminAuthorizationService } from '../auth/admin-authorization.service';
import { ServicePermission } from '../auth/admin-permissions';

@Controller('/api/v1/admin/images')
export class AdminImageController {
  constructor(
    private readonly imageService: AdminImageService,
    private readonly access: AdminAuthorizationService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Req() request: Request,
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
    this.access.assertServiceAccess(request, ServicePermission.IMAGES_MANAGE, applicationId);
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
  async getById(@Req() request: Request, @Param('id') id: string): Promise<ImageResponseDto> {
    const applicationId = await this.imageService.getApplicationIdById(id);
    this.access.assertServiceAccess(request, ServicePermission.IMAGES_MANAGE, applicationId);
    return await this.imageService.getById(id);
  }

  @Put(':id')
  async update(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() body: ImageUpdateRequestDto,
  ): Promise<ImageResponseDto> {
    const applicationId = await this.imageService.getApplicationIdById(id);
    this.access.assertServiceAccess(request, ServicePermission.IMAGES_MANAGE, applicationId);
    return await this.imageService.update(id, body);
  }

  @Put(':id/status')
  async changeStatus(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() body: ChangeStatusRequestDto,
  ): Promise<ImageResponseDto> {
    this.access.assertServiceAccess(request, ServicePermission.IMAGES_MANAGE, body.applicationId);
    return await this.imageService.changeStatus(id, body);
  }

  @Get()
  async list(
    @Req() request: Request,
    @Query('applicationId') applicationId: string,
    @Query('status') status?: ContentStatus,
    @Query('page') page = '0',
    @Query('size') size = '10',
  ): Promise<PageResponseDto<ImageResponseDto>> {
    this.access.assertServiceAccess(request, ServicePermission.IMAGES_MANAGE, applicationId);
    return await this.imageService.list(applicationId, status, Number(page), Number(size));
  }
}
