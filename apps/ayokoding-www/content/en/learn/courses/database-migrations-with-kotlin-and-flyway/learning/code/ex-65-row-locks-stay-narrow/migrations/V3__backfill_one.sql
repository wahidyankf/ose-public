-- V3: backfill touches a single row.
UPDATE parcels SET status = 'sent' WHERE code = 'A1';
