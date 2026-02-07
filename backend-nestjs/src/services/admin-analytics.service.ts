import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentType } from '../common/content-type.enum';
import { ArticleEntity } from '../entities/article.entity';
import { VideoEntity } from '../entities/video.entity';
import { ImageEntity } from '../entities/image.entity';
import { ViewEventEntity } from '../entities/view-event.entity';

@Injectable()
export class AdminAnalyticsService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepo: Repository<ArticleEntity>,
    @InjectRepository(VideoEntity)
    private readonly videoRepo: Repository<VideoEntity>,
    @InjectRepository(ImageEntity)
    private readonly imageRepo: Repository<ImageEntity>,
    @InjectRepository(ViewEventEntity)
    private readonly viewEventRepo: Repository<ViewEventEntity>,
  ) {}

  async topContent(applicationId: string, type?: ContentType, limit = 10) {
    if (type === ContentType.VIDEO) {
      const rows = await this.videoRepo.find({
        where: { applicationId },
        order: { viewCount: 'DESC' },
        take: limit,
      });
      return rows.map((row) => ({
        id: row.id,
        title: row.title,
        type: ContentType.VIDEO,
        viewCount: row.viewCount ?? 0,
      }));
    }
    if (type === ContentType.IMAGE) {
      const rows = await this.imageRepo.find({
        where: { applicationId },
        order: { viewCount: 'DESC' },
        take: limit,
      });
      return rows.map((row) => ({
        id: row.id,
        title: row.title,
        type: ContentType.IMAGE,
        viewCount: row.viewCount ?? 0,
      }));
    }
    const rows = await this.articleRepo.find({
      where: { applicationId },
      order: { viewCount: 'DESC' },
      take: limit,
    });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      type: ContentType.ARTICLE,
      viewCount: row.viewCount ?? 0,
    }));
  }

  async timeline(applicationId: string, days: number) {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - Math.max(1, days));
    const rows = await this.viewEventRepo
      .createQueryBuilder('event')
      .select("DATE_TRUNC('day', event.createdAt)", 'day')
      .addSelect('COUNT(*)', 'count')
      .where('event.applicationId = :applicationId', { applicationId })
      .andWhere('event.createdAt >= :since', { since })
      .groupBy("DATE_TRUNC('day', event.createdAt)")
      .orderBy("DATE_TRUNC('day', event.createdAt)", 'ASC')
      .getRawMany();
    return rows.map((row) => ({
      date: new Date(row.day).toISOString().slice(0, 10),
      views: Number(row.count),
    }));
  }
}
