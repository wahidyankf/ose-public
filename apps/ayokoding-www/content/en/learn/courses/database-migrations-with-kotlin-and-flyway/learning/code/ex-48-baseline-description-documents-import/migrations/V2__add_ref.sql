-- V2: the first migration after the import.
ALTER TABLE legacy_skus ADD COLUMN ref TEXT;
UPDATE legacy_skus SET ref = 'R1';
