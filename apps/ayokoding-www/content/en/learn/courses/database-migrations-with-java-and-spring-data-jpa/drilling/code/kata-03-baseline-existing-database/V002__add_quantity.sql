-- V002 adds the quantity column to the adopted stock table.
-- The first executed migration on a baselined database: everything new runs.
ALTER TABLE kata03_stock
ADD COLUMN quantity INTEGER NOT NULL DEFAULT 0;

-- => DEFAULT keeps adopted rows valid the moment the column appears
