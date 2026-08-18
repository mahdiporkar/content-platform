alter table applications
  add column if not exists demo_expires_at timestamptz;

create index if not exists idx_applications_demo_expires_at
  on applications (demo_expires_at)
  where demo_expires_at is not null;
