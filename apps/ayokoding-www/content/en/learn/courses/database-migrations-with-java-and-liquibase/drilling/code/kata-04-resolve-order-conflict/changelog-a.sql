-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Branch-a builds the waypoints table first and wins the kata race.
-- changeset kata:001-a-make-waypoints
-- => the winning changeset creates the table both branches want
CREATE TABLE waypoints (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this kata
  code VARCHAR(20) NOT NULL
  -- => waypoint codes are required from the first migration
);

-- rollback DROP TABLE waypoints;
-- => this reverse never runs here; winners are not rolled back
