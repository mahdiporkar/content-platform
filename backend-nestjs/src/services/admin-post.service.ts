import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { PostUpsertRequestDto } from '../dto/requests/post-upsert-request.dto';
import { ChangeStatusRequestDto } from '../dto/requests/change-status-request.dto';
import { ContentStatus } from '../common/content-status.enum';
import { PostResponseDto } from '../dto/responses/post-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';
import { PostEntity } from '../entities/post.entity';
import { normalizeContentLocale } from '../common/content-locale.constants';

@Injectable()
export class AdminPostService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,
  ) {}

  private mapPost(post: PostEntity): PostResponseDto {
    return new PostResponseDto(
      post.id,
      post.applicationId,
      post.title,
      post.description ?? null,
      post.slug,
      post.content,
      post.bannerUrl ?? null,
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

  private normalizeTags(tags?: string[]): string[] | null {
    if (!tags) {
      return null;
    }
    const normalized = tags.map((tag) => tag.trim()).filter(Boolean);
    return normalized.length > 0 ? normalized : null;
  }

  async create(request: PostUpsertRequestDto): Promise<PostResponseDto> {
    const post = this.postRepo.create({
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
      publishedAt: request.status === ContentStatus.PUBLISHED ? new Date() : null,
      scheduledAt: request.scheduledAt ? new Date(request.scheduledAt) : null,
    });
    const saved = await this.postRepo.save(post);
    return this.mapPost(saved);
  }

  async update(id: string, request: PostUpsertRequestDto): Promise<PostResponseDto> {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('Post not found.');
    }
    post.title = request.title.trim();
    post.description = request.description?.trim() || null;
    post.slug = request.slug.trim();
    post.content = request.content;
    post.bannerUrl = request.bannerUrl?.trim() || null;
    post.bannerKey = request.bannerKey?.trim() || null;
    post.locale = normalizeContentLocale(request.locale);
    post.tags = this.normalizeTags(request.tags);
    post.seo = request.seo ? (request.seo as Record<string, unknown>) : null;
    post.gallery = request.gallery
      ? (request.gallery as unknown as Record<string, unknown>[])
      : null;
    post.status = request.status;
    post.publishedAt =
      request.status === ContentStatus.PUBLISHED ? post.publishedAt ?? new Date() : null;
    post.scheduledAt = request.scheduledAt ? new Date(request.scheduledAt) : null;
    const saved = await this.postRepo.save(post);
    return this.mapPost(saved);
  }

  async changeStatus(id: string, request: ChangeStatusRequestDto): Promise<PostResponseDto> {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('Post not found.');
    }
    post.status = request.status;
    post.publishedAt = request.status === ContentStatus.PUBLISHED ? new Date() : null;
    const saved = await this.postRepo.save(post);
    return this.mapPost(saved);
  }

  async getApplicationIdById(id: string): Promise<string> {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('Post not found.');
    }
    return post.applicationId;
  }

  async list(
    applicationId: string,
    status: ContentStatus | undefined,
    page: number,
    size: number,
  ): Promise<PageResponseDto<PostResponseDto>> {
    const pageNumber = Math.max(0, page);
    const pageSize = Math.max(1, size);
    const where = status ? { applicationId, status } : { applicationId };
    const [items, total] = await this.postRepo.findAndCount({
      where,
      order: { publishedAt: 'DESC', createdAt: 'DESC' },
      skip: pageNumber * pageSize,
      take: pageSize,
    });

    const mapped = items.map((post) => this.mapPost(post));
    return new PageResponseDto(mapped, total, Math.ceil(total / pageSize), pageNumber, pageSize);
  }
}
