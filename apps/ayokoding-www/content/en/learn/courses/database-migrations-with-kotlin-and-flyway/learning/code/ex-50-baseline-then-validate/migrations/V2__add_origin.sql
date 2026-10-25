-- V2: origin tracking after the import.
ALTER TABLE legacy_goods ADD COLUMN origin TEXT;
UPDATE legacy_goods SET origin = 'local';
