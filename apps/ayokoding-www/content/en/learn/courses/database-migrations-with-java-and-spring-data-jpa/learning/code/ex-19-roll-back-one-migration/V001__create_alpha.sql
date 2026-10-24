-- V001 creates alpha: the base layer that never rolls back here.
CREATE TABLE ex19_alpha (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the alpha name the later layers reference
);
