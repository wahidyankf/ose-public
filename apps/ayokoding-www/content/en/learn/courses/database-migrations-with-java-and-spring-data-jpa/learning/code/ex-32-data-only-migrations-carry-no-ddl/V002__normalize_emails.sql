-- V002 lowercases every email: a data-only migration with no DDL.
-- No shape changes, yet it earns a version and a ledger row like any file.
-- Reruns stay safe: lowercasing twice is the same as lowercasing once.
UPDATE ex32_subscribers
SET
  email = lower(email);

-- => every row normalizes atomically with the ledger record
