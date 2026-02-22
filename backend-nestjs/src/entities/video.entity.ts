import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { ContentStatus } from '../common/content-status.enum';

@Entity({ name: 'videos' })
export class VideoEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ name: 'application_id', type: 'varchar', length: 36 })
  applicationId!: string;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

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

  @Column({ name: 'view_count', type: 'bigint', default: 0, transformer: {
    to: (value: number) => value,
    from: (value: string) => Number(value),
  } })
  viewCount!: number;

  @Column({ name: 'object_key', type: 'varchar' })
  objectKey!: string;

  @Column({ name: 'poster_key', type: 'varchar', nullable: true })
  posterKey!: string | null;

  @Column({ name: 'duration_seconds', type: 'int', nullable: true })
  durationSeconds!: number | null;

  @Column({ type: 'int', nullable: true })
  width!: number | null;

  @Column({ type: 'int', nullable: true })
  height!: number | null;

  @Column({ name: 'content_type', type: 'varchar' })
  contentType!: string;

  @Column({
    name: 'size_bytes',
    type: 'bigint',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  sizeBytes!: number;

  @Column({ name: 'alt_text', type: 'text', nullable: true })
  altText!: string | null;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
