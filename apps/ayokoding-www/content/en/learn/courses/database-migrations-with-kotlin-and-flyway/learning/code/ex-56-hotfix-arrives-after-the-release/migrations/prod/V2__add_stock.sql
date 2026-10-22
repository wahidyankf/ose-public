-- V2: stock tracking joins the release.
ALTER TABLE items ADD COLUMN stock INTEGER NOT NULL DEFAULT 0;
