import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import { ContentType } from '../common/content-type.enum';

@Entity({ name: 'view_events' })
export class ViewEventEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ name: 'application_id', type: 'varchar', length: 36 })
  applicationId!: string;

  @Column({ name: 'content_id', type: 'varchar', length: 36 })
  contentId!: string;

  @Column({ name: 'content_type', type: 'enum', enum: ContentType })
  contentType!: ContentType;

  @Column({ type: 'varchar', length: 5, nullable: true })
  locale!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
