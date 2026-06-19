import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export enum TenantRouteStatus {
  AVAILABLE = 'AVAILABLE',
  UNAVAILABLE = 'UNAVAILABLE',
}

@Entity({ name: 'tenant_routes' })
@Index(['applicationId', 'source', 'routeKey'], { unique: true })
export class TenantRouteEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ name: 'application_id', type: 'varchar', length: 36 })
  applicationId!: string;

  @Column({ type: 'varchar', length: 100 })
  source!: string;

  @Column({ name: 'route_key', type: 'varchar', length: 150 })
  routeKey!: string;

  @Column({ name: 'path_template', type: 'text' })
  pathTemplate!: string;

  @Column({ type: 'jsonb' })
  titles!: Record<string, string>;

  @Column({ type: 'enum', enum: TenantRouteStatus, default: TenantRouteStatus.AVAILABLE })
  status!: TenantRouteStatus;

  @Column({ type: 'varchar', nullable: true })
  icon!: string | null;

  @Column({ name: 'css_class', type: 'varchar', nullable: true })
  cssClass!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ name: 'last_synced_at', type: 'timestamptz' })
  lastSyncedAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
