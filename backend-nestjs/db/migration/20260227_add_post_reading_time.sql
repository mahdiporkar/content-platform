alter table posts
  add column if not exists reading_time_minutes integer not null default 0;
