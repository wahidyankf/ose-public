-- V001 creates the base the disputed plan below never touches.
CREATE TABLE ex60_base (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the shared name the refused plan would have extended
);
