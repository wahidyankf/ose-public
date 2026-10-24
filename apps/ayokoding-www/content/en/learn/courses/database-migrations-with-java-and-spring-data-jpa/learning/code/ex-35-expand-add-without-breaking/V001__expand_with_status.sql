-- V001 expands orders with a nullable status: old code keeps working.
-- Expand adds beside, never instead: nothing running depends on the new column.
-- Nullable means the alter never blocks on existing rows needing values.
CREATE TABLE ex35_orders (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for orders
  paid BOOLEAN NOT NULL,
  -- => the old flag running code still reads
  status VARCHAR(20)
  -- => the new column, nullable and ignored until the migrate phase
);

-- => one paid order stands in for live traffic during the expansion
INSERT INTO
  ex35_orders (paid, status)
VALUES
  (true, NULL);

-- => the old write path works unchanged with the new column present
