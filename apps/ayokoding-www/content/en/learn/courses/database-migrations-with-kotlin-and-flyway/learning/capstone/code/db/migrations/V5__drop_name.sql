-- V5: zero-downtime rename step two: contract after readers moved.
ALTER TABLE customers DROP COLUMN name;
