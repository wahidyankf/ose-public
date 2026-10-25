-- V001 creates levels and seeds two rows inside one transaction.
-- Both statements share the transaction the runner opens per migration.
-- A crash before commit leaves neither the rows nor the ledger entry.
CREATE TABLE ex12_levels (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for levels
  name VARCHAR(100) NOT NULL
  -- => the level name players see on the ladder
);

-- => the seed rows share the migration transaction with the create
INSERT INTO
  ex12_levels (name)
VALUES
  ('bronze'),
  ('silver');

-- => two rows land atomically with the table: all or nothing
