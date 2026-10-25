-- V001 creates badges: the file this example edits after applying.
-- The runner records its checksum at apply time, then validation recomputes.
-- Any edit after apply changes the fingerprint and fails validation loudly.
CREATE TABLE ex11_badges (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for badges
  label VARCHAR(100) NOT NULL
  -- => the badge label displayed on profiles
);
