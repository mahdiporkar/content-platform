alter table admin_users
  add column if not exists token_version integer not null default 1;

alter table applications
  add column if not exists api_token_hash varchar null,
  add column if not exists api_token_salt varchar null,
  add column if not exists last_rotated_at timestamptz null;

alter table posts
  add column if not exists sanitized_html text null;

alter table articles
  add column if not exists sanitized_html text null;

create table if not exists consumer_users (
  id varchar(36) primary key,
  email varchar null unique,
  phone varchar null unique,
  status varchar(32) not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists consumer_entitlements (
  id varchar(36) primary key,
  user_id varchar(36) not null,
  application_id varchar(36) not null,
  content_id varchar(36) not null,
  type varchar(32) not null,
  starts_at timestamptz null,
  expires_at timestamptz null,
  status varchar(32) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_consumer_entitlements_lookup
  on consumer_entitlements (user_id, application_id, content_id);
