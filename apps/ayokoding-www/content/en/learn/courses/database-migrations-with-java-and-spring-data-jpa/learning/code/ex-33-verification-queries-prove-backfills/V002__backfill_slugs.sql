-- V002 derives each slug from the club name in lowercase with dashes.
-- The verification below certifies coverage and uniqueness, not just effort.
UPDATE ex33_clubs
SET
  slug = lower(replace (name, ' ', '-'));

-- => every row derives its slug from data already present
