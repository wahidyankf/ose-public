-- V002 adds the price column the first version omitted.
-- Small single-purpose ups stay reversible: one change, one reverse file.
-- The down file drops exactly this column and nothing else.
ALTER TABLE ex03_products
ADD COLUMN price_cents INTEGER NOT NULL DEFAULT 0;

-- => DEFAULT 0 keeps existing rows valid the moment the column appears
