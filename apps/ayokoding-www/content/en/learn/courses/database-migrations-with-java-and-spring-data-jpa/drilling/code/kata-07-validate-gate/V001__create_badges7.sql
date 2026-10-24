-- V001 creates badges: validated before it ever runs.
CREATE TABLE kata07_badges (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for badges
  label VARCHAR(100) NOT NULL
  -- => the badge label validated alongside the file
);
