-- Resolved V004: branch B rebased onto the agreed order.
-- The loser rebases, never the ledger: applied history is never rewritten.
ALTER TABLE ex54_base
ADD COLUMN phone VARCHAR(40);

-- => phones land one version later with history intact
