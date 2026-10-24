-- V001 creates the strict table the repair below fills correctly.
CREATE TABLE kata08_strict (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL UNIQUE
  -- => UNIQUE tripped the original failure the repair respects
);
