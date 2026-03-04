import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export enum ApplicationStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

export enum MediaPolicy {
  PUBLIC_VIA_GATEWAY = 'public-via-gateway',
  DOMAIN_LOCKED = 'domain-locked',
  JWT_REQUIRED = 'jwt-required',
}

@Entity({ name: 'applications' })
export class ApplicationEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'enum', enum: ApplicationStatus, default: ApplicationStatus.ACTIVE })
  status!: ApplicationStatus;

  @Column({ name: 'rate_limit_policy', type: 'jsonb', nullable: true })
  rateLimitPolicy!: Record<string, unknown> | null;

  @Column({ name: 'media_policy', type: 'enum', enum: MediaPolicy, default: MediaPolicy.PUBLIC_VIA_GATEWAY })
  mediaPolicy!: MediaPolicy;

  @Column({ name: 'allowed_domains', type: 'text', array: true, nullable: true })
  allowedDomains!: string[] | null;

  @Column({ name: 'api_token', type: 'varchar', nullable: true })
  apiToken!: string | null;

  @Column({ name: 'api_token_hash', type: 'varchar', nullable: true })
  apiTokenHash!: string | null;

  @Column({ name: 'api_token_salt', type: 'varchar', nullable: true })
  apiTokenSalt!: string | null;

  @Column({ name: 'token_created_at', type: 'timestamptz', nullable: true })
  tokenCreatedAt!: Date | null;

  @Column({ name: 'last_rotated_at', type: 'timestamptz', nullable: true })
  lastRotatedAt!: Date | null;

  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  lastUsedAt!: Date | null;

  @Column({ name: 'website_url', type: 'varchar', nullable: true })
  websiteUrl?: string | null;

  @Column({ name: 'public_base_url_override', type: 'varchar', nullable: true })
  publicBaseUrlOverride!: string | null;

  @Column({ name: 'media_base_url_override', type: 'varchar', nullable: true })
  mediaBaseUrlOverride!: string | null;

  @Column({ type: 'text', array: true, nullable: true })
  tags!: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  seo!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  gallery!: Record<string, unknown>[] | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
