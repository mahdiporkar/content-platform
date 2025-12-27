import { Column, Entity, Index, OneToMany, PrimaryColumn } from 'typeorm';
import { AdminUserApplicationEntity } from './admin-user-application.entity';

@Entity({ name: 'admin_users' })
export class AdminUserEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar' })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar' })
  passwordHash!: string;

  @OneToMany(() => AdminUserApplicationEntity, (entry) => entry.adminUser, {
    cascade: true,
    eager: true,
  })
  applications!: AdminUserApplicationEntity[];
}