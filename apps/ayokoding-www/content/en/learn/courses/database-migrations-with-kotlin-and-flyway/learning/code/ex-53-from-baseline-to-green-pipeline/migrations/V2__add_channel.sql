-- V2: channels arrive after the import.
ALTER TABLE legacy_orders ADD COLUMN channel TEXT;
UPDATE legacy_orders SET channel = 'walk-in';
