-- V002 adds the balance column and backfills it from the amounts.
-- Schema first, then data: the column exists before any UPDATE touches it.
ALTER TABLE kata02_postings
ADD COLUMN balance_cents INTEGER;

-- => nullable first: computed below for every existing row
UPDATE kata02_postings
SET
  balance_cents = amount_cents * 2;

-- => every row derives its balance from data already present
