-- no-transaction
-- V002 fills without a transaction wrapper: early work commits on failure.
-- The first insert survives the second insert's UNIQUE violation below.
-- The verification prints the partial footprint the repair must complete.
INSERT INTO
  ex72_partial (name)
VALUES
  ('keeper');

-- => this insert commits immediately: no transaction protects it
INSERT INTO
  ex72_partial (name)
VALUES
  ('keeper');

-- => the duplicate fails, but the first row is already committed
