ALTER TABLE applications ADD COLUMN IF NOT EXISTS management_token_hash varchar;

CREATE TABLE IF NOT EXISTS tenant_routes (
  id varchar(36) PRIMARY KEY,
  application_id varchar(36) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  source varchar(100) NOT NULL,
  route_key varchar(150) NOT NULL,
  path_template text NOT NULL,
  titles jsonb NOT NULL,
  status varchar NOT NULL DEFAULT 'AVAILABLE',
  icon varchar,
  css_class varchar,
  metadata jsonb,
  last_synced_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_tenant_routes_app_source_key UNIQUE (application_id, source, route_key)
);

CREATE INDEX IF NOT EXISTS idx_tenant_routes_app_status ON tenant_routes(application_id, status);

ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS source varchar;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS source_key varchar;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS managed_by varchar NOT NULL DEFAULT 'ADMIN';
