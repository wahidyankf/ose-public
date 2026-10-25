-- Resolved V003: branch A kept its number after the team talked.
-- Resolution renumbers the loser, the winner keeps its version honestly.
ALTER TABLE ex54_base
ADD COLUMN email VARCHAR(200);

-- => the agreed V003: emails first, phones move to V004
