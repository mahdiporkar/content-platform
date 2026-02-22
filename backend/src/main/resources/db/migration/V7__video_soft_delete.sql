alter table if exists videos
    add column if not exists deleted_at timestamptz;

create index if not exists idx_videos_app_deleted_at
    on videos (application_id, deleted_at);
