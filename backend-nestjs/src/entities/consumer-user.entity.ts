import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

export enum ConsumerUserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

@Entity({ name: 'consumer_users' })
export class ConsumerUserEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', nullable: true })
  email!: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', nullable: true })
  phone!: string | null;

  @Column({ type: 'enum', enum: ConsumerUserStatus, default: ConsumerUserStatus.ACTIVE })
  status!: ConsumerUserStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
