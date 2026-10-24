-- V001 creates events with one thousand rows standing in for a large table.
-- generate_series seeds volume without a thousand-line insert script.
-- Batched backfills exist for tables exactly like this one.
CREATE TABLE ex29_events (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for events
  kind VARCHAR(50) NOT NULL,
  -- => the raw kind the backfill normalizes into a category
  category VARCHAR(50)
  -- => empty until V002 fills it in key-range batches
);

-- => one thousand rows stand in for production volume in this example
INSERT INTO
  ex29_events (kind)
SELECT
  'click'
FROM
  generate_series (1, 1000);

-- => every row starts uncategorized: the backfill below fixes that
