-- V003 carries the loser's change rebased onto the new tip.
-- The loser rebases, never the ledger: applied numbers stay spent.
ALTER TABLE kata04_base
ADD COLUMN phone VARCHAR(40);

-- => the same bytes under an honest new number
