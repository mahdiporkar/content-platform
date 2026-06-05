import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { ContentStatus } from '../common/content-status.enum';

@Entity({ name: 'pages' })
@Index(['applicationId', 'slug', 'languageCode'], { unique: true })
export class PageEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ name: 'application_id', type: 'varchar', length: 36 })
  applicationId!: string;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'varchar' })
  slug!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'sanitized_html', type: 'text', nullable: true })
  sanitizedHtml!: string | null;

  @Column({ name: 'cover_image', type: 'text', nullable: true })
  coverImage!: string | null;

  @Column({ name: 'language_code', type: 'varchar', length: 5 })
  languageCode!: string;

  @Column({ type: 'enum', enum: ContentStatus })
  status!: ContentStatus;

  @Column({ name: 'seo_title', type: 'varchar', nullable: true })
  seoTitle!: string | null;

  @Column({ name: 'seo_description', type: 'text', nullable: true })
  seoDescription!: string | null;

  @Column({ name: 'seo_keywords', type: 'text', array: true, nullable: true })
  seoKeywords!: string[] | null;

  @Column({ name: 'parent_id', type: 'varchar', length: 36, nullable: true })
  parentId!: string | null;

  @Column({ name: 'sort_order', type: 'integer', nullable: true })
  sortOrder!: number | null;

  @Column({ name: 'show_in_menu', type: 'boolean', default: false })
  showInMenu!: boolean;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @Column({ name: 'created_by', type: 'varchar', nullable: true })
  createdBy!: string | null;

  @Column({ name: 'updated_by', type: 'varchar', nullable: true })
  updatedBy!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
