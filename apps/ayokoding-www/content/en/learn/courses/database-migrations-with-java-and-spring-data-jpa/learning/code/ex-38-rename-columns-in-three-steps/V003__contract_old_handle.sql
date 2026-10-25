-- V003 drops the old handle: contraction after universal adoption.
-- The rename completes only when nothing reads the old name anymore.
ALTER TABLE ex38_players
DROP COLUMN handle;

-- => one name remains: the rename done without breaking any reader
