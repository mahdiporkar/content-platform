import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { MenuLocation, MenuStatus } from '../common/menu-types';

@Entity({ name: 'menus' })
@Index(['applicationId', 'code', 'languageCode'], { unique: true })
export class MenuEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ name: 'application_id', type: 'varchar', length: 36 })
  applicationId!: string;

  @Column({ type: 'varchar' })
  code!: string;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'enum', enum: MenuLocation })
  location!: MenuLocation;

  @Column({ name: 'language_code', type: 'varchar', length: 5 })
  languageCode!: string;

  @Column({ type: 'enum', enum: MenuStatus })
  status!: MenuStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
