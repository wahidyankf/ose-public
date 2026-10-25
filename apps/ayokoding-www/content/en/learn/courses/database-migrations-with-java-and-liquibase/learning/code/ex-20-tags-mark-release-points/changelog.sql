-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-canals
-- => the first release changeset creates the canals table
-- => it ships untagged; the tag lands on the second changeset below
CREATE TABLE canals (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => canal names are required from the first migration
);

-- rollback DROP TABLE canals;
-- => this reverse never runs here; no rollback happens in this example
-- changeset course:002-make-locks
-- => the second release changeset creates the locks table
-- => the v1 tag lands on this history row as the release point
CREATE TABLE locks (
  id SERIAL PRIMARY KEY,
  -- => locks get their own independent sequence of ids
  name VARCHAR(60) NOT NULL
  -- => lock names are required from the first migration
);

-- rollback DROP TABLE locks;
-- => this reverse never runs here; the example only tags, never rolls back
-- changeset course:003-make-tolls
-- => the post-release changeset creates the tolls table after the tag
-- => its row stays untagged, proving tags mark points, not ranges
CREATE TABLE tolls (
  id SERIAL PRIMARY KEY,
  -- => tolls get their own independent sequence of ids
  name VARCHAR(60) NOT NULL
  -- => toll names are required from the first migration
);

-- rollback DROP TABLE tolls;
-- => this reverse never runs here; the example only tags, never rolls back
