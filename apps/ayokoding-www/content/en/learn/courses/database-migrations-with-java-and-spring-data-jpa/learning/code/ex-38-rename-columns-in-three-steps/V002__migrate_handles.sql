-- V002 copies every handle into display_handle: the migrate phase.
-- Values move while both names exist, so no writer is ever stranded.
UPDATE ex38_players
SET
  display_handle = handle
WHERE
  display_handle IS NULL;

-- => old rows adopt the new name from values already present
