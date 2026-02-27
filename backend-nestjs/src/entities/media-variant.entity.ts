import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export const MEDIA_VARIANT_PURPOSES = [
  'default',
  'thumbnail',
  'hero',
  'cover',
  'gallery',
  'og_image',
  'preview',
] as const;
export type MediaVariantPurpose = (typeof MEDIA_VARIANT_PURPOSES)[number];

export const MEDIA_VARIANT_SIZE_KEYS = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
export type MediaVariantSizeKey = (typeof MEDIA_VARIANT_SIZE_KEYS)[number];

export const MEDIA_VARIANT_DEVICES = ['mobile', 'tablet', 'desktop'] as const;
export type MediaVariantDevice = (typeof MEDIA_VARIANT_DEVICES)[number];

@Entity({ name: 'media_variants' })
@Index(['mediaAssetId'])
@Index(['mediaAssetId', 'purpose', 'sizeKey', 'device'], { unique: true })
export class MediaVariantEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string = uuidv4();

  @Column({ name: 'media_asset_id', type: 'varchar', length: 36 })
  mediaAssetId!: string;

  @Column({ name: 'application_id', type: 'varchar', length: 36, nullable: true })
  applicationId!: string | null;

  @Column({ type: 'varchar', length: 32, default: 'default' })
  purpose!: MediaVariantPurpose;

  @Column({ name: 'size_key', type: 'varchar', length: 8, nullable: true })
  sizeKey!: MediaVariantSizeKey | null;

  @Column({ name: 'min_width', type: 'integer', nullable: true })
  minWidth!: number | null;

  @Column({ name: 'max_width', type: 'integer', nullable: true })
  maxWidth!: number | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  device!: MediaVariantDevice | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  format!: string | null;

  @Column({ type: 'varchar', default: 'media' })
  bucket!: string;

  @Column({ name: 'object_key', type: 'varchar' })
  objectKey!: string;

  @Column({ name: 'file_url', type: 'text', nullable: true })
  fileUrl!: string | null;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault!: boolean;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder!: number;

  @Column({ type: 'integer', nullable: true })
  width!: number | null;

  @Column({ type: 'integer', nullable: true })
  height!: number | null;

  @Column({ type: 'float', nullable: true })
  duration!: number | null;

  @Column({ type: 'integer', nullable: true })
  bitrate!: number | null;

  @Column({
    name: 'size_bytes',
    type: 'bigint',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  sizeBytes!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', nullable: true })
  updatedAt!: Date | null;
}
