-- V002 adopts the drifted table the scan found: drift becomes history.
-- Reconciling migrations describe orphans as the team wishes they were written.
-- From this version on the ledger covers reality again.
CREATE TABLE IF NOT EXISTS ex50_orphan (
  id SERIAL PRIMARY KEY,
  -- => SERIAL mirrors the hand-made table the scan discovered
  name VARCHAR(100) NOT NULL
  -- => the adopted column the scan will account for from here on
);

-- => IF NOT EXISTS adopts without colliding where the orphan already stands
