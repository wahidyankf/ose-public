-- V3: contact email arrives with an immediate backfill.
ALTER TABLE customers ADD COLUMN email TEXT;
UPDATE customers SET email = lower(name) || '@x.id';
