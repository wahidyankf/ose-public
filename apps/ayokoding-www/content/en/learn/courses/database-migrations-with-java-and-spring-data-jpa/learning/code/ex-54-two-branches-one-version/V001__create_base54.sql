-- V001 creates the shared base both branches built upon.
CREATE TABLE ex54_base (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the shared name both branches assumed present
);
