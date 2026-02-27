import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { ContentStatus } from '../common/content-status.enum';

@Entity({ name: 'articles' })
@Index(['applicationId', 'slug', 'locale'], { unique: true })
export class ArticleEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ name: 'application_id', type: 'varchar', length: 36 })
  applicationId!: string;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar' })
  slug!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'banner_url', type: 'text', nullable: true })
  bannerUrl!: string | null;

  @Column({ name: 'banner_key', type: 'varchar', nullable: true })
  bannerKey!: string | null;

  @Column({ type: 'varchar', length: 5, nullable: true })
  locale!: string | null;

  @Column({ type: 'text', array: true, nullable: true })
  tags!: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  seo!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  gallery!: Record<string, unknown>[] | null;

  @Column({ type: 'enum', enum: ContentStatus })
  status!: ContentStatus;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true })
  scheduledAt!: Date | null;

  @Column({
    name: 'view_count',
    type: 'bigint',
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  viewCount!: number;

  @Column({ name: 'reading_time_minutes', type: 'integer', default: 0 })
  readingTimeMinutes!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
