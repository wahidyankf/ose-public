-- V001 creates members with a unique email from day one.
-- Constraints declared at creation time never need a backfill later.
-- The verification reads the catalog, not the data, so reruns agree.
CREATE TABLE ex04_members (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for members
  email VARCHAR(200) NOT NULL UNIQUE,
  -- => UNIQUE at creation keeps duplicates impossible from the first row
  joined_on DATE NOT NULL DEFAULT CURRENT_DATE
  -- => DEFAULT keeps the column valid for every insert, even sparse ones
);
