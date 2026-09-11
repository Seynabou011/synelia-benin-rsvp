import { sql } from '@vercel/postgres';

let schemaReady = false;

export async function ensureSchema() {
  if (schemaReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS benin_rsvp (
      id SERIAL PRIMARY KEY,
      nom TEXT NOT NULL DEFAULT '',
      fonction TEXT NOT NULL DEFAULT '',
      organisation TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      telephone TEXT NOT NULL DEFAULT '',
      present BOOLEAN NOT NULL DEFAULT true,
      accompagnants INTEGER NOT NULL DEFAULT 0,
      atelier TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  schemaReady = true;
}
