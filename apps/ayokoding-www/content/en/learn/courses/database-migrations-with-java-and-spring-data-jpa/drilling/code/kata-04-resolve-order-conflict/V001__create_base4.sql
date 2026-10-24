-- V001 creates the base both developers built upon.
CREATE TABLE kata04_base (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the shared base the rebased change extends
);
