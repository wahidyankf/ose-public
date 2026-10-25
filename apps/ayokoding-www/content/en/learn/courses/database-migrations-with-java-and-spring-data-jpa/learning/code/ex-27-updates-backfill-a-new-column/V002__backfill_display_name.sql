-- V002 adds display_name and backfills it from the two name columns.
-- Schema first, then data: the column exists before any UPDATE touches it.
-- Deriving from existing rows beats asking every author to retype theirs.
ALTER TABLE ex27_authors
ADD COLUMN display_name VARCHAR(210);

-- => nullable first: the backfill fills it, a later migration may tighten it
UPDATE ex27_authors
SET
  display_name = first_name || ' ' || last_name;

-- => every existing row derives its display name from data already present
