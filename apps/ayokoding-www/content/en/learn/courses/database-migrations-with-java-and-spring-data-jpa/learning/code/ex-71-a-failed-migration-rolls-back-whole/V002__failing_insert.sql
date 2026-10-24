-- V002 inserts twice, and the duplicate name violates UNIQUE halfway.
-- The transaction wrapper rolls back the first insert with the failure.
-- Nothing survives: no rows, no ledger entry, no half-applied change.
INSERT INTO
  ex71_strict (name)
VALUES
  ('dupe');

-- => the first insert succeeds and then vanishes with the rollback
INSERT INTO
  ex71_strict (name)
VALUES
  ('dupe');

-- => the duplicate violates UNIQUE and fails the whole migration
