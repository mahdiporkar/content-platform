import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ContentStatus } from '../common/content-status.enum';
import { normalizeContentLocale } from '../common/content-locale.constants';
import { sanitizeHtml } from '../common/html-sanitizer';
import { PageResponseDto } from '../dto/page-response.dto';
import { PageUpsertRequestDto } from '../dto/requests/page-upsert-request.dto';
import { PageContentResponseDto } from '../dto/responses/page-response.dto';
import { ApplicationEntity } from '../entities/application.entity';
import { PageEntity } from '../entities/page.entity';
import { PublicMediaUrlService } from './public-media-url.service';

@Injectable()
export class AdminPageService {
  constructor(
    @InjectRepository(PageEntity)
    private readonly pageRepo: Repository<PageEntity>,
    private readonly publicMediaUrlService: PublicMediaUrlService,
  ) {}

  private mapPage(page: PageEntity): PageContentResponseDto {
    const app = { id: page.applicationId, publicBaseUrlOverride: null } as ApplicationEntity;
    return new PageContentResponseDto(
      page.id,
      page.applicationId,
      page.title,
      page.slug,
      page.content,
      this.publicMediaUrlService.rewriteHtmlMediaUrls(app, page.sanitizedHtml ?? page.content ?? null),
      this.publicMediaUrlService.toPublicMediaUrl(app, page.coverImage),
      page.languageCode,
      page.status,
      page.seoTitle,
      page.seoDescription,
      page.seoKeywords,
      page.parentId,
      page.sortOrder,
      page.showInMenu,
      page.publishedAt ? page.publishedAt.toISOString() : null,
      page.createdBy,
      page.updatedBy,
      page.createdAt.toISOString(),
      page.updatedAt.toISOString(),
    );
  }

  private normalizeKeywords(keywords?: string[]): string[] | null {
    const normalized = (keywords ?? []).map((keyword) => keyword.trim()).filter(Boolean);
    return normalized.length > 0 ? normalized : null;
  }

  private publishedAtFor(status: ContentStatus, current?: Date | null): Date | null {
    if (status === ContentStatus.PUBLISHED) {
      return current ?? new Date();
    }
    return null;
  }

  private async ensureSlugUnique(applicationId: string, languageCode: string, slug: string, excludeId?: string): Promise<void> {
    const where = excludeId
      ? { applicationId, languageCode, slug, id: Not(excludeId) }
      : { applicationId, languageCode, slug };
    const exists = await this.pageRepo.exists({ where });
    if (exists) {
      throw new ConflictException('Page slug must be unique per application and language.');
    }
  }

  private async ensureParent(applicationId: string, languageCode: string, parentId?: string | null): Promise<string | null> {
    if (!parentId) {
      return null;
    }
    const parent = await this.pageRepo.findOne({ where: { id: parentId, applicationId, languageCode } });
    if (!parent) {
      throw new NotFoundException('Parent page not found.');
    }
    return parent.id;
  }

  async create(request: PageUpsertRequestDto, userId?: string): Promise<PageContentResponseDto> {
    const languageCode = normalizeContentLocale(request.languageCode) ?? request.languageCode;
    const slug = request.slug.trim();
    await this.ensureSlugUnique(request.applicationId, languageCode, slug);
    const page = this.pageRepo.create({
      id: uuidv4(),
      applicationId: request.applicationId,
      title: request.title.trim(),
      slug,
      content: request.content,
      sanitizedHtml: sanitizeHtml(request.content),
      coverImage: request.coverImage?.trim() || null,
      languageCode,
      status: request.status,
      seoTitle: request.seoTitle?.trim() || null,
      seoDescription: request.seoDescription?.trim() || null,
      seoKeywords: this.normalizeKeywords(request.seoKeywords),
      parentId: await this.ensureParent(request.applicationId, languageCode, request.parentId),
      sortOrder: request.sortOrder ?? null,
      showInMenu: request.showInMenu ?? false,
      publishedAt: this.publishedAtFor(request.status),
      createdBy: userId ?? null,
      updatedBy: userId ?? null,
    });
    return this.mapPage(await this.pageRepo.save(page));
  }

