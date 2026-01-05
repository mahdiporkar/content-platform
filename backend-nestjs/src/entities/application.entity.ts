import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'applications' })
export class ApplicationEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ name: 'website_url', type: 'varchar', nullable: true })
  websiteUrl?: string | null;

  @Column({ type: 'text', array: true, nullable: true })
  tags!: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  seo!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  gallery!: Record<string, unknown>[] | null;
}
