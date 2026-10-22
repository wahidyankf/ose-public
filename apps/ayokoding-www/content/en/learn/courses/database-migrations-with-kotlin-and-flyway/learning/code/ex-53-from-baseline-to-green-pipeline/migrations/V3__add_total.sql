-- V3: totals follow channels.
ALTER TABLE legacy_orders ADD COLUMN total INTEGER NOT NULL DEFAULT 0;
