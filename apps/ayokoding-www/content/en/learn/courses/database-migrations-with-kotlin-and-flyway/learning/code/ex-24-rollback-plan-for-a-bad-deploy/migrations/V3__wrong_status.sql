-- V3: the bad deploy ships a wrong default.
ALTER TABLE accounts ADD COLUMN status TEXT NOT NULL DEFAULT 'X';
