-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => The seed builds the table with ungraded rows; the backfill lands next.
-- changeset kata:001-seed-ingots
-- => four seeded rows with weights but no grades yet
CREATE TABLE ingots (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this kata
  weight_kg INTEGER NOT NULL,
  -- => the weight below decides each row's derived grade
  grade VARCHAR(10)
  -- => grades start NULL; the backfill step derives all four
);
INSERT INTO ingots (weight_kg) VALUES (10), (20), (30), (40);
-- => four ungraded rows awaiting the wired backfill step

-- rollback DROP TABLE ingots;
-- => this reverse never runs here; the kata wires forward only
