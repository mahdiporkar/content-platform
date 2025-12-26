import { Injectable, NotImplementedException } from '@nestjs/common';
import { ArticleUpsertRequestDto } from '../dto/requests/article-upsert-request.dto';
import { ChangeStatusRequestDto } from '../dto/requests/change-status-request.dto';
import { ContentStatus } from '../common/content-status.enum';
import { ArticleResponseDto } from '../dto/responses/article-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';

@Injectable()
export class AdminArticleService {
  create(_request: ArticleUpsertRequestDto): ArticleResponseDto {
    throw new NotImplementedException('Article creation not implemented yet.');
  }

  update(_id: string, _request: ArticleUpsertRequestDto): ArticleResponseDto {
    throw new NotImplementedException('Article update not implemented yet.');
  }

  changeStatus(_id: string, _request: ChangeStatusRequestDto): ArticleResponseDto {
    throw new NotImplementedException('Article status change not implemented yet.');
  }

  list(_applicationId: string, _status: ContentStatus | undefined, _page: number, _size: number): PageResponseDto<ArticleResponseDto> {
    throw new NotImplementedException('Article listing not implemented yet.');
  }
}