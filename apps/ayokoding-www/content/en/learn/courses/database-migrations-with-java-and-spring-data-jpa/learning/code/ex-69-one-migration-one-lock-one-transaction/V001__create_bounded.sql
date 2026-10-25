-- V001 creates the bounded table the atomic migration below extends.
CREATE TABLE ex69_bounded (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the bounded name the locked migration extends atomically
);
