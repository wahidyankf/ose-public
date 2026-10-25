-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Branch-a builds the counters table first and wins the merge race.
-- changeset team-a:001-make-counters
-- => team-a's changeset creates the counters table both branches want
CREATE TABLE counters (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => counter names are required from the first migration
);

-- rollback DROP TABLE counters;
-- => this reverse never runs here; winners are not rolled back
