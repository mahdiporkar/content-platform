import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentStatus } from '../common/content-status.enum';
import { PostResponseDto } from '../dto/responses/post-response.dto';
import { ArticleResponseDto } from '../dto/responses/article-response.dto';
import { VideoResponseDto } from '../dto/responses/video-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';
import { PostEntity } from '../entities/post.entity';
import { ArticleEntity } from '../entities/article.entity';
import { VideoEntity } from '../entities/video.entity';
import { MinioService } from './minio.service';

@Injectable()
export class PublicContentService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,
    @InjectRepository(ArticleEntity)
    private readonly articleRepo: Repository<ArticleEntity>,
    @InjectRepository(VideoEntity)
    private readonly videoRepo: Repository<VideoEntity>,
    private readonly minioService: MinioService,
  ) {}

  async listPosts(
    applicationId: string,
    status: ContentStatus,
    page: number,
    size: number,
  ): Promise<PageResponseDto<PostResponseDto>> {
    const pageNumber = Math.max(0, page);
    const pageSize = Math.max(1, size);
    const [items, total] = await this.postRepo.findAndCount({
      where: { applicationId, status },
      order: { publishedAt: 'DESC', createdAt: 'DESC' },
      skip: pageNumber * pageSize,
      take: pageSize,
    });

    const mapped = items.map(
      (post) =>
        new PostResponseDto(
          post.id,
          post.applicationId,
          post.title,
          post.slug,
          post.content,
          post.bannerUrl ?? null,
          post.tags ?? null,
          post.seo ?? null,
          post.gallery ?? null,
          post.status,
          post.publishedAt ? post.publishedAt.toISOString() : null,
          post.createdAt.toISOString(),
          post.updatedAt.toISOString(),
        ),
    );

    return new PageResponseDto(mapped, total, Math.ceil(total / pageSize), pageNumber, pageSize);
  }

  async getPost(applicationId: string, slug: string): Promise<PostResponseDto> {
    const post = await this.postRepo.findOne({
      where: { applicationId, slug, status: ContentStatus.PUBLISHED },
    });
    if (!post) {
      throw new NotFoundException('Post not found.');
    }
    return new PostResponseDto(
      post.id,
      post.applicationId,
      post.title,
      post.slug,
      post.content,
      post.bannerUrl ?? null,
      post.tags ?? null,
      post.seo ?? null,
      post.gallery ?? null,
      post.status,
      post.publishedAt ? post.publishedAt.toISOString() : null,
      post.createdAt.toISOString(),
      post.updatedAt.toISOString(),
    );
  }

  async listArticles(
    applicationId: string,
    status: ContentStatus,
    page: number,
    size: number,
  ): Promise<PageResponseDto<ArticleResponseDto>> {
    const pageNumber = Math.max(0, page);
    const pageSize = Math.max(1, size);
    const [items, total] = await this.articleRepo.findAndCount({
      where: { applicationId, status },
      order: { publishedAt: 'DESC', createdAt: 'DESC' },
      skip: pageNumber * pageSize,
      take: pageSize,
    });

    const mapped = items.map(
      (article) =>
        new ArticleResponseDto(
          article.id,
          article.applicationId,
          article.title,
          article.slug,
          article.content,
          article.bannerUrl ?? null,
          article.tags ?? null,
          article.seo ?? null,
          article.gallery ?? null,
          article.status,
          article.publishedAt ? article.publishedAt.toISOString() : null,
          article.createdAt.toISOString(),
          article.updatedAt.toISOString(),
        ),
    );

    return new PageResponseDto(mapped, total, Math.ceil(total / pageSize), pageNumber, pageSize);
  }

  async getArticle(applicationId: string, slug: string): Promise<ArticleResponseDto> {
    const article = await this.articleRepo.findOne({
      where: { applicationId, slug, status: ContentStatus.PUBLISHED },
    });
    if (!article) {
      throw new NotFoundException('Article not found.');
    }
    return new ArticleResponseDto(
      article.id,
      article.applicationId,
      article.title,
      article.slug,
      article.content,
      article.bannerUrl ?? null,
      article.tags ?? null,
      article.seo ?? null,
      article.gallery ?? null,
      article.status,
      article.publishedAt ? article.publishedAt.toISOString() : null,
      article.createdAt.toISOString(),
      article.updatedAt.toISOString(),
    );
  }

  async listVideos(
    applicationId: string,
    status: ContentStatus,
    page: number,
    size: number,
  ): Promise<PageResponseDto<VideoResponseDto>> {
    const pageNumber = Math.max(0, page);
    const pageSize = Math.max(1, size);
    const [items, total] = await this.videoRepo.findAndCount({
      where: { applicationId, status },
      order: { publishedAt: 'DESC', createdAt: 'DESC' },
      skip: pageNumber * pageSize,
      take: pageSize,
    });

    const mapped = items.map(
      (video) =>
        new VideoResponseDto(
          video.id,
          video.applicationId,
          video.title,
          video.description,
          video.tags ?? null,
          video.seo ?? null,
          video.gallery ?? null,
          video.status,
          video.publishedAt ? video.publishedAt.toISOString() : null,
          video.objectKey,
          video.contentType,
          video.sizeBytes,
          video.createdAt.toISOString(),
          video.updatedAt.toISOString(),
          this.minioService.getPublicUrl(video.objectKey),
        ),
    );

    return new PageResponseDto(mapped, total, Math.ceil(total / pageSize), pageNumber, pageSize);
  }
}
