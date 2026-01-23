import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ArticleUpsertRequestDto } from '../dto/requests/article-upsert-request.dto';
import { ChangeStatusRequestDto } from '../dto/requests/change-status-request.dto';
import { ContentStatus } from '../common/content-status.enum';
import { ArticleResponseDto } from '../dto/responses/article-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';
import { ArticleEntity } from '../entities/article.entity';

@Injectable()
export class AdminArticleService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepo: Repository<ArticleEntity>,
  ) {}

  private mapArticle(article: ArticleEntity): ArticleResponseDto {
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

  private normalizeTags(tags?: string[]): string[] | null {
    if (!tags) {
      return null;
    }
    const normalized = tags.map((tag) => tag.trim()).filter(Boolean);
    return normalized.length > 0 ? normalized : null;
  }

  async create(request: ArticleUpsertRequestDto): Promise<ArticleResponseDto> {
    const article = this.articleRepo.create({
      id: uuidv4(),
      applicationId: request.applicationId,
      title: request.title,
      slug: request.slug,
      content: request.content,
      bannerUrl: request.bannerUrl?.trim() || null,
      tags: this.normalizeTags(request.tags),
      seo: request.seo ? (request.seo as Record<string, unknown>) : null,
      gallery: request.gallery ? (request.gallery as unknown as Record<string, unknown>[]) : null,
      status: request.status,
      publishedAt: request.status === ContentStatus.PUBLISHED ? new Date() : null,
    });
    const saved = await this.articleRepo.save(article);
    return this.mapArticle(saved);
  }

  async update(id: string, request: ArticleUpsertRequestDto): Promise<ArticleResponseDto> {
    const article = await this.articleRepo.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException('Article not found.');
    }
    article.title = request.title;
    article.slug = request.slug;
    article.content = request.content;
    article.bannerUrl = request.bannerUrl?.trim() || null;
    article.tags = this.normalizeTags(request.tags);
    article.seo = request.seo ? (request.seo as Record<string, unknown>) : null;
    article.gallery = request.gallery
      ? (request.gallery as unknown as Record<string, unknown>[])
      : null;
    article.status = request.status;
    article.publishedAt =
      request.status === ContentStatus.PUBLISHED ? article.publishedAt ?? new Date() : null;
    const saved = await this.articleRepo.save(article);
    return this.mapArticle(saved);
  }

  async changeStatus(id: string, request: ChangeStatusRequestDto): Promise<ArticleResponseDto> {
    const article = await this.articleRepo.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException('Article not found.');
    }
    article.status = request.status;
    article.publishedAt = request.status === ContentStatus.PUBLISHED ? new Date() : null;
    const saved = await this.articleRepo.save(article);
    return this.mapArticle(saved);
  }

  async list(
    applicationId: string,
    status: ContentStatus | undefined,
    page: number,
    size: number,
  ): Promise<PageResponseDto<ArticleResponseDto>> {
    const pageNumber = Math.max(0, page);
    const pageSize = Math.max(1, size);
    const where = status ? { applicationId, status } : { applicationId };
    const [items, total] = await this.articleRepo.findAndCount({
      where,
      order: { publishedAt: 'DESC', createdAt: 'DESC' },
      skip: pageNumber * pageSize,
      take: pageSize,
    });

    const mapped = items.map((article) => this.mapArticle(article));
    return new PageResponseDto(mapped, total, Math.ceil(total / pageSize), pageNumber, pageSize);
  }
}
