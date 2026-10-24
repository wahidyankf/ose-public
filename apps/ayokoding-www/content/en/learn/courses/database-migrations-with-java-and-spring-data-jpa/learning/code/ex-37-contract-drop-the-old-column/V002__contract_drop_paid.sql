-- V002 drops the old paid flag: contraction after universal adoption.
-- Dropping late is the safety margin: no reader touches paid anymore.
-- The down file re-adds the column for the abandon path, filled from status.
ALTER TABLE ex37_orders
DROP COLUMN paid;

-- => the old shape leaves only when nothing reads it
