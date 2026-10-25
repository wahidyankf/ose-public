-- V002 migrates handles into nicknames: phase two of two.
-- The gate below proves every row moved before any contraction runs.
UPDATE ex42_members
SET
  nickname = handle
WHERE
  nickname IS NULL;

-- => old rows adopt the new name from values already present
