-- V5: contract only after every reader moved.
DROP VIEW legacy_staff;
ALTER TABLE staff DROP COLUMN name;
