-- V002 adds the stock count to the adopted inventory table.
-- The first executed migration on a baselined database: everything new runs.
ALTER TABLE ex47_inventory
ADD COLUMN stock INTEGER NOT NULL DEFAULT 0;

-- => DEFAULT 0 keeps adopted rows valid the moment the column appears
