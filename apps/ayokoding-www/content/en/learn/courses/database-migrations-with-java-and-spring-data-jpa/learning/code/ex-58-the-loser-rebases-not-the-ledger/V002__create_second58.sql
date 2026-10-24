-- V002 extends the base both racers assumed in place.
ALTER TABLE ex58_base
ADD COLUMN code VARCHAR(20);

-- => nullable: the race diverges only after this shared point
