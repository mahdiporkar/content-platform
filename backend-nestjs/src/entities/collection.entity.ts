import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import {
  CollectionAudience,
  CollectionFallback,
  CollectionMetadata,
  CollectionPlacement,
  CollectionPresentation,
  CollectionPresentationType,
  CollectionStatus,
} from '../common/collection-types';

@Entity({ name: 'collections' })
@Index(['applicationId', 'slug'], { unique: true })
export class CollectionEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ name: 'application_id', type: 'varchar', length: 36 })
  applicationId!: string;

  @Column({ type: 'varchar' })
  slug!: string;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'allowed_types', type: 'text', array: true, nullable: true })
  allowedTypes!: string[] | null;

  @Column({ name: 'max_items', type: 'int', nullable: true })
  maxItems!: number | null;

  @Column({ name: 'is_public', type: 'boolean', default: true })
  isPublic!: boolean;

  @Column({ type: 'varchar', default: CollectionStatus.DRAFT })
  status!: CollectionStatus;

  @Column({ type: 'int', default: 0 })
  priority!: number;

  @Column({ type: 'jsonb', nullable: true, default: () => `'{"type":"${CollectionPresentationType.LIST}"}'::jsonb` })
  presentation!: CollectionPresentation | null;

  @Column({ type: 'jsonb', nullable: true })
  placement!: CollectionPlacement | null;

  @Column({ type: 'jsonb', nullable: true, default: () => `'{"enabled":false}'::jsonb` })
  fallback!: CollectionFallback | null;

  @Column({ type: 'jsonb', nullable: true })
  audience!: CollectionAudience | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: CollectionMetadata | null;

  @Column({ name: 'created_by', type: 'varchar', length: 36, nullable: true })
  createdBy!: string | null;

  @Column({ name: 'updated_by', type: 'varchar', length: 36, nullable: true })
  updatedBy!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
