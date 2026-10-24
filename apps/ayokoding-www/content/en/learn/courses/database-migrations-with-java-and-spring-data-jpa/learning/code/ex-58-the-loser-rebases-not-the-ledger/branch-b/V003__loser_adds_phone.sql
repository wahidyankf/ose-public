-- Loser V003: loses the race and must rebase, not rewrite.
-- The ledger already holds 003 for emails, phones need a new number.
ALTER TABLE ex58_base
ADD COLUMN phone VARCHAR(40);

-- => the same change, awaiting its rebased number below
