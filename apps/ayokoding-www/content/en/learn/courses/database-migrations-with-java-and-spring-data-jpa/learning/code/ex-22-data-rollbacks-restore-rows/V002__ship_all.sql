-- V002 flips every shipment to shipped in one data migration.
-- Data-only ups carry UPDATE statements instead of DDL.
-- The down file restores pending with the mirror UPDATE.
UPDATE ex22_shipments
SET
  status = 'shipped';

-- => every row moves to shipped atomically with the ledger record
