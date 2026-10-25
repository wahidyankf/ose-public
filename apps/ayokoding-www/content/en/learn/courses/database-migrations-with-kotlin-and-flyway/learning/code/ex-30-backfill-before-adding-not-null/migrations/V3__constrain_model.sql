-- V3: backfill first, constraint second, same file.
UPDATE phones SET model = 'unknown' WHERE model IS NULL;
ALTER TABLE phones ALTER COLUMN model SET NOT NULL;
