-- V002 locks only the changed table, never its neighbor.
-- Blast radius is a decision: this file names exactly one locked table.
LOCK TABLE ex64_changed IN ACCESS EXCLUSIVE MODE;

-- => the neighbor stays readable while this table migrates
ALTER TABLE ex64_changed
ADD COLUMN code VARCHAR(20);

-- => the DDL touches only the table the lock names
