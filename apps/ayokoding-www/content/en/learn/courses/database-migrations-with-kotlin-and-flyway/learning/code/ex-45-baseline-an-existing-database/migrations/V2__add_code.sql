-- V2: the first migration after the baseline.
ALTER TABLE legacy_orders ADD COLUMN code TEXT;
UPDATE legacy_orders SET code = 'L1';
