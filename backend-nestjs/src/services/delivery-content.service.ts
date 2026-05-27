import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ContentStatus } from '../common/content-status.enum';
import { ContentType } from '../common/content-type.enum';
import { ArticleEntity } from '../entities/article.entity';
import { PostEntity } from '../entities/post.entity';
import { VideoEntity } from '../entities/video.entity';
import { GalleryEntity } from '../entities/gallery.entity';
import { ImageEntity } from '../entities/image.entity';
import { CollectionEntity } from '../entities/collection.entity';
import { CollectionItemEntity } from '../entities/collection-item.entity';
import { ViewEventEntity } from '../entities/view-event.entity';
import { DeliveryContentResponseDto } from '../dto/responses/delivery-content-response.dto';
import { DeliveryCollectionResponseDto } from '../dto/responses/delivery-collection-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';
import { BaseUrlService } from './base-url.service';
import { ApplicationEntity } from '../entities/application.entity';
import { v4 as uuidv4 } from 'uuid';
import { PublicMediaUrlService } from './public-media-url.service';
import {
  CollectionFallbackSource,
  CollectionItemLinkType,
  CollectionItemType,
  CollectionPresentationType,
  CollectionStatus,
} from '../common/collection-types';

@Injectable()
export class DeliveryContentService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepo: Repository<ArticleEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,
    @InjectRepository(VideoEntity)
    private readonly videoRepo: Repository<VideoEntity>,
    @InjectRepository(GalleryEntity)
    private readonly galleryRepo: Repository<GalleryEntity>,
    @InjectRepository(ImageEntity)
    private readonly imageRepo: Repository<ImageEntity>,
    @InjectRepository(CollectionEntity)
    private readonly collectionRepo: Repository<CollectionEntity>,
    @InjectRepository(CollectionItemEntity)
    private readonly collectionItemRepo: Repository<CollectionItemEntity>,
    @InjectRepository(ViewEventEntity)
    private readonly viewEventRepo: Repository<ViewEventEntity>,
    private readonly baseUrl: BaseUrlService,
    private readonly publicMediaUrlService: PublicMediaUrlService,
  ) {}

  private toOptionalString(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
  }

  private isPublicCollection(collection: CollectionEntity): boolean {
    return collection.isPublic !== false && (collection.status ?? CollectionStatus.DRAFT) === CollectionStatus.PUBLISHED;
  }

  private isItemCurrentlyValid(item: CollectionItemEntity, now = new Date()): boolean {
    if (item.isActive === false) {
      return false;
    }
    if (item.startsAt && item.startsAt > now) {
      return false;
    }
    if (item.endsAt && item.endsAt <= now) {
      return false;
    }
    return true;
  }

  private collectionItemContext(item: CollectionItemEntity) {
    return {
      id: item.id,
      collectionId: item.collectionId,
      type: item.type ?? CollectionItemType.CONTENT,
      position: item.position,
      isActive: item.isActive ?? true,
      startsAt: item.startsAt ? item.startsAt.toISOString() : null,
      endsAt: item.endsAt ? item.endsAt.toISOString() : null,
      display: item.display ?? null,
      link: item.link ?? { type: CollectionItemLinkType.NONE },
      metadata: item.metadata ?? null,
    };
  }

  private withCollectionItem(
    content: DeliveryContentResponseDto,
    item: CollectionItemEntity,
  ): DeliveryContentResponseDto {
    content.collectionItem = this.collectionItemContext(item);
    return content;
  }

  private mapCustomItem(application: ApplicationEntity, item: CollectionItemEntity): DeliveryContentResponseDto {
    const display = item.display ?? {};
    return new DeliveryContentResponseDto(
      item.id,
      application.id,
      'custom',
      display.titleOverride ?? '',
      display.descriptionOverride ?? display.subtitleOverride ?? null,
      null,
      null,
      ContentStatus.PUBLISHED,
      null,
      null,
      null,
      0,
      null,
      display.imageOverride ? this.publicMediaUrlService.toPublicMediaUrl(application, display.imageOverride) : null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      display.videoOverride ?? null,
      this.collectionItemContext(item),
    );
  }

  async listContent(params: {
    application: ApplicationEntity;
    type?: ContentType;
    tags?: string[];
    collectionSlug?: string;
    locale?: string;
    page: number;
    size: number;
  }): Promise<PageResponseDto<DeliveryContentResponseDto>> {
    const pageNumber = Math.max(0, params.page);
    const pageSize = Math.max(1, params.size);
    const type = params.type;
    const tags = (params.tags || []).map((tag) => tag.trim()).filter(Boolean);
    const locale = params.locale?.trim() || null;

    if (params.collectionSlug) {
      const collection = await this.getCollection(params.application, params.collectionSlug, locale ?? undefined);
      const filtered = type ? collection.items.filter((item) => item.type === type) : collection.items;
      const tagged = tags.length
        ? filtered.filter((item) => (item.tags ?? []).some((tag) => tags.includes(tag)))
        : filtered;
      const paged = tagged.slice(pageNumber * pageSize, pageNumber * pageSize + pageSize);
      return new PageResponseDto(paged, tagged.length, Math.ceil(tagged.length / pageSize), pageNumber, pageSize);
    }

    if (type === ContentType.ARTICLE) {
      const [items, total] = await this.queryArticles(params.application.id, tags, locale, undefined, pageNumber, pageSize);
      return new PageResponseDto(
        items.map((article) => this.mapArticle(params.application, article)),
        total,
        Math.ceil(total / pageSize),
        pageNumber,
        pageSize,
      );
    }
    if (type === ContentType.POST) {
      const [items, total] = await this.queryPosts(params.application.id, tags, locale, undefined, pageNumber, pageSize);
      return new PageResponseDto(
        items.map((post) => this.mapPost(params.application, post)),
        total,
        Math.ceil(total / pageSize),
        pageNumber,
        pageSize,
      );
    }
    if (type === ContentType.VIDEO) {
      const [items, total] = await this.queryVideos(params.application.id, tags, locale, undefined, pageNumber, pageSize);
      return new PageResponseDto(
        items.map((video) => this.mapVideo(params.application, video)),
        total,
        Math.ceil(total / pageSize),
        pageNumber,
        pageSize,
      );
    }
    if (type === ContentType.GALLERY) {
      const [items, total] = await this.queryGalleries(params.application.id, tags, locale, undefined, pageNumber, pageSize);
      return new PageResponseDto(
        items.map((gallery) => this.mapGallery(params.application, gallery)),
        total,
        Math.ceil(total / pageSize),
        pageNumber,
        pageSize,
      );
    }
    if (type === ContentType.IMAGE) {
      const [items, total] = await this.queryImages(params.application.id, tags, locale, undefined, pageNumber, pageSize);
      return new PageResponseDto(
        items.map((image) => this.mapImage(params.application, image)),
        total,
        Math.ceil(total / pageSize),
        pageNumber,
        pageSize,
      );
    }

    const [posts, articles, videos, galleries, images] = await Promise.all([
      this.queryPosts(params.application.id, tags, locale, undefined, pageNumber, pageSize),
      this.queryArticles(params.application.id, tags, locale, undefined, pageNumber, pageSize),
      this.queryVideos(params.application.id, tags, locale, undefined, pageNumber, pageSize),
      this.queryGalleries(params.application.id, tags, locale, undefined, pageNumber, pageSize),
      this.queryImages(params.application.id, tags, locale, undefined, pageNumber, pageSize),
    ]);

    const allItems = [
      ...posts[0].map((post) => this.mapPost(params.application, post)),
      ...articles[0].map((article) => this.mapArticle(params.application, article)),
      ...videos[0].map((video) => this.mapVideo(params.application, video)),
      ...galleries[0].map((gallery) => this.mapGallery(params.application, gallery)),
      ...images[0].map((image) => this.mapImage(params.application, image)),
    ];
    const total = posts[1] + articles[1] + videos[1] + galleries[1] + images[1];

    return new PageResponseDto(allItems, total, Math.ceil(total / pageSize), pageNumber, pageSize);
  }

  async getCollection(application: ApplicationEntity, slug: string, locale?: string): Promise<DeliveryCollectionResponseDto> {
    const collection = await this.collectionRepo.findOne({ where: { applicationId: application.id, slug } });
    if (!collection || !this.isPublicCollection(collection)) {
      throw new NotFoundException('Collection not found.');
    }
    const items = (
      await this.collectionItemRepo.find({ where: { collectionId: collection.id }, order: { position: 'ASC' } })
    ).filter((item) => this.isItemCurrentlyValid(item));
    const mapped: DeliveryContentResponseDto[] = [];

    const localeValue = locale?.trim() || null;
    const grouped = {
      post: items.filter((item) => item.contentType === ContentType.POST && item.contentId).map((item) => item.contentId as string),
      article: items.filter((item) => item.contentType === ContentType.ARTICLE && item.contentId).map((item) => item.contentId as string),
      video: items.filter((item) => item.contentType === ContentType.VIDEO && item.contentId).map((item) => item.contentId as string),
      gallery: items.filter((item) => item.contentType === ContentType.GALLERY && item.contentId).map((item) => item.contentId as string),
      image: items.filter((item) => item.contentType === ContentType.IMAGE && item.contentId).map((item) => item.contentId as string),
    };
    const itemByContent = new Map(
      items
        .filter((item) => item.contentType && item.contentId)
        .map((item) => [`${item.contentType}:${item.contentId}`, item]),
    );

    if (grouped.post.length > 0) {
      const posts = await this.postRepo.find({ where: { id: In(grouped.post), status: ContentStatus.PUBLISHED } });
      const sorted = grouped.post
        .map((id) => posts.find((entry) => entry.id === id))
        .filter(Boolean) as PostEntity[];
      sorted.forEach((post) => {
        if (!localeValue || post.locale === localeValue) {
          const item = itemByContent.get(`${ContentType.POST}:${post.id}`);
          mapped.push(item ? this.withCollectionItem(this.mapPost(application, post), item) : this.mapPost(application, post));
        }
      });
    }
    if (grouped.article.length > 0) {
      const articles = await this.articleRepo.find({ where: { id: In(grouped.article), status: ContentStatus.PUBLISHED } });
      const sorted = grouped.article
        .map((id) => articles.find((entry) => entry.id === id))
        .filter(Boolean) as ArticleEntity[];
      sorted.forEach((article) => {
        if (!localeValue || article.locale === localeValue) {
          const item = itemByContent.get(`${ContentType.ARTICLE}:${article.id}`);
          mapped.push(item ? this.withCollectionItem(this.mapArticle(application, article), item) : this.mapArticle(application, article));
        }
      });
    }
    if (grouped.video.length > 0) {
      const videos = await this.videoRepo.find({ where: { id: In(grouped.video), status: ContentStatus.PUBLISHED } });
      const sorted = grouped.video
        .map((id) => videos.find((entry) => entry.id === id))
        .filter(Boolean) as VideoEntity[];
      sorted.forEach((video) => {
        if (!localeValue || video.locale === localeValue) {
          const item = itemByContent.get(`${ContentType.VIDEO}:${video.id}`);
          mapped.push(item ? this.withCollectionItem(this.mapVideo(application, video), item) : this.mapVideo(application, video));
        }
      });
    }
    if (grouped.gallery.length > 0) {
      const galleries = await this.galleryRepo.find({ where: { id: In(grouped.gallery), status: ContentStatus.PUBLISHED } });
      const sorted = grouped.gallery
        .map((id) => galleries.find((entry) => entry.id === id))
        .filter(Boolean) as GalleryEntity[];
      sorted.forEach((gallery) => {
        if (!localeValue || gallery.locale === localeValue) {
          const item = itemByContent.get(`${ContentType.GALLERY}:${gallery.id}`);
          mapped.push(item ? this.withCollectionItem(this.mapGallery(application, gallery), item) : this.mapGallery(application, gallery));
        }
      });
    }
    if (grouped.image.length > 0) {
      const images = await this.imageRepo.find({ where: { id: In(grouped.image), status: ContentStatus.PUBLISHED } });
      const sorted = grouped.image
        .map((id) => images.find((entry) => entry.id === id))
        .filter(Boolean) as ImageEntity[];
      sorted.forEach((image) => {
        if (!localeValue || image.locale === localeValue) {
          const item = itemByContent.get(`${ContentType.IMAGE}:${image.id}`);
          mapped.push(item ? this.withCollectionItem(this.mapImage(application, image), item) : this.mapImage(application, image));
        }
      });
    }
    items
      .filter((item) => (item.type ?? CollectionItemType.CONTENT) === CollectionItemType.CUSTOM)
      .forEach((item) => mapped.push(this.mapCustomItem(application, item)));

    if (mapped.length === 0 && collection.fallback?.enabled) {
      mapped.push(
        ...(await this.listFallbackContent(
          application,
          collection.fallback.source ?? CollectionFallbackSource.LATEST,
          collection.fallback.limit ?? 10,
          localeValue,
        )),
      );
    }

    mapped.sort((left, right) => (left.collectionItem?.position ?? 0) - (right.collectionItem?.position ?? 0));

    return new DeliveryCollectionResponseDto(
      collection.id,
      collection.applicationId,
      collection.slug,
      collection.title,
      collection.description ?? null,
      collection.isPublic,
      collection.allowedTypes ?? null,
      collection.maxItems ?? null,
      collection.priority ?? 0,
      collection.presentation ?? { type: CollectionPresentationType.LIST },
      collection.placement ?? null,
      collection.fallback ?? { enabled: false },
      collection.audience ?? null,
      collection.metadata ?? null,
      mapped,
    );
  }

  private async listFallbackContent(
    application: ApplicationEntity,
    source: CollectionFallbackSource,
    limit: number,
    locale: string | null,
  ): Promise<DeliveryContentResponseDto[]> {
    const take = Math.max(1, Math.min(50, limit));
    const order =
      source === CollectionFallbackSource.POPULAR
        ? { viewCount: 'DESC' as const, publishedAt: 'DESC' as const, createdAt: 'DESC' as const }
        : { publishedAt: 'DESC' as const, createdAt: 'DESC' as const };
    const where = locale
      ? { applicationId: application.id, status: ContentStatus.PUBLISHED, locale }
      : { applicationId: application.id, status: ContentStatus.PUBLISHED };
    const [posts, articles, videos, galleries, images] = await Promise.all([
      this.postRepo.find({ where, order, take }),
      this.articleRepo.find({ where, order, take }),
      this.videoRepo.find({ where, order, take }),
      this.galleryRepo.find({ where, order, take }),
      this.imageRepo.find({ where, order, take }),
    ]);
    return [
      ...posts.map((post) => this.mapPost(application, post)),
      ...articles.map((article) => this.mapArticle(application, article)),
      ...videos.map((video) => this.mapVideo(application, video)),
      ...galleries.map((gallery) => this.mapGallery(application, gallery)),
      ...images.map((image) => this.mapImage(application, image)),
    ]
      .sort((left, right) => {
        if (source === CollectionFallbackSource.POPULAR && right.viewCount !== left.viewCount) {
          return right.viewCount - left.viewCount;
        }
        return new Date(right.publishedAt ?? 0).getTime() - new Date(left.publishedAt ?? 0).getTime();
      })
      .slice(0, take);
  }

  async getPostBySlug(application: ApplicationEntity, slug: string): Promise<DeliveryContentResponseDto> {
    const post = await this.postRepo.findOne({
      where: { applicationId: application.id, slug, status: ContentStatus.PUBLISHED },
    });
    if (!post) {
      throw new NotFoundException('Post not found.');
    }
    return this.mapPost(application, post);
  }

  async getArticleBySlug(application: ApplicationEntity, slug: string): Promise<DeliveryContentResponseDto> {
    const article = await this.articleRepo.findOne({
      where: { applicationId: application.id, slug, status: ContentStatus.PUBLISHED },
    });
    if (!article) {
      throw new NotFoundException('Article not found.');
    }
    return this.mapArticle(application, article);
  }

  async getVideoById(application: ApplicationEntity, id: string): Promise<DeliveryContentResponseDto> {
    const video = await this.videoRepo.findOne({
      where: { applicationId: application.id, id, status: ContentStatus.PUBLISHED },
    });
    if (!video) {
      throw new NotFoundException('Video not found.');
    }
    return this.mapVideo(application, video);
  }

  async getGalleryBySlug(application: ApplicationEntity, slug: string): Promise<DeliveryContentResponseDto> {
    const gallery = await this.galleryRepo.findOne({
      where: { applicationId: application.id, slug, status: ContentStatus.PUBLISHED },
    });
    if (!gallery) {
      throw new NotFoundException('Gallery not found.');
    }
    return this.mapGallery(application, gallery);
  }

  async listGallery(
    application: ApplicationEntity,
    locale: string | undefined,
    page: number,
    size: number,
  ): Promise<PageResponseDto<DeliveryContentResponseDto>> {
    const pageNumber = Math.max(0, page);
    const pageSize = Math.max(1, size);
    const [items, total] = await this.queryGalleries(
      application.id,
      [],
      locale?.trim() || null,
      null,
      pageNumber,
      pageSize,
    );
    return new PageResponseDto(
      items.map((gallery) => this.mapGallery(application, gallery)),
      total,
      Math.ceil(total / pageSize),
      pageNumber,
      pageSize,
    );
  }

  async incrementView(contentType: ContentType, contentId: string, applicationId?: string, locale?: string | null): Promise<void> {
    if (contentType === ContentType.POST) {
      await this.postRepo.increment({ id: contentId }, 'viewCount', 1);
    } else if (contentType === ContentType.ARTICLE) {
      await this.articleRepo.increment({ id: contentId }, 'viewCount', 1);
    } else if (contentType === ContentType.VIDEO) {
      await this.videoRepo.increment({ id: contentId }, 'viewCount', 1);
    } else if (contentType === ContentType.GALLERY) {
      await this.galleryRepo.increment({ id: contentId }, 'viewCount', 1);
    } else if (contentType === ContentType.IMAGE) {
      await this.imageRepo.increment({ id: contentId }, 'viewCount', 1);
    }
    if (applicationId) {
      const event = this.viewEventRepo.create({
        id: uuidv4(),
        applicationId,
        contentId,
        contentType,
        locale: locale ?? null,
      });
      await this.viewEventRepo.save(event);
    }
  }

  private async queryArticles(
    applicationId: string,
    tags: string[],
    locale: string | null,
    ids: string[] | null | undefined,
    pageNumber: number,
    pageSize: number,
  ): Promise<[ArticleEntity[], number]> {
    const qb = this.articleRepo.createQueryBuilder('article');
    qb.where('article.applicationId = :applicationId', { applicationId })
      .andWhere('article.status = :status', { status: ContentStatus.PUBLISHED });
    if (locale) {
      qb.andWhere('article.locale = :locale', { locale });
    }
    if (tags.length > 0) {
      qb.andWhere('article.tags && ARRAY[:...tags]', { tags });
    }
    if (ids && ids.length > 0) {
      qb.andWhere('article.id IN (:...ids)', { ids });
    }
    qb.orderBy('article.publishedAt', 'DESC').addOrderBy('article.createdAt', 'DESC');
    qb.skip(pageNumber * pageSize).take(pageSize);
    return await qb.getManyAndCount();
  }

  private async queryPosts(
    applicationId: string,
    tags: string[],
    locale: string | null,
    ids: string[] | null | undefined,
    pageNumber: number,
    pageSize: number,
  ): Promise<[PostEntity[], number]> {
    const qb = this.postRepo.createQueryBuilder('post');
    qb.where('post.applicationId = :applicationId', { applicationId })
      .andWhere('post.status = :status', { status: ContentStatus.PUBLISHED });
    if (locale) {
      qb.andWhere('post.locale = :locale', { locale });
    }
    if (tags.length > 0) {
      qb.andWhere('post.tags && ARRAY[:...tags]', { tags });
    }
    if (ids && ids.length > 0) {
      qb.andWhere('post.id IN (:...ids)', { ids });
    }
    qb.orderBy('post.publishedAt', 'DESC').addOrderBy('post.createdAt', 'DESC');
    qb.skip(pageNumber * pageSize).take(pageSize);
    return await qb.getManyAndCount();
  }

  private async queryVideos(
    applicationId: string,
    tags: string[],
    locale: string | null,
    ids: string[] | null | undefined,
    pageNumber: number,
    pageSize: number,
  ): Promise<[VideoEntity[], number]> {
    const qb = this.videoRepo.createQueryBuilder('video');
    qb.where('video.applicationId = :applicationId', { applicationId })
      .andWhere('video.status = :status', { status: ContentStatus.PUBLISHED });
    if (locale) {
      qb.andWhere('video.locale = :locale', { locale });
    }
    if (tags.length > 0) {
      qb.andWhere('video.tags && ARRAY[:...tags]', { tags });
    }
    if (ids && ids.length > 0) {
      qb.andWhere('video.id IN (:...ids)', { ids });
    }
    qb.orderBy('video.publishedAt', 'DESC').addOrderBy('video.createdAt', 'DESC');
    qb.skip(pageNumber * pageSize).take(pageSize);
    return await qb.getManyAndCount();
  }

  private async queryGalleries(
    applicationId: string,
    tags: string[],
    locale: string | null,
    ids: string[] | null | undefined,
    pageNumber: number,
    pageSize: number,
  ): Promise<[GalleryEntity[], number]> {
    const qb = this.galleryRepo.createQueryBuilder('gallery');
    qb.where('gallery.applicationId = :applicationId', { applicationId })
      .andWhere('gallery.status = :status', { status: ContentStatus.PUBLISHED });
    if (locale) {
      qb.andWhere('gallery.locale = :locale', { locale });
    }
    if (tags.length > 0) {
      qb.andWhere('gallery.tags && ARRAY[:...tags]', { tags });
    }
    if (ids && ids.length > 0) {
      qb.andWhere('gallery.id IN (:...ids)', { ids });
    }
    qb.orderBy('gallery.publishedAt', 'DESC').addOrderBy('gallery.createdAt', 'DESC');
    qb.skip(pageNumber * pageSize).take(pageSize);
    return await qb.getManyAndCount();
  }

  private async queryImages(
    applicationId: string,
    tags: string[],
    locale: string | null,
    ids: string[] | null | undefined,
    pageNumber: number,
    pageSize: number,
  ): Promise<[ImageEntity[], number]> {
    const qb = this.imageRepo.createQueryBuilder('image');
    qb.where('image.applicationId = :applicationId', { applicationId })
      .andWhere('image.status = :status', { status: ContentStatus.PUBLISHED });
    if (locale) {
      qb.andWhere('image.locale = :locale', { locale });
    }
    if (tags.length > 0) {
      qb.andWhere('image.tags && ARRAY[:...tags]', { tags });
    }
    if (ids && ids.length > 0) {
      qb.andWhere('image.id IN (:...ids)', { ids });
    }
    qb.orderBy('image.publishedAt', 'DESC').addOrderBy('image.createdAt', 'DESC');
    qb.skip(pageNumber * pageSize).take(pageSize);
    return await qb.getManyAndCount();
  }

  private mapArticle(application: ApplicationEntity, article: ArticleEntity): DeliveryContentResponseDto {
    const mediaUrl = article.bannerKey
      ? this.baseUrl.buildMediaUrl(application, article.bannerKey)
      : this.publicMediaUrlService.toPublicMediaUrl(application, article.bannerUrl);
    return new DeliveryContentResponseDto(
      article.id,
      article.applicationId,
      ContentType.ARTICLE,
      article.title,
      article.description ?? null,
      article.locale ?? null,
      article.tags ?? null,
      article.status,
      article.slug,
      article.publishedAt ? article.publishedAt.toISOString() : null,
      article.scheduledAt ? article.scheduledAt.toISOString() : null,
      article.viewCount ?? 0,
      article.readingTimeMinutes ?? 0,
      mediaUrl,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      article.seo ?? null,
      this.publicMediaUrlService.rewriteHtmlMediaUrls(application, article.sanitizedHtml ?? article.content ?? null),
    );
  }

  private mapPost(application: ApplicationEntity, post: PostEntity): DeliveryContentResponseDto {
    const mediaUrl = post.bannerKey
      ? this.baseUrl.buildMediaUrl(application, post.bannerKey)
      : this.publicMediaUrlService.toPublicMediaUrl(application, post.bannerUrl);
    return new DeliveryContentResponseDto(
      post.id,
      post.applicationId,
      ContentType.POST,
      post.title,
      post.description ?? null,
      post.locale ?? null,
      post.tags ?? null,
      post.status,
      post.slug,
      post.publishedAt ? post.publishedAt.toISOString() : null,
      post.scheduledAt ? post.scheduledAt.toISOString() : null,
      post.viewCount ?? 0,
      post.readingTimeMinutes ?? 0,
      mediaUrl,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      post.seo ?? null,
      this.publicMediaUrlService.rewriteHtmlMediaUrls(application, post.sanitizedHtml ?? post.content ?? null),
    );
  }

  private mapVideo(application: ApplicationEntity, video: VideoEntity): DeliveryContentResponseDto {
    return new DeliveryContentResponseDto(
      video.id,
      video.applicationId,
      ContentType.VIDEO,
      video.title,
      video.description ?? null,
      video.locale ?? null,
      video.tags ?? null,
      video.status,
      null,
      video.publishedAt ? video.publishedAt.toISOString() : null,
      video.scheduledAt ? video.scheduledAt.toISOString() : null,
      video.viewCount ?? 0,
      null,
      this.baseUrl.buildMediaUrl(application, video.objectKey),
      video.posterKey ? this.baseUrl.buildMediaUrl(application, video.posterKey) : null,
      video.durationSeconds ?? null,
      video.width ?? null,
      video.height ?? null,
      video.contentType ?? null,
      video.sizeBytes ?? null,
      video.altText ?? null,
      video.seo ?? null,
      null,
    );
  }

  private mapGallery(application: ApplicationEntity, gallery: GalleryEntity): DeliveryContentResponseDto {
    const firstImage = (gallery.gallery || []).find((item) => typeof item.url === 'string' && item.url.trim().length > 0);
    const mediaUrl = firstImage
      ? this.publicMediaUrlService.toPublicMediaUrl(application, firstImage.url as string)
      : null;
    return new DeliveryContentResponseDto(
      gallery.id,
      gallery.applicationId,
      ContentType.GALLERY,
      gallery.title,
      gallery.description ?? null,
      gallery.locale ?? null,
      gallery.tags ?? null,
      gallery.status,
      gallery.slug,
      gallery.publishedAt ? gallery.publishedAt.toISOString() : null,
      gallery.scheduledAt ? gallery.scheduledAt.toISOString() : null,
      gallery.viewCount ?? 0,
      null,
      mediaUrl,
      null,
      null,
      null,
      null,
      null,
      null,
      this.toOptionalString(firstImage?.alt) ?? null,
      gallery.seo ?? null,
      JSON.stringify(
        (gallery.gallery || []).map((item) => ({
          ...item,
          url:
            typeof item.url === 'string'
              ? this.publicMediaUrlService.toPublicMediaUrl(application, item.url)
              : item.url,
        })),
      ),
    );
  }

  private mapImage(application: ApplicationEntity, image: ImageEntity): DeliveryContentResponseDto {
    return new DeliveryContentResponseDto(
      image.id,
      image.applicationId,
      ContentType.IMAGE,
      image.title,
      image.description ?? null,
      image.locale ?? null,
      image.tags ?? null,
      image.status,
      null,
      image.publishedAt ? image.publishedAt.toISOString() : null,
      image.scheduledAt ? image.scheduledAt.toISOString() : null,
      image.viewCount ?? 0,
      null,
      this.baseUrl.buildMediaUrl(application, image.objectKey),
      null,
      null,
      image.width ?? null,
      image.height ?? null,
      image.contentType ?? null,
      image.sizeBytes ?? null,
      image.altText ?? null,
      image.seo ?? null,
      null,
    );
  }
}
