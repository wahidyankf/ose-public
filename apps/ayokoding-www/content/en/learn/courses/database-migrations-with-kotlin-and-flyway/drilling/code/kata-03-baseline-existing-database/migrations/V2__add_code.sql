-- V2: the first migration after your baseline.
ALTER TABLE legacy_stock ADD COLUMN code TEXT;
UPDATE legacy_stock SET code = 'K1';
