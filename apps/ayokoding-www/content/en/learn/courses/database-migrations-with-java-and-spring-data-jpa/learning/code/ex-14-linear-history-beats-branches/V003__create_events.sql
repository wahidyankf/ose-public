-- V003 creates events referencing the venues above.
-- Each version has one predecessor: this file assumes V002 already ran.
CREATE TABLE ex14_events (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for events
  venue_id INTEGER NOT NULL REFERENCES ex14_venues (id),
  -- => the foreign key assumes venues exists: V001 first, always
  title VARCHAR(200) NOT NULL
  -- => the event title printed on the listing page
);
