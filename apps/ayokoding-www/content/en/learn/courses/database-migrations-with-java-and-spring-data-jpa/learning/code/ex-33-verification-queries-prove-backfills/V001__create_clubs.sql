-- V001 creates clubs with names but no slugs yet.
-- The backfill derives a URL-safe slug per club in V002.
CREATE TABLE ex33_clubs (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for clubs
  name VARCHAR(100) NOT NULL,
  -- => the display name the slug derives from
  slug VARCHAR(100)
  -- => empty until V002 derives one slug per club
);

-- => three clubs give the backfill real derivation work
INSERT INTO
  ex33_clubs (name)
VALUES
  ('Chess Club'),
  ('Book Club'),
  ('Run Club');

-- => seeds share the migration transaction with the create above
