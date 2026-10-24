-- V3: your backfill goes here: add qty, fill it, prove zero misses.
ALTER TABLE items ADD COLUMN qty INTEGER;
UPDATE items SET qty = 1;
