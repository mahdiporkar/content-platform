import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export enum MediaVariantType {
  ORIGINAL = 'ORIGINAL',
  THUMB = 'THUMB',
  RESIZED_720 = 'RESIZED_720',
  RESIZED_480 = 'RESIZED_480',
  HLS = 'HLS',
  POSTER = 'POSTER',
}

@Entity({ name: 'media_variants' })
@Index(['mediaAssetId'])
export class MediaVariantEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string = uuidv4();

  @Column({ name: 'media_asset_id', type: 'varchar', length: 36 })
  mediaAssetId!: string;

  @Column({ name: 'variant_type', type: 'enum', enum: MediaVariantType })
  variantType!: MediaVariantType;

  @Column({ type: 'varchar', default: 'media' })
  bucket!: string;

  @Column({ name: 'object_key', type: 'varchar' })
  objectKey!: string;

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
}
