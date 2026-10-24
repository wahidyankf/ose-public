-- V004 indexes events by venue: the last point on the line.
-- Four files, four rows, one order: the whole history in one scan.
CREATE INDEX ex14_events_venue_idx ON ex14_events (venue_id);

-- => the index serves per-venue event listings
