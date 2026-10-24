-- V002 extends the healthy table: the second line of the inventory.
ALTER TABLE ex74_healthy
ADD COLUMN code VARCHAR(20);

-- => the extension the ledger inventory below will show as applied
