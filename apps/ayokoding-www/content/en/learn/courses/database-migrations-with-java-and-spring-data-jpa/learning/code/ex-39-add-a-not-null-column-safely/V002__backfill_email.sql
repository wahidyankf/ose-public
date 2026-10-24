-- V002 backfills an email for every contact from its name.
UPDATE ex39_contacts
SET
  email = lower(name) || '@example.com'
WHERE
  email IS NULL;

-- => every row derives its email before enforcement arrives
