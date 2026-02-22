create table if not exists media_assets (
    id varchar(36) primary key,
    application_id varchar(36) not null,
    kind varchar(16) not null,
    object_key varchar(512) not null,
    original_name varchar(512),
    content_type varchar(255) not null,
    size_bytes bigint not null,
    created_at timestamptz not null,
    updated_at timestamptz not null,
    constraint fk_media_assets_app foreign key (application_id) references applications(id) on delete cascade,
    constraint uq_media_assets_app_object unique (application_id, object_key)
);

create index if not exists idx_media_assets_app_kind_created_at
    on media_assets (application_id, kind, created_at desc);
