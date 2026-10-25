-- V002 adds the code column while holding the table exclusively.
-- The runner wraps this file in an explicit LOCK TABLE before altering.
LOCK TABLE ex62_guarded IN ACCESS EXCLUSIVE MODE;

-- => explicit lock names the blast radius: this table, this statement
ALTER TABLE ex62_guarded
ADD COLUMN code VARCHAR(20);

-- => the DDL runs under the exclusive lock the migration chose deliberately
