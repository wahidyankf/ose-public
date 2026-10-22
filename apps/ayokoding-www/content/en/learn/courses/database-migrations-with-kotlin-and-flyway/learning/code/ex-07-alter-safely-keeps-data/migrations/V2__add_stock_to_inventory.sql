-- V2: new column defaults every existing row to zero.
ALTER TABLE inventory ADD COLUMN stock INTEGER NOT NULL DEFAULT 0;
