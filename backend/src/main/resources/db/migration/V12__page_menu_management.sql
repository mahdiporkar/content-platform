CREATE TABLE IF NOT EXISTS pages (
  id varchar(36) PRIMARY KEY,
  application_id varchar(36) NOT NULL,
  title varchar NOT NULL,
  slug varchar NOT NULL,
  content text NOT NULL,
  sanitized_html text,
  cover_image text,
  language_code varchar(5) NOT NULL,
  status varchar NOT NULL,
  seo_title varchar,
  seo_description text,
  seo_keywords text[],
  parent_id varchar(36),
  sort_order integer,
  show_in_menu boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_by varchar,
  updated_by varchar,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_pages_app_slug_language UNIQUE (application_id, slug, language_code)
);

CREATE INDEX IF NOT EXISTS idx_pages_app_language_status ON pages(application_id, language_code, status);

CREATE TABLE IF NOT EXISTS menus (
  id varchar(36) PRIMARY KEY,
  application_id varchar(36) NOT NULL,
  code varchar NOT NULL,
  title varchar NOT NULL,
  location varchar NOT NULL,
  language_code varchar(5) NOT NULL,
  status varchar NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_menus_app_code_language UNIQUE (application_id, code, language_code)
);

CREATE INDEX IF NOT EXISTS idx_menus_app_language_location ON menus(application_id, language_code, location);

CREATE TABLE IF NOT EXISTS menu_items (
  id varchar(36) PRIMARY KEY,
  menu_id varchar(36) NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  parent_id varchar(36) REFERENCES menu_items(id) ON DELETE CASCADE,
  title varchar NOT NULL,
  item_type varchar NOT NULL,
  reference_id varchar(36),
  url text,
  target varchar NOT NULL DEFAULT 'SELF',
  icon varchar,
  css_class varchar,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_tree ON menu_items(menu_id, parent_id, sort_order);
