-- V002 creates the table this example drops by hand afterward.
-- Hand-drops orphan the ledger row: the reverse scan exists to catch this.
CREATE TABLE ex49_dropped (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the dropped name the reverse scan reports missing
);
