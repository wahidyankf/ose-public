-- V003 enforces NOT NULL only after the backfill proved full coverage.
ALTER TABLE ex39_contacts
ALTER COLUMN email
SET
  NOT NULL;

-- => enforcement after proof: no row can violate what verification certified
