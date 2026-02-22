-- Audit inconsistent references to PURGED media assets.
-- Safe to run (read-only) unless you uncomment cleanup statements at the bottom.
--
-- Usage:
--   docker exec -i content-platform-postgres psql -U content -d content_platform \
--     -f /dev/stdin < backend-nestjs/db/maintenance/audit_purged_media_references.sql

\echo '=== 1) media_references rows that still point to PURGED assets ==='
select
  r.application_id,
  r.media_asset_id,
  r.ref_type,
  r.ref_id,
  r.ref_field,
  r.created_at as ref_created_at,
  a.state as asset_state,
  a.object_key,
  a.original_name
from media_references r
join media_assets a
  on a.id = r.media_asset_id
 and a.application_id = r.application_id
where a.state = 'PURGED'
order by r.application_id, r.ref_type, r.ref_id, r.created_at desc;

\echo '=== 2) images that point directly to PURGED media assets (broken preview candidates) ==='
select
  i.application_id,
  i.id as image_id,
  i.title,
  i.status,
  i.object_key,
  a.id as media_asset_id,
  a.state as asset_state,
  a.purged_at,
  i.created_at
from images i
join media_assets a
  on a.application_id = i.application_id
 and a.object_key = i.object_key
where a.state = 'PURGED'
order by i.application_id, i.created_at desc;

\echo '=== 3) videos that point to PURGED media assets (object_key or poster_key) ==='
select
  v.application_id,
  v.id as video_id,
  v.title,
  v.status,
  case
    when a.object_key = v.object_key then 'object_key'
    when a.object_key = v.poster_key then 'poster_key'
    else 'unknown'
  end as broken_field,
  a.id as media_asset_id,
  a.object_key,
  a.state as asset_state,
  a.purged_at,
  v.created_at
from videos v
join media_assets a
  on a.application_id = v.application_id
 and a.state = 'PURGED'
 and (a.object_key = v.object_key or a.object_key = v.poster_key)
order by v.application_id, v.created_at desc;

\echo '=== 4) posts/articles that reference PURGED assets in banner/content/gallery (heuristic scan) ==='
with purged_assets as (
  select application_id, id as media_asset_id, object_key
  from media_assets
  where state = 'PURGED'
)
select * from (
  select
    'posts'::text as source_table,
    p.application_id,
    p.id as record_id,
    p.title,
    pa.media_asset_id,
    pa.object_key,
    case
      when p.banner_key = pa.object_key then 'banner_key'
      when coalesce(p.banner_url, '') like ('%' || pa.object_key || '%') then 'banner_url'
      when coalesce(p.gallery::text, '') like ('%' || pa.object_key || '%') then 'gallery'
      when coalesce(p.content, '') like ('%' || pa.object_key || '%') then 'content'
      else 'unknown'
    end as matched_field
  from posts p
  join purged_assets pa on pa.application_id = p.application_id
  where p.banner_key = pa.object_key
     or coalesce(p.banner_url, '') like ('%' || pa.object_key || '%')
     or coalesce(p.gallery::text, '') like ('%' || pa.object_key || '%')
     or coalesce(p.content, '') like ('%' || pa.object_key || '%')

  union all

  select
    'articles'::text as source_table,
    ar.application_id,
    ar.id as record_id,
    ar.title,
    pa.media_asset_id,
    pa.object_key,
    case
      when ar.banner_key = pa.object_key then 'banner_key'
      when coalesce(ar.banner_url, '') like ('%' || pa.object_key || '%') then 'banner_url'
      when coalesce(ar.gallery::text, '') like ('%' || pa.object_key || '%') then 'gallery'
      when coalesce(ar.content, '') like ('%' || pa.object_key || '%') then 'content'
      else 'unknown'
    end as matched_field
  from articles ar
  join purged_assets pa on pa.application_id = ar.application_id
  where ar.banner_key = pa.object_key
     or coalesce(ar.banner_url, '') like ('%' || pa.object_key || '%')
     or coalesce(ar.gallery::text, '') like ('%' || pa.object_key || '%')
     or coalesce(ar.content, '') like ('%' || pa.object_key || '%')
) x
order by application_id, source_table, title, record_id;

-- Optional targeted cleanup examples (UNCOMMENT after review):
--
-- 1) Remove stale media_references that point to PURGED assets
-- delete from media_references r
-- using media_assets a
-- where a.id = r.media_asset_id
--   and a.application_id = r.application_id
--   and a.state = 'PURGED';
--
-- 2) Inspect a single broken image before deciding whether to delete/replace it
-- select * from images where id = 'PUT_IMAGE_ID_HERE';
--
-- 3) Delete a specific broken image record (destructive)
-- delete from images where id = 'PUT_IMAGE_ID_HERE' and application_id = 'PUT_APP_ID_HERE';

