-- U002 notes the restore path: expired rows return from backup, not SQL.
-- Plain re-insert cannot recover rows nobody recorded, backups can.
-- The runner deletes the 002 ledger row so forward may honestly rerun.
SELECT
  1;

-- => a no-op body: the restore happens outside the migration, from backup
