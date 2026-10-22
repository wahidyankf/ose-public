-- V4: the rollback release corrects rows and default.
UPDATE accounts SET status = 'active';
ALTER TABLE accounts ALTER COLUMN status SET DEFAULT 'active';
