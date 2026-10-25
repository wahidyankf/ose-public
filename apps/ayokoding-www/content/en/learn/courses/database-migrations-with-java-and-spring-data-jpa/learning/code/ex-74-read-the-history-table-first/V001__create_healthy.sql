-- V001 creates the healthy table diagnosis starts from.
CREATE TABLE ex74_healthy (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the healthy name the diagnosis inventory will list
);
