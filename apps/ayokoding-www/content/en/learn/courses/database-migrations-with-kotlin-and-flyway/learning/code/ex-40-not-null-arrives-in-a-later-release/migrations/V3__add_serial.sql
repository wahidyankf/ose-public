-- V3: nullable first, backfilled immediately.
ALTER TABLE devices ADD COLUMN serial TEXT;
UPDATE devices SET serial = 's-' || id;
