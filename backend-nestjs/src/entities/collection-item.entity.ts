import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { ContentType } from '../common/content-type.enum';

@Entity({ name: 'collection_items' })
@Index(['collectionId', 'contentType', 'contentId'], { unique: true })
@Index(['collectionId', 'position'], { unique: true })
export class CollectionItemEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ name: 'collection_id', type: 'varchar', length: 36 })
  collectionId!: string;

  @Column({ name: 'content_type', type: 'enum', enum: ContentType })
  contentType!: ContentType;

  @Column({ name: 'content_id', type: 'varchar', length: 36 })
  contentId!: string;

  @Column({ type: 'int' })
  position!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
