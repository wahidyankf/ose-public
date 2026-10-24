-- V001 creates postings with amounts but no running balance yet.
CREATE TABLE kata02_postings (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for postings
  amount_cents INTEGER NOT NULL
  -- => the amount the backfill below accumulates into balances
);

-- => three postings give the backfill real arithmetic to perform
INSERT INTO
  kata02_postings (amount_cents)
VALUES
  (100),
  (200),
  (300);

-- => seeds share the migration transaction with the create above
