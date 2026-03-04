import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsumerEntitlementEntity, ConsumerEntitlementStatus } from '../entities/consumer-entitlement.entity';
import { PostEntity } from '../entities/post.entity';
import { ArticleEntity } from '../entities/article.entity';
import { VideoEntity } from '../entities/video.entity';
import { ImageEntity } from '../entities/image.entity';
import { ContentStatus } from '../common/content-status.enum';

@Injectable()
export class AccessControlService {
  constructor(
    @InjectRepository(ConsumerEntitlementEntity)
    private readonly entitlementRepo: Repository<ConsumerEntitlementEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,
    @InjectRepository(ArticleEntity)
    private readonly articleRepo: Repository<ArticleEntity>,
    @InjectRepository(VideoEntity)
    private readonly videoRepo: Repository<VideoEntity>,
    @InjectRepository(ImageEntity)
    private readonly imageRepo: Repository<ImageEntity>,
  ) {}

  async canAccessContent(userId: string | null | undefined, applicationId: string, contentId: string): Promise<boolean> {
    const published = await this.isPublished(applicationId, contentId);
    if (!published) {
      return false;
    }

    // Until paid metadata is introduced, published delivery content is treated as free.
    if (!userId) {
      return true;
    }

    const entitlement = await this.entitlementRepo.findOne({
      where: { userId, applicationId, contentId, status: ConsumerEntitlementStatus.ACTIVE },
    });
    if (!entitlement) {
      return true;
    }

    const now = Date.now();
    const startsAt = entitlement.startsAt ? new Date(entitlement.startsAt).getTime() : 0;
    const expiresAt = entitlement.expiresAt ? new Date(entitlement.expiresAt).getTime() : Number.POSITIVE_INFINITY;
    return startsAt <= now && expiresAt >= now;
  }

  private async isPublished(applicationId: string, contentId: string): Promise<boolean> {
    const [post, article, video, image] = await Promise.all([
      this.postRepo.findOne({ where: { id: contentId, applicationId, status: ContentStatus.PUBLISHED } }),
      this.articleRepo.findOne({ where: { id: contentId, applicationId, status: ContentStatus.PUBLISHED } }),
      this.videoRepo.findOne({ where: { id: contentId, applicationId, status: ContentStatus.PUBLISHED } }),
      this.imageRepo.findOne({ where: { id: contentId, applicationId, status: ContentStatus.PUBLISHED } }),
    ]);
    return Boolean(post || article || video || image);
  }
}
