-- V001 creates the tracked base table for the reconcile experiment.
CREATE TABLE ex50_base (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the tracked name the scans account for
);
