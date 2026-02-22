import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export enum MediaReferenceType {
  POST = 'POST',
  PAGE = 'PAGE',
  GALLERY = 'GALLERY',
  PROFILE = 'PROFILE',
  ARTICLE = 'ARTICLE',
  VIDEO = 'VIDEO',
  IMAGE = 'IMAGE',
  OTHER = 'OTHER',
}

@Entity({ name: 'media_references' })
@Index(['applicationId'])
@Index(['mediaAssetId'])
@Index(['applicationId', 'mediaAssetId', 'refType', 'refId', 'refField'], { unique: true })
export class MediaReferenceEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string = uuidv4();

  @Column({ name: 'application_id', type: 'varchar', length: 36 })
  applicationId!: string;

  @Column({ name: 'media_asset_id', type: 'varchar', length: 36 })
  mediaAssetId!: string;

  @Column({ name: 'ref_type', type: 'enum', enum: MediaReferenceType })
  refType!: MediaReferenceType;

  @Column({ name: 'ref_id', type: 'varchar', length: 36 })
  refId!: string;

  @Column({ name: 'ref_field', type: 'varchar' })
  refField!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
