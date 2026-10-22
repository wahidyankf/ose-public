-- V3: CASE maps each total to its tier.
ALTER TABLE customers ADD COLUMN tier TEXT;
UPDATE customers SET tier = CASE WHEN lifetime_total >= 1000 THEN 'gold' ELSE 'standard' END;
