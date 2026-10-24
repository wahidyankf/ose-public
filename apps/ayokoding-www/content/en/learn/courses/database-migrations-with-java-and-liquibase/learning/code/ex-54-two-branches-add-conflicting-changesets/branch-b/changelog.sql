-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Branch-b builds the same counters table and loses the merge race.
-- changeset team-b:001-make-counters
-- => team-b's changeset collides: the table already exists from branch-a
CREATE TABLE counters (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => the identical shape proves neither branch compromised, both wrote it
);

-- rollback DROP TABLE counters;
-- => this reverse never runs: the changeset itself never applies
