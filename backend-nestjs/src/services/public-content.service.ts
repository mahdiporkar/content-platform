import { Injectable, NotImplementedException } from '@nestjs/common';
import { ContentStatus } from '../common/content-status.enum';
import { PostResponseDto } from '../dto/responses/post-response.dto';
import { ArticleResponseDto } from '../dto/responses/article-response.dto';
import { VideoResponseDto } from '../dto/responses/video-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';

@Injectable()
export class PublicContentService {
  listPosts(_applicationId: string, _status: ContentStatus, _page: number, _size: number): PageResponseDto<PostResponseDto> {
    throw new NotImplementedException('Public post listing not implemented yet.');
  }

  getPost(_applicationId: string, _slug: string): PostResponseDto {
    throw new NotImplementedException('Public post lookup not implemented yet.');
  }

  listArticles(_applicationId: string, _status: ContentStatus, _page: number, _size: number): PageResponseDto<ArticleResponseDto> {
    throw new NotImplementedException('Public article listing not implemented yet.');
  }

  getArticle(_applicationId: string, _slug: string): ArticleResponseDto {
    throw new NotImplementedException('Public article lookup not implemented yet.');
  }

  listVideos(_applicationId: string, _status: ContentStatus, _page: number, _size: number): PageResponseDto<VideoResponseDto> {
    throw new NotImplementedException('Public video listing not implemented yet.');
  }
}