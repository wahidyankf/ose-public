-- V001 creates counters: applied once, skipped on every later run.
-- The existsById guard makes reruns no-ops instead of explosions.
-- Every replica and every restart replays these files safely.
CREATE TABLE ex10_counters (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for counters
  name VARCHAR(100) NOT NULL UNIQUE
  -- => UNIQUE names keep the seed insert idempotent-friendly
);
