import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export enum SitemapRegenStrategy {
  ON_PUBLISH = 'on_publish',
  SCHEDULED = 'scheduled',
  MANUAL = 'manual',
}

@Entity({ name: 'sitemap_settings' })
export class SitemapSettingsEntity {
  @PrimaryColumn({ name: 'tenant_id', type: 'varchar', length: 36 })
  tenantId!: string;

  @Column({ type: 'boolean', default: false })
  enabled!: boolean;

  @Column({ name: 'base_url', type: 'varchar', length: 255, nullable: true })
  baseUrl!: string | null;

  @Column({ name: 'sitemap_path', type: 'varchar', length: 255, default: '/sitemap.xml' })
  sitemapPath!: string;

  @Column({ name: 'cache_ttl_seconds', type: 'integer', default: 3600 })
  cacheTtlSeconds!: number;

  @Column({
    name: 'regen_strategy',
    type: 'enum',
    enum: SitemapRegenStrategy,
    default: SitemapRegenStrategy.ON_PUBLISH,
  })
  regenStrategy!: SitemapRegenStrategy;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

