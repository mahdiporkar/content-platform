-- Art-direction upgrade for media_variants (NestJS)
-- Backward compatible with existing schema

alter table if exists media_variants
  add column if not exists application_id varchar(36),
  add column if not exists purpose varchar(32) not null default 'default',
  add column if not exists size_key varchar(8),
  add column if not exists min_width integer,
  add column if not exists max_width integer,
  add column if not exists device varchar(16),
  add column if not exists format varchar(16),
  add column if not exists width integer,
  add column if not exists height integer,
  add column if not exists duration double precision,
  add column if not exists bitrate integer,
  add column if not exists file_url text,
  add column if not exists is_default boolean not null default false,
  add column if not exists sort_order integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

update media_variants mv
set application_id = ma.application_id
from media_assets ma
where mv.media_asset_id = ma.id
  and mv.application_id is null;

-- Keep old rows compatible
update media_variants
set purpose = 'default'
where purpose is null or trim(purpose) = '';

-- Ensure at least one default for each asset that already has variants
with ranked as (
  select mv.id,
         mv.media_asset_id,
         row_number() over (partition by mv.media_asset_id order by mv.created_at asc) as rn
  from media_variants mv
)
update media_variants mv
set is_default = true
from ranked r
where mv.id = r.id
  and r.rn = 1
  and not exists (
    select 1 from media_variants x
    where x.media_asset_id = r.media_asset_id
      and x.is_default = true
  );

-- Backfill: every media_asset should have a default variant
insert into media_variants (
  id, media_asset_id, application_id, purpose, size_key, min_width, max_width, device, format,
  bucket, object_key, file_url, is_default, sort_order, width, height, duration, bitrate, size_bytes, created_at, updated_at
)
select
  lower(
    substr(md5(random()::text || clock_timestamp()::text), 1, 8) || '-' ||
    substr(md5(random()::text || clock_timestamp()::text), 9, 4) || '-' ||
    substr(md5(random()::text || clock_timestamp()::text), 13, 4) || '-' ||
    substr(md5(random()::text || clock_timestamp()::text), 17, 4) || '-' ||
    substr(md5(random()::text || clock_timestamp()::text), 21, 12)
  ),
  ma.id,
  ma.application_id,
  'default',
  null,
  null,
  null,
  null,
  split_part(ma.content_type, '/', 2),
  coalesce(ma.bucket, 'media'),
  ma.object_key,
  null,
  true,
  0,
  null,
  null,
  null,
  null,
  ma.size_bytes,
  now(),
  now()
from media_assets ma
where not exists (
  select 1 from media_variants mv where mv.media_asset_id = ma.id
);

create unique index if not exists uq_media_variants_combo
  on media_variants (media_asset_id, purpose, coalesce(size_key, ''), coalesce(device, ''));

create index if not exists idx_media_variants_application_id
  on media_variants(application_id);
