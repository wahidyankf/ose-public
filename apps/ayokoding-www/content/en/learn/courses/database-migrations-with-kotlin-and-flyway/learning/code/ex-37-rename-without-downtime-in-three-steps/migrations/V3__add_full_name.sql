-- V3: steps one and two of the rename.
ALTER TABLE staff ADD COLUMN full_name TEXT;
UPDATE staff SET full_name = name;
