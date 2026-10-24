-- V002 extends the base both branches assumed in place.
ALTER TABLE ex54_base
ADD COLUMN code VARCHAR(20);

-- => nullable: branches diverge only after this shared point
