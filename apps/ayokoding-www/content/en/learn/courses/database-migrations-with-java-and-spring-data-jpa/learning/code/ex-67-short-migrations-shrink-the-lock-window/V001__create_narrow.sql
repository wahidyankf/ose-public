-- V001 creates the narrow table: lock held for one statement only.
CREATE TABLE ex67_narrow (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the narrow name the next two files enrich separately
);