  async update(id: string, request: PageUpsertRequestDto, userId?: string): Promise<PageContentResponseDto> {
    const page = await this.pageRepo.findOne({ where: { id } });
    if (!page) {
      throw new NotFoundException('Page not found.');
    }
    const languageCode = normalizeContentLocale(request.languageCode) ?? request.languageCode;
    const slug = request.slug.trim();
    await this.ensureSlugUnique(request.applicationId, languageCode, slug, id);
    page.applicationId = request.applicationId;
    page.title = request.title.trim();
    page.slug = slug;
    page.content = request.content;
    page.sanitizedHtml = sanitizeHtml(request.content);
    page.coverImage = request.coverImage?.trim() || null;
    page.languageCode = languageCode;
    page.status = request.status;
    page.seoTitle = request.seoTitle?.trim() || null;
    page.seoDescription = request.seoDescription?.trim() || null;
    page.seoKeywords = this.normalizeKeywords(request.seoKeywords);
    page.parentId = await this.ensureParent(request.applicationId, languageCode, request.parentId);
    page.sortOrder = request.sortOrder ?? null;
    page.showInMenu = request.showInMenu ?? false;
    page.publishedAt = this.publishedAtFor(request.status, page.publishedAt);
    page.updatedBy = userId ?? null;
    return this.mapPage(await this.pageRepo.save(page));
  }

  async changeStatus(id: string, status: ContentStatus, userId?: string): Promise<PageContentResponseDto> {
    const page = await this.pageRepo.findOne({ where: { id } });
    if (!page) {
      throw new NotFoundException('Page not found.');
    }
    page.status = status;
    page.publishedAt = this.publishedAtFor(status, page.publishedAt);
    page.updatedBy = userId ?? null;
    return this.mapPage(await this.pageRepo.save(page));
  }

  async getApplicationIdById(id: string): Promise<string> {
    const page = await this.pageRepo.findOne({ where: { id } });
    if (!page) {
      throw new NotFoundException('Page not found.');
    }
    return page.applicationId;
  }

  async get(id: string): Promise<PageContentResponseDto> {
    const page = await this.pageRepo.findOne({ where: { id } });
    if (!page) {
      throw new NotFoundException('Page not found.');
    }
    return this.mapPage(page);
  }

  async list(
    applicationId: string,
    status: ContentStatus | undefined,
    languageCode: string | undefined,
    page: number,
    size: number,
  ): Promise<PageResponseDto<PageContentResponseDto>> {
    const pageNumber = Math.max(0, page);
    const pageSize = Math.max(1, size);
    const where = {
      applicationId,
      ...(status ? { status } : {}),
      ...(languageCode ? { languageCode } : {}),
    };
    const [items, total] = await this.pageRepo.findAndCount({
      where,
      order: { sortOrder: 'ASC', updatedAt: 'DESC' },
      skip: pageNumber * pageSize,
      take: pageSize,
    });
    return new PageResponseDto(items.map((item) => this.mapPage(item)), total, Math.ceil(total / pageSize), pageNumber, pageSize);
  }

  async getPublished(application: ApplicationEntity, languageCode: string, slug: string): Promise<PageContentResponseDto> {
    const page = await this.pageRepo.findOne({
      where: { applicationId: application.id, languageCode, slug, status: ContentStatus.PUBLISHED },
    });
    if (!page) {
      throw new NotFoundException('Page not found.');
    }
    return this.mapPage(page);
  }

  async listPublished(application: ApplicationEntity, languageCode?: string): Promise<PageContentResponseDto[]> {
    const items = await this.pageRepo.find({
      where: { applicationId: application.id, status: ContentStatus.PUBLISHED, ...(languageCode ? { languageCode } : {}) },
      order: { sortOrder: 'ASC', publishedAt: 'DESC', createdAt: 'DESC' },
    });
    return items.map((item) => this.mapPage(item));
  }
}
