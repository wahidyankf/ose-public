-- V002 extends the audited table under a declared lock the audit checks.
LOCK TABLE ex70_audited IN SHARE ROW EXCLUSIVE MODE;

-- => the declared mode the audit below must find in pg_locks
ALTER TABLE ex70_audited
ADD COLUMN code VARCHAR(20);

-- => the DDL runs under the declared lock inside the migration transaction
