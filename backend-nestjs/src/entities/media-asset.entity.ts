import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export enum MediaAssetKind {
  IMAGE = 'image',
  VIDEO = 'video',
  FILE = 'file',
}

@Entity({ name: 'media_assets' })
@Index(['applicationId', 'objectKey'], { unique: true })
export class MediaAssetEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string = uuidv4();

  @Column({ name: 'application_id', type: 'varchar', length: 36 })
  applicationId!: string;

  @Column({ type: 'enum', enum: MediaAssetKind })
  kind!: MediaAssetKind;

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

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
