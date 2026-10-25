-- V001 creates metrics with uncategorized rows awaiting backfill.
CREATE TABLE ex41_metrics (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for metrics
  name VARCHAR(100) NOT NULL,
  -- => the metric name the category derives from
  category VARCHAR(50)
  -- => empty until the batched backfill below fills it
);

-- => two hundred rows stand in for a table readers query constantly
INSERT INTO
  ex41_metrics (name)
SELECT
  'metric_' || g
FROM
  generate_series (1, 200) g;

-- => every row starts uncategorized: the backfill fixes that in batches
