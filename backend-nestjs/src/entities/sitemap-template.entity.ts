import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum SitemapLastmodPolicy {
  UPDATED_AT = 'updatedAt',
  PUBLISHED_AT = 'publishedAt',
}

export enum SitemapValidateStatus {
  OK = 'OK',
  ERROR = 'ERROR',
  WARNING = 'WARNING',
}

@Entity({ name: 'sitemap_templates' })
@Index(['tenantId', 'contentType'], { unique: true })
export class SitemapTemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 36 })
  tenantId!: string;

  @Column({ name: 'content_type', type: 'varchar', length: 64 })
  contentType!: string;

  @Column({ type: 'boolean', default: false })
  enabled!: boolean;

  @Column({ type: 'varchar', length: 512, nullable: true })
  template!: string | null;

  @Column({
    name: 'lastmod_policy',
    type: 'enum',
    enum: SitemapLastmodPolicy,
    default: SitemapLastmodPolicy.UPDATED_AT,
  })
  lastmodPolicy!: SitemapLastmodPolicy;

  @Column({ name: 'default_changefreq', type: 'varchar', length: 16, nullable: true })
  defaultChangefreq!: string | null;

  @Column({
    name: 'default_priority',
    type: 'decimal',
    precision: 2,
    scale: 1,
    nullable: true,
  })
  defaultPriority!: string | null;

  @Column({
    name: 'validate_status',
    type: 'enum',
    enum: SitemapValidateStatus,
    default: SitemapValidateStatus.OK,
  })
  validateStatus!: SitemapValidateStatus;

  @Column({ name: 'validate_errors', type: 'jsonb', nullable: true })
  validateErrors!: string[] | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

