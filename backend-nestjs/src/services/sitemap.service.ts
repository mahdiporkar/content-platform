import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ArticleEntity } from '../entities/article.entity';
import { CollectionEntity } from '../entities/collection.entity';
import { ContentStatus } from '../common/content-status.enum';
import { ImageEntity } from '../entities/image.entity';
import { PostEntity } from '../entities/post.entity';
import { VideoEntity } from '../entities/video.entity';
import { SitemapSettingsEntity, SitemapRegenStrategy } from '../entities/sitemap-settings.entity';
import {
  SitemapLastmodPolicy,
  SitemapTemplateEntity,
  SitemapValidateStatus,
} from '../entities/sitemap-template.entity';
import { SitemapOverrideEntity } from '../entities/sitemap-override.entity';
import { SitemapCustomUrlEntity, SitemapLastmodMode } from '../entities/sitemap-custom-url.entity';
import { SitemapUrlCheckEntity } from '../entities/sitemap-url-check.entity';
import { SitemapSettingsUpsertRequestDto } from '../dto/requests/sitemap-settings-upsert.dto';
import { SitemapTemplateUpsertRequestDto } from '../dto/requests/sitemap-template-upsert.dto';
import { SitemapOverrideUpsertRequestDto } from '../dto/requests/sitemap-override-upsert.dto';
import { SitemapCustomUrlUpsertRequestDto } from '../dto/requests/sitemap-custom-url-upsert.dto';
import { SitemapSettingsResponseDto } from '../dto/responses/sitemap-settings-response.dto';
import { SitemapTemplateResponseDto } from '../dto/responses/sitemap-template-response.dto';
import { SitemapCustomUrlResponseDto } from '../dto/responses/sitemap-custom-url-response.dto';
import { SitemapPreviewEntryResponseDto } from '../dto/responses/sitemap-preview-entry-response.dto';
import { SitemapTestUrlResponseDto } from '../dto/responses/sitemap-test-url-response.dto';

