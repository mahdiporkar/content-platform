import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'applications' })
export class ApplicationEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;
}