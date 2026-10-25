-- V007 drops the old status after universal adoption of display_status.
-- The rename completes only when nothing reads the old name anymore.
ALTER TABLE cap_orders
DROP COLUMN status;

-- => one name remains: the rename done without breaking any reader
