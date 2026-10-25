-- V002 adds capacity to the venues V001 created.
-- The next number is claimed, never forked: branches stay in version control.
ALTER TABLE ex14_venues
ADD COLUMN capacity INTEGER NOT NULL DEFAULT 0;

-- => DEFAULT 0 keeps existing venue rows valid at alter time
