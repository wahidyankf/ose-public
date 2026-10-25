-- V002 is the repair migration: it seeds the rows the failure never wrote.
-- Repair moves forward with valid data instead of editing the failed file.
INSERT INTO
  kata08_strict (name)
VALUES
  ('alpha'),
  ('beta');

-- => two valid rows land with their own version and ledger entry
