alter table articles
  add column if not exists reading_time_minutes integer not null default 0;
