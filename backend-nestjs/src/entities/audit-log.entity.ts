import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'audit_logs' })
export class AuditLogEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ name: 'actor_id', type: 'varchar', length: 36, nullable: true })
  actorId!: string | null;

  @Column({ name: 'actor_email', type: 'varchar', nullable: true })
  actorEmail!: string | null;

  @Column({ type: 'varchar' })
  action!: string;

  @Column({ name: 'entity_type', type: 'varchar', nullable: true })
  entityType!: string | null;

  @Column({ name: 'entity_id', type: 'varchar', length: 36, nullable: true })
  entityId!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
