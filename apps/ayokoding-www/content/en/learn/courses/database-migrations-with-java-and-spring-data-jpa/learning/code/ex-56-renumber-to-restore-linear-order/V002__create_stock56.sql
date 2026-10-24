-- V002 extends the store both developers assumed in place.
ALTER TABLE ex56_store
ADD COLUMN code VARCHAR(20);

-- => nullable: branches diverge only after this shared point
