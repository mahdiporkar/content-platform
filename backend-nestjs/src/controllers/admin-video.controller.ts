import { Body, Controller, Get, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminVideoService } from '../services/admin-video.service';
import { ChangeStatusRequestDto } from '../dto/requests/change-status-request.dto';
import { ContentStatus } from '../common/content-status.enum';
import { VideoResponseDto } from '../dto/responses/video-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';

@Controller('/api/v1/admin/videos')
export class AdminVideoController {
  constructor(private readonly videoService: AdminVideoService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title: string,
    @Body('description') description: string | undefined,
    @Body('applicationId') applicationId: string,
    @Body('status') status: ContentStatus,
  ): VideoResponseDto {
    return this.videoService.upload(file, title, description, applicationId, status);
  }

  @Patch(':id/status')
  changeStatus(@Param('id') id: string, @Body() request: ChangeStatusRequestDto): VideoResponseDto {
    return this.videoService.changeStatus(id, request);
  }

  @Get()
  list(
    @Query('applicationId') applicationId: string,
    @Query('status') status?: ContentStatus,
    @Query('page') page = '0',
    @Query('size') size = '10',
  ): PageResponseDto<VideoResponseDto> {
    return this.videoService.list(applicationId, status, Number(page), Number(size));
  }
}