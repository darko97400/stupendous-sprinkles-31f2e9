-- Apply to the dedicated voice database, never the leaderboard store.
CREATE TABLE IF NOT EXISTS ps_voice_jobs (
  cache_key text PRIMARY KEY,
  owner_hash text NOT NULL,
  state text NOT NULL CHECK (state IN ('reserved','ready','failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ps_voice_budgets (
  bucket text PRIMARY KEY,
  used integer NOT NULL CHECK (used >= 0)
);
