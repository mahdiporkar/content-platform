import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'sitemap_overrides' })
@Index(['tenantId', 'contentType', 'contentId'], { unique: true })
export class SitemapOverrideEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 36 })
  tenantId!: string;

  @Column({ name: 'content_type', type: 'varchar', length: 64 })
  contentType!: string;

  @Column({ name: 'content_id', type: 'varchar', length: 64 })
  contentId!: string;

  @Column({ name: 'custom_url', type: 'varchar', length: 1024, nullable: true })
  customUrl!: string | null;

  @Column({ type: 'boolean', default: false })
  excluded!: boolean;

  @Column({
    name: 'priority_override',
    type: 'decimal',
    precision: 2,
    scale: 1,
    nullable: true,
  })
  priorityOverride!: string | null;

  @Column({ name: 'changefreq_override', type: 'varchar', length: 16, nullable: true })
  changefreqOverride!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

