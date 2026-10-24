-- V002 is the repair migration: it adds the row the partial run missed.
-- Repair never edits the failed file, it completes the footprint forward.
INSERT INTO
  ex73_repairable (name)
VALUES
  ('second');

-- => the missing row lands with its own version and ledger entry
