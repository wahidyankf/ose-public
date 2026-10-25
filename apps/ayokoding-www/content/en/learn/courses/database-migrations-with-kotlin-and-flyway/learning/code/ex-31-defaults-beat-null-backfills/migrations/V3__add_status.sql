-- V3: the default backfills existing rows at alter time.
ALTER TABLE parcels ADD COLUMN status TEXT NOT NULL DEFAULT 'new';
