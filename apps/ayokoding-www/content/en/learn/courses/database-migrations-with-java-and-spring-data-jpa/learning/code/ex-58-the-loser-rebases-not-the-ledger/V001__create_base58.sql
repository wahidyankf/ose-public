-- V001 creates the base the race below builds upon.
CREATE TABLE ex58_base (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the shared name both racers assumed present
);
