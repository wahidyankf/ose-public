-- V002 migrates only matching rows: the incomplete pass this example fixes.
-- A restrictive predicate leaves a gap the verification below counts.
UPDATE ex44_items
SET
  code = sku
WHERE
  sku LIKE 'a-%';

-- => only a-1 moves: the gap stands in for a real-world partial migrate
