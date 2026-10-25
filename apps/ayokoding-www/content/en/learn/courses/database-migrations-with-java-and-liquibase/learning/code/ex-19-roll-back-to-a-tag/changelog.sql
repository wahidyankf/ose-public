-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-harbours
-- => the release changeset creates the harbours table
-- => the v1 tag lands on this row before the other two apply
CREATE TABLE harbours (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => harbour names are required from the first migration
);

-- rollback DROP TABLE harbours;
-- => this reverse never runs here; the tag rollback stops above it
-- changeset course:002-make-piers
-- => the first post-release changeset creates the piers table
-- => rolling back to v1 reverses this changeset and deletes its row
CREATE TABLE piers (
  id SERIAL PRIMARY KEY,
  -- => piers get their own independent sequence of ids
  name VARCHAR(60) NOT NULL
  -- => pier names are required from the first migration
);

-- rollback DROP TABLE piers;
-- => the tag rollback runs this line on its way back to v1
-- changeset course:003-make-ferries
-- => the second post-release changeset creates the ferries table
-- => it is the first reverse the tag rollback runs
CREATE TABLE ferries (
  id SERIAL PRIMARY KEY,
  -- => ferries get their own independent sequence of ids
  name VARCHAR(60) NOT NULL
  -- => ferry names are required from the first migration
);

-- rollback DROP TABLE ferries;
-- => the tag rollback runs this line first, then the piers reverse
