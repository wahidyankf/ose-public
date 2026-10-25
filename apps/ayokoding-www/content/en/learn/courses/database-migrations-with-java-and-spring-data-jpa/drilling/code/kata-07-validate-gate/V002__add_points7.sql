-- V002 adds the points badges accumulate over time.
ALTER TABLE kata07_badges
ADD COLUMN points INTEGER NOT NULL DEFAULT 0;

-- => DEFAULT keeps existing badge rows valid at alter time
