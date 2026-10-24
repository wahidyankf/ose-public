-- V002 adds priority to the tickets V001 created.
ALTER TABLE ex25_tickets
ADD COLUMN priority INTEGER NOT NULL DEFAULT 3;

-- => DEFAULT 3 keeps existing ticket rows valid at alter time
