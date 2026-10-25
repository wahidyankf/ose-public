-- V003 is the forward fix: it migrates the rows V002 missed.
-- Rolling back mid-split would strand a-1, rolling forward completes all three.
UPDATE ex44_items
SET
  code = sku
WHERE
  code IS NULL;

-- => the remainder moves: the split completes without unwinding anything
