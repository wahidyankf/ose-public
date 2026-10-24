-- V004 backfills the priority column from order amounts.
-- Orders at or above 10000 cents count as high priority, the rest standard.
ALTER TABLE cap_orders
ADD COLUMN priority VARCHAR(20);

-- => nullable first: computed below, proven full by the golden query
UPDATE cap_orders
SET
  priority = CASE
    WHEN amount_cents >= 10000 THEN 'high'
    ELSE 'standard'
  END;

-- => every order derives its priority from data already present
