-- Safe media deletion schema for NestJS backend
-- NOTE: current app uses TypeORM synchronize=true. This SQL is provided for controlled deployments.

alter table if exists media_assets
    add column if not exists owner_user_id varchar(36),
    add column if not exists state varchar(16) not null default 'ACTIVE',
    add column if not exists bucket varchar(255) not null default 'media',
    add column if not exists trashed_at timestamptz,
    add column if not exists purged_at timestamptz,
    add column if not exists deleted_by_user_id varchar(36),
    add column if not exists pinned boolean not null default false,
    add column if not exists metadata jsonb;

create index if not exists idx_media_assets_trashed_at on media_assets(trashed_at);

create table if not exists media_variants (
    id varchar(36) primary key,
    media_asset_id varchar(36) not null,
    variant_type varchar(32) not null,
    bucket varchar(255) not null,
    object_key varchar(512) not null,
    size_bytes bigint not null,
    created_at timestamptz not null default now()
);

create index if not exists idx_media_variants_media_asset_id on media_variants(media_asset_id);

create table if not exists media_references (
    id varchar(36) primary key,
    application_id varchar(36) not null,
    media_asset_id varchar(36) not null,
    ref_type varchar(32) not null,
    ref_id varchar(36) not null,
    ref_field varchar(128) not null,
    created_at timestamptz not null default now(),
    constraint uq_media_references unique (application_id, media_asset_id, ref_type, ref_id, ref_field)
);

create index if not exists idx_media_references_application_id on media_references(application_id);
create index if not exists idx_media_references_media_asset_id on media_references(media_asset_id);
