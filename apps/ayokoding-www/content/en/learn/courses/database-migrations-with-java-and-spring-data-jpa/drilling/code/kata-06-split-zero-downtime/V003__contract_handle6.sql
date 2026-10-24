-- V003 drops the old handle after universal adoption of nickname.
ALTER TABLE kata06_members
DROP COLUMN handle;

-- => one name remains: the split done without breaking any reader
