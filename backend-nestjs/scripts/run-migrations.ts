import { createDatabaseClient } from './db';

async function main() {
  const client = createDatabaseClient();
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      ALTER TABLE collections ADD COLUMN IF NOT EXISTS locale varchar(5) NOT NULL DEFAULT 'und';
      ALTER TABLE videos ADD COLUMN IF NOT EXISTS slug varchar;
      ALTER TABLE videos ADD COLUMN IF NOT EXISTS display_scopes text[];

      UPDATE collections SET locale = 'und' WHERE locale IS NULL OR btrim(locale) = '';
      ALTER TABLE collections ALTER COLUMN locale SET DEFAULT 'und';
      ALTER TABLE collections ALTER COLUMN locale SET NOT NULL;

      UPDATE videos
      SET slug = 'video-' || left(id, 8)
      WHERE slug IS NULL OR btrim(slug) = '';

      UPDATE videos
      SET display_scopes = ARRAY['video-gallery']::text[]
      WHERE display_scopes IS NULL OR cardinality(display_scopes) = 0;
    `);
    const oldIndexes = await client.query<{ indexname: string }>(`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = current_schema()
        AND tablename = 'collections'
        AND indexdef ~ '\\(application_id, slug\\)'
        AND indexdef !~ '\\(application_id, slug, locale\\)'
    `);
    for (const { indexname } of oldIndexes.rows) {
      await client.query(`DROP INDEX IF EXISTS "${indexname.replace(/"/g, '""')}"`);
    }
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_collections_application_slug_locale
        ON collections (application_id, slug, locale);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_videos_application_locale_slug
        ON videos (application_id, locale, slug);
      CREATE INDEX IF NOT EXISTS idx_videos_delivery_scopes
        ON videos (application_id, locale, status, published_at);
      CREATE INDEX IF NOT EXISTS idx_videos_display_scopes_gin
        ON videos USING gin (display_scopes);
      CREATE INDEX IF NOT EXISTS idx_collection_items_delivery
        ON collection_items (collection_id, is_active, position, starts_at, ends_at);
    `);
    await client.query('COMMIT');
    console.log('Educational video migration completed.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

void main();
