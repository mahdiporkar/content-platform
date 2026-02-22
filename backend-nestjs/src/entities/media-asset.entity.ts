import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export enum MediaAssetKind {
  IMAGE = 'image',
  VIDEO = 'video',
  OTHER = 'other',
}

export enum MediaAssetState {
  ACTIVE = 'ACTIVE',
  TRASH = 'TRASH',
  PURGED = 'PURGED',
}

@Entity({ name: 'media_assets' })
@Index(['applicationId', 'objectKey'], { unique: true })
export class MediaAssetEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string = uuidv4();

  @Column({ name: 'application_id', type: 'varchar', length: 36 })
  applicationId!: string;

  @Column({ name: 'owner_user_id', type: 'varchar', length: 36, nullable: true })
  ownerUserId!: string | null;

  @Column({ type: 'enum', enum: MediaAssetKind })
  kind!: MediaAssetKind;

  @Column({ type: 'enum', enum: MediaAssetState, default: MediaAssetState.ACTIVE })
  state!: MediaAssetState;

  @Column({ type: 'varchar', default: 'media' })
  bucket!: string;

  @Column({ name: 'object_key', type: 'varchar' })
  objectKey!: string;

  @Column({ name: 'original_name', type: 'varchar', nullable: true })
  originalName!: string | null;

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

  @Column({ name: 'trashed_at', type: 'timestamptz', nullable: true })
  @Index()
  trashedAt!: Date | null;

  @Column({ name: 'purged_at', type: 'timestamptz', nullable: true })
  purgedAt!: Date | null;

  @Column({ name: 'deleted_by_user_id', type: 'varchar', length: 36, nullable: true })
  deletedByUserId!: string | null;

  @Column({ type: 'boolean', default: false })
  pinned!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
