alter table if exists media_variants
    add column if not exists application_id varchar(36),
    add column if not exists purpose varchar(32),
    add column if not exists size_key varchar(8),
    add column if not exists min_width integer,
    add column if not exists max_width integer,
    add column if not exists device varchar(16),
    add column if not exists format varchar(32),
    add column if not exists width integer,
    add column if not exists height integer,
    add column if not exists duration double precision,
    add column if not exists bitrate integer,
    add column if not exists file_url varchar(1024),
    add column if not exists is_default boolean not null default false,
    add column if not exists sort_order integer not null default 0,
    add column if not exists updated_at timestamptz not null default now();

update media_variants mv
set application_id = ma.application_id
from media_assets ma
where mv.media_asset_id = ma.id
  and mv.application_id is null;

update media_variants
set purpose = case
    when variant_type = 'ORIGINAL' then 'default'
    when variant_type = 'THUMB' then 'thumbnail'
    when variant_type = 'POSTER' then 'preview'
    else 'gallery'
end
where purpose is null;

update media_variants
set is_default = true
where purpose = 'default';

update media_variants
set format = lower(split_part(object_key, '.', array_length(string_to_array(object_key, '.'), 1)))
where format is null
  and position('.' in object_key) > 0;

update media_variants
set updated_at = created_at
where updated_at is null;

insert into media_variants (
    id,
    media_asset_id,
    application_id,
    variant_type,
    purpose,
    bucket,
    object_key,
    size_bytes,
    is_default,
    sort_order,
    created_at,
    updated_at,
    format
)
select
    substr(md5(random()::text || clock_timestamp()::text || ma.id), 1, 36),
    ma.id,
    ma.application_id,
    'ORIGINAL',
    'default',
    ma.bucket,
    ma.object_key,
    ma.size_bytes,
    true,
    0,
    ma.created_at,
    ma.updated_at,
    lower(split_part(ma.object_key, '.', array_length(string_to_array(ma.object_key, '.'), 1)))
from media_assets ma
where not exists (
    select 1
    from media_variants mv
    where mv.media_asset_id = ma.id
      and mv.is_default = true
);

alter table if exists media_variants
    alter column application_id set not null,
    alter column purpose set not null;

create index if not exists idx_media_variants_application on media_variants(application_id);
create index if not exists idx_media_variants_purpose on media_variants(media_asset_id, purpose);

create unique index if not exists uq_media_variants_combo
    on media_variants(media_asset_id, purpose, coalesce(size_key, ''), coalesce(device, ''));
