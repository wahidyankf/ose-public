-- V3: the new column every reader moves to.
ALTER TABLE staff ADD COLUMN full_name TEXT;
UPDATE staff SET full_name = name;
