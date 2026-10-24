-- V006 migrates every status into display_status while both exist.
UPDATE cap_orders
SET
  display_status = status
WHERE
  display_status IS NULL;

-- => old rows adopt the new name from values already present
