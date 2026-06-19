import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { MenuItemTarget, MenuItemType } from '../common/menu-types';

@Entity({ name: 'menu_items' })
@Index(['menuId', 'parentId', 'sortOrder'])
export class MenuItemEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ name: 'menu_id', type: 'varchar', length: 36 })
  menuId!: string;

  @Column({ name: 'parent_id', type: 'varchar', length: 36, nullable: true })
  parentId!: string | null;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ name: 'item_type', type: 'enum', enum: MenuItemType })
  itemType!: MenuItemType;

  @Column({ name: 'reference_id', type: 'varchar', length: 36, nullable: true })
  referenceId!: string | null;

  @Column({ type: 'text', nullable: true })
  url!: string | null;

  @Column({ type: 'enum', enum: MenuItemTarget, default: MenuItemTarget.SELF })
  target!: MenuItemTarget;

  @Column({ type: 'varchar', nullable: true })
  icon!: string | null;

  @Column({ name: 'css_class', type: 'varchar', nullable: true })
  cssClass!: string | null;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder!: number;

  @Column({ name: 'is_visible', type: 'boolean', default: true })
  isVisible!: boolean;

  @Column({ type: 'varchar', nullable: true })
  source!: string | null;

  @Column({ name: 'source_key', type: 'varchar', nullable: true })
  sourceKey!: string | null;

  @Column({ name: 'managed_by', type: 'varchar', default: 'ADMIN' })
  managedBy!: 'TENANT' | 'CMS' | 'ADMIN';

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
