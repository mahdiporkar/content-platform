import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentStatus } from '../common/content-status.enum';
import { PostResponseDto } from '../dto/responses/post-response.dto';
import { ArticleResponseDto } from '../dto/responses/article-response.dto';
import { VideoResponseDto } from '../dto/responses/video-response.dto';
import { GalleryImageResponseDto } from '../dto/responses/gallery-image-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';
import { PostEntity } from '../entities/post.entity';
import { ArticleEntity } from '../entities/article.entity';
import { VideoEntity } from '../entities/video.entity';
import { ApplicationEntity } from '../entities/application.entity';
import { BaseUrlService } from './base-url.service';

@Injectable()
export class PublicContentService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,
    @InjectRepository(ArticleEntity)
    private readonly articleRepo: Repository<ArticleEntity>,
    @InjectRepository(VideoEntity)
    private readonly videoRepo: Repository<VideoEntity>,
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepo: Repository<ApplicationEntity>,
    private readonly baseUrl: BaseUrlService,
  ) {}

  private toOptionalString(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
  }

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

    const application = await this.applicationRepo.findOne({ where: { id: applicationId } });
    const mapped = items.map((post) => {
      const bannerUrl = post.bannerKey && application
        ? this.baseUrl.buildMediaUrl(application, post.bannerKey)
        : post.bannerUrl ?? null;
      return new PostResponseDto(
        post.id,
        post.applicationId,
        post.title,
        post.description ?? null,
        post.slug,
        post.content,
        bannerUrl,
        post.bannerKey ?? null,
        post.locale ?? null,
        post.tags ?? null,
        post.seo ?? null,
        post.gallery ?? null,
        post.status,
        post.publishedAt ? post.publishedAt.toISOString() : null,
        post.scheduledAt ? post.scheduledAt.toISOString() : null,
        post.viewCount ?? 0,
        post.createdAt.toISOString(),
        post.updatedAt.toISOString(),
      );
    });

    return new PageResponseDto(mapped, total, Math.ceil(total / pageSize), pageNumber, pageSize);
  }

  async getPost(applicationId: string, slug: string): Promise<PostResponseDto> {
    const post = await this.postRepo.findOne({
      where: { applicationId, slug, status: ContentStatus.PUBLISHED },
    });
    if (!post) {
      throw new NotFoundException('Post not found.');
    }
    const application = await this.applicationRepo.findOne({ where: { id: applicationId } });
    const bannerUrl = post.bannerKey && application
      ? this.baseUrl.buildMediaUrl(application, post.bannerKey)
      : post.bannerUrl ?? null;
    return new PostResponseDto(
      post.id,
      post.applicationId,
      post.title,
      post.description ?? null,
      post.slug,
      post.content,
      bannerUrl,
      post.bannerKey ?? null,
      post.locale ?? null,
      post.tags ?? null,
      post.seo ?? null,
      post.gallery ?? null,
      post.status,
      post.publishedAt ? post.publishedAt.toISOString() : null,
      post.scheduledAt ? post.scheduledAt.toISOString() : null,
      post.viewCount ?? 0,
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

    const application = await this.applicationRepo.findOne({ where: { id: applicationId } });
    const mapped = items.map((article) => {
      const bannerUrl = article.bannerKey && application
        ? this.baseUrl.buildMediaUrl(application, article.bannerKey)
        : article.bannerUrl ?? null;
      return new ArticleResponseDto(
        article.id,
        article.applicationId,
        article.title,
        article.description ?? null,
        article.slug,
        article.content,
        bannerUrl,
        article.bannerKey ?? null,
        article.locale ?? null,
        article.tags ?? null,
        article.seo ?? null,
        article.gallery ?? null,
        article.status,
        article.publishedAt ? article.publishedAt.toISOString() : null,
        article.scheduledAt ? article.scheduledAt.toISOString() : null,
        article.viewCount ?? 0,
        article.createdAt.toISOString(),
        article.updatedAt.toISOString(),
      );
    });

    return new PageResponseDto(mapped, total, Math.ceil(total / pageSize), pageNumber, pageSize);
  }

  async getArticle(applicationId: string, slug: string): Promise<ArticleResponseDto> {
    const article = await this.articleRepo.findOne({
      where: { applicationId, slug, status: ContentStatus.PUBLISHED },
    });
    if (!article) {
      throw new NotFoundException('Article not found.');
    }
    const application = await this.applicationRepo.findOne({ where: { id: applicationId } });
    const bannerUrl = article.bannerKey && application
      ? this.baseUrl.buildMediaUrl(application, article.bannerKey)
      : article.bannerUrl ?? null;
    return new ArticleResponseDto(
      article.id,
      article.applicationId,
      article.title,
      article.description ?? null,
      article.slug,
      article.content,
      bannerUrl,
      article.bannerKey ?? null,
      article.locale ?? null,
      article.tags ?? null,
      article.seo ?? null,
      article.gallery ?? null,
      article.status,
      article.publishedAt ? article.publishedAt.toISOString() : null,
      article.scheduledAt ? article.scheduledAt.toISOString() : null,
      article.viewCount ?? 0,
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

    const application = await this.applicationRepo.findOne({ where: { id: applicationId } });
    const mapped = items.map(
      (video) =>
        new VideoResponseDto(
          video.id,
          video.applicationId,
          video.title,
          video.description,
          video.locale ?? null,
          video.tags ?? null,
          video.seo ?? null,
          video.gallery ?? null,
          video.status,
          video.publishedAt ? video.publishedAt.toISOString() : null,
          video.scheduledAt ? video.scheduledAt.toISOString() : null,
          video.viewCount ?? 0,
          video.objectKey,
          video.posterKey ?? null,
          video.durationSeconds ?? null,
          video.width ?? null,
          video.height ?? null,
          video.contentType,
          video.sizeBytes,
          video.altText ?? null,
          video.createdAt.toISOString(),
          video.updatedAt.toISOString(),
          application ? this.baseUrl.buildMediaUrl(application, video.objectKey) : null,
          application ? this.baseUrl.buildMediaUrl(application, video.objectKey) : null,
        ),
    );

    return new PageResponseDto(mapped, total, Math.ceil(total / pageSize), pageNumber, pageSize);
  }

  async getVideo(applicationId: string, id: string): Promise<VideoResponseDto> {
    const video = await this.videoRepo.findOne({
      where: { applicationId, id, status: ContentStatus.PUBLISHED },
    });
    if (!video) {
      throw new NotFoundException('Video not found.');
    }
    const application = await this.applicationRepo.findOne({ where: { id: applicationId } });
    return new VideoResponseDto(
      video.id,
      video.applicationId,
      video.title,
      video.description,
      video.locale ?? null,
      video.tags ?? null,
      video.seo ?? null,
      video.gallery ?? null,
      video.status,
      video.publishedAt ? video.publishedAt.toISOString() : null,
      video.scheduledAt ? video.scheduledAt.toISOString() : null,
      video.viewCount ?? 0,
      video.objectKey,
      video.posterKey ?? null,
      video.durationSeconds ?? null,
      video.width ?? null,
      video.height ?? null,
      video.contentType,
      video.sizeBytes,
      video.altText ?? null,
      video.createdAt.toISOString(),
      video.updatedAt.toISOString(),
      application ? this.baseUrl.buildMediaUrl(application, video.objectKey) : null,
      application ? this.baseUrl.buildMediaUrl(application, video.objectKey) : null,
    );
  }

  async listGallery(
    applicationId: string,
    page: number,
    size: number,
  ): Promise<PageResponseDto<GalleryImageResponseDto>> {
    const application = await this.applicationRepo.findOne({ where: { id: applicationId } });
    if (!application) {
      throw new NotFoundException('Application not found.');
    }
    const gallery = (application.gallery || [])
      .filter((item) => typeof item.url === 'string' && item.url.trim().length > 0)
      .map(
        (item) =>
          new GalleryImageResponseDto(
            item.url as string,
            this.toOptionalString(item.alt),
            this.toOptionalString(item.caption),
          ),
      );
    const pageNumber = Math.max(0, page);
    const pageSize = Math.max(1, size);
    const start = pageNumber * pageSize;
    const paged = gallery.slice(start, start + pageSize);
    return new PageResponseDto(paged, gallery.length, Math.ceil(gallery.length / pageSize), pageNumber, pageSize);
  }

  async getGalleryItem(applicationId: string, index: number): Promise<GalleryImageResponseDto> {
    const application = await this.applicationRepo.findOne({ where: { id: applicationId } });
    if (!application) {
      throw new NotFoundException('Application not found.');
    }
    const gallery = (application.gallery || []).filter(
      (item) => typeof item.url === 'string' && item.url.trim().length > 0,
    );
    if (index < 0 || index >= gallery.length) {
      throw new NotFoundException('Gallery item not found.');
    }
    const item = gallery[index];
    return new GalleryImageResponseDto(
      item.url as string,
      this.toOptionalString(item.alt),
      this.toOptionalString(item.caption),
    );
  }
}
