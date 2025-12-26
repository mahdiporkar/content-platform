import { Injectable, NotImplementedException } from '@nestjs/common';
import { PostUpsertRequestDto } from '../dto/requests/post-upsert-request.dto';
import { ChangeStatusRequestDto } from '../dto/requests/change-status-request.dto';
import { ContentStatus } from '../common/content-status.enum';
import { PostResponseDto } from '../dto/responses/post-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';

@Injectable()
export class AdminPostService {
  create(_request: PostUpsertRequestDto): PostResponseDto {
    throw new NotImplementedException('Post creation not implemented yet.');
  }

  update(_id: string, _request: PostUpsertRequestDto): PostResponseDto {
    throw new NotImplementedException('Post update not implemented yet.');
  }

  changeStatus(_id: string, _request: ChangeStatusRequestDto): PostResponseDto {
    throw new NotImplementedException('Post status change not implemented yet.');
  }

  list(_applicationId: string, _status: ContentStatus | undefined, _page: number, _size: number): PageResponseDto<PostResponseDto> {
    throw new NotImplementedException('Post listing not implemented yet.');
  }
}