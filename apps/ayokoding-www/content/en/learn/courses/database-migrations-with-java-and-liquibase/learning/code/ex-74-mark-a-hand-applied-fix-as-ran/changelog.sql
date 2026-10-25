-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-hotfix
-- => the changeset describes the hand-applied fix column for column
-- => it must never execute here: the table already exists, so the mark
-- => records it ran and every future changeset builds on top normally
CREATE TABLE hotfix_repairs (
  id SERIAL PRIMARY KEY,
  -- => SERIAL matches the hand-built key exactly, or drift starts today
  note VARCHAR(60) NOT NULL
  -- => the hand-built note column the mark below carries over untouched
);

-- rollback DROP TABLE hotfix_repairs;
-- => this reverse never runs here; marks record, they do not execute
