-- V002 backfills status from paid and dual-writes agree from here on.
-- Migrate moves data while both shapes exist: no reader is ever stranded.
UPDATE ex36_payments
SET
  status = CASE
    WHEN paid THEN 'paid'
    ELSE 'open'
  END
WHERE
  status IS NULL;

-- => old rows adopt the new vocabulary from values already present
