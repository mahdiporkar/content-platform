import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentStatus } from '../common/content-status.enum';
import { ArticleEntity } from '../entities/article.entity';
import { ImageEntity } from '../entities/image.entity';
import { PostEntity } from '../entities/post.entity';
import { VideoEntity } from '../entities/video.entity';

@Injectable()
export class ScheduledPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScheduledPublisherService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,
    @InjectRepository(ArticleEntity)
    private readonly articleRepo: Repository<ArticleEntity>,
    @InjectRepository(VideoEntity)
    private readonly videoRepo: Repository<VideoEntity>,
    @InjectRepository(ImageEntity)
    private readonly imageRepo: Repository<ImageEntity>,
  ) {}

  onModuleInit() {
    void this.publishDueContent();
    this.timer = setInterval(() => {
      void this.publishDueContent();
    }, 30_000);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async publishDueContent() {
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      const [posts, articles, videos, images] = await Promise.all([
        this.publishDue(this.postRepo),
        this.publishDue(this.articleRepo),
        this.publishDue(this.videoRepo),
        this.publishDue(this.imageRepo),
      ]);
      const total = posts + articles + videos + images;
      if (total > 0) {
        this.logger.log(`Auto-published ${total} scheduled content item(s).`);
      }
    } finally {
      this.running = false;
    }
  }

  private async publishDue<T extends { status: ContentStatus; publishedAt: Date | null; scheduledAt: Date | null }>(
    repo: Repository<T>,
  ): Promise<number> {
    const result = await repo
      .createQueryBuilder()
      .update()
      .set({
        status: ContentStatus.PUBLISHED,
        publishedAt: () => 'NOW()',
        scheduledAt: null,
      } as never)
      .where('status = :scheduled', { scheduled: ContentStatus.SCHEDULED })
      .andWhere('scheduled_at IS NOT NULL')
      .andWhere('scheduled_at <= NOW()')
      .execute();

    return result.affected ?? 0;
  }
}
