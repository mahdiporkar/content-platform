import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum SitemapLastmodMode {
  NOW = 'now',
  FIXED_DATE = 'fixed_date',
  NONE = 'none',
}

@Entity({ name: 'sitemap_custom_urls' })
@Index(['tenantId'])
export class SitemapCustomUrlEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 36 })
  tenantId!: string;

  @Column({ name: 'path_or_url', type: 'varchar', length: 1024 })
  pathOrUrl!: string;

  @Column({ type: 'boolean', default: true })
  enabled!: boolean;

  @Column({
    name: 'lastmod_mode',
    type: 'enum',
    enum: SitemapLastmodMode,
    default: SitemapLastmodMode.NONE,
  })
  lastmodMode!: SitemapLastmodMode;

  @Column({ name: 'lastmod_value', type: 'timestamptz', nullable: true })
  lastmodValue!: Date | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  changefreq!: string | null;

  @Column({
    type: 'decimal',
    precision: 2,
    scale: 1,
    nullable: true,
  })
  priority!: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

