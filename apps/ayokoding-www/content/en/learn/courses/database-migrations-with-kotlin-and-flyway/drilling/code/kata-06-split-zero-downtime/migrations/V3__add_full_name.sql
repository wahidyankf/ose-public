-- V3: expand and backfill; old readers keep working.
ALTER TABLE accounts ADD COLUMN full_name TEXT;
UPDATE accounts SET full_name = name;
