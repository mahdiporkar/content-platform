import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { MediaAssetEntity } from '../entities/media-asset.entity';
import { MediaReferenceEntity, MediaReferenceType } from '../entities/media-reference.entity';
import { PostEntity } from '../entities/post.entity';
import { ArticleEntity } from '../entities/article.entity';
import { ImageEntity } from '../entities/image.entity';
import { VideoEntity } from '../entities/video.entity';

@Injectable()
export class MediaReferenceService {
  constructor(
    @InjectRepository(MediaReferenceEntity)
    private readonly mediaRefRepo: Repository<MediaReferenceEntity>,
    @InjectRepository(MediaAssetEntity)
    private readonly mediaAssetRepo: Repository<MediaAssetEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,
    @InjectRepository(ArticleEntity)
    private readonly articleRepo: Repository<ArticleEntity>,
    @InjectRepository(ImageEntity)
    private readonly imageRepo: Repository<ImageEntity>,
    @InjectRepository(VideoEntity)
    private readonly videoRepo: Repository<VideoEntity>,
  ) {}

  async addReference(
    applicationId: string,
    mediaAssetId: string,
    refType: MediaReferenceType,
    refId: string,
    refField: string,
  ): Promise<void> {
    const exists = await this.mediaRefRepo.findOne({
      where: { applicationId, mediaAssetId, refType, refId, refField },
      select: ['id'],
    });
    if (exists) {
      return;
    }
    const entity = this.mediaRefRepo.create({
      id: uuidv4(),
      applicationId,
      mediaAssetId,
      refType,
      refId,
      refField,
    });
    await this.mediaRefRepo.save(entity);
  }

  async removeReference(
    applicationId: string,
    mediaAssetId: string,
    refType: MediaReferenceType,
    refId: string,
    refField: string,
  ): Promise<void> {
    await this.mediaRefRepo.delete({ applicationId, mediaAssetId, refType, refId, refField });
  }

  async removeAllForRef(
    applicationId: string,
    refType: MediaReferenceType,
    refId: string,
  ): Promise<void> {
    await this.mediaRefRepo.delete({ applicationId, refType, refId });
  }

  async countReferences(applicationId: string, mediaAssetId: string): Promise<number> {
    return await this.mediaRefRepo.count({ where: { applicationId, mediaAssetId } });
  }

