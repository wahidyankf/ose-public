-- V3: restore with a default so old rows stay sane.
ALTER TABLE products ADD COLUMN price INTEGER NOT NULL DEFAULT 0;
