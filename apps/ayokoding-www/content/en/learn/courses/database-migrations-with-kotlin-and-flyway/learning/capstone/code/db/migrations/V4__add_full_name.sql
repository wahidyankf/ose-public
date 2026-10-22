-- V4: zero-downtime rename step one: the new name beside the old.
ALTER TABLE customers ADD COLUMN full_name TEXT;
UPDATE customers SET full_name = name;
