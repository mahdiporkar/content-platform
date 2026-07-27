import { Client } from 'pg';

export function createDatabaseClient(): Client {
  return new Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME ?? 'content_platform',
    user: process.env.DB_USER ?? 'content',
    password: process.env.DB_PASSWORD ?? 'content',
  });
}
