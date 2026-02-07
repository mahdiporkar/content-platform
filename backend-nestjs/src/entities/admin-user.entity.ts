import { Column, Entity, Index, OneToMany, PrimaryColumn } from 'typeorm';
import { AdminUserApplicationEntity } from './admin-user-application.entity';

export enum AdminUserRole {
  SUPER_ADMIN = 'super_admin',
  EDITOR = 'editor',
  PUBLISHER = 'publisher',
}

export enum AdminUserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

@Entity({ name: 'admin_users' })
export class AdminUserEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar' })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar' })
  passwordHash!: string;

  @Column({ type: 'enum', enum: AdminUserRole, default: AdminUserRole.EDITOR })
  role!: AdminUserRole;

  @Column({ type: 'enum', enum: AdminUserStatus, default: AdminUserStatus.ACTIVE })
  status!: AdminUserStatus;

  @OneToMany(() => AdminUserApplicationEntity, (entry) => entry.adminUser, {
    cascade: true,
    eager: true,
  })
  applications!: AdminUserApplicationEntity[];
}