  async listReferences(applicationId: string, mediaAssetId: string, limit = 20): Promise<MediaReferenceEntity[]> {
    return await this.mediaRefRepo.find({
      where: { applicationId, mediaAssetId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async addReferencesByObjectKeys(
    applicationId: string,
    objectKeys: string[],
    refType: MediaReferenceType,
    refId: string,
    refField: string,
  ): Promise<void> {
    const uniqueKeys = Array.from(new Set(objectKeys.map((entry) => entry.trim()).filter(Boolean)));
    if (uniqueKeys.length === 0) {
      return;
    }
    const assets = await this.mediaAssetRepo
      .createQueryBuilder('asset')
      .where('asset.application_id = :applicationId', { applicationId })
      .andWhere('asset.object_key IN (:...keys)', { keys: uniqueKeys })
      .getMany();
    for (const asset of assets) {
      await this.addReference(applicationId, asset.id, refType, refId, refField);
    }
  }

  async syncContentReferences(params: {
    applicationId: string;
    refType: MediaReferenceType;
    refId: string;
    bannerKey?: string | null;
    bannerUrl?: string | null;
    galleryUrls?: string[];
    content?: string;
  }): Promise<void> {
    await this.removeAllForRef(params.applicationId, params.refType, params.refId);

    const keys: string[] = [];
    if (params.bannerKey) {
      keys.push(params.bannerKey);
    }
    if (params.bannerUrl) {
      const fromUrl = this.extractObjectKey(params.applicationId, params.bannerUrl);
      if (fromUrl) {
        keys.push(fromUrl);
      }
    }
    for (const url of params.galleryUrls || []) {
      const fromUrl = this.extractObjectKey(params.applicationId, url);
      if (fromUrl) {
        keys.push(fromUrl);
      }
    }
    for (const key of this.extractObjectKeysFromContent(params.applicationId, params.content || '')) {
      keys.push(key);
    }

    const unique = Array.from(new Set(keys));
    await this.addReferencesByObjectKeys(params.applicationId, unique, params.refType, params.refId, 'content');
  }

  async ensureReferencesForAsset(applicationId: string, mediaAssetId: string): Promise<void> {
    const asset = await this.mediaAssetRepo.findOne({
      where: { id: mediaAssetId, applicationId },
      select: ['id', 'applicationId', 'objectKey'],
    });
    if (!asset?.objectKey) {
      return;
    }
    const target = asset.objectKey;

    const posts = await this.postRepo.find({
      where: { applicationId },
      select: ['id', 'bannerKey', 'bannerUrl', 'gallery', 'content'],
    });
    for (const post of posts) {
      if (this.collectReferenceKeys(applicationId, post.bannerKey, post.bannerUrl, post.gallery, post.content).includes(target)) {
        await this.addReference(applicationId, mediaAssetId, MediaReferenceType.POST, post.id, 'content');
      }
    }

    const articles = await this.articleRepo.find({
      where: { applicationId },
      select: ['id', 'bannerKey', 'bannerUrl', 'gallery', 'content'],
    });
    for (const article of articles) {
      if (
        this.collectReferenceKeys(applicationId, article.bannerKey, article.bannerUrl, article.gallery, article.content).includes(target)
      ) {
        await this.addReference(applicationId, mediaAssetId, MediaReferenceType.ARTICLE, article.id, 'content');
      }
    }

    const images = await this.imageRepo.find({ where: { applicationId }, select: ['id', 'objectKey'] });
    for (const image of images) {
      if (image.objectKey === target) {
        await this.addReference(applicationId, mediaAssetId, MediaReferenceType.IMAGE, image.id, 'content');
      }
    }

    const videos = await this.videoRepo.find({ where: { applicationId }, select: ['id', 'objectKey'] });
    for (const video of videos) {
      if (video.objectKey === target) {
        await this.addReference(applicationId, mediaAssetId, MediaReferenceType.VIDEO, video.id, 'content');
      }
    }
  }

  private extractObjectKeysFromContent(applicationId: string, content: string): string[] {
    if (!content) {
      return [];
    }
    const matches = content.match(/https?:\/\/[^"'\s<]+|\/media\/[^"'\s<]+/g) || [];
    return matches
      .map((entry) => this.extractObjectKey(applicationId, entry))
      .filter((entry): entry is string => Boolean(entry));
  }

  private extractObjectKey(applicationId: string, raw: string): string | null {
    const value = raw.trim();
    if (!value) {
      return null;
    }
    if (value.startsWith(`${applicationId}/`)) {
      return value;
    }
    const marker = `/media/${applicationId}/`;
    const markerIndex = value.indexOf(marker);
    if (markerIndex >= 0) {
      const suffix = value.slice(markerIndex + marker.length);
      if (!suffix) {
        return null;
      }
      const decoded = suffix
        .split('/')
        .filter(Boolean)
        .map((part) => decodeURIComponent(part))
        .join('/');
      return decoded ? `${applicationId}/${decoded}` : null;
    }
    const directIndex = value.indexOf(`${applicationId}/`);
    if (directIndex >= 0) {
      return value.slice(directIndex);
    }
    return null;
  }

  private collectReferenceKeys(
    applicationId: string,
    bannerKey: string | null | undefined,
    bannerUrl: string | null | undefined,
    gallery: Array<Record<string, unknown>> | null | undefined,
    content: string | null | undefined,
  ): string[] {
    const keys: string[] = [];
    if (bannerKey) {
      keys.push(bannerKey);
    }
    if (bannerUrl) {
      const fromBanner = this.extractObjectKey(applicationId, bannerUrl);
      if (fromBanner) {
        keys.push(fromBanner);
      }
    }
    for (const entry of gallery || []) {
      const rawUrl = String(entry?.url || '').trim();
      if (!rawUrl) {
        continue;
      }
      const fromGallery = this.extractObjectKey(applicationId, rawUrl);
      if (fromGallery) {
        keys.push(fromGallery);
      }
    }
    keys.push(...this.extractObjectKeysFromContent(applicationId, content || ''));
    return Array.from(new Set(keys));
  }
}
