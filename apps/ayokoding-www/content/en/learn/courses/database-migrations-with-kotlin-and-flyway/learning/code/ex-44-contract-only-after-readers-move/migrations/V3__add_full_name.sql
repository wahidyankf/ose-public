-- V3: expand with the new column.
ALTER TABLE staff ADD COLUMN full_name TEXT;
UPDATE staff SET full_name = name;
