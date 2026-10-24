-- V002 migrates handles into nicknames while both names exist.
UPDATE kata06_members
SET
  nickname = handle
WHERE
  nickname IS NULL;

-- => old rows adopt the new name from values already present
