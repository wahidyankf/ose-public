-- V001 creates the promoted table: identical DDL in every environment.
-- Promotion replays the same bytes, only the schema name changes per stage.
CREATE TABLE promoted_things (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the promoted name every environment must agree on
);
