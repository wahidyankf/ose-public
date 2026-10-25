-- V001 expands payments with a status beside the old paid flag.
-- Old binaries write paid, new binaries will write both during migration.
CREATE TABLE ex36_payments (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for payments
  paid BOOLEAN NOT NULL,
  -- => the old flag every deployed binary still writes
  status VARCHAR(20)
  -- => the new column, filled by the migrate phase below
);

-- => one old-format row predates the dual-write era
INSERT INTO
  ex36_payments (paid, status)
VALUES
  (true, NULL);

-- => the migrate phase below backfills exactly rows like this one
