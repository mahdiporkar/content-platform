import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { AdminPostService } from '../services/admin-post.service';
import { PostUpsertRequestDto } from '../dto/requests/post-upsert-request.dto';
import { ChangeStatusRequestDto } from '../dto/requests/change-status-request.dto';
import { ContentStatus } from '../common/content-status.enum';
import { PostResponseDto } from '../dto/responses/post-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';

@Controller('/api/v1/admin/posts')
export class AdminPostController {
  constructor(private readonly postService: AdminPostService) {}

  @Post()
  async create(@Body() request: PostUpsertRequestDto): Promise<PostResponseDto> {
    return await this.postService.create(request);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() request: PostUpsertRequestDto): Promise<PostResponseDto> {
    return await this.postService.update(id, request);
  }

  @Patch(':id/status')
  async changeStatus(@Param('id') id: string, @Body() request: ChangeStatusRequestDto): Promise<PostResponseDto> {
    return await this.postService.changeStatus(id, request);
  }

  @Get()
  async list(
    @Query('applicationId') applicationId: string,
    @Query('status') status?: ContentStatus,
    @Query('page') page = '0',
    @Query('size') size = '10',
  ): Promise<PageResponseDto<PostResponseDto>> {
    return await this.postService.list(applicationId, status, Number(page), Number(size));
  }
}
