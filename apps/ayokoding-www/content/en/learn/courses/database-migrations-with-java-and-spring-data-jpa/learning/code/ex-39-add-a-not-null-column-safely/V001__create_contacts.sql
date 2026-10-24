-- V001 creates contacts with names but no email yet.
-- The email column arrives nullable, fills, then tightens across V002-V003.
CREATE TABLE ex39_contacts (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for contacts
  name VARCHAR(100) NOT NULL,
  -- => the name the email backfill derives from
  email VARCHAR(200)
  -- => nullable on arrival: backfill fills it before enforcement
);

-- => two contacts give the backfill real rows to derive from
INSERT INTO
  ex39_contacts (name)
VALUES
  ('ada'),
  ('grace');

-- => seeds share the migration transaction with the create above
