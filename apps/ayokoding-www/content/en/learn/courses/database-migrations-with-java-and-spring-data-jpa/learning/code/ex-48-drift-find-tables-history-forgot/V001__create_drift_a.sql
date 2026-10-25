-- V001 creates the first tracked table for the drift scan below.
CREATE TABLE ex48_tracked_a (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the tracked name the drift scan accounts for
);
