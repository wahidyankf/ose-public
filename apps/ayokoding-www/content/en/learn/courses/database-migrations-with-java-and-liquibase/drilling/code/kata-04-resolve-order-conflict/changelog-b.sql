-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Branch-b builds the same table and loses the kata race by design.
-- changeset kata:001-b-make-waypoints
-- => the losing changeset collides: the table already exists from branch-a
CREATE TABLE waypoints (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this kata
  code VARCHAR(20) NOT NULL
  -- => the identical shape proves neither branch compromised, both wrote it
);

-- rollback DROP TABLE waypoints;
-- => this reverse never runs: the changeset itself never applies
