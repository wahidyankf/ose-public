-- V002 deletes sessions older than thirty days: the retention rule as DDL.
-- The predicate is the reviewable policy: thirty days, no more, no less.
-- Rollback restores from backup, DELETE has no mirror the way UPDATE does.
DELETE FROM ex31_sessions
WHERE
  seen_on < CURRENT_DATE - 30;

-- => old rows leave, fresh rows stay in the same transaction
