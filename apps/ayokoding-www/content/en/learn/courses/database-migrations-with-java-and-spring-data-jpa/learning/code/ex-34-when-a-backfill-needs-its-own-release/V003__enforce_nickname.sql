-- V003 enforces the backfilled column only after verification passed.
-- Constraints land last: every row is proven full before NOT NULL arrives.
ALTER TABLE ex34_players
ALTER COLUMN nickname
SET
  NOT NULL;

-- => enforcement after proof: no row can violate what verification certified
