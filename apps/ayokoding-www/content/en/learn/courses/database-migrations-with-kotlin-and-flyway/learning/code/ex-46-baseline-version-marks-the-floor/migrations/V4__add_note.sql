-- V4: the first migration above the floor.
ALTER TABLE legacy_docs ADD COLUMN note TEXT;
UPDATE legacy_docs SET note = 'kept';
