import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export enum ConsumerEntitlementType {
  PURCHASE = 'purchase',
  SUBSCRIPTION = 'subscription',
  RENTAL = 'rental',
}

export enum ConsumerEntitlementStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

@Entity({ name: 'consumer_entitlements' })
@Index(['userId', 'applicationId', 'contentId'])
export class ConsumerEntitlementEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId!: string;

  @Column({ name: 'application_id', type: 'varchar', length: 36 })
  applicationId!: string;

  @Column({ name: 'content_id', type: 'varchar', length: 36 })
  contentId!: string;

  @Column({ type: 'enum', enum: ConsumerEntitlementType })
  type!: ConsumerEntitlementType;

  @Column({ name: 'starts_at', type: 'timestamptz', nullable: true })
  startsAt!: Date | null;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @Column({ type: 'enum', enum: ConsumerEntitlementStatus, default: ConsumerEntitlementStatus.ACTIVE })
  status!: ConsumerEntitlementStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
