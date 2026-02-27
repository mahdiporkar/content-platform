create table if not exists sitemap_settings (
    tenant_id varchar(36) primary key,
    enabled boolean not null default false,
    base_url varchar(255),
    sitemap_path varchar(255) not null default '/sitemap.xml',
    cache_ttl_seconds integer not null default 3600,
    regen_strategy varchar(32) not null default 'on_publish',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint fk_sitemap_settings_app foreign key (tenant_id) references applications(id) on delete cascade
);

create table if not exists sitemap_templates (
    id varchar(36) primary key,
    tenant_id varchar(36) not null,
    content_type varchar(64) not null,
    enabled boolean not null default false,
    template varchar(512),
    lastmod_policy varchar(32) not null default 'updatedAt',
    default_changefreq varchar(16),
    default_priority decimal(2,1),
    validate_status varchar(16) not null default 'OK',
    validate_errors jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint fk_sitemap_templates_app foreign key (tenant_id) references applications(id) on delete cascade,
    constraint uq_sitemap_templates_tenant_type unique (tenant_id, content_type)
);

create index if not exists idx_sitemap_templates_tenant on sitemap_templates(tenant_id);

create table if not exists sitemap_overrides (
    id varchar(36) primary key,
    tenant_id varchar(36) not null,
    content_type varchar(64) not null,
    content_id varchar(64) not null,
    custom_url varchar(1024),
    excluded boolean not null default false,
    priority_override decimal(2,1),
    changefreq_override varchar(16),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint fk_sitemap_overrides_app foreign key (tenant_id) references applications(id) on delete cascade,
    constraint uq_sitemap_overrides_tenant_type_content unique (tenant_id, content_type, content_id)
);

create index if not exists idx_sitemap_overrides_tenant on sitemap_overrides(tenant_id);

create table if not exists sitemap_custom_urls (
    id varchar(36) primary key,
    tenant_id varchar(36) not null,
    path_or_url varchar(1024) not null,
    enabled boolean not null default true,
    lastmod_mode varchar(16) not null default 'none',
    lastmod_value timestamptz,
    changefreq varchar(16),
    priority decimal(2,1),
    notes varchar(512),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint fk_sitemap_custom_urls_app foreign key (tenant_id) references applications(id) on delete cascade
);

create index if not exists idx_sitemap_custom_urls_tenant on sitemap_custom_urls(tenant_id);

create table if not exists sitemap_url_checks (
    id varchar(36) primary key,
    tenant_id varchar(36) not null,
    url varchar(2048) not null,
    last_checked_at timestamptz not null default now(),
    http_status integer,
    error_message text,
    constraint fk_sitemap_url_checks_app foreign key (tenant_id) references applications(id) on delete cascade
);

create index if not exists idx_sitemap_url_checks_tenant_url on sitemap_url_checks(tenant_id, url);
