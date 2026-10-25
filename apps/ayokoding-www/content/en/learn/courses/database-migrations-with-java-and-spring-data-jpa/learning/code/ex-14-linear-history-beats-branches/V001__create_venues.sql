-- V001 creates venues: the first point on one straight line.
-- Linear history means one predecessor and one successor per version.
-- Any database state maps to exactly one point on this line.
CREATE TABLE ex14_venues (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for venues
  name VARCHAR(100) NOT NULL
  -- => the venue name printed on the ticket
);
