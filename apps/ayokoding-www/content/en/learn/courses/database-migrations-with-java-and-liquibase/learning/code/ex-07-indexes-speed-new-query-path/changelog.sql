-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- changeset course:001-create-members
-- => the table exists first; the index arrives as its own changeset
CREATE TABLE members (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  handle VARCHAR(50) NOT NULL
  -- => lookups by handle are the query path the index will serve
);

-- rollback DROP TABLE members;
-- => dropping the table reverses exactly what this changeset built
-- changeset course:002-index-handle
-- => a B-tree over handle turns full scans into index lookups
CREATE INDEX ix_members_handle ON members (handle);

-- => a named index shows up in pg_indexes under a name reviewers chose
-- rollback DROP INDEX ix_members_handle;
-- => indexes drop by name, so naming them is load-bearing
