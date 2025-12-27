import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { AdminUserEntity } from './admin-user.entity';

@Entity({ name: 'admin_user_applications' })
export class AdminUserApplicationEntity {
  @PrimaryColumn({ name: 'admin_user_id', type: 'varchar', length: 36 })
  adminUserId!: string;

  @PrimaryColumn({ name: 'application_id', type: 'varchar', length: 36 })
  applicationId!: string;

  @ManyToOne(() => AdminUserEntity, (adminUser) => adminUser.applications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'admin_user_id' })
  adminUser!: AdminUserEntity;
}