const ALLOWED_PLACEHOLDERS = new Set([
  'slug',
  'id',
  'lang',
  'categorySlug',
  'publishedYear',
  'publishedMonth',
  'publishedDay',
]);
const CHANGEFREQ_VALUES = new Set(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']);
const DEFAULT_CONTENT_TYPES = ['article', 'post', 'video', 'photo', 'gallery', 'page'];

type ResolvedSitemapEntry = {
  contentId: string | null;
  contentType: string;
  title: string | null;
  finalUrl: string;
  lastmod: string | null;
  priority: number | null;
  changefreq: string | null;
  source: 'template' | 'override' | 'manual';
  duplicate: boolean;
  rank: number;
};

type DraftSitemapEntry = Omit<ResolvedSitemapEntry, 'finalUrl' | 'duplicate' | 'rank'> & {
  finalUrl: string | null;
  duplicate?: boolean;
  rank?: number;
  errors: string[];
  status: 'OK' | 'ERROR' | 'WARNING';
};

type ContentSourceItem = {
  id: string;
  contentType: string;
  title: string | null;
  slug?: string | null;
  lang?: string | null;
  categorySlug?: string | null;
  publishedAt?: Date | null;
  updatedAt?: Date | null;
  seo?: Record<string, unknown> | null;
};

@Injectable()
export class SitemapService {
  private readonly xmlCache = new Map<
    string,
    { expiresAt: number; indexXml: string | null; chunkXmlByKey: Map<string, string>; baseUrl: string }
  >();

  constructor(
    @InjectRepository(SitemapSettingsEntity)
    private readonly settingsRepo: Repository<SitemapSettingsEntity>,
    @InjectRepository(SitemapTemplateEntity)
    private readonly templateRepo: Repository<SitemapTemplateEntity>,
    @InjectRepository(SitemapOverrideEntity)
    private readonly overrideRepo: Repository<SitemapOverrideEntity>,
    @InjectRepository(SitemapCustomUrlEntity)
    private readonly customUrlRepo: Repository<SitemapCustomUrlEntity>,
    @InjectRepository(SitemapUrlCheckEntity)
    private readonly urlCheckRepo: Repository<SitemapUrlCheckEntity>,
    @InjectRepository(ArticleEntity)
    private readonly articleRepo: Repository<ArticleEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,
    @InjectRepository(VideoEntity)
    private readonly videoRepo: Repository<VideoEntity>,
    @InjectRepository(ImageEntity)
    private readonly imageRepo: Repository<ImageEntity>,
    @InjectRepository(CollectionEntity)
    private readonly collectionRepo: Repository<CollectionEntity>,
  ) {}

  async getSettings(tenantId: string): Promise<SitemapSettingsResponseDto> {
    const settings = await this.getOrCreateSettings(tenantId);
    return this.toSettingsResponse(settings);
  }

  async putSettings(tenantId: string, dto: SitemapSettingsUpsertRequestDto): Promise<SitemapSettingsResponseDto> {
    const settings = await this.getOrCreateSettings(tenantId);
    settings.enabled = dto.enabled;
    settings.baseUrl = dto.baseUrl?.trim() || null;
    settings.sitemapPath = dto.sitemapPath?.trim() || '/sitemap.xml';
    settings.cacheTtlSeconds = dto.cacheTtlSeconds ?? settings.cacheTtlSeconds;
    settings.regenStrategy = dto.regenStrategy ?? settings.regenStrategy;
    if (settings.enabled) {
      const baseValidation = this.validateBaseUrl(settings.baseUrl);
      if (!baseValidation.ok) {
        throw new BadRequestException(baseValidation.error);
      }
    }
    await this.settingsRepo.save(settings);
    this.invalidateTenantCache(tenantId);
    return this.toSettingsResponse(settings);
  }

  async listTemplates(tenantId: string): Promise<SitemapTemplateResponseDto[]> {
    const defaults = await this.ensureDefaultTemplates(tenantId);
    return defaults.map((entry) => this.toTemplateResponse(entry));
  }

  async putTemplate(tenantId: string, contentType: string, dto: SitemapTemplateUpsertRequestDto): Promise<SitemapTemplateResponseDto> {
    const normalizedType = this.normalizeContentType(contentType);
    let template =
      (await this.templateRepo.findOne({ where: { tenantId, contentType: normalizedType } })) ||
      this.templateRepo.create({
        tenantId,
        contentType: normalizedType,
        enabled: false,
        template: null,
        lastmodPolicy: SitemapLastmodPolicy.UPDATED_AT,
      });
    template.enabled = dto.enabled;
    template.template = dto.template?.trim() || null;
    template.lastmodPolicy = dto.lastmodPolicy ?? template.lastmodPolicy;
    template.defaultChangefreq = dto.defaultChangefreq?.trim() || null;
    template.defaultPriority =
      dto.defaultPriority === undefined || dto.defaultPriority === null ? null : String(dto.defaultPriority);
    this.validateChangefreq(template.defaultChangefreq);
    const templateValidation = this.validateTemplate(template.template, template.enabled);
    template.validateStatus = templateValidation.status;
    template.validateErrors = templateValidation.errors.length > 0 ? templateValidation.errors : null;
    template = await this.templateRepo.save(template);
    this.invalidateTenantCache(tenantId);
    return this.toTemplateResponse(template);
  }

  async listCustomUrls(tenantId: string): Promise<SitemapCustomUrlResponseDto[]> {
    const rows = await this.customUrlRepo.find({ where: { tenantId }, order: { createdAt: 'DESC' } });
    return rows.map((entry) => this.toCustomUrlResponse(entry));
  }

  async createCustomUrl(tenantId: string, dto: SitemapCustomUrlUpsertRequestDto): Promise<SitemapCustomUrlResponseDto> {
    const settings = await this.getOrCreateSettings(tenantId);
    const pathOrUrl = dto.pathOrUrl.trim();
    const urlValidation = this.validateRelativeOrAbsoluteUrl(pathOrUrl, settings.baseUrl);
    if (!urlValidation.ok) {
      throw new BadRequestException(urlValidation.error);
    }
    const model = this.customUrlRepo.create({
      tenantId,
      pathOrUrl,
      enabled: dto.enabled ?? true,
      lastmodMode: dto.lastmodMode ?? SitemapLastmodMode.NONE,
      lastmodValue: dto.lastmodValue ? new Date(dto.lastmodValue) : null,
      changefreq: dto.changefreq?.trim() || null,
      priority: dto.priority === undefined || dto.priority === null ? null : String(dto.priority),
      notes: dto.notes?.trim() || null,
    });
    this.validateChangefreq(model.changefreq);
    const saved = await this.customUrlRepo.save(model);
    this.invalidateTenantCache(tenantId);
    return this.toCustomUrlResponse(saved);
  }

  async updateCustomUrl(
    tenantId: string,
    id: string,
    dto: SitemapCustomUrlUpsertRequestDto,
  ): Promise<SitemapCustomUrlResponseDto> {
    const existing = await this.customUrlRepo.findOne({ where: { id, tenantId } });
    if (!existing) {
      throw new NotFoundException('Custom URL not found.');
    }
    const settings = await this.getOrCreateSettings(tenantId);
    const pathOrUrl = dto.pathOrUrl.trim();
    const urlValidation = this.validateRelativeOrAbsoluteUrl(pathOrUrl, settings.baseUrl);
    if (!urlValidation.ok) {
      throw new BadRequestException(urlValidation.error);
    }
    existing.pathOrUrl = pathOrUrl;
    existing.enabled = dto.enabled ?? existing.enabled;
    existing.lastmodMode = dto.lastmodMode ?? existing.lastmodMode;
    existing.lastmodValue = dto.lastmodValue ? new Date(dto.lastmodValue) : null;
    existing.changefreq = dto.changefreq?.trim() || null;
    existing.priority = dto.priority === undefined || dto.priority === null ? null : String(dto.priority);
    existing.notes = dto.notes?.trim() || null;
    this.validateChangefreq(existing.changefreq);
    const saved = await this.customUrlRepo.save(existing);
    this.invalidateTenantCache(tenantId);
    return this.toCustomUrlResponse(saved);
  }

  async deleteCustomUrl(tenantId: string, id: string): Promise<void> {
    const row = await this.customUrlRepo.findOne({ where: { id, tenantId } });
    if (!row) {
      throw new NotFoundException('Custom URL not found.');
    }
    await this.customUrlRepo.delete({ id, tenantId });
    this.invalidateTenantCache(tenantId);
  }

  async putOverride(tenantId: string, contentType: string, contentId: string, dto: SitemapOverrideUpsertRequestDto): Promise<void> {
    const normalizedType = this.normalizeContentType(contentType);
    let override =
      (await this.overrideRepo.findOne({ where: { tenantId, contentType: normalizedType, contentId } })) ||
      this.overrideRepo.create({ tenantId, contentType: normalizedType, contentId });
    const settings = await this.getOrCreateSettings(tenantId);
    const customUrl = dto.customUrl?.trim() || null;
    if (customUrl) {
      const urlValidation = this.validateRelativeOrAbsoluteUrl(customUrl, settings.baseUrl);
      if (!urlValidation.ok) {
        throw new BadRequestException(urlValidation.error);
      }
    }
    this.validateChangefreq(dto.changefreqOverride ?? null);
    override.customUrl = customUrl;
    override.excluded = dto.excluded ?? override.excluded ?? false;
    override.priorityOverride = dto.priorityOverride === undefined || dto.priorityOverride === null ? null : String(dto.priorityOverride);
    override.changefreqOverride = dto.changefreqOverride?.trim() || null;
    await this.overrideRepo.save(override);
    this.invalidateTenantCache(tenantId);
  }

  async preview(
    tenantId: string,
    contentType?: string,
    limit = 50,
    offset = 0,
  ): Promise<{ items: SitemapPreviewEntryResponseDto[]; total: number }> {
    const generated = await this.generateEntries(tenantId, contentType ? [this.normalizeContentType(contentType)] : [], {
      strict: false,
    });
    const sliced = generated.previewItems.slice(offset, offset + limit);
    return {
      total: generated.previewItems.length,
      items: sliced.map(
        (entry) =>
          new SitemapPreviewEntryResponseDto(
            entry.contentId,
            entry.contentType,
            entry.title,
            entry.finalUrl,
            entry.lastmod,
            entry.priority,
            entry.changefreq,
            entry.source,
            entry.status,
            entry.errors,
            !!entry.duplicate,
          ),
      ),
    };
  }

  async testUrl(tenantId: string, url: string): Promise<SitemapTestUrlResponseDto> {
    let status: number | null = null;
    let errorMessage: string | null = null;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
      try {
        const response = await fetch(url, { method: 'HEAD', signal: controller.signal });
        status = response.status;
      } catch {
        const response = await fetch(url, { method: 'GET', signal: controller.signal });
        status = response.status;
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to reach URL';
    }
    await this.urlCheckRepo.save({
      tenantId,
      url,
      lastCheckedAt: new Date(),
      httpStatus: status,
      errorMessage,
    });
    return new SitemapTestUrlResponseDto(status !== null && status < 400, status, errorMessage);
  }

  async getPublicSitemapXml(
    tenantId: string,
    chunkType?: string,
    chunkNumber?: number,
  ): Promise<{ xml: string; chunked: boolean }> {
    const settings = await this.getOrCreateSettings(tenantId);
    if (!settings.enabled) {
      throw new NotFoundException('Sitemap is disabled for this tenant.');
    }
    const baseValidation = this.validateBaseUrl(settings.baseUrl);
    if (!baseValidation.ok) {
      throw new NotFoundException(baseValidation.error);
    }
    const key = tenantId;
    const now = Date.now();
    let cache = this.xmlCache.get(key);
    if (!cache || cache.expiresAt <= now) {
      cache = await this.buildSitemapCache(tenantId, settings);
      this.xmlCache.set(key, cache);
    }

    if (chunkType && chunkNumber) {
      const chunkKey = `${chunkType}-${chunkNumber}`;
      const xml = cache.chunkXmlByKey.get(chunkKey);
      if (!xml) {
        throw new NotFoundException('Sitemap chunk not found.');
      }
      return { xml, chunked: true };
    }

    if (cache.indexXml) {
      return { xml: cache.indexXml, chunked: true };
    }
    const single = cache.chunkXmlByKey.get('all-1');
    if (!single) {
      throw new NotFoundException('Sitemap is empty.');
    }
    return { xml: single, chunked: false };
  }

  invalidateTenantCache(tenantId: string): void {
    this.xmlCache.delete(tenantId);
  }

  async invalidateTenantCacheIfOnPublish(tenantId: string): Promise<void> {
    const settings = await this.getOrCreateSettings(tenantId);
    if (settings.regenStrategy === SitemapRegenStrategy.ON_PUBLISH) {
      this.invalidateTenantCache(tenantId);
    }
  }

  private async buildSitemapCache(
    tenantId: string,
    settings: SitemapSettingsEntity,
  ): Promise<{ expiresAt: number; indexXml: string | null; chunkXmlByKey: Map<string, string>; baseUrl: string }> {
    const generated = await this.generateEntries(tenantId, []);
    const chunks = this.chunkEntries(generated.dedupedEntries, 50000);
    const chunkXmlByKey = new Map<string, string>();
    const sitemapBase = `${generated.baseUrl}/public/${tenantId}`;
    chunks.forEach((chunk, index) => {
      chunkXmlByKey.set(`all-${index + 1}`, this.renderUrlSetXml(chunk));
    });
    const indexXml =
      chunks.length > 1
        ? this.renderIndexXml(chunks.map((_, index) => `${sitemapBase}/sitemap-all-${index + 1}.xml`))
        : null;
    return {
      expiresAt: Date.now() + Math.max(1, settings.cacheTtlSeconds) * 1000,
      indexXml,
      chunkXmlByKey,
      baseUrl: generated.baseUrl,
    };
  }

  private async generateEntries(
    tenantId: string,
    onlyContentTypes: string[],
    options?: { strict?: boolean },
  ): Promise<{ baseUrl: string; previewItems: DraftSitemapEntry[]; dedupedEntries: ResolvedSitemapEntry[] }> {
    const strict = options?.strict ?? true;
    const settings = await this.getOrCreateSettings(tenantId);
    const baseValidation = this.validateBaseUrl(settings.baseUrl);
    if (!settings.enabled || !baseValidation.ok || !baseValidation.value) {
      if (strict) {
        throw new BadRequestException(baseValidation.error || 'Sitemap is disabled.');
      }
      const reason = !settings.enabled
        ? 'Sitemap is disabled for this tenant.'
        : baseValidation.error || 'Invalid sitemap settings.';
      return {
        baseUrl: baseValidation.value || '',
        previewItems: [
          {
            contentId: null,
            contentType: onlyContentTypes[0] || 'all',
            title: null,
            finalUrl: null,
            lastmod: null,
            priority: null,
            changefreq: null,
            source: 'template',
            status: 'ERROR',
            errors: [reason],
          },
        ],
        dedupedEntries: [],
      };
    }
    const baseUrl = baseValidation.value;
    const templates = await this.ensureDefaultTemplates(tenantId);
    const templateMap = new Map(templates.map((entry) => [entry.contentType, entry]));
    const overrides = await this.overrideRepo.find({ where: { tenantId } });
    const overrideMap = new Map(overrides.map((entry) => [`${entry.contentType}:${entry.contentId}`, entry]));
    const previewItems: DraftSitemapEntry[] = [];

    const typesToProcess = onlyContentTypes.length > 0 ? onlyContentTypes : DEFAULT_CONTENT_TYPES;
    for (const type of typesToProcess) {
      const template = templateMap.get(type);
      if (!template || !template.enabled) {
        continue;
      }
      const templateValidation = this.validateTemplate(template.template, template.enabled);
      if (templateValidation.status === SitemapValidateStatus.ERROR) {
        previewItems.push({
          contentId: null,
          contentType: type,
          title: null,
          finalUrl: null,
          lastmod: null,
          priority: null,
          changefreq: null,
          source: 'template',
          status: 'ERROR',
          errors: templateValidation.errors,
        });
        continue;
      }
      const items = await this.loadContentItems(tenantId, type);
      for (const item of items) {
        const key = `${type}:${item.id}`;
        const override = overrideMap.get(key);
        if (override?.excluded) {
          continue;
        }

        const current: DraftSitemapEntry = {
          contentId: item.id,
          contentType: type,
          title: item.title,
          finalUrl: null,
          lastmod: this.resolveLastmod(template.lastmodPolicy, item),
          priority: this.parsePriority(template.defaultPriority),
          changefreq: template.defaultChangefreq,
          source: override?.customUrl ? 'override' : 'template',
          status: 'OK',
          errors: [],
        };

        if (override?.priorityOverride !== null && override?.priorityOverride !== undefined) {
          current.priority = this.parsePriority(override.priorityOverride);
        }
        if (override?.changefreqOverride) {
          current.changefreq = override.changefreqOverride;
        }

        if (override?.customUrl) {
          const absolute = this.resolveCustomUrl(override.customUrl, baseUrl);
          if (!absolute.ok || !absolute.url) {
            current.status = 'ERROR';
            current.errors.push(absolute.error || 'Invalid override URL');
          } else {
            current.finalUrl = absolute.url;
          }
          previewItems.push(current);
          continue;
        }

        const rendered = this.renderTemplatePath(template.template || '', item);
        if (!rendered.path || rendered.errors.length > 0) {
          current.status = 'ERROR';
          current.errors.push(...rendered.errors);
          previewItems.push(current);
          continue;
        }
        current.finalUrl = `${baseUrl}${rendered.path}`;
        previewItems.push(current);
      }
    }

    if (onlyContentTypes.length === 0) {
      const customUrls = await this.customUrlRepo.find({ where: { tenantId, enabled: true } });
      for (const custom of customUrls) {
        const urlResolution = this.resolveCustomUrl(custom.pathOrUrl, baseUrl);
        previewItems.push({
          contentId: custom.id,
          contentType: 'manual',
          title: custom.notes || null,
          finalUrl: urlResolution.url || null,
          lastmod: this.resolveManualLastmod(custom),
          priority: this.parsePriority(custom.priority),
          changefreq: custom.changefreq,
          source: 'manual',
          status: urlResolution.ok ? 'OK' : 'ERROR',
          errors: urlResolution.ok ? [] : [urlResolution.error || 'Invalid manual URL'],
        });
      }
    }

    const deduped = this.dedupe(previewItems);
    return {
      baseUrl,
      previewItems: deduped.previewItems,
      dedupedEntries: deduped.entries,
    };
  }

  private dedupe(input: DraftSitemapEntry[]): { previewItems: DraftSitemapEntry[]; entries: ResolvedSitemapEntry[] } {
    const bestByUrl = new Map<string, ResolvedSitemapEntry>();
    const previewOwnerByUrl = new Map<string, DraftSitemapEntry>();
    const previewItems = input.map((entry) => ({ ...entry }));
    for (const entry of previewItems) {
      if (!entry.finalUrl || entry.status === 'ERROR') {
        continue;
      }
      const rank = this.rankForSource(entry.source);
      const candidate: ResolvedSitemapEntry = {
        contentId: entry.contentId,
        contentType: entry.contentType,
        title: entry.title,
        finalUrl: entry.finalUrl,
        lastmod: entry.lastmod,
        priority: entry.priority,
        changefreq: entry.changefreq,
        source: entry.source,
        duplicate: false,
        rank,
      };
      const existing = bestByUrl.get(entry.finalUrl);
      if (!existing || rank > existing.rank) {
        const previousOwner = previewOwnerByUrl.get(entry.finalUrl);
        if (previousOwner) previousOwner.duplicate = true;
        bestByUrl.set(entry.finalUrl, candidate);
        previewOwnerByUrl.set(entry.finalUrl, entry);
      } else {
        entry.duplicate = true;
      }
    }
    return { previewItems, entries: Array.from(bestByUrl.values()) };
  }

  private rankForSource(source: 'template' | 'override' | 'manual'): number {
    if (source === 'override') return 3;
    if (source === 'template') return 2;
    return 1;
  }

  private resolveManualLastmod(row: SitemapCustomUrlEntity): string | null {
    if (row.lastmodMode === SitemapLastmodMode.NOW) return new Date().toISOString();
    if (row.lastmodMode === SitemapLastmodMode.FIXED_DATE && row.lastmodValue) return row.lastmodValue.toISOString();
    return null;
  }

  private resolveLastmod(policy: SitemapLastmodPolicy, item: ContentSourceItem): string | null {
    if (policy === SitemapLastmodPolicy.PUBLISHED_AT && item.publishedAt) return item.publishedAt.toISOString();
    if (item.updatedAt) return item.updatedAt.toISOString();
    if (item.publishedAt) return item.publishedAt.toISOString();
    return null;
  }

  private async loadContentItems(tenantId: string, contentType: string): Promise<ContentSourceItem[]> {
    switch (contentType) {
      case 'article': {
        const rows = await this.articleRepo.find({ where: { applicationId: tenantId, status: ContentStatus.PUBLISHED } });
        return rows
          .filter((entry) => !this.isNoIndex(entry.seo))
          .map((entry) => ({
            id: entry.id,
            contentType: 'article',
            title: entry.title,
            slug: entry.slug,
            lang: entry.locale,
            categorySlug: entry.tags?.[0] || null,
            publishedAt: entry.publishedAt,
            updatedAt: entry.updatedAt,
            seo: entry.seo,
          }));
      }
      case 'post': {
        const rows = await this.postRepo.find({ where: { applicationId: tenantId, status: ContentStatus.PUBLISHED } });
        return rows
          .filter((entry) => !this.isNoIndex(entry.seo))
          .map((entry) => ({
            id: entry.id,
            contentType: 'post',
            title: entry.title,
            slug: entry.slug,
            lang: entry.locale,
            categorySlug: entry.tags?.[0] || null,
            publishedAt: entry.publishedAt,
            updatedAt: entry.updatedAt,
            seo: entry.seo,
          }));
      }
      case 'video': {
        const rows = await this.videoRepo.find({
          where: { applicationId: tenantId, status: ContentStatus.PUBLISHED, deletedAt: IsNull() },
        });
        return rows
          .filter((entry) => !this.isNoIndex(entry.seo))
          .map((entry) => ({
            id: entry.id,
            contentType: 'video',
            title: entry.title,
            lang: entry.locale,
            categorySlug: entry.tags?.[0] || null,
            publishedAt: entry.publishedAt,
            updatedAt: entry.updatedAt,
            seo: entry.seo,
          }));
      }
      case 'photo': {
        const rows = await this.imageRepo.find({
          where: { applicationId: tenantId, status: ContentStatus.PUBLISHED, deletedAt: IsNull() },
        });
        return rows
          .filter((entry) => !this.isNoIndex(entry.seo))
          .map((entry) => ({
            id: entry.id,
            contentType: 'photo',
            title: entry.title,
            lang: entry.locale,
            categorySlug: entry.tags?.[0] || null,
            publishedAt: entry.publishedAt,
            updatedAt: entry.updatedAt,
            seo: entry.seo,
          }));
      }
      case 'gallery': {
        const rows = await this.collectionRepo.find({ where: { applicationId: tenantId, isPublic: true } });
        return rows.map((entry) => ({
          id: entry.id,
          contentType: 'gallery',
          title: entry.title,
          slug: entry.slug,
          updatedAt: entry.updatedAt,
        }));
      }
      case 'page':
      default:
        return [];
    }
  }

  private renderTemplatePath(template: string, item: ContentSourceItem): { path: string | null; errors: string[] } {
    const errors: string[] = [];
    if (!template.startsWith('/')) return { path: null, errors: ['Template must start with /'] };
    const publication = item.publishedAt || item.updatedAt || null;
    const year = publication ? String(publication.getUTCFullYear()) : null;
    const month = publication ? String(publication.getUTCMonth() + 1).padStart(2, '0') : null;
    const day = publication ? String(publication.getUTCDate()).padStart(2, '0') : null;
    let rendered = template;
    const tokenRegex = /\{([a-zA-Z0-9_]+)\}/g;
    let match: RegExpExecArray | null;
    while ((match = tokenRegex.exec(template)) !== null) {
      const token = match[1];
      if (!ALLOWED_PLACEHOLDERS.has(token)) {
        errors.push(`Unsupported placeholder {${token}}`);
        continue;
      }
      let value: string | null = null;
      switch (token) {
        case 'slug':
          value = item.slug || null;
          break;
        case 'id':
          value = item.id;
          break;
        case 'lang':
          value = item.lang || null;
          break;
        case 'categorySlug':
          value = item.categorySlug || null;
          break;
        case 'publishedYear':
          value = year;
          break;
        case 'publishedMonth':
          value = month;
          break;
        case 'publishedDay':
          value = day;
          break;
      }
      if (!value) {
        errors.push(`Missing value for placeholder {${token}} on content ${item.id}`);
        continue;
      }
      rendered = rendered.split(`{${token}}`).join(encodeURIComponent(value));
    }
    if (errors.length > 0) return { path: null, errors };
    return { path: rendered, errors: [] };
  }

  private validateTemplate(template: string | null, enabled: boolean): { status: SitemapValidateStatus; errors: string[] } {
    if (!enabled) return { status: SitemapValidateStatus.OK, errors: [] };
    const errors: string[] = [];
    if (!template) return { status: SitemapValidateStatus.ERROR, errors: ['Template is required when enabled'] };
    if (!template.startsWith('/')) errors.push('Template must start with "/"');
    const matches = template.match(/\{([a-zA-Z0-9_]+)\}/g) || [];
    for (const raw of matches) {
      const token = raw.slice(1, -1);
      if (!ALLOWED_PLACEHOLDERS.has(token)) errors.push(`Invalid placeholder ${raw}`);
    }
    return { status: errors.length > 0 ? SitemapValidateStatus.ERROR : SitemapValidateStatus.OK, errors };
  }

  private resolveCustomUrl(custom: string, baseUrl: string): { ok: boolean; url: string | null; error?: string } {
    const value = custom.trim();
    if (value.startsWith('/')) return { ok: true, url: `${baseUrl}${value}` };
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== 'https:') return { ok: false, url: null, error: 'URL must use https' };
      const base = new URL(baseUrl);
      if (parsed.host !== base.host) return { ok: false, url: null, error: 'Absolute URL host must match baseUrl host' };
      return { ok: true, url: parsed.toString() };
    } catch {
      return { ok: false, url: null, error: 'Invalid URL format' };
    }
  }

  private validateRelativeOrAbsoluteUrl(value: string, baseUrl: string | null): { ok: boolean; error?: string } {
    if (value.startsWith('/')) return { ok: true };
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== 'https:') return { ok: false, error: 'URL must use https' };
      if (!baseUrl) return { ok: false, error: 'baseUrl is required before using absolute URL.' };
      const base = new URL(baseUrl);
      if (parsed.host !== base.host) return { ok: false, error: 'Absolute URL host must match baseUrl host' };
      return { ok: true };
    } catch {
      return { ok: false, error: 'URL must be relative (/path) or absolute https URL' };
    }
  }

  private validateBaseUrl(value: string | null): { ok: boolean; value: string | null; error?: string } {
    if (!value) return { ok: false, value: null, error: 'baseUrl is required when sitemap is enabled.' };
    try {
      const parsed = new URL(value.trim());
      if (parsed.protocol !== 'https:') return { ok: false, value: null, error: 'baseUrl must use https protocol.' };
      if ((parsed.pathname && parsed.pathname !== '/') || parsed.search || parsed.hash) {
        return { ok: false, value: null, error: 'baseUrl must contain only scheme and host.' };
      }
      return { ok: true, value: `${parsed.protocol}//${parsed.host}` };
    } catch {
      return { ok: false, value: null, error: 'Invalid baseUrl format.' };
    }
  }

  private validateChangefreq(value: string | null): void {
    if (!value) return;
    if (!CHANGEFREQ_VALUES.has(value)) {
      throw new BadRequestException(`Invalid changefreq value: ${value}`);
    }
  }

  private parsePriority(value: string | null): number | null {
    if (!value) return null;
    const asNumber = Number(value);
    if (Number.isNaN(asNumber)) return null;
    return Math.max(0, Math.min(1, asNumber));
  }

  private isNoIndex(seo: Record<string, unknown> | null | undefined): boolean {
    if (!seo) return false;
    const noIndexRaw = (seo.noIndex as boolean | undefined) ?? (seo.noindex as boolean | undefined);
    if (noIndexRaw === true) return true;
    const robots = seo.robots;
    return typeof robots === 'string' && robots.toLowerCase().includes('noindex');
  }

  private normalizeContentType(contentType: string): string {
    const normalized = contentType.trim().toLowerCase();
    if (!DEFAULT_CONTENT_TYPES.includes(normalized)) {
      throw new BadRequestException(`Unsupported contentType: ${contentType}`);
    }
    return normalized;
  }

  private chunkEntries<T>(rows: T[], size: number): T[][] {
    if (rows.length === 0) return [[]];
    const chunks: T[][] = [];
    for (let i = 0; i < rows.length; i += size) {
      chunks.push(rows.slice(i, i + size));
    }
    return chunks;
  }

  private renderUrlSetXml(entries: ResolvedSitemapEntry[]): string {
    const lines: string[] = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
    for (const entry of entries) {
      lines.push('  <url>');
      lines.push(`    <loc>${this.escapeXml(entry.finalUrl)}</loc>`);
      if (entry.lastmod) lines.push(`    <lastmod>${this.escapeXml(entry.lastmod)}</lastmod>`);
      if (entry.changefreq) lines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
      if (entry.priority !== null && entry.priority !== undefined) lines.push(`    <priority>${entry.priority.toFixed(1)}</priority>`);
      lines.push('  </url>');
    }
    lines.push('</urlset>');
    return lines.join('\n');
  }

  private renderIndexXml(locs: string[]): string {
    const lines: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ];
    for (const loc of locs) {
      lines.push('  <sitemap>');
      lines.push(`    <loc>${this.escapeXml(loc)}</loc>`);
      lines.push(`    <lastmod>${new Date().toISOString()}</lastmod>`);
      lines.push('  </sitemap>');
    }
    lines.push('</sitemapindex>');
    return lines.join('\n');
  }

  private escapeXml(value: string): string {
    return value
      .split('&').join('&amp;')
      .split('<').join('&lt;')
      .split('>').join('&gt;')
      .split('"').join('&quot;')
      .split("'").join('&apos;');
  }

  private async getOrCreateSettings(tenantId: string): Promise<SitemapSettingsEntity> {
    let settings = await this.settingsRepo.findOne({ where: { tenantId } });
    if (settings) return settings;
    settings = this.settingsRepo.create({
      tenantId,
      enabled: false,
      baseUrl: null,
      sitemapPath: '/sitemap.xml',
      cacheTtlSeconds: 3600,
      regenStrategy: SitemapRegenStrategy.ON_PUBLISH,
    });
    return await this.settingsRepo.save(settings);
  }

  private async ensureDefaultTemplates(tenantId: string): Promise<SitemapTemplateEntity[]> {
    const existing = await this.templateRepo.find({ where: { tenantId }, order: { contentType: 'ASC' } });
    const map = new Map(existing.map((entry) => [entry.contentType, entry]));
    const newRows: SitemapTemplateEntity[] = [];
    for (const contentType of DEFAULT_CONTENT_TYPES) {
      if (map.has(contentType)) continue;
      const defaultTemplate = this.defaultTemplateFor(contentType);
      newRows.push(
        this.templateRepo.create({
          tenantId,
          contentType,
          enabled: !!defaultTemplate,
          template: defaultTemplate,
          lastmodPolicy: SitemapLastmodPolicy.UPDATED_AT,
          validateStatus: defaultTemplate ? SitemapValidateStatus.OK : SitemapValidateStatus.WARNING,
          validateErrors: defaultTemplate ? null : ['No default template provided'],
        }),
      );
    }
    if (newRows.length > 0) {
      await this.templateRepo.save(newRows);
    }
    return await this.templateRepo.find({ where: { tenantId }, order: { contentType: 'ASC' } });
  }

  private defaultTemplateFor(contentType: string): string | null {
    switch (contentType) {
      case 'article':
        return '/articles/{slug}';
      case 'post':
        return '/posts/{slug}';
      case 'video':
        return '/videos/{id}';
      case 'photo':
        return '/photos/{id}';
      case 'gallery':
        return '/collections/{slug}';
      default:
        return null;
    }
  }

  private toSettingsResponse(entity: SitemapSettingsEntity): SitemapSettingsResponseDto {
    return new SitemapSettingsResponseDto(
      entity.tenantId,
      entity.enabled,
      entity.baseUrl,
      entity.sitemapPath,
      entity.cacheTtlSeconds,
      entity.regenStrategy,
      entity.createdAt.toISOString(),
      entity.updatedAt.toISOString(),
    );
  }

  private toTemplateResponse(entity: SitemapTemplateEntity): SitemapTemplateResponseDto {
    return new SitemapTemplateResponseDto(
      entity.id,
      entity.tenantId,
      entity.contentType,
      entity.enabled,
      entity.template,
      entity.lastmodPolicy,
      entity.defaultChangefreq,
      this.parsePriority(entity.defaultPriority),
      entity.validateStatus,
      entity.validateErrors,
      entity.createdAt.toISOString(),
      entity.updatedAt.toISOString(),
    );
  }

  private toCustomUrlResponse(entity: SitemapCustomUrlEntity): SitemapCustomUrlResponseDto {
    return new SitemapCustomUrlResponseDto(
      entity.id,
      entity.tenantId,
      entity.pathOrUrl,
      entity.enabled,
      entity.lastmodMode,
      entity.lastmodValue ? entity.lastmodValue.toISOString() : null,
      entity.changefreq,
      this.parsePriority(entity.priority),
      entity.notes,
      entity.createdAt.toISOString(),
      entity.updatedAt.toISOString(),
    );
  }
}
