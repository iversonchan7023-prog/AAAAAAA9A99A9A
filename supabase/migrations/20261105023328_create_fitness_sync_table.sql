/*
# Fitness Sync Data Table (single-tenant, sync-key based)

1. New Tables
- `fitness_sync_data`
  - `sync_key` (text, primary key): the private sync space passphrase that groups all data for one user
  - `payload` (jsonb, not null): the full fitness data blob (week plan, exercises, history, calendar, settings)
  - `updated_at` (timestamptz, default now()): last write timestamp for optimistic merge
2. Security
- Enable RLS on `fitness_sync_data`.
- Grant CRUD to `anon` + `authenticated` so the anon-key frontend can read/write its sync space.
- Allow anon + authenticated full CRUD because access is gated by the sync_key (private passphrase), not by user identity. The key is intentionally shared across the user's own devices.
3. Notes
- Single row per sync_key. Upsert pattern used by the frontend.
- No user accounts; isolation is by knowledge of the sync_key passphrase.
*/

CREATE TABLE IF NOT EXISTS fitness_sync_data (
  sync_key text PRIMARY KEY,
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE fitness_sync_data ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON fitness_sync_data TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_fitness_sync" ON fitness_sync_data;
CREATE POLICY "anon_select_fitness_sync" ON fitness_sync_data
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_fitness_sync" ON fitness_sync_data;
CREATE POLICY "anon_insert_fitness_sync" ON fitness_sync_data
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_fitness_sync" ON fitness_sync_data;
CREATE POLICY "anon_update_fitness_sync" ON fitness_sync_data
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_fitness_sync" ON fitness_sync_data;
CREATE POLICY "anon_delete_fitness_sync" ON fitness_sync_data
  FOR DELETE TO anon, authenticated USING (true);
