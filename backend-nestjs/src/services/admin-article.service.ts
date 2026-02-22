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
import { normalizeContentLocale } from '../common/content-locale.constants';
import { resolvePublicationFields } from '../common/publishing';
import { MediaReferenceService } from './media-reference.service';
import { MediaReferenceType } from '../entities/media-reference.entity';

@Injectable()
export class AdminArticleService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepo: Repository<ArticleEntity>,
    private readonly mediaReferenceService: MediaReferenceService,
  ) {}

  private mapArticle(article: ArticleEntity): ArticleResponseDto {
    return new ArticleResponseDto(
      article.id,
      article.applicationId,
      article.title,
      article.description ?? null,
      article.slug,
      article.content,
      article.bannerUrl ?? null,
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

  private normalizeTags(tags?: string[]): string[] | null {
    if (!tags) {
      return null;
    }
    const normalized = tags.map((tag) => tag.trim()).filter(Boolean);
    return normalized.length > 0 ? normalized : null;
  }

  async create(request: ArticleUpsertRequestDto): Promise<ArticleResponseDto> {
    const publication = resolvePublicationFields(request.status, request.scheduledAt);
    const article = this.articleRepo.create({
      id: uuidv4(),
      applicationId: request.applicationId,
      title: request.title.trim(),
      description: request.description?.trim() || null,
      slug: request.slug.trim(),
      content: request.content,
      bannerUrl: request.bannerUrl?.trim() || null,
      bannerKey: request.bannerKey?.trim() || null,
      locale: normalizeContentLocale(request.locale),
      tags: this.normalizeTags(request.tags),
      seo: request.seo ? (request.seo as Record<string, unknown>) : null,
      gallery: request.gallery ? (request.gallery as unknown as Record<string, unknown>[]) : null,
      status: request.status,
      publishedAt: publication.publishedAt,
      scheduledAt: publication.scheduledAt,
    });
    const saved = await this.articleRepo.save(article);
    await this.mediaReferenceService.syncContentReferences({
      applicationId: saved.applicationId,
      refType: MediaReferenceType.ARTICLE,
      refId: saved.id,
      bannerKey: saved.bannerKey,
      bannerUrl: saved.bannerUrl,
      galleryUrls: (saved.gallery || []).map((entry) => String((entry as Record<string, unknown>).url || '')).filter(Boolean),
      content: saved.content,
    });
    return this.mapArticle(saved);
  }

  async update(id: string, request: ArticleUpsertRequestDto): Promise<ArticleResponseDto> {
    const article = await this.articleRepo.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException('Article not found.');
    }
    const publication = resolvePublicationFields(request.status, request.scheduledAt, article.publishedAt);
    article.title = request.title.trim();
    article.description = request.description?.trim() || null;
    article.slug = request.slug.trim();
    article.content = request.content;
    article.bannerUrl = request.bannerUrl?.trim() || null;
    article.bannerKey = request.bannerKey?.trim() || null;
    article.locale = normalizeContentLocale(request.locale);
    article.tags = this.normalizeTags(request.tags);
    article.seo = request.seo ? (request.seo as Record<string, unknown>) : null;
    article.gallery = request.gallery
      ? (request.gallery as unknown as Record<string, unknown>[])
      : null;
    article.status = request.status;
    article.publishedAt = publication.publishedAt;
    article.scheduledAt = publication.scheduledAt;
    const saved = await this.articleRepo.save(article);
    await this.mediaReferenceService.syncContentReferences({
      applicationId: saved.applicationId,
      refType: MediaReferenceType.ARTICLE,
      refId: saved.id,
      bannerKey: saved.bannerKey,
      bannerUrl: saved.bannerUrl,
      galleryUrls: (saved.gallery || []).map((entry) => String((entry as Record<string, unknown>).url || '')).filter(Boolean),
      content: saved.content,
    });
    return this.mapArticle(saved);
  }

  async changeStatus(id: string, request: ChangeStatusRequestDto): Promise<ArticleResponseDto> {
    const article = await this.articleRepo.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException('Article not found.');
    }
    article.status = request.status;
    article.publishedAt = request.status === ContentStatus.PUBLISHED ? new Date() : null;
    article.scheduledAt = null;
    const saved = await this.articleRepo.save(article);
    return this.mapArticle(saved);
  }

  async getApplicationIdById(id: string): Promise<string> {
    const article = await this.articleRepo.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException('Article not found.');
    }
    return article.applicationId;
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
