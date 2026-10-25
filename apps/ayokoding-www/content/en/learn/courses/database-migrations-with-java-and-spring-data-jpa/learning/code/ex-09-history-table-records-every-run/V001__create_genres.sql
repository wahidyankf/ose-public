-- V001 creates genres: the first of three ledger entries.
-- Each file earns exactly one history row with its version and checksum.
-- Reading those rows back is the whole subject of this example.
CREATE TABLE ex09_genres (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for genres
  name VARCHAR(100) NOT NULL
  -- => the genre name the later shelves will reference
);
