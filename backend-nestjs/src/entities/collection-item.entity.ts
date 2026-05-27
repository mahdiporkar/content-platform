import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { ContentType } from '../common/content-type.enum';
import {
  CollectionItemDisplay,
  CollectionItemLink,
  CollectionItemLinkType,
  CollectionItemMetadata,
  CollectionItemType,
} from '../common/collection-types';

@Entity({ name: 'collection_items' })
@Index(['collectionId', 'contentType', 'contentId'], { unique: true })
@Index(['collectionId', 'position'], { unique: true })
export class CollectionItemEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ name: 'collection_id', type: 'varchar', length: 36 })
  collectionId!: string;

  @Column({ name: 'content_type', type: 'enum', enum: ContentType, nullable: true })
  contentType!: ContentType | null;

  @Column({ name: 'content_id', type: 'varchar', length: 36, nullable: true })
  contentId!: string | null;

  @Column({ type: 'varchar', default: CollectionItemType.CONTENT })
  type!: CollectionItemType;

  @Column({ type: 'int' })
  position!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'starts_at', type: 'timestamptz', nullable: true })
  startsAt!: Date | null;

  @Column({ name: 'ends_at', type: 'timestamptz', nullable: true })
  endsAt!: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  display!: CollectionItemDisplay | null;

  @Column({ type: 'jsonb', nullable: true, default: () => `'{"type":"${CollectionItemLinkType.NONE}"}'::jsonb` })
  link!: CollectionItemLink | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: CollectionItemMetadata | null;

  @Column({ name: 'created_by', type: 'varchar', length: 36, nullable: true })
  createdBy!: string | null;

  @Column({ name: 'updated_by', type: 'varchar', length: 36, nullable: true })
  updatedBy!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
